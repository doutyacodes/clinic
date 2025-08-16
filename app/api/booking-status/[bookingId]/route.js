import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { appointments } from '@/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt.js';
import { AUTH_CONFIG } from '@/lib/auth/config.js';

export async function GET(request, { params }) {
  try {
    // Check authentication first
    const cookie = request.headers.get('cookie') || '';
    const tokenMatch = cookie.match(new RegExp(`${AUTH_CONFIG.COOKIE_NAME}=([^;]+)`));
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let user;
    try {
      user = await verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { bookingId } = params;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Get booking details with related data (no authentication required for status check)
    const booking = await db.query.appointments.findFirst({
      where: eq(appointments.id, bookingId),
      with: {
        doctor: {
          with: {
            specialty: true,
          },
        },
        hospital: true,
        session: true,
        payments: {
          orderBy: (payments, { desc }) => [desc(payments.createdAt)],
          limit: 1, // Get latest payment
        },
        medicalRecord: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify that the booking belongs to the authenticated user
    if (booking.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to booking' },
        { status: 403 }
      );
    }

    // Transform data for public viewing (exclude sensitive information)
    const publicBookingData = {
      id: booking.id,
      appointmentDate: booking.appointmentDate,
      tokenNumber: booking.tokenNumber,
      estimatedTime: booking.estimatedTime,
      actualStartTime: booking.actualStartTime,
      actualEndTime: booking.actualEndTime,
      status: booking.status,
      bookingType: booking.bookingType,
      consultationFee: booking.consultationFee,
      patientComplaints: booking.patientComplaints,
      doctorNotes: booking.doctorNotes,
      prescription: booking.prescription,
      createdAt: booking.createdAt,
      doctor: booking.doctor ? {
        id: booking.doctor.id,
        name: booking.doctor.name,
        specialty: booking.doctor.specialty?.name,
        image: booking.doctor.image,
        rating: booking.doctor.rating,
        // Hide personal contact information
      } : null,
      hospital: booking.hospital ? {
        id: booking.hospital.id,
        name: booking.hospital.name,
        address: booking.hospital.address,
        phone: booking.hospital.phone,
        image: booking.hospital.image,
      } : null,
      session: booking.session ? {
        id: booking.session.id,
        dayOfWeek: booking.session.dayOfWeek,
        startTime: booking.session.startTime,
        endTime: booking.session.endTime,
      } : null,
      payment: booking.payments?.[0] ? {
        id: booking.payments[0].id,
        amount: booking.payments[0].amount,
        status: booking.payments[0].status,
        transactionId: booking.payments[0].transactionId,
        gateway: booking.payments[0].gateway,
        paidAt: booking.payments[0].paidAt,
        // Hide sensitive payment details
      } : null,
      medicalRecord: booking.medicalRecord ? {
        id: booking.medicalRecord.id,
        diagnosis: booking.medicalRecord.diagnosis,
        symptoms: booking.medicalRecord.symptoms,
        treatment: booking.medicalRecord.treatment,
        prescription: booking.medicalRecord.prescription,
        followUpDate: booking.medicalRecord.followUpDate,
        // Only show if not marked as private
        isPrivate: booking.medicalRecord.isPrivate,
      } : null,
    };

    // Hide medical record details if marked as private
    if (publicBookingData.medicalRecord?.isPrivate) {
      publicBookingData.medicalRecord = {
        id: booking.medicalRecord.id,
        isPrivate: true,
        message: 'Medical record is private and can only be viewed by the patient'
      };
    }

    return NextResponse.json({
      success: true,
      booking: publicBookingData,
    });

  } catch (error) {
    console.error('Get booking status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking status' },
      { status: 500 }
    );
  }
}