import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { users } from '@/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt.js';
import { AUTH_CONFIG } from '@/lib/auth/config.js';

export async function GET(request) {
  try {
    // Get token from cookie
    const cookie = request.headers.get('cookie') || '';
    const tokenMatch = cookie.match(new RegExp(`${AUTH_CONFIG.COOKIE_NAME}=([^;]+)`));
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let tokenPayload;
    try {
      tokenPayload = await verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, tokenPayload.userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data (without sensitive fields)
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      bloodGroup: user.bloodGroup,
      allergies: user.allergies,
      emergencyContact: user.emergencyContact,
      emergencyPhone: user.emergencyPhone,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
      marketingEmails: user.marketingEmails,
      createdAt: user.createdAt,
    };

    return NextResponse.json({
      success: true,
      user: userData,
    });

  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}