import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db/index.js';
import { users } from '@/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password.js';
import { signToken } from '@/lib/auth/jwt.js';
import { createAuthResponse } from '@/lib/auth/middleware.js';
import { validateSignupData } from '@/lib/auth/validation.js';
import { AUTH_ERRORS } from '@/lib/auth/config.js';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validation = validateSignupData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      zipCode,
      bloodGroup,
      allergies,
      emergencyContact,
      emergencyPhone,
      marketingEmails,
    } = body;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: AUTH_ERRORS.EMAIL_EXISTS },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = nanoid();

    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      dateOfBirth,
      gender,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      bloodGroup: bloodGroup || null,
      allergies: allergies || null,
      emergencyContact: emergencyContact || null,
      emergencyPhone: emergencyPhone || null,
      termsAccepted: true,
      marketingEmails: marketingEmails || false,
      profileImage: null,
      isVerified: false,
    };

    await db.insert(users).values(newUser);

    // Create JWT token
    const token = await signToken({
      userId,
      email: email.toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    // Create response with cookie
    const responseData = {
      success: true,
      message: 'Account created successfully',
      user: {
        id: userId,
        email: email.toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        isVerified: false,
      },
    };

    return createAuthResponse(token, NextResponse.json(responseData, { status: 201 }));

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}