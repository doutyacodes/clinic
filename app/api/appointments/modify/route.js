import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { appointments, appointmentHistory, doctorSessions } from '@/lib/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      appointmentId,
      appointmentDate,
      tokenNumber,
      estimatedTime,
      modifyType
    } = body;

    console.log('Modify appointment request:', {
      appointmentId,
      appointmentDate,
      tokenNumber,
      estimatedTime,
      modifyType
    });

    // Validate required fields
    if (!appointmentId || !appointmentDate || !tokenNumber || !estimatedTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch existing appointment
    const existingAppointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        session: true,
        doctor: true,
        hospital: true,
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Only allow modification if appointment is confirmed or pending
    if (!['confirmed', 'pending'].includes(existingAppointment.status)) {
      return NextResponse.json(
        { error: `Cannot modify ${existingAppointment.status} appointment` },
        { status: 400 }
      );
    }

    // Validate that the selected date is not in the past
    const selectedDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return NextResponse.json(
        { error: 'Cannot modify to a past date' },
        { status: 400 }
      );
    }

    // Validate that the selected date matches the doctor's available day
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    if (existingAppointment.session.dayOfWeek !== dayOfWeek) {
      return NextResponse.json(
        { error: `Doctor is not available on ${dayOfWeek}. Available on ${existingAppointment.session.dayOfWeek}s` },
        { status: 400 }
      );
    }

    // Check if the new token is available (exclude current appointment)
    const conflictingAppointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.sessionId, existingAppointment.sessionId),
        eq(appointments.appointmentDate, appointmentDate),
        eq(appointments.tokenNumber, parseInt(tokenNumber))
      ),
    });

    // Allow if it's the same appointment or no conflict exists
    if (conflictingAppointment && conflictingAppointment.id !== appointmentId) {
      if (conflictingAppointment.status !== 'cancelled') {
        return NextResponse.json(
          { error: `Token ${tokenNumber} is already booked for this date` },
          { status: 400 }
        );
      }
    }

    // Validate token number against session limits
    if (tokenNumber > existingAppointment.session.maxTokens) {
      return NextResponse.json(
        { error: `Token ${tokenNumber} exceeds maximum limit of ${existingAppointment.session.maxTokens}` },
        { status: 400 }
      );
    }

    // Record change in appointment history
    const historyId = nanoid();
    await db.insert(appointmentHistory).values({
      id: historyId,
      appointmentId,
      userId: existingAppointment.userId,
      changeType: 'modification',
      previousDate: existingAppointment.appointmentDate,
      newDate: appointmentDate,
      previousTokenNumber: existingAppointment.tokenNumber,
      newTokenNumber: parseInt(tokenNumber),
      previousEstimatedTime: existingAppointment.estimatedTime,
      newEstimatedTime: estimatedTime,
      modificationReason: modifyType || 'user_request',
      changedAt: new Date(),
      changedBy: existingAppointment.userId,
      notes: `Modified via ${modifyType || 'manual'} method`,
    });

    // Update the appointment
    await db.update(appointments)
      .set({
        appointmentDate,
        tokenNumber: parseInt(tokenNumber),
        estimatedTime,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId));

    // Fetch updated appointment with all relations
    const updatedAppointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        doctor: {
          with: {
            specialty: true
          }
        },
        hospital: true,
        session: true,
        payment: true,
      },
    });

    console.log('Appointment modified successfully:', {
      appointmentId,
      oldToken: existingAppointment.tokenNumber,
      newToken: tokenNumber,
      oldDate: existingAppointment.appointmentDate,
      newDate: appointmentDate
    });

    // TODO: Send notification email to user about the modification
    // await sendModificationNotification(updatedAppointment);

    return NextResponse.json({
      success: true,
      booking: {
        ...updatedAppointment,
        id: updatedAppointment.id,
        appointmentDate: updatedAppointment.appointmentDate,
        tokenNumber: updatedAppointment.tokenNumber,
        estimatedTime: updatedAppointment.estimatedTime,
        status: updatedAppointment.status,
        doctor: {
          name: updatedAppointment.doctor.name,
          specialty: updatedAppointment.doctor.specialty?.name || 'General Medicine',
          rating: updatedAppointment.doctor.rating,
        },
        hospital: {
          name: updatedAppointment.hospital.name,
          address: updatedAppointment.hospital.address,
          phone: updatedAppointment.hospital.phone,
        },
        session: {
          id: updatedAppointment.session.id,
          dayOfWeek: updatedAppointment.session.dayOfWeek,
          startTime: updatedAppointment.session.startTime,
          endTime: updatedAppointment.session.endTime,
          maxTokens: updatedAppointment.session.maxTokens,
          avgMinutesPerPatient: updatedAppointment.session.avgMinutesPerPatient,
        },
        sessionId: updatedAppointment.sessionId,
        payment: updatedAppointment.payment ? {
          amount: updatedAppointment.payment.amount,
          status: updatedAppointment.payment.status,
          transactionId: updatedAppointment.payment.transactionId,
        } : null,
      },
      message: 'Appointment modified successfully. No additional payment required.',
      previousValues: {
        date: existingAppointment.appointmentDate,
        token: existingAppointment.tokenNumber,
        time: existingAppointment.estimatedTime,
      }
    });

  } catch (error) {
    console.error('Modify appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to modify appointment', details: error.message },
      { status: 500 }
    );
  }
}
