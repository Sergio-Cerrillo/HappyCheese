import { NextResponse } from 'next/server'
import { deleteSession } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session')?.value
    
    if (sessionId) {
      await deleteSession(sessionId)
    }
    
    const response = NextResponse.json({ success: true })
    response.cookies.delete('session')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    )
  }
}
