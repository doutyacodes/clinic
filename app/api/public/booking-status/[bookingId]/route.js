import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { appointments } from '@/lib/db/schema.js';
import { eq, and, gte } from 'drizzle-orm';

export async function GET(request, { params }) {
  try {
    const { bookingId } = params;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Get booking details with related data (public access - no authentication required)
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
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get current queue status if appointment is today and confirmed
    let queueStatus = null;
    const appointmentDate = new Date(booking.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    appointmentDate.setHours(0, 0, 0, 0);
    
    const isToday = appointmentDate.getTime() === today.getTime();
    
    if (isToday && booking.status === 'confirmed') {
      // Get all appointments for this session today to calculate current position
      const todaysAppointments = await db.select({
        tokenNumber: appointments.tokenNumber,
        status: appointments.status,
        actualStartTime: appointments.actualStartTime,
        actualEndTime: appointments.actualEndTime,
      }).from(appointments)
        .where(and(
          eq(appointments.sessionId, booking.sessionId),
          eq(appointments.appointmentDate, booking.appointmentDate),
        ))
        .orderBy(appointments.tokenNumber);

      // Filter active appointments (not cancelled)
      const activeAppointments = todaysAppointments.filter(apt => apt.status !== 'cancelled');
      
      // Calculate current token being served
      const completedAppointments = activeAppointments.filter(apt => 
        apt.status === 'completed' || apt.actualEndTime
      );
      
      const currentlyServing = activeAppointments.find(apt => 
        apt.actualStartTime && !apt.actualEndTime && apt.status !== 'completed'
      );

      // Calculate queue position
      const currentToken = currentlyServing?.tokenNumber || 
                          (completedAppointments.length > 0 ? 
                           Math.max(...completedAppointments.map(apt => apt.tokenNumber)) + 1 : 1);
      
      const tokensAhead = Math.max(0, booking.tokenNumber - currentToken);
      
      // Estimate waiting time based on average consultation time
      const avgConsultationTime = booking.session?.avgMinutesPerPatient || 15;
      const estimatedWaitingMinutes = tokensAhead * avgConsultationTime;
      
      // Calculate updated estimated time
      const now = new Date();
      const updatedEstimatedTime = new Date(now.getTime() + estimatedWaitingMinutes * 60000);
      
      queueStatus = {
        currentToken,
        tokensAhead,
        estimatedWaitingMinutes,
        updatedEstimatedTime: updatedEstimatedTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        totalTokensToday: activeAppointments.length,
        completedToday: completedAppointments.length,
        currentlyServing: currentlyServing?.tokenNumber || null,
        queuePosition: booking.tokenNumber <= currentToken ? 'current' : 'waiting',
        lastUpdated: new Date().toISOString(),
      };
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
      createdAt: booking.createdAt,
      isToday,
      queueStatus,
      doctor: booking.doctor ? {
        id: booking.doctor.id,
        name: booking.doctor.name,
        specialty: booking.doctor.specialty?.name,
        image: booking.doctor.image,
        rating: booking.doctor.rating,
        qualification: booking.doctor.qualification,
        experience: booking.doctor.experience,
        // Hide personal contact information for public access
      } : null,
      hospital: booking.hospital ? {
        id: booking.hospital.id,
        name: booking.hospital.name,
        address: booking.hospital.address,
        phone: booking.hospital.phone,
        image: booking.hospital.image,
        city: booking.hospital.city,
        state: booking.hospital.state,
      } : null,
      session: booking.session ? {
        id: booking.session.id,
        dayOfWeek: booking.session.dayOfWeek,
        startTime: booking.session.startTime,
        endTime: booking.session.endTime,
        maxTokens: booking.session.maxTokens,
        avgMinutesPerPatient: booking.session.avgMinutesPerPatient,
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
    };

    return NextResponse.json({
      success: true,
      booking: publicBookingData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Get public booking status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking status' },
      { status: 500 }
    );
  }
}