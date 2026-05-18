# 🚀 Guía de Despliegue a Producción - HappyCheese

## 📋 Checklist Pre-Despliegue

Antes de empezar, asegúrate de tener:
- [ ] Cuenta de Vercel (https://vercel.com)
- [ ] Proyecto en GitHub/GitLab/Bitbucket
- [ ] Cuenta de Stripe (modo producción activado)
- [ ] Proyecto de Supabase funcionando
- [ ] Dominio personalizado (opcional)

---

## 🔐 PASO 1: Preparar Variables de Entorno

### 1.1 Crear archivo `.env.example`
Primero, documenta todas las variables necesarias (sin valores reales):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe (Producción)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL (tu dominio de producción)
NEXT_PUBLIC_APP_URL=https://tu-dominio.com

# Resend (Email)
RESEND_API_KEY=re_...

# Emails de tiendas
STORE_EMAIL_CENTRAL=central@happycheese.com
STORE_EMAIL_NORTE=norte@happycheese.com
```

### 1.2 Obtener tus claves de Stripe para Producción

⚠️ **IMPORTANTE**: Ahora vas a usar claves REALES (no test)

1. **Activar cuenta de Stripe para producción**:
   - Ve a https://dashboard.stripe.com
   - Completa el proceso de verificación de cuenta
   - Añade información bancaria para recibir pagos
   - Activa tu cuenta

2. **Obtener claves de producción**:
   - Ve a: https://dashboard.stripe.com/apikeys
   - **Cambia de "Modo de prueba" a "Modo en vivo"** (toggle arriba a la derecha)
   - Copia la **Publishable key** (`pk_live_...`)
   - Revela y copia la **Secret key** (`sk_live_...`)
   - ⚠️ Guárdalas en un lugar seguro

3. **El webhook secret lo configuraremos después del deploy**

---

## 🗄️ PASO 2: Verificar Supabase

### 2.1 Confirmar que tu base de datos está lista

1. Ve a tu proyecto en https://supabase.com
2. Ve a **SQL Editor** y ejecuta este query para verificar:

```sql
-- Verificar tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'happycheese';

-- Verificar que hay datos
SELECT COUNT(*) as stores FROM happycheese.stores;
SELECT COUNT(*) as flavors FROM happycheese.flavors;
```

### 2.2 Verificar Storage

```sql
-- Verificar bucket de imágenes
SELECT * FROM storage.buckets WHERE name = 'flavor-images';
```

### 2.3 Verificar Políticas de Seguridad (RLS)

Asegúrate de que las políticas estén configuradas:

```sql
-- Ver políticas activas
SELECT * FROM pg_policies WHERE schemaname = 'happycheese';
```

### 2.4 Obtener credenciales de Supabase

1. Ve a **Project Settings** → **API**
2. Copia:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 🌐 PASO 3: Desplegar en Vercel

### 3.1 Preparar el código

1. **Asegúrate de que `.env.local` NO esté en git**:
```bash
# Verificar .gitignore
cat .gitignore | grep .env
```

Debe contener:
```
.env*.local
.env.local
.env
```

2. **Commit y push de todos los cambios**:
```bash
git add .
git commit -m "Preparado para producción"
git push origin main
```

### 3.2 Crear proyecto en Vercel

1. Ve a https://vercel.com/new
2. **Importa tu repositorio** de GitHub/GitLab
3. Configura el proyecto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (por defecto)
   - **Build Command**: `pnpm build` (o `npm run build`)
   - **Output Directory**: `.next` (automático)
   - **Install Command**: `pnpm install` (o `npm install`)

### 3.3 Configurar Variables de Entorno en Vercel

**MUY IMPORTANTE**: Antes de hacer el primer deploy, añade TODAS las variables:

1. En la sección **Environment Variables** de Vercel:
2. Añade UNA POR UNA:

```
NEXT_PUBLIC_SUPABASE_URL = [tu_url_de_supabase]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [tu_anon_key]
SUPABASE_SERVICE_ROLE_KEY = [tu_service_role_key]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
STRIPE_SECRET_KEY = sk_live_...
NEXT_PUBLIC_APP_URL = https://tu-proyecto.vercel.app
RESEND_API_KEY = [tu_resend_key]
STORE_EMAIL_CENTRAL = central@happycheese.com
STORE_EMAIL_NORTE = norte@happycheese.com
```

3. **IMPORTANTE**: Por ahora, deja `STRIPE_WEBHOOK_SECRET` vacío (lo configuraremos después)

4. Asegúrate de que todas las variables estén para **Production**, **Preview**, y **Development**

### 3.4 Deploy

1. Click en **Deploy**
2. Espera a que termine (2-3 minutos)
3. Una vez desplegado, copia tu URL de producción (ej: `https://happy-cheese.vercel.app`)

---

## 🔔 PASO 4: Configurar Webhook de Stripe en Producción

Ahora que tu app está en vivo, configura el webhook REAL:

### 4.1 Crear webhook en Stripe

1. Ve a: https://dashboard.stripe.com/webhooks
2. Asegúrate de estar en **Modo en vivo** (no test)
3. Click en **+ Add endpoint**
4. Configura:
   - **Endpoint URL**: `https://tu-dominio.vercel.app/api/webhooks/stripe`
   - **Description**: `HappyCheese Production Webhook`
   - **Events to send**: Selecciona:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Click en **Add endpoint**

5. **Copia el Signing secret** (empieza con `whsec_...`)

### 4.2 Actualizar variable en Vercel

1. Ve a tu proyecto en Vercel → **Settings** → **Environment Variables**
2. Añade o edita:
   ```
   STRIPE_WEBHOOK_SECRET = whsec_[tu_secret_de_producción]
   ```
3. **Redeploy**: Ve a **Deployments** → **⋮** (tres puntos del último deploy) → **Redeploy**

---

## ✅ PASO 5: Verificación Post-Despliegue

### 5.1 Test de la aplicación

1. **Navega a tu URL de producción**
2. **Prueba el flujo completo**:
   - [ ] La página principal carga correctamente
   - [ ] Se muestran las tiendas y sabores desde Supabase
   - [ ] Las imágenes cargan correctamente
   - [ ] Puedes crear un pedido
   - [ ] El checkout de Stripe funciona (usa una tarjeta de prueba primero)
   - [ ] Recibes el email de confirmación

### 5.2 Test del webhook

1. Ve a https://dashboard.stripe.com/webhooks
2. Click en tu webhook → **Send test webhook**
3. Selecciona `checkout.session.completed`
4. Envía el test
5. Verifica en Vercel → **Functions** → Logs que el webhook se procesó correctamente

### 5.3 Test de pago REAL (con precaución)

Para probar con dinero real (puedes hacer un pedido mínimo):

1. Haz un pedido real usando tu tarjeta
2. Verifica que:
   - [ ] El pago se procesa en Stripe
   - [ ] El pedido se guarda en Supabase con `paymentStatus: 'paid'`
   - [ ] Recibes el email de confirmación
   - [ ] Aparece en el panel de admin

---

## 🔐 PASO 6: Seguridad y Mejoras

### 6.1 Cambiar credenciales de admin

⚠️ **CRÍTICO**: Si tu admin actual tiene contraseña por defecto, cámbiala:

1. Ve a Supabase → SQL Editor
2. Ejecuta (ajusta el hash de bcrypt con tu nueva contraseña):

```sql
-- Primero genera el hash en Node.js:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('tu_nueva_contraseña', 10);

UPDATE happycheese.admins 
SET "passwordHash" = '$2b$10$...' -- tu hash aquí
WHERE username = 'admin';
```

### 6.2 Configurar dominio personalizado (opcional)

Si tienes un dominio:

1. Ve a tu proyecto en Vercel → **Settings** → **Domains**
2. Añade tu dominio (ej: `happycheese.com`)
3. Sigue las instrucciones para configurar DNS
4. Una vez configurado, actualiza:
   - `NEXT_PUBLIC_APP_URL` en Vercel
   - La URL del webhook en Stripe

### 6.3 Monitoreo

1. **Vercel Analytics**: 
   - Ya está incluido con `@vercel/analytics`
   - Verifica métricas en Vercel → **Analytics**

2. **Stripe Dashboard**:
   - Monitorea pagos y webhooks en https://dashboard.stripe.com

3. **Supabase Logs**:
   - Revisa logs de base de datos en Supabase → **Logs**

---

## 🎯 PASO 7: Testing Final

### Checklist de producción:

- [ ] **Página principal** funciona y carga rápido
- [ ] **Sabores** se muestran con imágenes desde Supabase Storage
- [ ] **Tiendas** se muestran correctamente
- [ ] **Formulario de pedido** funciona completamente
- [ ] **Checkout de Stripe** funciona (modo live)
- [ ] **Webhook** se ejecuta correctamente después de un pago
- [ ] **Email de confirmación** se envía al cliente y admin
- [ ] **Panel de admin** funciona:
  - [ ] Login con nuevas credenciales
  - [ ] Ver pedidos
  - [ ] Gestionar sabores
  - [ ] Gestionar tiendas
- [ ] **SSL/HTTPS** activo (Vercel lo hace automáticamente)
- [ ] **Variables de entorno** todas configuradas
- [ ] **Logs de errores** funcionan (revisa Vercel Functions)

---

## 🆘 Solución de Problemas Comunes

### Error: "Missing environment variables"
- Verifica que TODAS las variables estén en Vercel
- Redeploy después de añadir variables

### Error: "Stripe webhook signature verification failed"
- Verifica que `STRIPE_WEBHOOK_SECRET` sea el correcto
- Asegúrate de que sea el webhook de PRODUCCIÓN (no test)
- Redeploy después de cambiar

### Error: "Supabase unauthorized"
- Verifica las claves de Supabase
- Confirma que las políticas RLS estén correctas
- Verifica que `db: { schema: 'happycheese' }` esté en `lib/supabase.ts`

### Las imágenes no cargan
- Verifica las políticas de Supabase Storage
- Confirma que las URLs sean públicas
- Revisa CORS en Supabase Storage settings

### Error 500 en webhooks
- Revisa logs en Vercel → Functions → `/api/webhooks/stripe`
- Verifica que el webhook de Stripe envíe los eventos correctos
- Confirma que Supabase pueda guardar el pedido

---

## 📊 Monitoreo Post-Producción

### Diario:
- Revisar dashboard de Stripe para pagos
- Revisar panel de admin para nuevos pedidos
- Verificar que los emails se envíen

### Semanal:
- Revisar logs de Vercel para errores
- Revisar analytics para ver uso
- Backup manual de datos importantes (si es necesario)

### Mensual:
- Actualizar dependencias: `pnpm update`
- Revisar métricas de rendimiento en Vercel
- Revisar uso de Supabase y Stripe

---

## 🎉 ¡Listo!

Tu aplicación HappyCheese ya está en producción. Puntos importantes:

1. ✅ **Supabase**: Base de datos en la nube
2. ✅ **Vercel**: Hosting y serverless functions
3. ✅ **Stripe**: Pagos reales configurados
4. ✅ **Webhooks**: Confirmación automática de pagos
5. ✅ **Emails**: Notificaciones automáticas

### Próximos pasos recomendados:

1. **Configurar dominio personalizado** para marca profesional
2. **Implementar Google Analytics** para tracking de usuarios
3. **Configurar Sentry** para monitoreo de errores (opcional)
4. **Backup automático** de Supabase (Supabase Pro)
5. **Optimización SEO** con metadata de Next.js

---

## 📞 Soporte

- **Vercel**: https://vercel.com/support
- **Stripe**: https://support.stripe.com
- **Supabase**: https://supabase.com/support

---

**Fecha de creación**: Mayo 2026
**Última actualización**: Mayo 2026
