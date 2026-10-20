import 'server-only'
import type Stripe from 'stripe'
import supabase from '@/lib/supabase-admin'
import { stripe } from '@/lib/stripe'
import { sendCustomerConfirmationEmail, sendStoreNotificationEmail } from '@/lib/email'
import type { Order } from '@/lib/types'

export class PaymentSyncError extends Error {
  constructor(message: string, public status = 502) {
    super(message)
  }
}

async function readOrder(id: string): Promise<Order> {
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single()
  if (error || !data) throw new PaymentSyncError('No se ha podido consultar el pedido', 503)
  return data
}

async function paymentIntentFor(session: Stripe.Checkout.Session): Promise<Stripe.PaymentIntent | null> {
  if (!session.payment_intent) return null
  if (typeof session.payment_intent !== 'string') return session.payment_intent
  return stripe.paymentIntents.retrieve(session.payment_intent, { expand: ['latest_charge'] })
}

// El estado del pago siempre procede de Stripe. El estado de preparación se
// conserva: volver a verificar un pago no debe reiniciar un pedido completado.
export async function syncCheckoutSession(sessionId: string, expectedOrderId?: string): Promise<Order> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent.latest_charge'],
  })
  const orderId = session.metadata?.orderId
  if (!orderId || (expectedOrderId && expectedOrderId !== orderId)) {
    throw new PaymentSyncError('La sesión de pago no corresponde al pedido', 404)
  }
  const intent = await paymentIntentFor(session)
  const charge = intent?.latest_charge && typeof intent.latest_charge !== 'string' ? intent.latest_charge : null

  for (let attempt = 0; attempt < 3; attempt++) {
    const order = await readOrder(orderId)
    if (order.stripeSessionId && order.stripeSessionId !== session.id) {
      throw new PaymentSyncError('La sesión de pago no corresponde al pedido', 409)
    }
    if (session.currency !== 'eur' || session.amount_total !== Math.round(Number(order.total) * 100)) {
      throw new PaymentSyncError('El importe de Stripe no coincide con el pedido', 409)
    }

    const updates: Partial<Order> = { stripeSessionId: session.id }
    if (intent) updates.stripePaymentIntentId = intent.id
    if (session.payment_status === 'paid') {
      const refundedAmount = Math.max(Number(order.refundedAmount || 0), (charge?.amount_refunded || 0) / 100)
      updates.refundedAmount = refundedAmount
      // Un reembolso registrado nunca se revierte por una lectura concurrente anterior.
      updates.paymentStatus = order.paymentStatus === 'refunded' || charge?.refunded
        ? 'refunded' : refundedAmount > 0 ? 'partially_refunded' : 'paid'
      updates.paidAt = order.paidAt || new Date((charge?.created || session.created) * 1000).toISOString()
      if (updates.paymentStatus === 'refunded') updates.status = 'cancelado'
      else if (order.status === 'pendiente' && (!order.paidAt || !['paid', 'partially_refunded'].includes(order.paymentStatus || ''))) {
        updates.status = 'confirmado'
      }
    } else if (!['paid', 'partially_refunded', 'refunded'].includes(order.paymentStatus || '')) {
      updates.paymentStatus = session.status === 'expired' ? 'expired' : intent?.last_payment_error ? 'failed' : 'pending'
      if (session.status === 'expired' && order.status === 'pendiente') updates.status = 'cancelado'
    }

    const changed = Object.entries(updates).some(([key, value]) => order[key as keyof Order] !== value)
    if (!changed) return order
    // Bloqueo optimista: si el admin u otro webhook cambia el pedido mientras
    // consultamos Stripe, releerlo en vez de sobrescribir el estado más reciente.
    let query = supabase.from('orders').update({ ...updates, updatedAt: new Date().toISOString() }).eq('id', order.id)
    query = order.updatedAt ? query.eq('updatedAt', order.updatedAt) : query.is('updatedAt', null)
    const { data, error } = await query.select('*').maybeSingle()
    if (error) throw new PaymentSyncError('No se ha podido guardar el estado del pago', 503)
    if (data) return data
  }
  throw new PaymentSyncError('El pedido ha cambiado durante la verificación; vuelve a intentarlo', 503)
}

