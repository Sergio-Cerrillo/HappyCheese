import { NextResponse } from 'next/server'
import { stripe, formatAmountForStripe } from '@/lib/stripe'
import { createOrder, getStoreById, getFlavors } from '@/lib/db'
import { getBaseDescription, priceOrderItems } from '@/lib/order-items'
import supabase from '@/lib/supabase-admin'
import { getPickupValidationMessage, isValidPickupDate } from '@/lib/date-utils'
import { getFlavorCartError, getFlavorPickupError } from '@/lib/flavor-sales'
import { refreshExpiredFlavorReservations } from '@/lib/flavor-inventory'

const PORTION_LABELS: Record<string, string> = {
  individual: 'Individual',
  doble: 'Doble',
  mediana: 'Mediana',
  grande: 'Grande',
}

export async function POST(request: Request) {
  let orderId: string | undefined
  let sessionCreated = false
  let limitedCheckout = false
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

    const store = await getStoreById(data.storeId)
    if (!store || !store.active) {
      return NextResponse.json(
        { error: 'Tienda no disponible' },
        { status: 400 }
      )
    }

    // Validar fecha de recogida con las reglas de la tienda
    if (!isValidPickupDate(data.pickupDate, data.pickupTime, store)) {
      return NextResponse.json(
        { error: getPickupValidationMessage(data.pickupDate, data.pickupTime, store) },
        { status: 400 }
      )
    }

    let flavors = await getFlavors()
    limitedCheckout = flavors.some(flavor => flavor.limitedEdition?.enabled && data.items.some((item: { flavorId: string }) => item?.flavorId === flavor.id))
    if (limitedCheckout && await refreshExpiredFlavorReservations()) flavors = await getFlavors()
    let items
    try {
      items = priceOrderItems(data.items, flavors, store.id)
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Pedido no válido' }, { status: 400 })
    }
    const total = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100
    for (const flavor of flavors.filter(flavor => items.some(item => item.flavorId === flavor.id))) {
      const error = getFlavorCartError(flavor, items) || getFlavorPickupError(flavor, data.pickupDate)
      if (error) return NextResponse.json({ error }, { status: 409 })
    }
    if (!Number.isFinite(data.total) || Math.round(data.total * 100) !== Math.round(total * 100)) {
      return NextResponse.json({ error: 'El precio del pedido ha cambiado. Recarga los sabores y revisa tu pedido.' }, { status: 409 })
    }

    // Crear el pedido en estado "pending" (pendiente de pago)
    const order = await createOrder({
      items,
      storeId: data.storeId,
      storeName: store.name,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      notes: data.notes,
      total,
      status: 'pendiente',
      paymentStatus: 'pending',
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
    })

    orderId = order.id

    // Crear line items para Stripe
    const lineItems = items.map(
      (item) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.flavorName,
            description: [PORTION_LABELS[item.portion] || item.portion, getBaseDescription(item)].filter(Boolean).join(' · '),
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
      ...(limitedCheckout ? { expires_at: Math.floor(Date.now() / 1000) + 35 * 60 } : {}),
      payment_intent_data: { metadata: { orderId: order.id } },
      success_url: `${appUrl}/pedido/confirmacion?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${appUrl}/pedido?canceled=true`,
      customer_email: data.customerEmail,
      metadata: {
        orderId: order.id,
        storeId: data.storeId,
        storeName: store.name,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        pickupDate: data.pickupDate,
        pickupTime: data.pickupTime,
      },
      billing_address_collection: 'auto',
      locale: 'es',
    }, { idempotencyKey: `checkout-${order.id}` })

    sessionCreated = true

    // El webhook también puede asociar el pedido mediante sus metadatos.
    const { error: sessionError } = await supabase
      .from('orders')
      .update({ stripeSessionId: session.id })
      .eq('id', order.id)
      .select('id')
      .single()
    if (sessionError) throw sessionError

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      orderId: order.id,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    if (orderId && !sessionCreated) {
      const { error: cleanupError } = await supabase.from('orders').update({
        // Una respuesta de red perdida puede ocultar una sesión creada. Mantener
        // el pedido limitado recuperable hasta verificar su caducidad en Stripe.
        status: limitedCheckout ? 'pendiente' : 'cancelado', paymentStatus: 'failed', updatedAt: new Date().toISOString(),
      }).eq('id', orderId).eq('paymentStatus', 'pending')
      if (cleanupError) console.error('Error marking failed checkout:', cleanupError)
    }
    if (error && typeof error === 'object' && 'message' in error && String(error.message).startsWith('LIMITED_EDITION:')) {
      return NextResponse.json({ error: String(error.message).replace('LIMITED_EDITION: ', '') }, { status: 409 })
    }
    return NextResponse.json(
      { error: 'Error al crear sesión de pago' },
      { status: 500 }
    )
  }
}
