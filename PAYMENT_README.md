# 💳 Sistema de Pagos - Happy Cheese

Sistema completo de pagos con Stripe, notificaciones por email y gestión de pedidos.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTE                              │
│  1. Crea pedido en /pedido                                   │
│  2. Completa datos → Click "Proceder al pago"               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    API: /api/checkout                         │
│  1. Valida datos del pedido                                  │
│  2. Crea pedido en Supabase (status: 'pendiente')           │
│  3. Crea sesión de Stripe Checkout                          │
│  4. Retorna URL de pago                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   STRIPE CHECKOUT                            │
│  Cliente ingresa tarjeta → Stripe procesa pago              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│            WEBHOOK: /api/webhooks/stripe                     │
│  1. Recibe evento checkout.session.completed                │
│  2. Actualiza pedido en Supabase:                           │
│     - status: 'confirmado'                                   │
│     - paymentStatus: 'paid'                                  │
│     - stripeSessionId, stripePaymentIntentId                │
│  3. Envía emails (paralelo):                                │
│     ├─ Email confirmación → Cliente                         │
│     └─ Email notificación → Tienda                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              PÁGINA: /pedido/confirmacion                    │
│  Muestra resumen del pedido con estado del pago              │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Componentes del Sistema

### Backend

- **`lib/stripe.ts`** - Cliente y utilidades de Stripe
- **`lib/email.ts`** - Templates y envío de emails con Resend
- **`app/api/checkout/route.ts`** - Creación de sesión de pago
- **`app/api/webhooks/stripe/route.ts`** - Procesamiento de pagos confirmados

### Frontend

- **`components/order/order-form.tsx`** - Formulario de pedido con integración Stripe
- **`app/pedido/confirmacion/page.tsx`** - Confirmación post-pago

### Base de Datos

- **`supabase-payment-migration.sql`** - Schema para campos de pago

### Emails

- **Confirmación al cliente** - HTML con detalles del pedido
- **Notificación a tienda** - HTML con información completa para preparar pedido

## 🚀 Quick Start

1. **Instalar dependencias:**
   ```bash
   pnpm add stripe @stripe/stripe-js resend
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env.local
   # Edita .env.local con tus claves
   ```

3. **Actualizar Supabase:**
   ```bash
   # Ejecuta supabase-payment-migration.sql en SQL Editor
   ```

4. **Iniciar Stripe CLI (desarrollo):**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

5. **Iniciar servidor:**
   ```bash
   pnpm dev
   ```

6. **Probar:**
   - Ve a http://localhost:3000/pedido
   - Crear pedido
   - Usar tarjeta: `4242 4242 4242 4242`

## 📚 Documentación Completa

- **`PAYMENT_SETUP_GUIDE.md`** - Guía detallada de configuración
- **`IMPLEMENTATION_COMPLETE.md`** - Checklist y troubleshooting
- **`.env.example`** - Template de variables de entorno

## 🔑 Servicios Requeridos

| Servicio | Propósito | URL |
|----------|-----------|-----|
| Stripe | Procesamiento de pagos | https://stripe.com |
| Resend | Envío de emails | https://resend.com |
| Supabase | Base de datos | https://supabase.com |

## 💡 Características

- ✅ Pagos seguros con Stripe Checkout
- ✅ Webhooks para confirmación automática
- ✅ Emails HTML profesionales
- ✅ Manejo de estados de pago
- ✅ Página de confirmación dinámica
- ✅ Soporte para múltiples tiendas
- ✅ Logs y monitoreo
- ✅ Modo test y producción

## 🧪 Tarjetas de Prueba

| Tarjeta | Descripción |
|---------|-------------|
| `4242 4242 4242 4242` | Pago exitoso |
| `4000 0000 0000 0002` | Pago rechazado |
| `4000 0000 0000 9995` | Requiere autenticación |

Usa cualquier:
- Fecha futura
- CVC de 3 dígitos
- Código postal válido

## 📊 Estados de Pedido

```typescript
// Status del pedido
'pendiente'    // Creado, esperando pago
'confirmado'   // Pago recibido
'completado'   // Entregado
'cancelado'    // Cancelado

// Payment Status
'pending'      // Esperando pago
'paid'         // Pagado exitosamente
'failed'       // Pago fallido
'refunded'     // Reembolsado
```

## 🔍 Verificación

### Pedido Creado
```sql
SELECT * FROM happycheese.orders WHERE id = 'tu-order-id';
```

### Pagos por Estado
```sql
SELECT "paymentStatus", COUNT(*) 
FROM happycheese.orders 
GROUP BY "paymentStatus";
```

### Ingresos Totales
```sql
SELECT SUM(total) 
FROM happycheese.orders 
WHERE "paymentStatus" = 'paid';
```

## 📈 Monitoreo

- **Stripe Dashboard**: Pagos y webhooks
- **Resend Dashboard**: Emails enviados
- **Supabase**: Estado de pedidos
- **Logs del servidor**: Debug

## 🆘 Soporte

Si algo no funciona:

1. Revisa `IMPLEMENTATION_COMPLETE.md` → Troubleshooting
2. Verifica logs de terminal
3. Chequea Stripe CLI está corriendo
4. Confirma variables de entorno
5. Revisa dashboards de servicios

## 🎯 Próximos Pasos

Después de implementar:

- [ ] Testing completo
- [ ] Verificar dominio en Resend
- [ ] Obtener claves de producción Stripe
- [ ] Configurar webhook de producción
- [ ] Deploy a Vercel
- [ ] Monitorear primeros pedidos

---

**¡Listo para procesar pagos! 🎉**
