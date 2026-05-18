# 📧 Configuración de Emails para Producción

## 📋 Resumen

Tu proyecto ya tiene Resend configurado y funcionando. Solo necesitas ajustar algunas cosas para producción.

---

## ✅ Lo que ya funciona

1. **Sistema de emails automáticos**:
   - ✅ Email de confirmación al cliente cuando hace un pedido
   - ✅ Email de notificación a la tienda cuando recibe un pedido
   - ✅ Templates HTML profesionales y responsive
   - ✅ Integración con Resend

2. **Configuración actual**:
   - API Key de Resend: Ya tienes una (`re_cffwe9zr_...`)
   - Emails de tiendas configurados:
     - `happycheesepedidos@gmail.com` → HappyCheese
     - `happycheeseluxpedidos@gmail.com` → HappyCheese LUX

---

## ⚠️ Qué necesitas hacer para PRODUCCIÓN

### 1. Verificar dominio en Resend (Recomendado)

Actualmente los emails se envían desde `onboarding@resend.dev` que **solo funciona para testing**.

Para producción profesional, necesitas:

#### Opción A: Dominio personalizado (Recomendado)

Si tienes un dominio (ej: `happycheese.com`):

1. **Ve a Resend**: https://resend.com/domains
2. **Añade tu dominio**: Click en "Add Domain"
3. **Configura DNS**: Añade los registros que te dé Resend:
   ```
   Tipo: TXT
   Nombre: @
   Valor: resend-verification=...
   
   Tipo: MX
   Nombre: @
   Valor: ...
   ```
4. **Verifica**: Espera unos minutos y verifica el dominio
5. **Actualiza variable en Vercel**:
   ```env
   RESEND_FROM_EMAIL=HappyCheese <pedidos@happycheese.com>
   ```

#### Opción B: Usar onboarding@resend.dev (Solo para empezar)

Puedes dejarlo con `onboarding@resend.dev` temporalmente, pero:
- ⚠️ Límite de 100 emails/día
- ⚠️ Puede ir a spam más fácilmente
- ⚠️ No es profesional para producción

Para usarlo:
```env
RESEND_FROM_EMAIL=Happy Cheese <onboarding@resend.dev>
```

---

### 2. Verificar emails de las tiendas

Los emails donde llegarán las notificaciones son:
- `happycheesepedidos@gmail.com` → Pedidos de HappyCheese
- `happycheeseluxpedidos@gmail.com` → Pedidos de HappyCheese LUX

**¿Son correctos estos emails?** Si no, actualiza en `.env.local` y en Vercel:

```env
STORE_EMAIL_HAPPYCHEESE=tu-email-real@gmail.com
STORE_EMAIL_HAPPYCHEESE_LUX=otro-email@gmail.com
```

---

### 3. Variables de entorno para Vercel

Cuando despliegues, añade estas variables en Vercel:

```env
# Resend
RESEND_API_KEY=re_tu_api_key_de_produccion
RESEND_FROM_EMAIL=HappyCheese <pedidos@tudominio.com>

# Emails de tiendas
STORE_EMAIL_HAPPYCHEESE=happycheesepedidos@gmail.com
STORE_EMAIL_HAPPYCHEESE_LUX=happycheeseluxpedidos@gmail.com
```

---

## 🧪 Cómo probar los emails

### En desarrollo local:

1. Asegúrate de tener las variables en `.env.local`
2. Haz un pedido de prueba
3. Verifica en https://resend.com/emails que se enviaron
4. Revisa tu bandeja de entrada

### En producción:

1. Haz un pedido de prueba pequeño
2. Verifica que lleguen los 2 emails:
   - Email al cliente
   - Email a la tienda
3. Si no llegan, revisa:
   - Logs en Vercel → Functions → `/api/checkout`
   - Dashboard de Resend → Emails
   - Carpeta de spam

---

## 🎨 Personalizar emails (Opcional)

Si quieres cambiar el diseño de los emails, edita:
- `lib/email.ts` → Funciones `sendCustomerConfirmationEmail` y `sendStoreNotificationEmail`

Los templates están en HTML inline para máxima compatibilidad con clientes de email.

---

## 📊 Monitoreo

Dashboard de Resend: https://resend.com/emails

Aquí puedes ver:
- Emails enviados
- Emails entregados
- Emails rebotados
- Emails que fueron a spam

---

## 🆘 Troubleshooting

### Los emails no llegan

1. **Verifica la API key**: Dashboard de Resend → API Keys
2. **Revisa logs**: Vercel → Functions → Busca errores de Resend
3. **Verifica spam**: Los emails pueden estar en spam
4. **Dominio verificado**: Si usas dominio propio, verifica que esté validado

### Emails van a spam

- **Verifica dominio**: SPF, DKIM y DMARC configurados correctamente
- **Warming up**: Los primeros emails pueden ir a spam, es normal
- **Contenido**: Evita palabras spam ("gratis", "oferta", etc.)
- **"From" profesional**: Usa dominio propio en vez de `onboarding@resend.dev`

### Error "Invalid API key"

- La API key es incorrecta
- Copia de nuevo desde https://resend.com/api-keys
- Actualiza en `.env.local` y en Vercel

---

## ✅ Checklist Final

- [ ] API key de Resend configurada
- [ ] Dominio verificado en Resend (o usando `onboarding@resend.dev` temporalmente)
- [ ] Variable `RESEND_FROM_EMAIL` configurada
- [ ] Emails de tiendas correctos
- [ ] Variables añadidas en Vercel
- [ ] Email de prueba enviado y recibido
- [ ] Email a tienda recibido correctamente
- [ ] Monitoreando dashboard de Resend

---

## 🎯 Plan recomendado

### Fase 1: Testing (AHORA)
- Usa `onboarding@resend.dev` para probar
- Verifica que los emails funcionen
- Confirma que lleguen a las tiendas

### Fase 2: Pre-producción (Antes del lanzamiento)
- Verifica dominio personalizado en Resend
- Actualiza `RESEND_FROM_EMAIL` con tu dominio
- Prueba de nuevo

### Fase 3: Producción
- Monitorea emails enviados
- Revisa si van a spam
- Ajusta si es necesario

---

**Última actualización**: Mayo 2026

¿Dudas? Revisa la documentación de Resend: https://resend.com/docs
