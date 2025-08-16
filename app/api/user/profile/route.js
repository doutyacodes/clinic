import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { users } from '@/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function PUT(request) {
  try {
    // Get the JWT token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Get the updated profile data
    const profileData = await request.json();
    
    // Validate required fields
    if (!profileData.firstName || !profileData.lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Prepare update data (exclude email as it shouldn't be updated here)
    const updateData = {
      firstName: profileData.firstName.trim(),
      lastName: profileData.lastName.trim(),
      phone: profileData.phone?.trim() || null,
      dateOfBirth: profileData.dateOfBirth || null,
      gender: profileData.gender || null,
      address: profileData.address?.trim() || null,
      emergencyContact: profileData.emergencyContact?.trim() || null,
      emergencyPhone: profileData.emergencyPhone?.trim() || null,
      bloodGroup: profileData.bloodGroup || null,
      allergies: profileData.allergies?.trim() || null,
      medicalHistory: profileData.medicalHistory?.trim() || null,
      updatedAt: new Date(),
    };

    // Update the user profile
    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    // Get the updated user data
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false, // Exclude password from response
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Get the JWT token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Get the user profile
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false, // Exclude password from response
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}