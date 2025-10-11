import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { appointments, doctorSessions, tokenLocks } from '@/lib/db/schema.js';
import { eq, and, gt } from 'drizzle-orm';

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

    // Get session details
    const session = await db.query.doctorSessions.findFirst({
      where: eq(doctorSessions.id, sessionId),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
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
        eq(appointments.appointmentDate, date)
      ));

    // Filter out cancelled appointments
    const activeAppointments = existingAppointments.filter(
      appointment => appointment.status !== 'cancelled'
    );

    // Get currently locked tokens (within 5-minute lock period)
    const now = new Date();
    const lockedTokensData = await db.select({
      tokenNumber: tokenLocks.tokenNumber,
      expiresAt: tokenLocks.expiresAt,
      lockedByUserId: tokenLocks.lockedByUserId,
    }).from(tokenLocks)
      .where(and(
        eq(tokenLocks.sessionId, sessionId),
        eq(tokenLocks.appointmentDate, date),
        eq(tokenLocks.status, 'active'),
        gt(tokenLocks.expiresAt, now)
      ));

    // Extract booked and locked token numbers
    const bookedTokens = activeAppointments.map(apt => apt.tokenNumber);
    const lockedTokens = lockedTokensData.map(lock => lock.tokenNumber);

    // Generate token grid with availability status
    const tokens = [];
    // Use avg_minutes_per_patient from doctor_sessions table, default to 10 minutes if not available
    const avgMinutes = session.avgMinutesPerPatient || 10;

    for (let i = 1; i <= session.maxTokens; i++) {
      const isBooked = bookedTokens.includes(i);
      const isLocked = lockedTokens.includes(i);
      const estimatedTime = calculateEstimatedTime(i, session.startTime, avgMinutes);

      let status = 'available';
      if (isBooked) {
        status = 'booked';
      } else if (isLocked) {
        status = 'locked';
      }

      tokens.push({
        tokenNumber: i,
        estimatedTime,
        status,
        isAvailable: !isBooked && !isLocked,
      });
    }

    // Calculate statistics
    const availableCount = tokens.filter(t => t.status === 'available').length;
    const bookedCount = bookedTokens.length;
    const lockedCount = lockedTokens.length;

    return NextResponse.json({
      success: true,
      date,
      sessionId,
      tokens,
      statistics: {
        total: session.maxTokens,
        available: availableCount,
        booked: bookedCount,
        locked: lockedCount,
        fullyBooked: availableCount === 0,
      },
      sessionInfo: {
        startTime: session.startTime,
        endTime: session.endTime,
        avgMinutesPerPatient: avgMinutes,
      }
    });

  } catch (error) {
    console.error('Token availability error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token availability' },
      { status: 500 }
    );
  }
}

// Helper function to calculate estimated time for a token
function calculateEstimatedTime(tokenNumber, startTime, avgMinutesPerPatient) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const sessionStartMinutes = hours * 60 + minutes;
  const estimatedMinutes = sessionStartMinutes + ((tokenNumber - 1) * avgMinutesPerPatient);

  const estimatedHours = Math.floor(estimatedMinutes / 60);
  const estimatedMins = estimatedMinutes % 60;

  return `${estimatedHours.toString().padStart(2, '0')}:${estimatedMins.toString().padStart(2, '0')}`;
}
