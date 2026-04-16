import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', request.url))
  }

  let apiRes
  try {
    apiRes = await fetch(`${process.env.API_URL}/auth/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
  } catch (err) {
    console.error('api unavailable', err)
    return NextResponse.redirect(new URL('/?error=api_unavailable', request.url))
  }

  if (!apiRes.ok) {
    const body = await apiRes.text().catch(() => '')
    console.error('auth failed', apiRes.status, body)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }

  // Forward the encrypted session cookie from the Go API to the browser.
  const response = NextResponse.redirect(new URL('/dashboard', request.url))
  const setCookie = apiRes.headers.get('set-cookie')
  if (setCookie) {
    response.headers.set('set-cookie', setCookie)
  }
  return response
}