export async function sendOrderNotifications(order: Order): Promise<void> {
  if (order.paymentStatus !== 'paid' || order.status === 'cancelado') return
  const results = await Promise.allSettled([
    (async () => {
      if (order.customerConfirmationSentAt) return
      await sendCustomerConfirmationEmail({
        to: order.customerEmail, customerName: order.customerName, orderId: order.id,
        items: order.items, total: Number(order.total), storeId: order.storeId,
        storeName: order.storeName, pickupDate: order.pickupDate, pickupTime: order.pickupTime,
      })
      const { error } = await supabase.from('orders').update({
        customerConfirmationSentAt: new Date().toISOString(),
      }).eq('id', order.id).select('id').single()
      if (error) throw error
    })(),
    (async () => {
      if (order.storeNotificationSentAt) return
      await sendStoreNotificationEmail({
        storeId: order.storeId, storeName: order.storeName, orderId: order.id,
        customerName: order.customerName, customerEmail: order.customerEmail,
        customerPhone: order.customerPhone, items: order.items, total: Number(order.total),
        pickupDate: order.pickupDate, pickupTime: order.pickupTime, notes: order.notes,
      })
      const { error } = await supabase.from('orders').update({
        storeNotificationSentAt: new Date().toISOString(),
      }).eq('id', order.id).select('id').single()
      if (error) throw error
    })(),
  ])
  for (const result of results) if (result.status === 'rejected') throw result.reason
}

// Recuperar también pedidos anteriores cuyo sessionId no se guardó por RLS.
// La ventana corresponde a la creación de Checkout, no a la hora del pago.
export async function findOrderSession(order: Order): Promise<string | undefined> {
  if (order.stripeSessionId) return order.stripeSessionId
  if (order.stripePaymentIntentId) {
    const sessions = await stripe.checkout.sessions.list({ payment_intent: order.stripePaymentIntentId, limit: 100 })
    return sessions.data.find(session => session.metadata?.orderId === order.id)?.id
  }
  const created = Math.floor(new Date(order.createdAt).getTime() / 1000)
  if (!Number.isFinite(created)) throw new PaymentSyncError('El pedido no tiene una fecha válida')
  let startingAfter: string | undefined
  do {
    const page = await stripe.checkout.sessions.list({
      created: { gte: created - 60, lte: created + 600 }, limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })
    const match = page.data.find(session => session.metadata?.orderId === order.id)
    if (match) return match.id
    startingAfter = page.has_more && page.data.length ? page.data[page.data.length - 1].id : undefined
  } while (startingAfter)
  return undefined
}

const checkedAt = new Map<string, number>()
const checking = new Map<string, Promise<Order>>()
const syncErrors = new Set<string>()

// Máximo 20 pedidos por consulta, cuatro en paralelo. Rotar por última comprobación
// permite conciliar todo el histórico sin saturar Stripe o la función de Vercel.
export async function reconcileOrders(orders: Order[]): Promise<Order[]> {
  const now = Date.now()
  const candidates = orders.filter(order => now - (checkedAt.get(order.id) || 0) >= 30_000)
    .sort((a, b) => (checkedAt.get(a.id) || 0) - (checkedAt.get(b.id) || 0)).slice(0, 20)
  const updated = new Map<string, Order>()
  for (let offset = 0; offset < candidates.length; offset += 4) {
    if (Date.now() - now > 15_000) break
    await Promise.all(candidates.slice(offset, offset + 4).map(async order => {
      let pending = checking.get(order.id)
      if (!pending) {
        pending = (async () => {
          const sessionId = await findOrderSession(order)
          if (!sessionId) return order
          return syncCheckoutSession(sessionId, order.id)
        })()
        checking.set(order.id, pending)
      }
      try {
        updated.set(order.id, await pending)
        syncErrors.delete(order.id)
      } catch (error) {
        syncErrors.add(order.id)
        console.error('Stripe order reconciliation failed:', order.id, error)
      } finally {
        checkedAt.set(order.id, Date.now())
        checking.delete(order.id)
      }
    }))
  }
  // Eliminar referencias de pedidos que ya no existen, sin guardar datos personales en la caché.
  const ids = new Set(orders.map(order => order.id))
  for (const id of checkedAt.keys()) if (!ids.has(id)) { checkedAt.delete(id); syncErrors.delete(id) }
  return orders.map(order => ({ ...(updated.get(order.id) || order), paymentSyncError: syncErrors.has(order.id) }))
}
