import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { appointments } from '@/lib/db/schema.js';
import { eq } from 'drizzle-orm';

export async function POST(request) {
  try {
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Get the appointment
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Appointment is already cancelled' },
        { status: 400 }
      );
    }

    if (appointment.status === 'completed') {
      return NextResponse.json(
        { error: 'Completed appointments cannot be cancelled' },
        { status: 400 }
      );
    }

    // Update appointment status to cancelled
    await db.update(appointments)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId));

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}