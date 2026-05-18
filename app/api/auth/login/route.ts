import { NextResponse } from 'next/server'
import { getAdminByUsername, createSession } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña requeridos' },
        { status: 400 }
      )
    }
    
    const admin = await getAdminByUsername(username)
    
    // En producción usar bcrypt.compare
    if (!admin || admin.passwordHash !== password) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }
    
    const session = await createSession(admin.id)
    
    const response = NextResponse.json({ success: true })
    response.cookies.set('session', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 días
    })
    
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    )
  }
}
