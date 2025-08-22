import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { appointments } from '@/lib/db/schema.js';
import { eq, and } from 'drizzle-orm';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const date = searchParams.get('date');

    if (!sessionId || !date) {
      return NextResponse.json(
        { error: 'Session ID and date are required' },
        { status: 400 }
      );
    }

    // Validate date format
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
      return NextResponse.json(
        { error: 'Cannot check availability for past dates' },
        { status: 400 }
      );
    }

    // Fetch existing appointments for this session and date
    const existingAppointments = await db.select({
      tokenNumber: appointments.tokenNumber,
      estimatedTime: appointments.estimatedTime,
      status: appointments.status,
    }).from(appointments)
      .where(and(
        eq(appointments.sessionId, sessionId),
        eq(appointments.appointmentDate, date),
        // Only count non-cancelled appointments
      ));

    // Filter out cancelled appointments
    const activeAppointments = existingAppointments.filter(
      appointment => appointment.status !== 'cancelled'
    );

    // Extract booked tokens and times
    const bookedTokens = activeAppointments.map(apt => apt.tokenNumber);
    const bookedTimes = activeAppointments
      .map(apt => apt.estimatedTime)
      .filter(time => time); // Filter out null/undefined times

    // Calculate availability statistics
    const totalBooked = bookedTokens.length;
    
    return NextResponse.json({
      success: true,
      date,
      sessionId,
      bookedTokens,
      bookedTimes,
      totalBooked,
      availability: {
        hasAvailability: bookedTokens.length > 0,
        nextAvailableToken: getNextAvailableToken(bookedTokens),
        fullyBooked: false, // We'll determine this based on session.maxTokens in the frontend
      }
    });

  } catch (error) {
    console.error('Check availability error:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}

// Helper function to find next available token
function getNextAvailableToken(bookedTokens) {
  if (bookedTokens.length === 0) return 1;
  
  const sortedTokens = bookedTokens.sort((a, b) => a - b);
  
  // Find the first gap in the sequence
  for (let i = 1; i <= Math.max(...sortedTokens) + 1; i++) {
    if (!sortedTokens.includes(i)) {
      return i;
    }
  }
  
  return Math.max(...sortedTokens) + 1;
}