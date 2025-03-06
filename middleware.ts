
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get Firebase auth session cookie if it exists
  const authCookie = request.cookies.get("__session") || request.cookies.get("auth")
  const { pathname } = request.nextUrl

  // Auth routes that don't require authentication
  const authRoutes = ["/sign-in", "/sign-up", "/forgot-password"]

  // Routes that require authentication
  const protectedRoutes = ["/", "/chat", "/community", "/profile", "/settings"]

  // Check if we're in a redirect loop by counting redirects
  const redirectCount = parseInt(request.cookies.get("redirect-count")?.value || "0")
  
  // If too many redirects or we're in development mode, just let the request through
  if (redirectCount > 3 || process.env.NODE_ENV === 'development') {
    const response = NextResponse.next()
    response.cookies.delete("redirect-count")
    return response
  }

  // Handle protected routes when not authenticated
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !authCookie) {
    const response = NextResponse.redirect(new URL("/sign-in", request.url))
    response.cookies.set("redirect-count", (redirectCount + 1).toString(), { maxAge: 10 })
    return response
  }
  
  // Redirect authenticated users from auth pages to home
  if (authCookie && authRoutes.some(route => pathname === route)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Handle auth routes when authenticated
  if (authRoutes.includes(pathname) && authCookie) {
    const response = NextResponse.redirect(new URL("/", request.url))
    response.cookies.set("redirect-count", (redirectCount + 1).toString(), { maxAge: 10 })
    return response
  }

  // Reset redirect count for normal navigation
  const response = NextResponse.next()
  if (redirectCount > 0) {
    response.cookies.delete("redirect-count")
  }
  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
