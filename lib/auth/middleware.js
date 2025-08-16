import { NextResponse } from 'next/server';
import { AUTH_CONFIG } from './config.js';

/**
 * Create authentication response with cookie
 */
export function createAuthResponse(token, response) {
  const clonedResponse = response.clone ? response : NextResponse.json(response.body, response);
  
  clonedResponse.cookies.set(
    AUTH_CONFIG.COOKIE_NAME,
    token,
    AUTH_CONFIG.COOKIE_OPTIONS
  );
  
  return clonedResponse;
}

/**
 * Clear authentication cookie
 */
export function clearAuthResponse(response) {
  const clonedResponse = response.clone ? response : NextResponse.json(response.body, response);
  
  // Delete cookie with the same options used when setting it
  clonedResponse.cookies.set(
    AUTH_CONFIG.COOKIE_NAME,
    '',
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    }
  );
  
  return clonedResponse;
}

/**
 * Extract user data from request headers (set by middleware)
 */
export function getUserFromHeaders(request) {
  const userId = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');
  
  if (!userId || !email) {
    return null;
  }
  
  return {
    userId,
    email,
  };
}