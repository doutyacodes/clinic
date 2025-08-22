import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index.js';
import { appointments, doctors, hospitals, doctorSessions, payments } from '@/lib/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt.js';
import { AUTH_CONFIG } from '@/lib/auth/config.js';
import { nanoid } from 'nanoid';

export async function POST(request) {
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

    const body = await request.json();
    const {
      doctorId,
      sessionId,
      hospitalId,
      appointmentDate,
      tokenNumber,
      estimatedTime,
      bookingType,
      patientComplaints,
      emergencyContact,
      emergencyPhone
    } = body;

    console.log('Booking request received:', {
      doctorId,
      sessionId,
      hospitalId,
      appointmentDate,
      tokenNumber,
      estimatedTime,
      bookingType
    });

    // Validate required fields
    if (!doctorId || !sessionId || !hospitalId || !appointmentDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        { error: 'Cannot book appointments for past dates' },
        { status: 400 }
      );
    }


    // Validate token number
    if (!tokenNumber || tokenNumber <= 0) {
      return NextResponse.json(
        { error: 'Valid token number is required' },
        { status: 400 }
      );
    }

    // Verify doctor exists and is available
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, doctorId),
    });

    if (!doctor || !doctor.isAvailable) {
      return NextResponse.json(
        { error: 'Doctor not found or not available' },
        { status: 404 }
      );
    }

    // Verify session exists and is active
    const session = await db.query.doctorSessions.findFirst({
      where: and(
        eq(doctorSessions.id, sessionId),
        eq(doctorSessions.doctorId, doctorId),
        eq(doctorSessions.hospitalId, hospitalId),
        eq(doctorSessions.isActive, true)
      ),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or not active' },
        { status: 404 }
      );
    }

    // Validate that the selected date matches the doctor's available day
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    if (session.dayOfWeek !== dayOfWeek) {
      return NextResponse.json(
        { error: `Doctor is not available on ${dayOfWeek}. Available on ${session.dayOfWeek}s from ${session.startTime} to ${session.endTime}` },
        { status: 400 }
      );
    }

    // Validate token number against session limits
    if (tokenNumber > session.maxTokens) {
      // Allow booking but warn about overflow
      console.warn(`Token ${tokenNumber} exceeds max tokens ${session.maxTokens} for session ${sessionId}`);
    }

    // Check if user already has an appointment with this doctor on the same date
    const existingAppointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.userId, user.userId),
        eq(appointments.doctorId, doctorId),
        eq(appointments.appointmentDate, appointmentDate),
        // Only check for active appointments (not cancelled)
      ),
    });

    if (existingAppointment && existingAppointment.status !== 'cancelled') {
      return NextResponse.json(
        { error: 'You already have an appointment with this doctor on this date' },
        { status: 400 }
      );
    }

    // Check existing bookings for this session and date
    const existingBookings = await db.select({
      tokenNumber: appointments.tokenNumber,
      estimatedTime: appointments.estimatedTime,
      status: appointments.status,
    }).from(appointments)
      .where(and(
        eq(appointments.sessionId, sessionId),
        eq(appointments.appointmentDate, appointmentDate),
      ));

    // Filter active (non-cancelled) appointments
    const activeBookings = existingBookings.filter(booking => booking.status !== 'cancelled');
    const bookedTokens = activeBookings.map(booking => booking.tokenNumber);

    // Check if the specific token is already taken
    if (bookedTokens.includes(parseInt(tokenNumber))) {
      return NextResponse.json(
        { error: `Token number ${tokenNumber} is already booked for this date. Available tokens: ${getAvailableTokensMessage(bookedTokens, session.maxTokens)}` },
        { status: 400 }
      );
    }

    // Additional validation: check if we're exceeding max tokens
    if (activeBookings.length >= session.maxTokens) {
      return NextResponse.json(
        { error: `All ${session.maxTokens} tokens are booked for this date. Please choose a different date.` },
        { status: 400 }
      );
    }

    // Calculate estimated time if not provided
    let finalEstimatedTime = estimatedTime;
    if (!finalEstimatedTime) {
      const sessionStartMinutes = convertTimeToMinutes(session.startTime);
      const estimatedMinutes = sessionStartMinutes + ((tokenNumber - 1) * session.avgMinutesPerPatient);
      finalEstimatedTime = convertMinutesToTime(estimatedMinutes);
    }

    // Create appointment
    const appointmentId = nanoid();
    const newAppointment = {
      id: appointmentId,
      userId: user.userId,
      doctorId,
      hospitalId,
      sessionId,
      appointmentDate,
      tokenNumber: parseInt(tokenNumber),
      estimatedTime: finalEstimatedTime,
      status: 'pending', // Will be confirmed after payment
      bookingType: bookingType || 'online',
      patientComplaints: patientComplaints || null,
      consultationFee: doctor.consultationFee,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(appointments).values(newAppointment);

    // Create payment record
    const paymentId = nanoid();
    const transactionId = `TXN_${appointmentId}_${Date.now()}`;
    
    const newPayment = {
      id: paymentId,
      appointmentId,
      userId: user.userId,
      doctorId,
      amount: doctor.consultationFee,
      currency: 'INR',
      status: 'pending',
      transactionId,
      gateway: 'payu',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(payments).values(newPayment);

    // Update user emergency contact if provided
    if (emergencyContact && emergencyPhone) {
      // You might want to update user's emergency contact in the users table
      // or create a separate emergency contact record
    }

    // Get hospital name for payment URL
    const hospital = await db.query.hospitals.findFirst({
      where: eq(hospitals.id, hospitalId),
    });

    // Generate payment URL using PayU integration
    const paymentUrl = await generatePaymentUrl({
      appointmentId,
      paymentId,
      transactionId,
      amount: doctor.consultationFee,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      productInfo: `Consultation - ${doctor.name} at ${hospital?.name || 'Hospital'}`,
    });

    console.log('Appointment created successfully:', {
      appointmentId,
      tokenNumber: parseInt(tokenNumber),
      estimatedTime: finalEstimatedTime,
      paymentUrl
    });

    return NextResponse.json({
      success: true,
      booking: newAppointment,
      paymentRequired: true,
      paymentUrl,
      message: 'Appointment booked successfully. Please complete payment to confirm.',
    });

  } catch (error) {
    console.error('Book appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to book appointment' },
      { status: 500 }
    );
  }
}

