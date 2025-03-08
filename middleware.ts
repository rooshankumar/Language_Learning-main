
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Define auth pages
  const isAuthPage = request.nextUrl.pathname.startsWith('/sign-in') || 
                    request.nextUrl.pathname.startsWith('/sign-up')

  // Define public paths that don't require authentication
  const isPublicPath = request.nextUrl.pathname.startsWith('/_next') || 
                      request.nextUrl.pathname.startsWith('/api/auth') ||
                      request.nextUrl.pathname.startsWith('/static') ||
                      request.nextUrl.pathname === '/favicon.ico'

  // If trying to access auth page while logged in, redirect to home
  if (isAuthPage) {
    if (token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // If accessing protected route without being logged in
  if (!isPublicPath && !token) {
    const url = new URL('/sign-in', request.url)
    url.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
