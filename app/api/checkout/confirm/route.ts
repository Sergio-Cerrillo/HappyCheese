import { after, NextResponse } from 'next/server'
import { PaymentSyncError, sendOrderNotifications, syncCheckoutSession } from '@/lib/order-payments'
import { getStoreById } from '@/lib/db'
import { getStoreReviewUrl } from '@/lib/store-reviews'

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
    let storeReviewUrl = getStoreReviewUrl(order.storeId)
    try {
      const store = await getStoreById(order.storeId)
      storeReviewUrl = getStoreReviewUrl(order.storeId, store?.googleReviewUrl)
    } catch (error) {
      // El enlace opcional nunca debe impedir mostrar un pago ya verificado.
      console.error('Store review link unavailable:', order.storeId, error)
    }
    return NextResponse.json({ ...order, storeReviewUrl }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Checkout verification failed:', error)
    return NextResponse.json({
      error: error instanceof PaymentSyncError ? error.message : 'No se ha podido verificar el pago. No repitas el pedido; vuelve a consultar en unos instantes.',
    }, { status: error instanceof PaymentSyncError ? error.status : 502, headers: { 'Cache-Control': 'no-store' } })
  }
}
