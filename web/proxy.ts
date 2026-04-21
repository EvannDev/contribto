import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard', '/onboarding']
const authRoutes = ['/login']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has('session')

  const isProtected = protectedRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  )
  const isAuthRoute = authRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  )

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
