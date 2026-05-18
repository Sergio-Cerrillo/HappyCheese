import { NextResponse } from 'next/server'
import { getSessionById } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session')?.value
    
    if (!sessionId) {
      return NextResponse.json({ authenticated: false })
    }
    
    const session = await getSessionById(sessionId)
    
    if (!session) {
      return NextResponse.json({ authenticated: false })
    }
    
    return NextResponse.json({ authenticated: true })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}
