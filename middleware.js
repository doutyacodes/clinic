import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth/jwt.js';
import { AUTH_CONFIG } from './lib/auth/config.js';

export async function middleware(request) {
  // Skip middleware for API routes, static files, and auth pages
  const { pathname } = request.nextUrl;
  
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/payment/success') ||
    pathname.startsWith('/payment/failure') ||
    pathname === '/' ||
    pathname.startsWith('/doctor/') ||
    pathname.startsWith('/hospital/')
  ) {
    return NextResponse.next();
  }

  try {
    // Get token from cookie
    const token = request.cookies.get(AUTH_CONFIG.COOKIE_NAME)?.value;
    
    if (!token) {
      // Redirect to login if no token
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token
    const payload = await verifyToken(token);
    
    if (!payload) {
      // Redirect to login if invalid token
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      // Clear invalid cookie
      response.cookies.delete(AUTH_CONFIG.COOKIE_NAME);
      return response;
    }

    // Add user info to headers for API routes (optional)
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-email', payload.email);
    
    return response;

  } catch (error) {
    console.error('Middleware auth error:', error);
    // On error, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(AUTH_CONFIG.COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match request paths that require authentication:
     * - /bookings
     * - /payment/initiate
     * - /profile
     * - /settings
     */
    '/bookings/:path*',
    '/payment/initiate/:path*',
    '/profile/:path*',
    '/settings/:path*',
  ],
};