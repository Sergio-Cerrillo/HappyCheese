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

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment intent succeeded:', paymentIntent.id)
        // Ya manejado en checkout.session.completed
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error('Payment failed:', paymentIntent.id)
        
        // Actualizar estado del pedido si existe
        if (paymentIntent.metadata?.orderId) {
          await supabase
            .from('orders')
            .update({
              paymentStatus: 'failed',
              stripePaymentIntentId: paymentIntent.id,
              updatedAt: new Date().toISOString(),
            })
            .eq('id', paymentIntent.metadata.orderId)
        }
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

  if (!orderId) {
    console.error('No orderId in session metadata')
    return
  }

  console.log('Processing completed checkout for order:', orderId)

  // Obtener el pedido de la base de datos
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error('Order not found:', orderId, orderError)
    return
  }

  // Actualizar el pedido con información del pago
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'confirmado',
      paymentStatus: 'paid',
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (updateError) {
    console.error('Error updating order:', updateError)
    return
  }

  console.log('Order updated successfully:', orderId)

  // Enviar emails de confirmación
  try {
    // Email al cliente
    await sendCustomerConfirmationEmail({
      to: order.customerEmail,
      customerName: order.customerName,
      orderId: order.id,
      items: order.items,
      total: parseFloat(order.total),
      storeId: order.storeId,
      storeName: order.storeName,
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
    })

    console.log('Customer confirmation email sent')

    // Email a la tienda
    await sendStoreNotificationEmail({
      storeId: order.storeId,
      storeName: order.storeName,
      orderId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      items: order.items,
      total: parseFloat(order.total),
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
      notes: order.notes,
    })

    console.log('Store notification email sent')
  } catch (emailError) {
    console.error('Error sending emails:', emailError)
    // No lanzamos error aquí porque el pedido ya está procesado
    // Solo registramos el error para revisarlo manualmente
  }
}
