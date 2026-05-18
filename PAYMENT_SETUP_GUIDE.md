# 🚀 Guía de Setup - Sistema de Pagos y Emails

Esta guía te llevará paso a paso por la configuración completa del sistema de pagos con Stripe y notificaciones por email.

## 📋 Requisitos Previos

- Cuenta de Stripe (https://stripe.com)
- Cuenta de Resend (https://resend.com - plan gratuito incluye 3,000 emails/mes)
- Proyecto Supabase configurado

---

## 🔧 Paso 1: Instalar Dependencias

```bash
pnpm add stripe @stripe/stripe-js resend
pnpm add -D @types/node
```

---

## 🔑 Paso 2: Configurar Variables de Entorno

Añade estas variables a tu archivo `.env.local`:

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Emails de notificación (emails de las tiendas)
STORE_EMAIL_CENTRAL=central@happycheese.com
STORE_EMAIL_NORTE=norte@happycheese.com
```

### 📝 Cómo obtener las claves:

### Stripe:
1. Ve a https://dashboard.stripe.com/test/apikeys
2. Copia la "Publishable key" → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copia la "Secret key" → `STRIPE_SECRET_KEY`
4. Para webhook (lo configuraremos después): Developers → Webhooks → `STRIPE_WEBHOOK_SECRET`

### Resend:
1. Ve a https://resend.com/api-keys
2. Crea una API Key → `RESEND_API_KEY`
3. Verifica tu dominio (o usa `onboarding@resend.dev` para testing)

---

## 🗄️ Paso 3: Actualizar Schema de Supabase

Ejecuta este SQL en tu proyecto de Supabase:

```sql
-- Añadir campos de pago a la tabla orders
ALTER TABLE happycheese.orders 
ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT,
ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT,
ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMPTZ;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session 
ON happycheese.orders("stripeSessionId");

CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON happycheese.orders("paymentStatus");

-- Comentarios
COMMENT ON COLUMN happycheese.orders."paymentStatus" IS 
'Estados: pending, paid, failed, refunded';
```

---

## 🌐 Paso 4: Configurar Webhook de Stripe (Desarrollo Local)

### Para desarrollo local:

1. Instala Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Verifica instalación
stripe --version
```

2. Login en Stripe:
```bash
stripe login
```

3. Escucha webhooks en otra terminal:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. Copia el webhook secret que aparece (`whsec_...`) a tu `.env.local`

### Para producción:

1. Ve a Stripe Dashboard → Developers → Webhooks
2. "+ Add endpoint"
3. URL: `https://tu-dominio.com/api/webhooks/stripe`
4. Eventos a escuchar:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copia el Signing secret a tu `.env.local` de producción

---

## 📧 Paso 5: Configurar Dominio en Resend (Opcional pero Recomendado)

Para producción, configura tu dominio:

1. Ve a Resend → Domains → Add Domain
2. Añade tu dominio (ej: `happycheese.com`)
3. Añade los DNS records que te proporcione Resend
4. Verifica el dominio

Para testing, puedes usar `onboarding@resend.dev` como remitente.

---

## 🧪 Paso 6: Testing

### Test del flujo completo:

1. Inicia el servidor:
```bash
pnpm dev
```

2. En otra terminal, inicia Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

3. Crea un pedido en http://localhost:3000/pedido

4. Usa tarjetas de prueba de Stripe:
   - Éxito: `4242 4242 4242 4242`
   - Falla: `4000 0000 0000 0002`
   - Cualquier fecha futura y CVC

5. Verifica:
   - ✅ Redirección correcta
   - ✅ Pedido guardado en Supabase
   - ✅ Email al cliente
   - ✅ Email a la tienda
   - ✅ Estado del pedido actualizado

### Logs a revisar:

- Terminal del servidor Next.js
- Terminal de Stripe CLI
- Dashboard de Stripe
- Dashboard de Resend (Emails)
- Supabase Database

---

## 🚀 Paso 7: Deploy a Producción

### 7.1 Variables de Entorno en Vercel:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (el de producción)
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://happycheese.com
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
STORE_EMAIL_CENTRAL=...
STORE_EMAIL_NORTE=...
```

### 7.2 Configurar Webhook de Producción:

1. En Stripe Dashboard, crea webhook para producción
2. URL: `https://happycheese.com/api/webhooks/stripe`
3. Actualiza `STRIPE_WEBHOOK_SECRET` en Vercel

### 7.3 Testing en Producción:

Usa modo test de Stripe en producción primero:
- Mantén `pk_test_...` y `sk_test_...`
- Prueba todo el flujo
- Cuando funcione, cambia a `pk_live_...` y `sk_live_...`

---

## 📊 Monitoreo

### Stripe Dashboard:
- Payments → Ver todos los pagos
- Developers → Webhooks → Ver logs

### Resend Dashboard:
- Emails → Ver todos los emails enviados
- Analytics → Tasas de entrega

### Supabase:
```sql
-- Ver pedidos recientes
SELECT * FROM happycheese.orders 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Ver pedidos por estado de pago
SELECT "paymentStatus", COUNT(*) 
FROM happycheese.orders 
GROUP BY "paymentStatus";
```

---

## 🆘 Troubleshooting

### Error: "No signature found in headers"
- Webhook secret incorrecto
- Verifica que Stripe CLI esté corriendo
- Verifica la variable `STRIPE_WEBHOOK_SECRET`

### Emails no se envían:
- Verifica `RESEND_API_KEY`
- Revisa Dashboard de Resend → Logs
- Para testing, usa `onboarding@resend.dev` como from

### Pedido creado pero pago no procesa:
- Revisa logs de Stripe CLI
- Verifica que el webhook esté activo
- Chequea la consola del navegador

### Doble pedido creado:
- Normal: uno pendiente + uno al confirmar pago
- El webhook actualiza el estado del pendiente

---

## ✅ Checklist Final

Antes de ir a producción:

- [ ] Todas las variables de entorno configuradas
- [ ] Webhook de Stripe funcionando
- [ ] Emails de prueba recibidos
- [ ] Tarjetas de prueba funcionan
- [ ] Estados de pedido se actualizan correctamente
- [ ] Dominio verificado en Resend
- [ ] Claves de producción de Stripe configuradas
- [ ] SSL/HTTPS activo en tu dominio
- [ ] Políticas de privacidad y términos actualizados

---

## 🎉 ¡Listo!

Tu sistema de pagos está configurado. Los clientes ahora pueden:

1. ✅ Crear pedidos
2. ✅ Pagar con Stripe Checkout
3. ✅ Recibir confirmación por email
4. ✅ Ver su pedido confirmado

Y tú recibes:
1. ✅ Notificación de nuevo pedido
2. ✅ Pago seguro en Stripe
3. ✅ Registro en Supabase
4. ✅ Panel de admin actualizado

---

**Siguiente paso:** Ejecuta `pnpm add stripe @stripe/stripe-js resend` y continúa con la implementación.
