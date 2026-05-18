import { NextResponse } from 'next/server'
import { getOrders, createOrder, updateOrder } from '@/lib/db'
import { getSessionById } from '@/lib/db'
import { isValidPickupDate } from '@/lib/date-utils'
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
    
    const orders = await getOrders()
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Error al obtener pedidos' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Validaciones
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
    
    // Validar fecha de recogida (48h mínimo, 1 año máximo)
    if (!isValidPickupDate(data.pickupDate, data.pickupTime)) {
      return NextResponse.json(
        { error: 'La fecha de recogida debe ser entre 48 horas y 1 año desde ahora' },
        { status: 400 }
      )
    }
    
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
      pickupTime: data.pickupTime
    })
    
    return NextResponse.json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Error al crear pedido' },
      { status: 500 }
    )
  }
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
    
    const { id, ...updates } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      )
    }
    
    const order = await updateOrder(id, updates)
    
    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
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
