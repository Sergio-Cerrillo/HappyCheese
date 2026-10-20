# Revisión del flujo de pedidos

## Incidencia contrastada en producción el 20/10/2026

Se consultaron Stripe y Supabase en lectura para el pedido indicado por el usuario (`HC-MVB2B…`). Stripe registra una sesión completa, pagada por 46 EUR y con el ID del pedido en sus metadatos. Supabase conserva el pedido como pendiente, sin sesión, PaymentIntent ni fechas de envío de correos.

El webhook de producción está habilitado y suscrito a los eventos necesarios. No se tuvo acceso a los registros de ejecución de Vercel ni al detalle de cada intento de entrega de Stripe; por tanto, no se atribuye una respuesta HTTP concreta al evento de este pedido.

## Fallos localizados

- Las escrituras del servidor utilizaban el cliente público de Supabase. El esquema del proyecto permite insertar y leer pedidos con ese rol, pero no define una política para actualizarlos.
- Una actualización bloqueada por RLS puede afectar a cero filas sin devolver error. El checkout y el webhook solo comprobaban `error`, por lo que podían continuar como si hubieran guardado los cambios. Las pruebas anteriores simulaban siempre una escritura efectiva y no cubrían este fallo.
- La página de confirmación recibía `session_id`, pero lo ignoraba: consultaba directamente el estado local de Supabase. Ni el cliente ni el panel podían corregir un webhook perdido o un pago desincronizado.
- El administrador recargaba la base de datos cada 30 segundos, sin contrastar los pagos con Stripe. Una consulta iniciada antes de una modificación manual también podía terminar después y devolver la pantalla al estado anterior.

## Corrección implementada

`lib/supabase-admin.ts` es un cliente exclusivo del servidor que exige `SUPABASE_SERVICE_ROLE_KEY`. Las operaciones de `lib/db.ts` y la asociación de Checkout utilizan ese cliente. No hay alternativa silenciosa con la clave pública. Se mantienen los controles de sesión de las rutas administrativas y los filtros públicos de tiendas y sabores.

`lib/order-payments.ts` centraliza la verificación. Recupera el estado actual de la sesión de Stripe, expande PaymentIntent y cargo, valida ID del pedido, sesión guardada, moneda e importe y persiste el pago con comprobación de fila y control de concurrencia. Conserva los estados de preparación asignados después del cobro; un evento antiguo no revierte reembolsos ni pedidos completados.

El webhook utiliza esa misma función, en vez de aplicar directamente un evento posiblemente antiguo. Los errores de persistencia o notificación devuelven 500 para permitir reintentos. Las fechas de envío y las claves de idempotencia de Resend se mantienen por destinatario.

La página del cliente llama a `POST /api/checkout/confirm` con el ID del pedido y la sesión. Ambos se contrastan desde el servidor antes de devolver datos. Un pago verificado muestra «¡Pedido pagado correctamente!», aunque no haya llegado el webhook. Los correos se procesan con `after()` para no retrasar la confirmación del pago. La página sigue consultando mientras el pago o su correo estén pendientes, hasta 20 intentos separados por tres segundos, y ofrece volver a comprobar. Si no se puede verificar, informa de ello y pide no repetir el pedido; no interpreta un fallo de conexión como impago.

El panel concilia sus pedidos contra Stripe al consultar `/api/orders`. Si un pedido antiguo carece de sesión, busca una coincidencia exacta de metadatos entre las sesiones creadas cerca de su creación (desde un minuto antes hasta diez minutos después, con paginación). Nunca utiliza el prefijo visible del pedido para vincular un pago.

La conciliación procesa como máximo 20 pedidos por consulta, cuatro en paralelo, rotando por última comprobación y con un presupuesto de 15 segundos antes de iniciar cada bloque. No es una sincronización instantánea de todo el histórico: una lista grande puede requerir varias actualizaciones. La caché de 30 segundos es local a cada proceso de servidor. El panel consulta cada 30 segundos mientras está visible, al recuperar el foco y al pulsar «Actualizar pedidos». Los fallos de conciliación o carga se muestran explícitamente, conservando el último estado disponible. La consulta al panel no envía correos retrospectivos.

