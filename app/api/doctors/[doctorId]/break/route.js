import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { doctors } from '@/lib/db/schema.js';
import { eq } from 'drizzle-orm';

// Start a break (timed or indefinite)
export async function POST(request, { params }) {
  try {
    const { doctorId } = await params;
    const body = await request.json();
    const { breakType, durationMinutes, reason } = body;

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    if (!breakType || !['timed', 'indefinite'].includes(breakType)) {
      return NextResponse.json(
        { error: 'Break type must be "timed" or "indefinite"' },
        { status: 400 }
      );
    }

    if (breakType === 'timed' && !durationMinutes) {
      return NextResponse.json(
        { error: 'Duration in minutes is required for timed breaks' },
        { status: 400 }
      );
    }

    const now = new Date();
    const breakEndTime = breakType === 'timed'
      ? new Date(now.getTime() + durationMinutes * 60000)
      : null;

    // Update doctor status to on_break with break details
    await db.update(doctors)
      .set({
        status: 'on_break',
        breakType,
        breakStartTime: now,
        breakEndTime,
        breakReason: reason || null,
        updatedAt: now,
      })
      .where(eq(doctors.id, doctorId));

    return NextResponse.json({
      success: true,
      message: `${breakType === 'timed' ? 'Timed' : 'Indefinite'} break started successfully`,
      breakDetails: {
        breakType,
        breakStartTime: now,
        breakEndTime,
        breakReason: reason || null,
        durationMinutes: breakType === 'timed' ? durationMinutes : null,
      },
    });

  } catch (error) {
    console.error('Start break error:', error);
    return NextResponse.json(
      { error: 'Failed to start break' },
      { status: 500 }
    );
  }
}

// End a break
export async function DELETE(request, { params }) {
  try {
    const { doctorId } = await params;

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    // Get current doctor status
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, doctorId),
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    if (doctor.status !== 'on_break') {
      return NextResponse.json(
        { error: 'Doctor is not currently on break' },
        { status: 400 }
      );
    }

    // Update doctor status back to available/online
    await db.update(doctors)
      .set({
        status: 'available',
        breakType: null,
        breakStartTime: null,
        breakEndTime: null,
        breakReason: null,
        updatedAt: new Date(),
      })
      .where(eq(doctors.id, doctorId));

    return NextResponse.json({
      success: true,
      message: 'Break ended successfully',
    });

  } catch (error) {
    console.error('End break error:', error);
    return NextResponse.json(
      { error: 'Failed to end break' },
      { status: 500 }
    );
  }
}

// Get break status
export async function GET(request, { params }) {
  try {
    const { doctorId } = await params;

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, doctorId),
      columns: {
        id: true,
        name: true,
        status: true,
        breakType: true,
        breakStartTime: true,
        breakEndTime: true,
        breakReason: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    const isOnBreak = doctor.status === 'on_break';
    let timeRemaining = null;
    let breakExpired = false;

    if (isOnBreak && doctor.breakType === 'timed' && doctor.breakEndTime) {
      const now = new Date();
      const endTime = new Date(doctor.breakEndTime);
      timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000)); // seconds
      breakExpired = timeRemaining === 0;
    }

    return NextResponse.json({
      success: true,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        status: doctor.status,
        isOnBreak,
        breakDetails: isOnBreak ? {
          breakType: doctor.breakType,
          breakStartTime: doctor.breakStartTime,
          breakEndTime: doctor.breakEndTime,
          breakReason: doctor.breakReason,
          timeRemainingSeconds: timeRemaining,
          breakExpired,
        } : null,
      },
    });

  } catch (error) {
    console.error('Get break status error:', error);
    return NextResponse.json(
      { error: 'Failed to get break status' },
      { status: 500 }
    );
  }
}
