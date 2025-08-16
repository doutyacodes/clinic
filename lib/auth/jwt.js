import jwt from 'jsonwebtoken';
import { SignJWT, jwtVerify } from 'jose';
import { AUTH_CONFIG } from './config.js';

const secret = new TextEncoder().encode(AUTH_CONFIG.JWT_SECRET);

/**
 * Sign JWT token using jose (recommended for Next.js App Router)
 */
export async function signToken(payload) {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    return token;
  } catch (error) {
    console.error('JWT sign error:', error);
    throw new Error('Failed to sign token');
  }
}

/**
 * Verify JWT token using jose
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('JWT verify error:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Legacy JWT methods for compatibility
 */
export function signTokenLegacy(payload) {
  return jwt.sign(payload, AUTH_CONFIG.JWT_SECRET, {
    expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN,
  });
}

export function verifyTokenLegacy(token) {
  return jwt.verify(token, AUTH_CONFIG.JWT_SECRET);
}

/**
 * Decode JWT token without verification (for client-side use)
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}