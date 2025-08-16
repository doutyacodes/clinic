import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { users } from '@/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { comparePasswords } from '@/lib/auth/password.js';
import { signToken } from '@/lib/auth/jwt.js';
import { createAuthResponse } from '@/lib/auth/middleware.js';
import { validateLoginData } from '@/lib/auth/validation.js';
import { AUTH_ERRORS } from '@/lib/auth/config.js';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validation = validateLoginData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = body;

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      return NextResponse.json(
        { error: AUTH_ERRORS.INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await comparePasswords(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: AUTH_ERRORS.INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    // Update last login (optional)
    await db.update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Create JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    // Create response with cookie
    const responseData = {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
      },
    };

    return createAuthResponse(token, NextResponse.json(responseData));

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}