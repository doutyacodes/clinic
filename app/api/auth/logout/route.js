import { NextResponse } from 'next/server';
import { clearAuthResponse } from '@/lib/auth/middleware.js';

export async function POST(request) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear the authentication cookie
    return clearAuthResponse(response);

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}