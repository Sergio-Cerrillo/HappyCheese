import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { sendOrderNotifications, syncCheckoutSession } from '@/lib/order-payments'

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    let sessionId: string | undefined
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.orderId) sessionId = session.id
        break
      }
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
      case 'charge.refunded': {
        const object = event.data.object
        const intent = object.object === 'charge' ? object.payment_intent : object.id
        const intentId = typeof intent === 'string' ? intent : intent?.id
        if (intentId) {
          const sessions = await stripe.checkout.sessions.list({ payment_intent: intentId, limit: 100 })
          sessionId = sessions.data.find(session => session.metadata?.orderId)?.id
        }
        break
      }
    }
    if (sessionId) {
      // Usar el estado actual evita que eventos antiguos reviertan pagos o reembolsos.
      const order = await syncCheckoutSession(sessionId)
      await sendOrderNotifications(order)
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Stripe webhook:', event.id, error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
