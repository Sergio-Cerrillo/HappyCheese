import { NextResponse } from 'next/server'
import { getOrders, updateOrder, getOrderById } from '@/lib/db'
import { getSessionById } from '@/lib/db'
import { canConfirmOrder } from '@/lib/order-status'
import { reconcileOrders, findOrderSession, syncCheckoutSession } from '@/lib/order-payments'
import { cookies } from 'next/headers'

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session')?.value
  if (!sessionId) return false
  const session = await getSessionById(sessionId)
  return !!session
}

export async function GET() {
  try {
    const isAuth = await checkAuth()
    if (!isAuth) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const orders = await reconcileOrders(await getOrders())
    return NextResponse.json(orders, { headers: {
      'Cache-Control': 'private, no-store',
      'X-Order-Sync-Errors': String(orders.filter(order => order.paymentSyncError).length),
    } })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Error al obtener pedidos' },
      { status: 500 }
    )
  }
}

// Los pedidos públicos se crean exclusivamente mediante /api/checkout.
export async function POST() {
  return NextResponse.json({ error: 'Utiliza el proceso de pago para crear el pedido' }, { status: 410 })
}

export async function PUT(request: Request) {
  try {
    const isAuth = await checkAuth()
    if (!isAuth) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const { id, status } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      )
    }
    
    if (!['pendiente', 'confirmado', 'completado', 'cancelado'].includes(status)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    }
    let existing = await getOrderById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }
    if (status === 'confirmado' || status === 'completado') {
      const sessionId = await findOrderSession(existing)
      if (sessionId) existing = await syncCheckoutSession(sessionId, id)
      if (!sessionId || !canConfirmOrder(existing)) {
        return NextResponse.json({ error: 'No se puede confirmar o completar un pedido sin pago verificado' }, { status: 409 })
      }
    }
    // El estado del pago solo lo modifica el webhook de Stripe.
    const order = await updateOrder(id, { status }, existing.updatedAt)
    
    if (!order) {
      return NextResponse.json(
        { error: 'El pedido ha cambiado o no se ha podido guardar. Actualiza los pedidos y vuelve a intentarlo.' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Error al actualizar pedido' },
      { status: 500 }
    )
  }
}
