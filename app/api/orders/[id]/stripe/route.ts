import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getOrderById, getSessionById } from '@/lib/db'
import { findOrderSession } from '@/lib/order-payments'
import { stripe } from '@/lib/stripe'
import type { StripeAttemptDetails } from '@/lib/types'

const headers = { 'Cache-Control': 'private, no-store' }

// Diagnóstico en lectura: devolver datos concretos de Stripe dentro del panel,
// sin redirecciones ni confundir una consulta actual con un fallo histórico.
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const sessionCookie = (await cookies()).get('session')?.value
    if (!sessionCookie || !await getSessionById(sessionCookie)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401, headers })
    }
    const { id } = await context.params
    const order = await getOrderById(id)
    if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404, headers })

    const sessionId = await findOrderSession(order)
    if (!sessionId) {
      return NextResponse.json({
        found: false, checkedAt: new Date().toISOString(),
        summary: 'No se ha encontrado una sesión de Stripe asociada a este pedido. No hay un registro de intento disponible para consultar.',
      } satisfies StripeAttemptDetails, { headers })
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent.latest_charge'] })
    if (session.metadata?.orderId !== order.id || session.currency !== 'eur' ||
        session.amount_total !== Math.round(Number(order.total) * 100)) {
      return NextResponse.json({ error: 'La sesión de Stripe no corresponde al pedido' }, { status: 409, headers })
    }
    const intent = typeof session.payment_intent === 'string'
      ? await stripe.paymentIntents.retrieve(session.payment_intent, { expand: ['latest_charge'] })
      : session.payment_intent
    const charge = intent?.latest_charge && typeof intent.latest_charge !== 'string' ? intent.latest_charge : null
    const error = intent?.last_payment_error
    const refundedAmount = (charge?.amount_refunded || 0) / 100
    const summary = charge?.refunded ? 'Stripe registra un reembolso completo de este pago.'
      : refundedAmount > 0 ? 'Stripe registra un reembolso parcial de este pago.'
      : session.payment_status === 'paid' ? 'Stripe confirma que el pedido está pagado. Cancelarlo en la web no devuelve el cobro.'
      : intent?.status === 'canceled' ? 'Stripe registra el intento de pago como cancelado.'
      : error ? 'Stripe conserva un error en el último intento de pago.'
      : session.status === 'expired' ? 'La sesión caducó sin un pago confirmado. Esto no demuestra que la tarjeta fuera rechazada.'
      : !intent ? 'Stripe tiene una sesión de pago, pero no devuelve un intento de cobro asociado.'
      : 'Stripe todavía no confirma el pago de este intento.'

    const details: StripeAttemptDetails = {
      found: true, checkedAt: new Date().toISOString(), summary,
      sessionId: session.id, sessionStatus: session.status || undefined, paymentStatus: session.payment_status,
      paymentIntentId: intent?.id, paymentIntentStatus: intent?.status,
      createdAt: session.created ? new Date(session.created * 1000).toISOString() : undefined,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : undefined,
      refundedAmount,
      lastPaymentError: error ? {
        message: error.message || undefined, code: error.code || undefined, declineCode: error.decline_code || undefined,
      } : undefined,
    }
    return NextResponse.json(details, { headers })
  } catch (error) {
    console.error('Error inspecting Stripe order attempt:', error)
    return NextResponse.json({ error: 'No se ha podido consultar Stripe. No se ha modificado el pedido. Vuelve a intentarlo.' }, { status: 502, headers })
  }
}
