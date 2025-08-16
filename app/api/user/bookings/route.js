import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { appointments } from '@/lib/db/schema.js';
import { eq, desc } from 'drizzle-orm';
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

    let user;
    try {
      user = await verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user's appointments with related data
    const userBookings = await db.query.appointments.findMany({
      where: eq(appointments.userId, user.userId),
      with: {
        doctor: {
          with: {
            specialty: true,
          },
        },
        hospital: true,
        session: true,
        payments: {
          orderBy: desc(appointments.createdAt),
          limit: 1, // Get latest payment
        },
        medicalRecord: true,
      },
      orderBy: desc(appointments.appointmentDate),
    });

    // Transform data for frontend
    const bookings = userBookings.map(appointment => ({
      id: appointment.id,
      appointmentDate: appointment.appointmentDate,
      tokenNumber: appointment.tokenNumber,
      estimatedTime: appointment.estimatedTime,
      actualStartTime: appointment.actualStartTime,
      actualEndTime: appointment.actualEndTime,
      status: appointment.status,
      bookingType: appointment.bookingType,
      consultationFee: appointment.consultationFee,
      patientComplaints: appointment.patientComplaints,
      doctorNotes: appointment.doctorNotes,
      prescription: appointment.prescription,
      createdAt: appointment.createdAt,
      doctor: {
        id: appointment.doctor?.id,
        name: appointment.doctor?.name,
        specialty: appointment.doctor?.specialty?.name,
        image: appointment.doctor?.image,
        rating: appointment.doctor?.rating,
        phone: appointment.doctor?.phone,
        email: appointment.doctor?.email,
      },
      hospital: {
        id: appointment.hospital?.id,
        name: appointment.hospital?.name,
        address: appointment.hospital?.address,
        phone: appointment.hospital?.phone,
        image: appointment.hospital?.image,
      },
      session: appointment.session ? {
        id: appointment.session.id,
        dayOfWeek: appointment.session.dayOfWeek,
        startTime: appointment.session.startTime,
        endTime: appointment.session.endTime,
      } : null,
      payment: appointment.payments?.[0] ? {
        id: appointment.payments[0].id,
        amount: appointment.payments[0].amount,
        status: appointment.payments[0].status,
        transactionId: appointment.payments[0].transactionId,
        gateway: appointment.payments[0].gateway,
        paidAt: appointment.payments[0].paidAt,
      } : null,
      medicalRecord: appointment.medicalRecord ? {
        id: appointment.medicalRecord.id,
        diagnosis: appointment.medicalRecord.diagnosis,
        symptoms: appointment.medicalRecord.symptoms,
        treatment: appointment.medicalRecord.treatment,
        prescription: appointment.medicalRecord.prescription,
        followUpDate: appointment.medicalRecord.followUpDate,
      } : null,
    }));

    // Group bookings by status
    const groupedBookings = {
      upcoming: bookings.filter(b => 
        b.status === 'confirmed' && 
        new Date(b.appointmentDate) > new Date()
      ),
      completed: bookings.filter(b => b.status === 'completed'),
      cancelled: bookings.filter(b => b.status === 'cancelled'),
      pending: bookings.filter(b => b.status === 'pending'),
      all: bookings,
    };

    return NextResponse.json({
      success: true,
      bookings: groupedBookings,
      total: bookings.length,
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}