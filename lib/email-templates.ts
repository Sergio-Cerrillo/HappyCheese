import type { OrderItem } from '@/lib/types'
import { getBaseDescription } from '@/lib/order-items'

export interface CustomerConfirmationEmailData {
  customerName: string
  orderId: string
  items: Array<{ flavorName: string; portion: string; quantity: number; price: number; customBase?: OrderItem['customBase'] }>
  total: number
  storeName: string
  pickupDate: string
  pickupTime: string
  storeEmail: string
  reviewUrl: string | null
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

function formatPortionLabel(portion: string) {
  const map: Record<string, string> = {
    individual: 'Individual',
    doble: 'Doble',
    mediana: 'Mediana',
    grande: 'Grande',
  }

  return map[portion] || portion
}

export function buildItemsRows(
  items: Array<{
    flavorName: string
    portion: string
    quantity: number
    price: number
    customBase?: OrderItem['customBase']
  }>
) {
  return items
    .map((item) => {
      const subtotal = (item.price * item.quantity).toFixed(2)

      return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #eceae6;">
            <div style="font-size: 15px; color: #383836; font-weight: 600; line-height: 1.4;">
              ${escapeHtml(item.flavorName)}
            </div>
            <div style="margin-top: 4px; font-size: 13px; color: rgba(56,56,54,0.62);">
              ${formatPortionLabel(item.portion)} · ${item.quantity} ud.
              ${item.customBase ? `<br />${escapeHtml(getBaseDescription(item))}` : ''}
            </div>
          </td>
          <td style="padding: 14px 0; border-bottom: 1px solid #eceae6; text-align: right; vertical-align: top; font-size: 15px; color: #383836; font-weight: 600;">
            ${subtotal}€
          </td>
        </tr>
      `
    })
    .join('')
}

// Shared by the real sender and the local preview. Pure HTML: no delivery or database access.
export function renderCustomerConfirmationEmail({
  customerName, orderId, items, total, storeName, pickupDate, pickupTime, storeEmail, reviewUrl,
}: CustomerConfirmationEmailData): string {
  const reviewSection = reviewUrl ? `
          <tr>
            <td style="padding:0 34px 28px;">
              <div style="border-radius:24px; background:#383836; background:linear-gradient(135deg,#424240 0%,#383836 55%,#2e2e2c 100%); padding:30px 24px; text-align:center;">
                <p style="margin:0 0 18px; font-size:10px; letter-spacing:2px; text-transform:uppercase; color:#c4c4bf;">Happycheese · Reseñas en Google</p>
                <h2 style="margin:0 0 16px; font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif; font-size:34px; font-weight:400; line-height:1.05; letter-spacing:1px; text-transform:uppercase; color:#ffffff;">Tu opinión nos importa</h2>
                <p style="margin:0 0 22px; font-size:14px; line-height:1.8; color:#dfdfdb;">Comparte tu experiencia en Google. Ayúdanos a que más personas descubran Happycheese.</p>
                <a href="${escapeHtml(reviewUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:15px 24px; border-radius:12px; background:#ffffff; color:#383836; font-size:14px; font-weight:600; text-decoration:none;">Dejar mi reseña ahora</a>
                <p style="margin:18px 0 0; font-size:10px; letter-spacing:1px; text-transform:uppercase; color:#b3b3ae;">${escapeHtml(storeName)}</p>
              </div>
            </td>
          </tr>` : ''

  const formattedDate = new Date(pickupDate + 'T' + pickupTime).toLocaleDateString(
    'es-ES',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  )

  const itemsRows = buildItemsRows(items)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Pedido - Happy Cheese</title>
</head>
<body style="margin:0; padding:0; background-color:#f7f7f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; color:#383836;">
  <table role="presentation" style="width:100%; border-collapse:collapse; background-color:#f7f7f6;">
    <tr>
      <td style="padding:40px 20px;">
        <table role="presentation" style="width:100%; max-width:640px; margin:0 auto; border-collapse:separate; border-spacing:0; background-color:#ffffff; border:1px solid rgba(56,56,54,0.08); border-radius:24px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="padding:40px 34px 34px; background:linear-gradient(135deg, #383836 0%, #2f2f2d 100%); text-align:center;">
              <div style="font-family:'Bebas Neue', Impact, 'Arial Narrow Bold', sans-serif; font-size:46px; line-height:1; letter-spacing:1px; color:#ffffff; text-transform:uppercase;">
                HappyCheese
              </div>
              <div style="margin-top:12px; font-size:14px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(255,255,255,0.72);">
                Pedido confirmado
              </div>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:34px 34px 0;">
              <p style="margin:0 0 14px; font-size:16px; line-height:1.7; color:#383836;">
                Hola <strong>${customerName}</strong>,
              </p>

              <p style="margin:0; font-size:15px; line-height:1.8; color:rgba(56,56,54,0.76);">
                Hemos recibido correctamente tu pedido y ya está programado para recogida. A continuación encontrarás todos los detalles.
              </p>
            </td>
          </tr>

          <!-- Order number -->
          <tr>
            <td style="padding:28px 34px 0;">
              <div style="border:1px solid rgba(56,56,54,0.08); background:#fbfbfa; border-radius:18px; padding:18px 20px;">
                <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(56,56,54,0.45);">
                  Número de pedido
                </div>
                <div style="margin-top:8px; font-size:22px; font-weight:700; color:#383836; letter-spacing:0.04em;">
                  #${orderId.slice(0, 8).toUpperCase()}
                </div>
              </div>
            </td>
          </tr>

          <!-- Pickup -->
          <tr>
            <td style="padding:20px 34px 0;">
              <div style="border:1px solid rgba(56,56,54,0.08); background:#ffffff; border-radius:18px; padding:22px 20px;">
                <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(56,56,54,0.45); margin-bottom:14px;">
                  Recogida
                </div>

                <div style="font-size:15px; line-height:1.8; color:rgba(56,56,54,0.78);">
                  <strong style="color:#383836;">Tienda:</strong> ${storeName}<br />
                  <strong style="color:#383836;">Fecha:</strong> ${formattedDate}<br />
                  <strong style="color:#383836;">Hora:</strong> ${pickupTime}
                </div>
              </div>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:20px 34px 0;">
              <div style="border:1px solid rgba(56,56,54,0.08); background:#ffffff; border-radius:18px; padding:22px 20px;">
                <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(56,56,54,0.45); margin-bottom:10px;">
                  Tu pedido
                </div>

                <table role="presentation" style="width:100%; border-collapse:collapse;">
                  ${itemsRows}
                </table>
              </div>
            </td>
          </tr>

          <!-- Total -->
          <tr>
            <td style="padding:20px 34px 0;">
              <div style="border-radius:18px; background:#383836; padding:22px 20px;">
                <table role="presentation" style="width:100%; border-collapse:collapse;">
                  <tr>
                    <td style="font-size:15px; color:rgba(255,255,255,0.82);">
                      Total pagado
                    </td>
                    <td style="text-align:right; font-size:28px; font-weight:700; color:#ffffff;">
                      ${total.toFixed(2)}€
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Important note -->
          <tr>
            <td style="padding:20px 34px 0;">
              <div style="border-radius:18px; background:#f3efe9; border:1px solid rgba(56,56,54,0.08); padding:18px 20px;">
                <p style="margin:0; font-size:14px; line-height:1.7; color:#5b5b58;">
                  <strong style="color:#383836;">Importante:</strong> si necesitas modificar algo relacionado con tu pedido, ponte en contacto con la tienda lo antes posible.
                </p>
              </div>
            </td>
          </tr>

          <!-- Contact -->
          <tr>
            <td style="padding:24px 34px 34px;">
              <p style="margin:0; text-align:center; font-size:14px; line-height:1.8; color:rgba(56,56,54,0.62);">
                ¿Necesitas ayuda? Escríbenos a
                <a href="mailto:${storeEmail}" style="color:#383836; text-decoration:none; font-weight:600;">
                  ${storeEmail}
                </a>
              </p>
            </td>
          </tr>

          ${reviewSection}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 34px; border-top:1px solid #eceae6; background:#fbfbfa; text-align:center;">
              <p style="margin:0 0 8px; font-size:12px; color:rgba(56,56,54,0.55);">
                © 2026 Happy Cheese. Todos los derechos reservados.
              </p>
              <p style="margin:0; font-size:12px; color:rgba(56,56,54,0.4);">
                Este es un email automático, por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  return html
}
