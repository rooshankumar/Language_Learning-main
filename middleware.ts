
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Auth routes that don't require authentication
const publicRoutes = ['/sign-in', '/sign-up', '/verify-email', '/reset-password'];

// Routes that require authentication
const protectedRoutes = [
  '/profile',
  '/chat',
  '/community',
  '/settings',
  '/onboarding',
  '/dashboard'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the pathname is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the pathname is a public route (auth routes)
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Get the token from the request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect logic
  if (isProtectedRoute && !token) {
    // If trying to access a protected route without being authenticated
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  if (isPublicRoute && token) {
    // If trying to access login/signup pages while already authenticated
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (Replit static assets)
     * 4. /favicon.ico, /robots.txt (SEO)
     * 5. /public files (public assets)
     */
    '/((?!api|_next|_static|favicon.ico|robots.txt|.*\\.(?:jpg|jpeg|png|gif|svg|css|js)).*)',
  ],
};
