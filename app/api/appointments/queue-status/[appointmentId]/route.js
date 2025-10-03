// app/api/appointments/queue-status/[appointmentId]/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { appointments } from '@/lib/db/schema.js';
import { eq, and, lt } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt.js';
import { AUTH_CONFIG } from '@/lib/auth/config.js';

export async function GET(request, { params }) {
  try {
    const { appointmentId } = params;

    // Get token from cookie (optional - can be public for booking status)
    const cookie = request.headers.get('cookie') || '';
    const tokenMatch = cookie.match(new RegExp(`${AUTH_CONFIG.COOKIE_NAME}=([^;]+)`));
    const token = tokenMatch ? tokenMatch[1] : null;

    let user = null;
    if (token) {
      try {
        user = await verifyToken(token);
      } catch (error) {
        // Continue without authentication
      }
    }

    // Get the appointment
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        doctor: {
          columns: {
            name: true,
          },
        },
        hospital: {
          columns: {
            name: true,
          },
        },
        session: {
          columns: {
            avgMinutesPerPatient: true,
            startTime: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Verify ownership if user is authenticated
    if (user && appointment.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all appointments for the same session and date
    const allSessionAppointments = await db.select()
      .from(appointments)
      .where(
        and(
          eq(appointments.sessionId, appointment.sessionId),
          eq(appointments.appointmentDate, appointment.appointmentDate)
        )
      );

    // Filter active appointments (not cancelled)
    const activeAppointments = allSessionAppointments.filter(a =>
      a.status !== 'cancelled'
    );

    // Sort by token number
    activeAppointments.sort((a, b) => a.tokenNumber - b.tokenNumber);

    // Find position in queue
    const currentIndex = activeAppointments.findIndex(a => a.id === appointmentId);
    const queuePosition = currentIndex + 1;

    // Count how many are ahead
    const tokensAhead = activeAppointments.filter(a =>
      a.tokenNumber < appointment.tokenNumber &&
      (a.status === 'confirmed' || a.status === 'in-progress')
    ).length;

    // Count completed today
    const completedToday = allSessionAppointments.filter(a =>
      a.status === 'completed'
    ).length;

    // Current token being served (lowest token number that's in-progress)
    const currentToken = activeAppointments.find(a => a.status === 'in-progress');
    const currentTokenNumber = currentToken ? currentToken.tokenNumber :
      (completedToday > 0 ? completedToday : 0);

    // Estimate wait time
    const avgMinutes = appointment.session?.avgMinutesPerPatient || 15;
    const estimatedWaitMinutes = tokensAhead * avgMinutes;
    const estimatedWaitTime = estimatedWaitMinutes > 0 ?
      `${Math.floor(estimatedWaitMinutes / 60)}h ${estimatedWaitMinutes % 60}m` :
      'Your turn soon';

    // Calculate progress percentage
    const totalTokens = activeAppointments.length;
    const progress = totalTokens > 0 ? Math.round(((totalTokens - tokensAhead) / totalTokens) * 100) : 0;

    return NextResponse.json({
      success: true,
      queueStatus: {
        appointmentId: appointment.id,
        tokenNumber: appointment.tokenNumber,
        currentTokenNumber,
        queuePosition,
        tokensAhead,
        totalInQueue: activeAppointments.length,
        completedToday,
        status: appointment.status,
        estimatedWaitTime,
        estimatedWaitMinutes,
        progress,
        appointmentDate: appointment.appointmentDate,
        estimatedTime: appointment.estimatedTime,
        doctor: appointment.doctor?.name,
        hospital: appointment.hospital?.name,
        sessionStartTime: appointment.session?.startTime,
      },
    });

  } catch (error) {
    console.error('Get queue status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue status' },
      { status: 500 }
    );
  }
}
