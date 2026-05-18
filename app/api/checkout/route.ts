import { NextResponse } from 'next/server'
import { stripe, formatAmountForStripe } from '@/lib/stripe'
import { createOrder } from '@/lib/db'
import { isValidPickupDate } from '@/lib/date-utils'

const PORTION_LABELS: Record<string, string> = {
  individual: 'Individual',
  doble: 'Doble',
  mediana: 'Mediana',
  grande: 'Grande',
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validaciones (igual que antes)
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { error: 'El pedido debe contener al menos un producto' },
        { status: 400 }
      )
    }

    if (!data.storeId || !data.storeName) {
      return NextResponse.json(
        { error: 'Tienda requerida' },
        { status: 400 }
      )
    }

    if (!data.customerName || !data.customerEmail || !data.customerPhone) {
      return NextResponse.json(
        { error: 'Datos del cliente incompletos' },
        { status: 400 }
      )
    }

    if (!data.pickupDate || !data.pickupTime) {
      return NextResponse.json(
        { error: 'Fecha y hora de recogida requeridas' },
        { status: 400 }
      )
    }

    // Validar fecha de recogida
    if (!isValidPickupDate(data.pickupDate, data.pickupTime)) {
      return NextResponse.json(
        { error: 'La fecha de recogida debe ser entre 48 horas y 1 año desde ahora' },
        { status: 400 }
      )
    }

    // Crear el pedido en estado "pending" (pendiente de pago)
    const order = await createOrder({
      items: data.items,
      storeId: data.storeId,
      storeName: data.storeName,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      notes: data.notes,
      total: data.total,
      status: 'pendiente',
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
    })

    // Crear line items para Stripe
    const lineItems = data.items.map(
      (item: {
        flavorName: string
        portion: string
        quantity: number
        price: number
      }) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.flavorName,
            description: PORTION_LABELS[item.portion] || item.portion,
          },
          unit_amount: formatAmountForStripe(item.price),
        },
        quantity: item.quantity,
      })
    )

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Crear Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${appUrl}/pedido/confirmacion?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${appUrl}/pedido?canceled=true`,
      customer_email: data.customerEmail,
      metadata: {
        orderId: order.id,
        storeId: data.storeId,
        storeName: data.storeName,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        pickupDate: data.pickupDate,
        pickupTime: data.pickupTime,
      },
      billing_address_collection: 'auto',
      locale: 'es',
    })

    // Guardar el session ID en el pedido
    // (esto se hace en el webhook, pero lo guardamos aquí también por si acaso)
    const supabase = (await import('@/lib/supabase')).default
    await supabase
      .from('orders')
      .update({ stripeSessionId: session.id })
      .eq('id', order.id)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      orderId: order.id,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Error al crear sesión de pago' },
      { status: 500 }
    )
  }
}
