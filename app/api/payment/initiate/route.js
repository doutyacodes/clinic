// /app/api/payment/initiate/route.js
import { NextResponse } from 'next/server';
import { getRazorpayService, createAppointmentPaymentOrder, validateRazorpayConfig } from '@/lib/utils/razorpay';
import { db } from '@/lib/db/index.js';
import { appointments } from '@/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/jwt.js';
import { AUTH_CONFIG } from '@/lib/auth/config.js';

export async function POST(request) {
  try {
    console.log('=== Razorpay Payment Initiation Started ===');
    
    // Validate Razorpay configuration
    validateRazorpayConfig();
    
    // Extract and verify authentication
    const cookie = request.headers.get('cookie') || '';
    const tokenMatch = cookie.match(new RegExp(`${AUTH_CONFIG.COOKIE_NAME}=([^;]+)`));
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await verifyToken(token);
    console.log('User authenticated:', user.email);

    // Parse request body
    const body = await request.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    // Fetch appointment with related data
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        user: true,
        doctor: true,
        hospital: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Verify authorization
    if (appointment.userId !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Validate appointment data
    if (!appointment.consultationFee || appointment.consultationFee <= 0) {
      return NextResponse.json({ error: 'Invalid consultation fee' }, { status: 400 });
    }

    console.log('Appointment validated:', {
      id: appointment.id,
      doctor: appointment.doctor?.name,
      hospital: appointment.hospital?.name,
      fee: appointment.consultationFee
    });

    // Create Razorpay order
    const order = await createAppointmentPaymentOrder(
      {
        id: appointment.id,
        amount: appointment.consultationFee,
        doctorName: appointment.doctor.name,
        hospitalName: appointment.hospital.name,
      },
      {
        firstName: appointment.user.firstName,
        lastName: appointment.user.lastName,
        email: appointment.user.email,
        phone: appointment.user.phone,
        address: appointment.user.address,
        city: appointment.user.city,
        state: appointment.user.state,
        zipCode: appointment.user.zipCode,
      }
    );

    console.log('Razorpay order created:', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });

    return NextResponse.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      order: order,
      amount: appointment.consultationFee,
      prefill: {
        name: `${appointment.user.firstName} ${appointment.user.lastName || ''}`.trim(),
        email: appointment.user.email,
        contact: appointment.user.phone
      },
      appointmentDetails: {
        doctorName: appointment.doctor.name,
        hospitalName: appointment.hospital.name,
        appointmentDate: appointment.appointmentDate,
        tokenNumber: appointment.tokenNumber,
      },
    });

  } catch (error) {
    console.error('=== Razorpay Payment Initiation Error ===');
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Payment initiation failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}