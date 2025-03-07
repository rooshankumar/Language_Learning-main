import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Auth routes that don't require authentication
const authRoutes = ['/sign-in', '/sign-up', '/verify-email', '/reset-password'];

// Routes that require authentication
const protectedRoutes = ['/chat', '/profile', '/settings', '/community', '/onboarding'];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  const path = request.nextUrl.pathname;

  // If the user is authenticated and trying to access an auth route, redirect to home
  if (isAuthenticated && authRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If the user is not authenticated and trying to access a protected route, redirect to sign-in
  if (!isAuthenticated && protectedRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // If authenticated but not onboarded trying to access any route except onboarding, redirect to onboarding
  if (isAuthenticated && !token.isOnboarded && path !== '/onboarding' && !path.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // If authenticated and onboarded trying to access onboarding, redirect to home
  if (isAuthenticated && token.isOnboarded && path === '/onboarding') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};