import { NextResponse } from 'next/server'
import { getStores, createStore, updateStore, deleteStore } from '@/lib/db'
import { getSessionById } from '@/lib/db'
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
    const stores = await getStores()
    // Solo devolver tiendas activas para usuarios públicos
    return NextResponse.json(stores.filter(s => s.active))
  } catch (error) {
    console.error('Error fetching stores:', error)
    return NextResponse.json(
      { error: 'Error al obtener tiendas' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const isAuth = await checkAuth()
    if (!isAuth) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const data = await request.json()
    
    if (!data.name || !data.address || !data.phone || !data.hours) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }
    
    const store = await createStore({
      name: data.name,
      address: data.address,
      phone: data.phone,
      hours: data.hours,
      coordinates: data.coordinates || { lat: 0, lng: 0 },
      active: data.active ?? true
    })
    
    return NextResponse.json(store)
  } catch (error) {
    console.error('Error creating store:', error)
    return NextResponse.json(
      { error: 'Error al crear tienda' },
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
    
    const store = await updateStore(id, updates)
    
    if (!store) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(store)
  } catch (error) {
    console.error('Error updating store:', error)
    return NextResponse.json(
      { error: 'Error al actualizar tienda' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const isAuth = await checkAuth()
    if (!isAuth) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      )
    }
    
    const success = await deleteStore(id)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting store:', error)
    return NextResponse.json(
      { error: 'Error al eliminar tienda' },
      { status: 500 }
    )
  }
}
