import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getFlavors, getSessionById, getStoreById } from '@/lib/db'
import { db } from '@/lib/supabase-admin'

export async function PUT(request: Request) {
  try {
    const sessionId = (await cookies()).get('session')?.value
    if (!sessionId || !(await getSessionById(sessionId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { storeId, ids } = await request.json()
    if (typeof storeId !== 'string' || !storeId || storeId.length > 100 || !Array.isArray(ids) || ids.length > 1000 || ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length) {
      return NextResponse.json({ error: 'Orden de sabores no válido' }, { status: 400 })
    }
    const store = await getStoreById(storeId)
    if (!store?.active) return NextResponse.json({ error: 'Tienda no disponible' }, { status: 404 })
    const { error } = await db.rpc('reorder_flavors_for_store', { store_id: storeId, flavor_ids: ids })
    if (error) {
      console.error('Error reordering flavors:', error)
      if (error.code === 'PGRST202' || error.code === '42883') {
        return NextResponse.json({ error: 'La ordenación por tienda todavía no está activada.' }, { status: 503 })
      }
      return NextResponse.json({ error: 'No se ha podido guardar el orden. Recarga el catálogo e inténtalo de nuevo.' }, { status: 409 })
    }
    return NextResponse.json(await getFlavors(), { headers: { 'Cache-Control': 'private, no-store, max-age=0' } })
  } catch (error) {
    console.error('Error reordering flavors:', error)
    return NextResponse.json({ error: 'Error al guardar el orden' }, { status: 500 })
  }
}
