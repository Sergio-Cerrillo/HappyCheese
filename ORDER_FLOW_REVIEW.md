# Revisión del flujo de pedidos

## Hallazgos del código anterior

- `/api/checkout` guardaba el pedido antes de abrir Stripe. Abandonar el pago dejaba un pedido pendiente indefinidamente. No recibir correo en ese caso es correcto: no se ha confirmado ningún pago.
- El dashboard mostraba `status` (preparación), sin mostrar `paymentStatus` (pago). Era posible confirmar o completar manualmente un pedido impagado.
- El webhook confirmaba `checkout.session.completed` sin comprobar `payment_status`. Ocultaba errores de base de datos y correo devolviendo 200, impidiendo los reintentos de Stripe.
- Los eventos repetidos podían volver a poner un pedido completado como confirmado y repetir los correos.
- Los fallos de pago dependían de metadatos del PaymentIntent que no se añadían al crear Checkout. No se procesaban sesiones caducadas ni reembolsos.
- Las estadísticas incluían pedidos pendientes de pago. El calendario también incluía intentos sin pagar.
- La ruta pública antigua `POST /api/orders` permitía crear pedidos sin pasar por Stripe. El formulario actual utiliza `/api/checkout`.

## Comportamiento corregido

Los intentos siguen registrados en el dashboard, con un indicador y filtro de pago independientes del estado del pedido. Un intento abandonado sigue pendiente hasta que Stripe notifica su caducidad; entonces pasa a cancelado con pago caducado. Volver desde Stripe mediante el botón de cancelar no prueba que la sesión haya caducado, porque todavía puede reutilizarse.

Solo un pago verificado permite confirmar o completar el pedido desde el panel. Un evento de pago repetido conserva los estados completado y cancelado. La ruta administrativa solo acepta modificar `status`; la ruta antigua de creación devuelve 410.

El webhook comprueba pago, sesión, moneda e importe, devuelve 500 si falla la persistencia o un correo, registra los envíos por destinatario y utiliza claves de idempotencia de Resend. Los registros indican aceptación del envío por el proveedor, no entrega a la bandeja del destinatario. Las claves de Resend duran 24 horas; los registros persistentes evitan repetir envíos posteriormente. Si Resend acepta un correo pero falla el registro durante más de 24 horas, un reintento posterior todavía podría duplicarlo.

Los ingresos cuentan pagos verificados y descuentan los importes reembolsados. Cancelar un pedido pagado no devuelve dinero automáticamente y mantiene ese cobro en ingresos hasta registrar el reembolso. En las gráficas por producto o porción, los reembolsos parciales se distribuyen proporcionalmente: Stripe no indica qué producto corresponde al importe devuelto. El calendario de recogidas excluye impagos, cancelaciones y reembolsos completos.

El dashboard consulta nuevos estados cada 30 segundos mientras está visible y al volver a la pestaña. La página de confirmación consulta durante unos 30 segundos para recoger la actualización del webhook y distingue el pago confirmado del correo pendiente de envío.

## Puesta en producción pendiente

1. Ejecutar `supabase-order-notifications-migration.sql` en Supabase **antes de desplegar**. Requiere que ya esté aplicada la migración de pagos existente. Añade dos fechas de envío y el importe reembolsado, sin cambiar los estados históricos.
2. Configurar el destino de Stripe `/api/webhooks/stripe` para recibir `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `payment_intent.payment_failed` y `charge.refunded`. Mantener el secreto de firma correspondiente al destino y entorno correctos.
3. Desplegar y comprobar en Stripe de pruebas un pago, abandono/caducidad, fallo seguido de pago, reenvío de evento y reembolso. Verificar los dos destinatarios en Resend.
4. Conciliar los pedidos históricos con sus sesiones de Stripe antes de cambiar sus estados. Un pendiente puede ser un abandono o un pago cuyo webhook falló; no se puede decidir solo por el indicador local. Los correos históricos sin registro aparecerán como «Sin envío de confirmación registrado».

Esta revisión y las pruebas no consultaron pedidos, entregas de webhook ni correos de producción. No se han aplicado migraciones, desplegado cambios, cancelado sesiones reales ni modificado pedidos históricos.

## Validación local

`node --test scripts/order-flow.test.cjs`: 13 pruebas con Stripe, Supabase y Resend simulados. Cubren impagos, pago confirmado, duplicados, errores y reintentos, importes o sesiones incorrectos, caducidad, fallos antiguos, reembolsos, ingresos, restricciones administrativas y error al crear Checkout.

La comprobación TypeScript completa sigue bloqueada por cuatro errores previos: dos propiedades `defaultPrices` ausentes en `app/admin/page.backup.tsx`, la importación inexistente `components/sections/product-showcase` en `app/page.tsx`, y la versión de API configurada en `lib/stripe.ts`, incompatible con los tipos del SDK instalado. No se cambia la versión de API de Stripe en esta corrección porque requiere comprobar su compatibilidad por separado.

Referencias: [confirmación de pedidos en Stripe](https://docs.stripe.com/checkout/fulfillment), [idempotencia de Resend](https://resend.com/docs/dashboard/emails/idempotency-keys).