El panel muestra el número completo del pedido y conserva el enlace directo al pago solo en pedidos que no estén cancelados ni tengan el pago caducado. Se eliminaron las búsquedas y redirecciones a registros de Stripe.

Para pedidos cancelados, pagos fallidos o caducados, «Detalles del intento» consulta una ruta autenticada y muestra los datos dentro del panel: estado de sesión, estado del pago y del intento de cobro, último error que Stripe conserva (mensaje, código y motivo de rechazo), reembolsos y referencias. La respuesta está limitada a esos campos y no expone secretos del cliente ni datos de tarjeta. Es una consulta en lectura, no un historial completo de errores. Stripe puede borrar `last_payment_error` al actualizar el PaymentIntent. La ausencia de ese campo no demuestra que nunca hubiera fallos; una caducidad tampoco demuestra un rechazo de tarjeta.

En una consulta adicional de producción se encontró una sesión caducada con pago no confirmado, sin PaymentIntent asociado ni error bancario disponible. No se modificaron registros. No se fabrican motivos de fallo cuando Stripe no los devuelve.

Los estados de preparación y pago siguen separados. Las escrituras administrativas comprueban versión y pago en la propia actualización para no completar un pedido reembolsado durante una modificación concurrente.

## Puesta en producción

1. Verificar en Vercel, entorno Production, que existe `SUPABASE_SERVICE_ROLE_KEY` del mismo proyecto que `NEXT_PUBLIC_SUPABASE_URL`. Es una variable privada del servidor; no debe tener prefijo `NEXT_PUBLIC_` ni compartirse por chat. Se comprobó su presencia local, no su configuración en Vercel.
2. Mantener aplicadas las migraciones de pagos y `supabase-order-notifications-migration.sql`, ya preparadas en la revisión anterior. Esta corrección no requiere un SQL adicional ni desactivar RLS.
3. Mantener el webhook y el secreto de firma del destino correcto. Eventos atendidos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `payment_intent.succeeded` (respaldo opcional), `payment_intent.payment_failed` y `charge.refunded`. El destino revisado ya incluye los seis eventos de la configuración anterior.
4. Desplegar el código y comprobar un pago en un entorno de pruebas independiente: retorno del cliente antes del webhook, recuperación posterior desde el panel, cambio manual de estado y reembolso. Revisar la aceptación de correos en Resend.
5. Tras desplegar, abrir o actualizar el panel para conciliar los pedidos anteriores. La recuperación automática requiere encontrar la sesión y validar metadatos e importe; una sesión no encontrada no se interpreta como pago ni se cancela por suposición.

Durante la investigación no se modificaron pedidos reales, no se reenviaron eventos ni correos, y no se desplegaron cambios. La conciliación de registros reales se ejecutará con el código actualizado cuando el administrador consulte el panel.

## Validación

`node --test scripts/order-flow.test.cjs`: 37 pruebas aisladas con Stripe, Supabase y Resend simulados, incluidas la escritura sin filas afectadas, vuelta del cliente sin webhook, recuperación de sesión ausente, errores de Stripe, acceso a un pedido con sesión ajena, concurrencia administrativa, reintentos de correo, caducidades y reembolsos.

`npm run build` (Turbopack) y `npm run build -- --webpack` compilan y genera las páginas y rutas. Se eliminó una importación sin uso a un componente inexistente de la portada para poder verificar el build. El proyecto configura `typescript.ignoreBuildErrors: true`; el build no acredita una comprobación de tipos completa. `tsc` conserva tres errores anteriores: dos usos de `defaultPrices` ausentes en `app/admin/page.backup.tsx` y la versión de API de `lib/stripe.ts`, incompatible con el tipo literal del SDK instalado. Esta revisión conserva la versión de API existente.

Las fechas de correo registran aceptación por Resend, no entrega en la bandeja del cliente. Las claves de idempotencia de Resend duran 24 horas: si el proveedor acepta un envío y su registro en base de datos falla durante más tiempo, un reintento posterior podría duplicarlo.

Referencias: [confirmación de pedidos con webhook y retorno del cliente en Stripe](https://docs.stripe.com/checkout/fulfillment.md?payment-ui=stripe-hosted), [idempotencia de Resend](https://resend.com/docs/dashboard/emails/idempotency-keys).
