import { NextResponse } from 'next/server'

export function middleware(request) {
  console.log('[Middleware] Processing:', request.nextUrl.pathname)

  // Skip API routes except for healthz
  if (request.nextUrl.pathname.startsWith('/api')) {
    if (request.nextUrl.pathname === '/api/healthz') {
      return NextResponse.next()
    }
    // Let other API routes handle their own auth
    return NextResponse.next()
  }

  // Skip static assets like Kuromoji dictionary files
  if (request.nextUrl.pathname.startsWith('/kuromoji-dict/')) {
    return NextResponse.next()
  }

  // Check if user has auth cookie
  const authStorageCookie = request.cookies.get('auth-storage')?.value
  let token = null
  let refreshToken = null
  let isAuthenticated = false

  // Parse the auth cookie to extract token info
  if (authStorageCookie) {
    try {
      const authData = JSON.parse(decodeURIComponent(authStorageCookie))
      token = authData.state?.token
      refreshToken = authData.state?.refreshToken
      isAuthenticated = authData.state?.isAuthenticated
    } catch (error) {
      console.log('[Middleware] Failed to parse auth cookie:', error)
      // Clear invalid cookie
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-storage')
      return response
    }
  }

  // Define public paths that don't require authentication
  // Since trailingSlash: true, normalize paths to always have trailing slash for comparison
  const normalizedPathname = request.nextUrl.pathname.endsWith('/') ? request.nextUrl.pathname : request.nextUrl.pathname + '/'
  const publicPaths = ['/login/', '/', '/applications/new/', '/applications/qr/', '/applications/lease-screening/', '/applications/complete/']
  const isPublicPath = publicPaths.includes(normalizedPathname) ||
    normalizedPathname.startsWith('/applications/new/')||
    normalizedPathname.startsWith('/applications/lease-screening/')||
    normalizedPathname.startsWith('/applications/qr/')||
    normalizedPathname.startsWith('/applications/complete/')

  console.log('[Middleware] Path:', request.nextUrl.pathname, 'Has token:', !!token, 'Is public:', isPublicPath, 'Authenticated:', isAuthenticated)

  // Handle root path redirection
  if (request.nextUrl.pathname === '/') {
    if (token && isAuthenticated) {
      return NextResponse.redirect(new URL('/projects', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check for authentication requirements
  if (!token || !isAuthenticated) {
    console.log('[Middleware] No valid token, redirecting to login')
    const response = NextResponse.redirect(new URL('/login', request.url))
    // Clear invalid/expired auth data
    response.cookies.delete('auth-storage')
    return response
  }

  // Check if both access and refresh tokens are present
  if (!refreshToken) {
    console.log('[Middleware] No refresh token available, redirecting to login')
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-storage')
    return response
  }

  // If token exists, let the request continue (API calls will validate and refresh if needed)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
