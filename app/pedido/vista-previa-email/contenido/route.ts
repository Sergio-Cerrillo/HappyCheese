import { renderCustomerConfirmationEmail } from '@/lib/email-templates'
import { getStoreReviewUrl } from '@/lib/store-reviews'

export const dynamic = 'force-dynamic'

export function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not found', { status: 404 })
  }

  const lux = new URL(request.url).searchParams.get('tienda') === 'lux'
  const storeId = lux ? 'happycheese-lux' : 'happycheese'
  const html = renderCustomerConfirmationEmail({
    customerName: 'Cliente de ejemplo',
    orderId: 'DEMO1234',
    storeName: lux ? 'Happycheese Lux' : 'Happycheese Joan Alcover',
    storeEmail: lux
      ? process.env.STORE_EMAIL_HAPPYCHEESE_LUX || 'happycheeseluxpedidos@gmail.com'
      : process.env.STORE_EMAIL_HAPPYCHEESE || 'happycheesepedidos@gmail.com',
    reviewUrl: getStoreReviewUrl(storeId),
    pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    pickupTime: '12:30',
    items: [
      { flavorName: 'Pistacho', portion: 'mediana', quantity: 1, price: 28.5, customBase: { id: 'demo-base', name: 'Galleta de pistacho', surcharge: 3.5 } },
      { flavorName: 'Clásica', portion: 'grande', quantity: 1, price: 40 },
    ],
    total: 68.5,
  })
  return new Response(html, { headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'self'",
  } })
}
