import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import supabase from '@/lib/supabase'
import { sendCustomerConfirmationEmail, sendStoreNotificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('No stripe signature found')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  console.log('Received event:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      }

      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        await markUnpaidSession(session, event.type === 'checkout.session.expired' ? 'expired' : 'failed')
        break
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent
        // Consultar la sesión actual evita que un fallo antiguo sobreescriba un pago posterior.
        const sessions = await stripe.checkout.sessions.list({ payment_intent: intent.id, limit: 1 })
        const session = sessions.data[0]
        if (session && session.status !== 'complete' && session.status !== 'expired') {
          await markUnpaidSession(session, 'failed')
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const intentId = typeof charge.payment_intent === 'string'
          ? charge.payment_intent : charge.payment_intent?.id
        if (!intentId) break
        // Leer el cargo actual: Stripe no garantiza el orden de los eventos de reembolso.
        const current = await stripe.charges.retrieve(charge.id)
        const { error } = await supabase.from('orders').update({
          paymentStatus: current.refunded ? 'refunded' : 'partially_refunded',
          refundedAmount: current.amount_refunded / 100,
          ...(current.refunded ? { status: 'cancelado' } : {}),
          updatedAt: new Date().toISOString(),
        }).eq('stripePaymentIntentId', intentId)
        if (error) throw error
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId

  if (!orderId) return
  if (session.payment_status !== 'paid') return

  const { data: order, error: orderError } = await supabase
    .from('orders').select('*').eq('id', orderId).single()
  if (orderError || !order) throw orderError || new Error(`Order not found: ${orderId}`)
  if (order.stripeSessionId && order.stripeSessionId !== session.id) {
    throw new Error('Checkout session does not match order')
  }
  if (session.currency !== 'eur' || session.amount_total !== Math.round(Number(order.total) * 100)) {
    throw new Error('Checkout amount does not match order')
  }
  if (order.paymentStatus === 'refunded' || order.paymentStatus === 'partially_refunded') return

  const intentId = typeof session.payment_intent === 'string'
    ? session.payment_intent : session.payment_intent?.id
  // Un webhook tardío tampoco debe revertir un reembolso ya realizado en Stripe.
  if (intentId) {
    const charges = await stripe.charges.list({ payment_intent: intentId, limit: 1 })
    const charge = charges.data[0]
    if (charge && charge.amount_refunded > 0) {
      const { error } = await supabase.from('orders').update({
        paymentStatus: charge.refunded ? 'refunded' : 'partially_refunded',
        refundedAmount: charge.amount_refunded / 100,
        ...(charge.refunded ? { status: 'cancelado' } : {}),
        stripeSessionId: session.id,
        stripePaymentIntentId: intentId,
        paidAt: order.paidAt || new Date(session.created * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      }).eq('id', orderId)
      if (error) throw error
      return
    }
  }

  // La condición evita que entregas repetidas o simultáneas restablezcan el estado de preparación.
  const { error: updateError } = await supabase.from('orders').update({
    paymentStatus: 'paid',
    stripeSessionId: session.id,
    stripePaymentIntentId: intentId,
    paidAt: order.paidAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).eq('id', orderId).or('paymentStatus.is.null,paymentStatus.in.(pending,failed,expired)')
  if (updateError) throw updateError

  const { error: statusError } = await supabase.from('orders')
    .update({ status: 'confirmado' }).eq('id', orderId)
    .eq('paymentStatus', 'paid').eq('status', 'pendiente')
  if (statusError) throw statusError

  // Cada destinatario tiene su registro de envío y clave de idempotencia en Resend.
  // Si falla un envío o su registro, devolver 500 permite que Stripe lo reintente.
  const results = await Promise.allSettled([
    (async () => {
      if (order.customerConfirmationSentAt) return
      await sendCustomerConfirmationEmail({
        to: order.customerEmail,
        customerName: order.customerName,
        orderId: order.id,
        items: order.items,
        total: Number(order.total),
        storeId: order.storeId,
        storeName: order.storeName,
        pickupDate: order.pickupDate,
        pickupTime: order.pickupTime,
      })
      const { error } = await supabase.from('orders').update({
        customerConfirmationSentAt: new Date().toISOString(),
      }).eq('id', orderId)
      if (error) throw error
    })(),
    (async () => {
      if (order.storeNotificationSentAt) return
      await sendStoreNotificationEmail({
        storeId: order.storeId,
        storeName: order.storeName,
        orderId: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        items: order.items,
        total: Number(order.total),
        pickupDate: order.pickupDate,
        pickupTime: order.pickupTime,
        notes: order.notes,
      })
      const { error } = await supabase.from('orders').update({
        storeNotificationSentAt: new Date().toISOString(),
      }).eq('id', orderId)
      if (error) throw error
    })(),
  ])
  for (const result of results) {
    if (result.status === 'rejected') throw result.reason
  }
}

async function markUnpaidSession(session: Stripe.Checkout.Session, paymentStatus: 'failed' | 'expired') {
  if (!session.metadata?.orderId) return
  const { error } = await supabase.from('orders').update({
    paymentStatus,
    ...(paymentStatus === 'expired' ? { status: 'cancelado' } : {}),
    stripeSessionId: session.id,
    updatedAt: new Date().toISOString(),
  }).eq('id', session.metadata.orderId)
    .or(`stripeSessionId.is.null,stripeSessionId.eq.${session.id}`)
    .or('paymentStatus.is.null,paymentStatus.in.(pending,failed)')
  if (error) throw error
}
