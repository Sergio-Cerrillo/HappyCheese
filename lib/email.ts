import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in environment variables')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Obtiene el email de la tienda basado en su ID
 */
export function getStoreEmail(storeId: string): string {
  const storeEmails: Record<string, string> = {
    happycheese:
      process.env.STORE_EMAIL_HAPPYCHEESE || 'happycheesepedidos@gmail.com',
    'happycheese-lux':
      process.env.STORE_EMAIL_HAPPYCHEESE_LUX || 'happycheeseluxpedidos@gmail.com',
    happycheese_lux:
      process.env.STORE_EMAIL_HAPPYCHEESE_LUX || 'happycheeseluxpedidos@gmail.com',
  }

  return (
    storeEmails[storeId] ||
    process.env.STORE_EMAIL_HAPPYCHEESE ||
    'happycheesepedidos@gmail.com'
  )
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

function buildItemsRows(
  items: Array<{
    flavorName: string
    portion: string
    quantity: number
    price: number
  }>
) {
  return items
    .map((item) => {
      const subtotal = (item.price * item.quantity).toFixed(2)

      return `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #eceae6;">
            <div style="font-size: 15px; color: #383836; font-weight: 600; line-height: 1.4;">
              ${item.flavorName}
            </div>
            <div style="margin-top: 4px; font-size: 13px; color: rgba(56,56,54,0.62);">
              ${formatPortionLabel(item.portion)} · ${item.quantity} ud.
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

/**
 * Email de confirmación para el cliente
 */
export async function sendCustomerConfirmationEmail({
  to,
  customerName,
  orderId,
  items,
  total,
  storeId,
  storeName,
  pickupDate,
  pickupTime,
}: {
  to: string
  customerName: string
  orderId: string
  items: Array<{ flavorName: string; portion: string; quantity: number; price: number }>
  total: number
  storeId: string
  storeName: string
  pickupDate: string
  pickupTime: string
}) {
  const storeEmail = getStoreEmail(storeId)

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

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Happy Cheese <onboarding@resend.dev>',
      to,
      subject: `Pedido confirmado #${orderId.slice(0, 8).toUpperCase()} - Happy Cheese`,
      html,
    })

    if (error) {
      console.error('Error sending customer email:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to send customer email:', error)
    throw error
  }
}

/**
 * Email de notificación para la tienda
 */
export async function sendStoreNotificationEmail({
  storeId,
  storeName,
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  items,
  total,
  pickupDate,
  pickupTime,
  notes,
}: {
  storeId: string
  storeName: string
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: Array<{ flavorName: string; portion: string; quantity: number; price: number }>
  total: number
  pickupDate: string
  pickupTime: string
  notes?: string
}) {
  const storeEmail = getStoreEmail(storeId)

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
  <title>Nuevo Pedido - Happy Cheese</title>
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
                Nuevo pedido
              </div>
              <div style="margin-top:12px; font-size:14px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(255,255,255,0.72);">
                ${storeName}
              </div>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:34px 34px 0;">
              <p style="margin:0; font-size:15px; line-height:1.8; color:rgba(56,56,54,0.76);">
                Se ha recibido y cobrado correctamente un nuevo pedido.
              </p>
            </td>
          </tr>

          <!-- Order number -->
          <tr>
            <td style="padding:20px 34px 0;">
              <div style="border:1px solid rgba(56,56,54,0.08); background:#fbfbfa; border-radius:18px; padding:18px 20px;">
                <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(56,56,54,0.45);">
                  Pedido
                </div>
                <div style="margin-top:8px; font-size:22px; font-weight:700; color:#383836; letter-spacing:0.04em;">
                  #${orderId.slice(0, 8).toUpperCase()}
                </div>
              </div>
            </td>
          </tr>

          <!-- Customer -->
          <tr>
            <td style="padding:20px 34px 0;">
              <div style="border:1px solid rgba(56,56,54,0.08); background:#ffffff; border-radius:18px; padding:22px 20px;">
                <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(56,56,54,0.45); margin-bottom:14px;">
                  Cliente
                </div>

                <div style="font-size:15px; line-height:1.8; color:rgba(56,56,54,0.78);">
                  <strong style="color:#383836;">Nombre:</strong> ${customerName}<br />
                  <strong style="color:#383836;">Email:</strong> <a href="mailto:${customerEmail}" style="color:#383836; text-decoration:none; font-weight:600;">${customerEmail}</a><br />
                  <strong style="color:#383836;">Teléfono:</strong> <a href="tel:${customerPhone}" style="color:#383836; text-decoration:none; font-weight:600;">${customerPhone}</a>
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
                  Productos
                </div>

                <table role="presentation" style="width:100%; border-collapse:collapse;">
                  ${itemsRows}
                </table>
              </div>
            </td>
          </tr>

          ${
            notes
              ? `
          <tr>
            <td style="padding:20px 34px 0;">
              <div style="border:1px solid rgba(56,56,54,0.08); background:#f3efe9; border-radius:18px; padding:18px 20px;">
                <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(56,56,54,0.45); margin-bottom:10px;">
                  Notas del cliente
                </div>
                <p style="margin:0; font-size:14px; line-height:1.7; color:#5b5b58; white-space:pre-wrap;">
                  ${notes}
                </p>
              </div>
            </td>
          </tr>
          `
              : ''
          }

          <!-- Total -->
          <tr>
            <td style="padding:20px 34px 0;">
              <div style="border-radius:18px; background:#383836; padding:22px 20px;">
                <table role="presentation" style="width:100%; border-collapse:collapse;">
                  <tr>
                    <td style="font-size:15px; color:rgba(255,255,255,0.82);">
                      Total cobrado
                    </td>
                    <td style="text-align:right; font-size:28px; font-weight:700; color:#ffffff;">
                      ${total.toFixed(2)}€
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Action -->
          <tr>
            <td style="padding:24px 34px 34px; text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin"
                 style="display:inline-block; background:#383836; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:12px; font-size:15px; font-weight:600;">
                Ver en panel de admin
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 34px; border-top:1px solid #eceae6; background:#fbfbfa; text-align:center;">
              <p style="margin:0; font-size:12px; color:rgba(56,56,54,0.55);">
                © 2026 Happy Cheese. Sistema de gestión de pedidos.
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

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Happy Cheese Sistema <onboarding@resend.dev>',
      to: storeEmail,
      subject: `Nuevo pedido #${orderId.slice(0, 8).toUpperCase()} - ${storeName}`,
      html,
    })

    if (error) {
      console.error('Error sending store email:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to send store email:', error)
    throw error
  }
}