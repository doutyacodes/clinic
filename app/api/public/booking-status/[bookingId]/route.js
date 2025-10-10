import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { appointments, tokenCallHistory, queuePositions } from '@/lib/db/schema.js';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

export async function GET(request, { params }) {
  try {
    const { bookingId } = await params;

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
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
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
        id: appointments.id,
        tokenNumber: appointments.tokenNumber,
        status: appointments.status,
        actualStartTime: appointments.actualStartTime,
        actualEndTime: appointments.actualEndTime,
        isRecalled: appointments.isRecalled,
        recallCount: appointments.recallCount,
        missedAppointment: appointments.missedAppointment,
      }).from(appointments)
        .where(and(
          eq(appointments.sessionId, booking.sessionId),
          eq(appointments.appointmentDate, booking.appointmentDate),
        ))
        .orderBy(appointments.tokenNumber);

      // Filter active appointments (not cancelled)
      const activeAppointments = todaysAppointments.filter(apt => apt.status !== 'cancelled');

      // Calculate COMPLETED appointments (actually finished consultations)
      const completedAppointments = activeAppointments.filter(apt =>
        apt.status === 'completed'
      );

      // Calculate NO-SHOW appointments (missed/skipped)
      const noShowAppointments = activeAppointments.filter(apt =>
        apt.status === 'no_show' || apt.missedAppointment
      );

      // Calculate PROCESSED appointments (completed + no-shows = all that were called and handled)
      const processedAppointments = activeAppointments.filter(apt =>
        apt.status === 'completed' || apt.status === 'no_show'
      );

      const currentlyServing = activeAppointments.find(apt =>
        apt.actualStartTime && !apt.actualEndTime && apt.status !== 'completed'
      );

      // Calculate current token (use session's currentToken which is set by doctor's call system)
      // IMPORTANT: This is the EXACT token being called, not the next one
      let currentToken = booking.session?.currentToken || 0;

      if (!currentToken) {
        // Fallback calculation if session.currentToken is not set
        currentToken = currentlyServing?.tokenNumber ||
                      (processedAppointments.length > 0 ?
                       Math.max(...processedAppointments.map(apt => apt.tokenNumber)) : 0);
      }

      // Check if current token is a recall by querying tokenCallHistory
      let isCurrentTokenRecalled = false;
      let currentTokenCallInfo = null;

      try {
        const callHistory = await db.query.tokenCallHistory.findFirst({
          where: and(
            eq(tokenCallHistory.sessionId, booking.sessionId),
            eq(tokenCallHistory.appointmentDate, booking.appointmentDate),
            eq(tokenCallHistory.tokenNumber, currentToken),
            eq(tokenCallHistory.isRecall, true)
          ),
          orderBy: [desc(tokenCallHistory.calledAt)],
        });

        if (callHistory) {
          isCurrentTokenRecalled = true;
          currentTokenCallInfo = callHistory;
        }
      } catch (historyError) {
        console.warn('Token call history query failed:', historyError.message);
        // Fallback: check if current token appointment is recalled
        const currentAppointment = activeAppointments.find(apt => apt.tokenNumber === currentToken);
        if (currentAppointment?.isRecalled) {
          isCurrentTokenRecalled = true;
        }
      }

      // Count total tokens called (including recalls) from tokenCallHistory
      let totalTokensCalled = processedAppointments.length; // Fallback: completed + no-shows
      try {
        const callHistoryCount = await db.select({
          count: sql`COUNT(*)`,
        }).from(tokenCallHistory)
          .where(and(
            eq(tokenCallHistory.sessionId, booking.sessionId),
            eq(tokenCallHistory.appointmentDate, booking.appointmentDate)
          ));

        if (callHistoryCount && callHistoryCount[0]) {
          totalTokensCalled = Number(callHistoryCount[0].count);
        }
      } catch (historyError) {
        console.warn('Token call count query failed:', historyError.message);
        // Fallback already set above
      }

      // Count total UNIQUE tokens called (in case a token was recalled multiple times)
      let uniqueTokensCalled = processedAppointments.length;
      try {
        const uniqueCallHistory = await db.select({
          count: sql`COUNT(DISTINCT ${tokenCallHistory.tokenNumber})`,
        }).from(tokenCallHistory)
          .where(and(
            eq(tokenCallHistory.sessionId, booking.sessionId),
            eq(tokenCallHistory.appointmentDate, booking.appointmentDate)
          ));

        if (uniqueCallHistory && uniqueCallHistory[0]) {
          uniqueTokensCalled = Number(uniqueCallHistory[0].count);
        }
      } catch (historyError) {
        console.warn('Unique token call count query failed:', historyError.message);
      }

      // Get average wait time from queuePositions table
      let averageWaitTimeMinutes = booking.session?.avgMinutesPerPatient || 15;
      try {
        const queuePosition = await db.query.queuePositions.findFirst({
          where: and(
            eq(queuePositions.sessionId, booking.sessionId),
            eq(queuePositions.appointmentDate, booking.appointmentDate)
          ),
        });

        if (queuePosition?.averageWaitTimeMinutes) {
          averageWaitTimeMinutes = queuePosition.averageWaitTimeMinutes;
        }
      } catch (queueError) {
        console.warn('Queue positions query failed:', queueError.message);
      }

      const tokensAhead = Math.max(0, booking.tokenNumber - currentToken);

      // Estimate waiting time based on average consultation time
      const estimatedWaitingMinutes = tokensAhead * averageWaitTimeMinutes;

      // Calculate updated estimated time
      const now = new Date();
      const updatedEstimatedTime = new Date(now.getTime() + estimatedWaitingMinutes * 60000);

      queueStatus = {
        currentToken,
        tokensAhead,
        estimatedWaitingMinutes,
        averageWaitTimeMinutes,
        updatedEstimatedTime: updatedEstimatedTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        totalTokensToday: activeAppointments.length,
        completedToday: completedAppointments.length, // Only successfully completed consultations
        noShowToday: noShowAppointments.length, // Missed appointments
        processedToday: processedAppointments.length, // Completed + No-shows (total handled)
        totalTokensCalled, // Total calls including recalls (e.g., 12 if token #3 was called 3 times)
        uniqueTokensCalled, // Unique tokens called (e.g., 10 if 10 different tokens were called)
        currentlyServing: currentlyServing?.tokenNumber || null,
        queuePosition: booking.tokenNumber <= currentToken ? 'current' : 'waiting',
        isCurrentTokenRecalled,
        currentTokenRecallInfo: currentTokenCallInfo ? {
          recallReason: currentTokenCallInfo.recallReason,
          calledAt: currentTokenCallInfo.calledAt,
        } : null,
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
      patientName: booking.user ? `${booking.user.firstName} ${booking.user.lastName}`.trim() : null,
      createdAt: booking.createdAt,
      sessionId: booking.sessionId,
      isToday,
      queueStatus,
      // Add token recall data
      isRecalled: booking.isRecalled || false,
      recallCount: booking.recallCount || 0,
      lastRecalledAt: booking.lastRecalledAt,
      tokenStatus: booking.tokenStatus,
      tokenLockExpiresAt: booking.tokenLockExpiresAt,
      missedAppointment: booking.missedAppointment || false,
      user: booking.user ? {
        firstName: booking.user.firstName,
        lastName: booking.user.lastName,
      } : null,
      doctor: booking.doctor ? {
        id: booking.doctor.id,
        name: booking.doctor.name,
        specialty: booking.doctor.specialty?.name,
        image: booking.doctor.image,
        rating: booking.doctor.rating,
        qualification: booking.doctor.qualification,
        experience: booking.doctor.experience,
        status: booking.doctor.status || 'offline', // Include doctor status
        breakType: booking.doctor.breakType,
        breakEndTime: booking.doctor.breakEndTime,
        breakStartTime: booking.doctor.breakStartTime,
        breakReason: booking.doctor.breakReason,
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
        // Add room location details
        roomNumber: booking.session.roomNumber,
        floor: booking.session.floor,
        buildingLocation: booking.session.buildingLocation,
        // Add recall settings
        recallCheckInterval: booking.session.recallCheckInterval || 5,
        recallEnabled: booking.session.recallEnabled !== false,
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