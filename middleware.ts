import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Proteger rutas /admin
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('session')
    
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Verificar sesión con la API
    try {
      const response = await fetch(new URL('/api/auth/session', request.url), {
        headers: {
          Cookie: `session=${sessionCookie.value}`
        }
      })
      
      const data = await response.json()
      
      if (!data.authenticated) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}
