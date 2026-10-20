import { after, NextResponse } from 'next/server'
import { PaymentSyncError, sendOrderNotifications, syncCheckoutSession } from '@/lib/order-payments'

export async function POST(request: Request) {
  try {
    const { sessionId, orderId } = await request.json()
    if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_') || sessionId.length > 255 ||
        typeof orderId !== 'string' || !orderId || orderId.length > 100) {
      return NextResponse.json({ error: 'Faltan los datos de verificación del pago' }, { status: 400 })
    }
    // La URL de retorno no acredita el cobro: se consulta Stripe desde el servidor
    // y se comprueban metadatos, pedido e importe antes de devolver datos del cliente.
    const order = await syncCheckoutSession(sessionId, orderId)
    after(async () => {
      try { await sendOrderNotifications(order) }
      catch (error) { console.error('Order notification pending:', order.id, error) }
    })
    return NextResponse.json(order, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Checkout verification failed:', error)
    return NextResponse.json({
      error: error instanceof PaymentSyncError ? error.message : 'No se ha podido verificar el pago. No repitas el pedido; vuelve a consultar en unos instantes.',
    }, { status: error instanceof PaymentSyncError ? error.status : 502, headers: { 'Cache-Control': 'no-store' } })
  }
}
