# 🚀 Quick Start - Producción en 10 Pasos

## Tiempo estimado: 30-45 minutos

### 1️⃣ Activa Stripe Producción (5 min)
- Ve a https://dashboard.stripe.com
- Completa verificación de cuenta
- Cambia a "Modo en vivo"
- Copia claves: `pk_live_...` y `sk_live_...`

### 2️⃣ Verifica Supabase (2 min)
- Ve a https://supabase.com → Tu proyecto
- Settings → API
- Copia: URL, anon key, service_role key

### 3️⃣ Prepara código (2 min)
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

### 4️⃣ Deploy en Vercel (5 min)
- https://vercel.com/new
- Importa tu repo
- Framework: Next.js
- Build: `pnpm build`
- **NO HAGAS DEPLOY TODAVÍA**

### 5️⃣ Añade Variables en Vercel (5 min)
Copia y pega todas estas (reemplaza valores):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_APP_URL=https://tu-proyecto.vercel.app
RESEND_API_KEY=re_xxx
STORE_EMAIL_CENTRAL=central@happycheese.com
STORE_EMAIL_NORTE=norte@happycheese.com
```

**DEJA VACÍO POR AHORA**: `STRIPE_WEBHOOK_SECRET`

### 6️⃣ Deploy! (3 min)
- Click "Deploy"
- Espera...
- ✅ Copia tu URL: `https://tu-proyecto.vercel.app`

### 7️⃣ Configura Webhook Stripe (5 min)
- https://dashboard.stripe.com/webhooks (Modo en vivo)
- Add endpoint: `https://tu-proyecto.vercel.app/api/webhooks/stripe`
- Eventos: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- Copia el webhook secret: `whsec_...`

### 8️⃣ Añade Webhook Secret (2 min)
- Vercel → Settings → Environment Variables
- Añade: `STRIPE_WEBHOOK_SECRET=whsec_xxx`
- Deployments → Redeploy (último deployment)

### 9️⃣ Test con Tarjeta de Prueba (5 min)
- Abre tu app: `https://tu-proyecto.vercel.app`
- Crea un pedido
- Paga con: `4242 4242 4242 4242`, cualquier fecha futura, CVC 123
- Verifica email recibido
- Verifica pedido en admin

### 🔟 Test con Pago Real (5 min)
- Crea pedido pequeño
- Paga con tarjeta real
- Verifica todo funciona
- 🎉 **¡LISTO! Estás en producción**

---

## ⚠️ Importante ANTES de aceptar pagos reales:

1. **Cambia contraseña de admin** (si es la default)
2. **Verifica políticas de privacidad** en tu web
3. **Configura términos y condiciones** (requisito legal para e-commerce)
4. **Prueba el flujo completo** al menos 3 veces
5. **Verifica que los emails lleguen** correctamente

---

## 📞 URLs Importantes:

- **Tu app**: https://___________
- **Admin**: https://___________/admin
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard

---

## 🆘 ¿Problemas?

Consulta [DESPLIEGUE_PRODUCCION.md](./DESPLIEGUE_PRODUCCION.md) para guía detallada y troubleshooting.

---

**Última actualización**: Mayo 2026
