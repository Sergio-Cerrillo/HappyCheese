# 🔧 Debug de Webhooks - Happy Cheese

## Verificar configuración actual

### 1. Revisar logs del servidor
Cuando haces un pago de prueba, deberías ver en los logs:
```
Received event: checkout.session.completed
Processing completed checkout for order: [ORDER_ID]
Order updated successfully: [ORDER_ID]
Customer confirmation email sent
Store notification email sent
```

Si no ves estos logs, el webhook NO está llegando.

### 2. Probar webhook manualmente

Desde tu terminal, prueba el endpoint:

```bash
# Probar que el endpoint responde
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{}'

# Deberías ver: {"error":"No signature"}
# Esto es CORRECTO - significa que el endpoint funciona
```

### 3. Ver eventos en Stripe Dashboard

1. Ve a: https://dashboard.stripe.com/test/events
2. Busca eventos recientes de tipo `checkout.session.completed`
3. Click en uno
4. Ve a la pestaña "Webhooks"
5. Verifica:
   - ✅ Verde = Webhook entregado exitosamente
   - ❌ Rojo = Webhook falló
   - Si falló, verás el error (ej: "URL no alcanzable")

## Soluciones a problemas comunes

### Problema 1: "No stripe signature found"
**Causa:** La petición no viene de Stripe
**Solución:** Asegúrate de que el webhook esté configurado en Stripe Dashboard

### Problema 2: "Webhook signature verification failed"
**Causa:** El STRIPE_WEBHOOK_SECRET no coincide
**Solución:** 
- Si usas Stripe CLI: copia el secret que aparece al ejecutar `stripe listen`
- Si usas Dashboard: copia el "Signing secret" del webhook endpoint

### Problema 3: Webhook no llega
**Causa:** URL incorrecta o localhost no accesible
**Solución:**
- **Desarrollo:** Usa Stripe CLI con `stripe listen`
- **Producción:** Configura webhook en Dashboard con URL pública

### Problema 4: "Order not found"
**Causa:** El orderId en session.metadata no existe en DB
**Solución:** Revisa que se está creando el pedido correctamente en `/api/checkout`

## Testing con tarjetas de prueba

Usa estas tarjetas en modo test:

```
✅ Pago exitoso:
   Número: 4242 4242 4242 4242
   Vencimiento: cualquier fecha futura
   CVC: cualquier 3 dígitos
   
❌ Pago fallido:
   Número: 4000 0000 0000 0002
   (Simula rechazo de tarjeta)
   
⏳ Requiere autenticación 3D Secure:
   Número: 4000 0027 6000 3184
   (Útil para probar flujo completo)
```

## Checklist de configuración

- [ ] `NEXT_PUBLIC_APP_URL` apunta a la URL correcta (localhost o producción)
- [ ] `STRIPE_WEBHOOK_SECRET` coincide con el del endpoint activo
- [ ] Webhook configurado en Stripe Dashboard (producción) O Stripe CLI corriendo (desarrollo)
- [ ] Eventos seleccionados: `checkout.session.completed`, `payment_intent.*`
- [ ] El servidor está corriendo y accesible en la URL configurada
- [ ] Variables de entorno cargadas (reiniciar servidor después de cambios)

## Comando rápido para desarrollo

Para iniciar todo de una vez:

```bash
# Terminal 1: Servidor Next.js
pnpm dev

# Terminal 2: Stripe webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# La terminal 2 te dará un webhook secret - ¡cópialo a .env.local!
```
