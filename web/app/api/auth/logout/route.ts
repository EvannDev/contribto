import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    await fetch(`${process.env.API_URL}/auth/logout`, {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') ?? '' },
    })
  } catch {
    // Continue with local cookie deletion even if backend is down
  }

  const response = NextResponse.redirect(new URL('/', request.url))
  response.cookies.set('session', '', {
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })
  return response
}
