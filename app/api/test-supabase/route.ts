import { NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test 1: Obtener tiendas
    const { data: stores, error: storesError } = await db
      .from('stores')
      .select('*')
    
    console.log('Stores:', stores, 'Error:', storesError)
    
    // Test 2: Obtener sabores
    const { data: flavors, error: flavorsError } = await db
      .from('flavors')
      .select('*')
    
    console.log('Flavors:', flavors, 'Error:', flavorsError)
    
    // Test 3: Obtener admins
    const { data: admins, error: adminsError } = await db
      .from('admins')
      .select('*')
    
    console.log('Admins:', admins, 'Error:', adminsError)
    
    return NextResponse.json({
      stores: {
        count: stores?.length || 0,
        data: stores,
        error: storesError?.message
      },
      flavors: {
        count: flavors?.length || 0,
        data: flavors,
        error: flavorsError?.message
      },
      admins: {
        count: admins?.length || 0,
        data: admins,
        error: adminsError?.message
      }
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json(
      { error: 'Error en la prueba', details: String(error) },
      { status: 500 }
    )
  }
}
