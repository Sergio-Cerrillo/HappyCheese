import { NextResponse } from 'next/server'
import { getFlavors, createFlavor, updateFlavor, deleteFlavor } from '@/lib/db'
import { getSessionById } from '@/lib/db'
import { cookies } from 'next/headers'

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session')?.value
  if (!sessionId) return false
  const session = await getSessionById(sessionId)
  return !!session
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    
    let flavors = await getFlavors()
    
    // Filtrar por tienda si se especifica
    if (storeId) {
      flavors = flavors.filter(f => 
        f.active && 
        f.availability.some(a => a.storeId === storeId && a.portions.length > 0)
      )
    } else {
      // Para usuarios públicos, solo activos
      const isAuth = await checkAuth()
      if (!isAuth) {
        flavors = flavors.filter(f => f.active)
      }
    }
    
    return NextResponse.json(flavors)
  } catch (error) {
    console.error('Error fetching flavors:', error)
    return NextResponse.json(
      { error: 'Error al obtener sabores' },
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
    
    if (!data.name || !data.description || !data.prices) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }
    
    const flavor = await createFlavor({
      name: data.name,
      description: data.description,
      prices: data.prices,
      image: data.image || '/images/clasica.jpg',
      active: data.active ?? true,
      availability: data.availability || []
    })
    
    return NextResponse.json(flavor)
  } catch (error) {
    console.error('Error creating flavor:', error)
    return NextResponse.json(
      { error: 'Error al crear sabor' },
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
    
    const flavor = await updateFlavor(id, updates)
    
    if (!flavor) {
      return NextResponse.json(
        { error: 'Sabor no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(flavor)
  } catch (error) {
    console.error('Error updating flavor:', error)
    return NextResponse.json(
      { error: 'Error al actualizar sabor' },
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
    
    const success = await deleteFlavor(id)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Sabor no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting flavor:', error)
    return NextResponse.json(
      { error: 'Error al eliminar sabor' },
      { status: 500 }
    )
  }
}
