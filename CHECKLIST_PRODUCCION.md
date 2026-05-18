# ✅ Checklist Rápido de Despliegue a Producción

## 🎯 Pre-Despliegue

- [ ] Código actualizado y testeado localmente
- [ ] Archivo `.env.local` NO está en git (verificar `.gitignore`)
- [ ] Cuenta de Vercel creada
- [ ] Cuenta de Stripe activada para producción (verificación completada)
- [ ] Proyecto de Supabase configurado y con datos

---

## 🔑 Paso 1: Reunir Credenciales

### Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_URL` copiado
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` copiado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` copiado

### Stripe (Modo LIVE)
- [ ] Activaste el "Modo en vivo" en Stripe Dashboard
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_...) copiado
- [ ] `STRIPE_SECRET_KEY` (sk_live_...) copiado

### Otros
- [ ] `RESEND_API_KEY` copiado
- [ ] Emails de tiendas definidos

---

## 🚀 Paso 2: Deploy en Vercel

- [ ] Repositorio pusheado a GitHub/GitLab
- [ ] Proyecto importado en Vercel
- [ ] Framework detectado como Next.js
- [ ] **TODAS** las variables de entorno añadidas (excepto STRIPE_WEBHOOK_SECRET por ahora)
- [ ] Build command: `pnpm build` o `npm run build`
- [ ] Deploy completado exitosamente
- [ ] URL de producción copiada (https://tu-proyecto.vercel.app)

---

## 🔔 Paso 3: Webhook de Stripe

- [ ] Ir a https://dashboard.stripe.com/webhooks (Modo en vivo)
- [ ] Crear nuevo endpoint con URL: `https://tu-proyecto.vercel.app/api/webhooks/stripe`
- [ ] Eventos añadidos:
  - [ ] `checkout.session.completed`
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
- [ ] Webhook secret (whsec_...) copiado
- [ ] Variable `STRIPE_WEBHOOK_SECRET` añadida en Vercel
- [ ] Redeploy realizado en Vercel

---

## ✅ Paso 4: Verificación

### Tests Básicos
- [ ] Página principal carga correctamente
- [ ] Sabores e imágenes se muestran
- [ ] Tiendas se muestran
- [ ] Formulario de pedido funciona
- [ ] Checkout de Stripe se abre correctamente

### Test de Pago (Tarjeta de prueba primero)
- [ ] Crear un pedido de prueba
- [ ] Completar pago con tarjeta: `4242 4242 4242 4242`
- [ ] Verificar redirección a página de confirmación
- [ ] Pedido aparece en Supabase
- [ ] Email de confirmación recibido

### Test de Pago Real (⚠️ Pequeño monto)
- [ ] Pedido con tarjeta real procesado
- [ ] Pago confirmado en Stripe Dashboard
- [ ] Pedido guardado con `paymentStatus: 'paid'`
- [ ] Email recibido por cliente
- [ ] Email recibido por tienda

### Panel de Admin
- [ ] Login funciona
- [ ] Dashboard muestra estadísticas
- [ ] Pedidos se listan correctamente
- [ ] Gestión de sabores funciona
- [ ] Gestión de tiendas funciona

---

## 🔐 Paso 5: Seguridad

- [ ] Contraseña de admin cambiada (si era por defecto)
- [ ] Variables de entorno verificadas (ninguna expuesta en código)
- [ ] Políticas de Supabase (RLS) verificadas
- [ ] HTTPS activo (automático en Vercel)

---

## 🎨 Paso 6: Personalización (Opcional)

- [ ] Dominio personalizado configurado
- [ ] SSL del dominio personalizado activo
- [ ] `NEXT_PUBLIC_APP_URL` actualizado al dominio personalizado
- [ ] URL del webhook actualizada en Stripe
- [ ] Favicon personalizado
- [ ] Open Graph images configuradas

---

## 📊 Paso 7: Monitoreo

- [ ] Vercel Analytics activado
- [ ] Logs de Vercel Functions verificados
- [ ] Dashboard de Stripe configurado
- [ ] Notificaciones de Stripe activadas
- [ ] Backup de Supabase programado (si usas plan Pro)

---

## 🎉 ¡Producción!

Tu aplicación está LIVE en: `___________________________`

### Accesos Importantes:
- **App**: https://tu-dominio.vercel.app
- **Admin**: https://tu-dominio.vercel.app/admin
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Supabase Dashboard**: https://supabase.com/dashboard

---

## 📝 Notas Post-Despliegue

### Problemas encontrados:
```
(Documenta aquí cualquier issue y su solución)
```

### Cambios realizados:
```
(Documenta modificaciones hechas después del deploy)
```

### Próximos pasos:
- [ ] Añadir Google Analytics
- [ ] Configurar Sentry para error tracking
- [ ] Optimizar SEO
- [ ] Crear página de términos y condiciones
- [ ] Crear página de política de privacidad

---

**Fecha de despliegue**: _______________
**Desplegado por**: _______________
**Versión**: 1.0.0