// Helper functions
function convertTimeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function convertMinutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Helper function to generate available tokens message
function getAvailableTokensMessage(bookedTokens, maxTokens) {
  const availableTokens = [];
  for (let i = 1; i <= maxTokens; i++) {
    if (!bookedTokens.includes(i)) {
      availableTokens.push(i);
    }
  }
  
  if (availableTokens.length === 0) {
    return 'None available';
  } else if (availableTokens.length <= 5) {
    return availableTokens.join(', ');
  } else {
    return `${availableTokens.slice(0, 3).join(', ')}, ... (${availableTokens.length} total)`;
  }
}

async function generatePaymentUrl({ appointmentId, paymentId, transactionId, amount, userEmail, userName, productInfo }) {
  // Extract doctor and hospital names from productInfo more safely
  const parts = productInfo.split(' - ');
  let doctorName = 'Doctor';
  let hospitalName = 'Hospital';
  
  if (parts.length > 1) {
    const consultationInfo = parts[1]; // "Dr. Name at Hospital Name"
    const atIndex = consultationInfo.indexOf(' at ');
    if (atIndex > -1) {
      doctorName = consultationInfo.substring(0, atIndex);
      hospitalName = consultationInfo.substring(atIndex + 4);
    } else {
      doctorName = consultationInfo;
    }
  }

  // Generate URL for our payment initiate page with query parameters
  const params = new URLSearchParams({
    appointmentId,
    amount: amount.toString(),
    doctorName,
    hospitalName
  });

  return `/payment/initiate?${params.toString()}`;
}