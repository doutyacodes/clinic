// /app/api/payment/verify/route.js
import { NextResponse } from 'next/server';
import { getRazorpayService } from '@/lib/utils/razorpay';
import { db } from '@/lib/db/index.js';
import { payments, appointments, paymentReceipts, notifications } from '@/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getPDFService } from '@/lib/utils/pdf';
import { getEmailService } from '@/lib/utils/email';

export async function POST(request) {
  try {
    console.log('=== Razorpay Payment Verification Started ===');
    
    let body;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        console.error('Empty request body received');
        return NextResponse.json(
          { error: 'Empty request body' },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (jsonError) {
      console.error('JSON parsing failed:', jsonError.message);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = body;

    console.log('Razorpay Response received:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature ? 'present' : 'missing',
      appointmentId: appointmentId
    });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !appointmentId) {
      console.error('Missing required Razorpay response parameters');
      return NextResponse.json(
        { error: 'Invalid payment response - missing required parameters' },
        { status: 400 }
      );
    }

    // Process payment response
    const razorpayService = getRazorpayService();
    const verificationResult = razorpayService.processPaymentResponse({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    console.log('Verification result:', {
      success: verificationResult.success,
      verified: verificationResult.verified,
      paymentId: verificationResult.paymentId
    });

    // Fetch appointment
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        user: true,
        doctor: true,
        hospital: true,
      },
    });

    if (!appointment) {
      console.error('Appointment not found:', appointmentId);
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    console.log('Appointment found:', {
      id: appointment.id,
      userId: appointment.userId,
      status: appointment.status
    });

    // Get payment details from Razorpay
    const paymentDetails = await razorpayService.getPaymentDetails(razorpay_payment_id);
    
    console.log('Payment details fetched:', {
      id: paymentDetails.id,
      amount: paymentDetails.amount,
      status: paymentDetails.status,
      method: paymentDetails.method
    });
    
    const amount = paymentDetails.amount / 100; // Convert from paise to rupees
    
    const platformFeePercentage = 5.0;
    const taxPercentage = 18.0;
    
    const platformFee = (amount * platformFeePercentage) / 100;
    const taxAmount = (amount * taxPercentage) / 100;
    const doctorEarnings = amount - platformFee;
    const hospitalEarnings = platformFee * 0.3;

    // Create payment record
    const paymentId = nanoid();
    const now = new Date();
    const paymentStatus = verificationResult.success ? 'completed' : 'failed';

    try {
      const paymentRecord = {
        id: paymentId,
        appointmentId: appointment.id,
        userId: appointment.userId,
        doctorId: appointment.doctorId,
        amount: amount,
        currency: 'INR',
        status: paymentStatus,
        transactionId: razorpay_order_id,
        gatewayTransactionId: razorpay_payment_id,
        gateway: 'razorpay',
        gatewayResponse: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentDetails }),
        paidAt: verificationResult.success ? now : null,
        failedAt: verificationResult.success ? null : now,
        failureReason: verificationResult.success ? null : 
          (verificationResult.errorDescription || verificationResult.errorCode || 'Payment failed'),
        platformFee: verificationResult.success ? platformFee : 0,
        doctorEarnings: verificationResult.success ? doctorEarnings : 0,
        hospitalEarnings: verificationResult.success ? hospitalEarnings : 0,
        taxAmount: verificationResult.success ? taxAmount : 0,
        createdAt: now,
        updatedAt: now,
      };

      console.log('About to insert payment record:', {
        paymentId,
        status: paymentStatus,
        amount: amount,
        now: now,
        nowType: typeof now
      });

      await db.insert(payments).values(paymentRecord);

      console.log('Payment record created successfully:', {
        paymentId,
        status: paymentStatus,
        amount: amount
      });

      // Update appointment status if payment successful
      if (verificationResult.success) {
        await db.update(appointments)
          .set({
            status: 'confirmed',
            updatedAt: now,
          })
          .where(eq(appointments.id, appointmentId));

        console.log('Appointment status updated to confirmed');

        // Generate receipt number
        const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Generate PDF receipt
        try {
          const pdfService = getPDFService();
          const receiptPdfBuffer = await pdfService.generateReceipt({
            payment: paymentRecord,
            appointment: appointment,
            user: appointment.user,
            doctor: appointment.doctor,
            hospital: appointment.hospital,
            receiptNumber,
          });

          console.log('PDF receipt generated successfully');

          // Store receipt in database
          const receiptId = nanoid();
          await db.insert(paymentReceipts).values({
            id: receiptId,
            paymentId: paymentId,
            receiptNumber,
            receiptData: JSON.stringify({
              receiptNumber,
              paymentId,
              appointmentId: appointment.id,
              generatedAt: now.toISOString(),
            }),
            emailSent: false,
            createdAt: now,
          });

          console.log('Receipt record saved to database');

          // Send receipt email
          try {
            const emailService = getEmailService();
            await emailService.sendPaymentReceipt({
              user: appointment.user,
              payment: paymentRecord,
              appointment: appointment,
              doctor: appointment.doctor,
              hospital: appointment.hospital,
              receiptPdfBuffer,
            });

            // Update receipt as emailed
            await db.update(paymentReceipts)
              .set({ emailSent: true })
              .where(eq(paymentReceipts.id, receiptId));

            console.log('Receipt email sent successfully');
          } catch (emailError) {
            console.error('Failed to send receipt email:', emailError);
          }

          // Send appointment confirmation email
          try {
            const emailService = getEmailService();
            await emailService.sendAppointmentConfirmation({
              user: appointment.user,
              appointment: appointment,
              doctor: appointment.doctor,
              hospital: appointment.hospital,
            });

            console.log('Appointment confirmation email sent');
          } catch (emailError) {
            console.error('Failed to send appointment confirmation:', emailError);
          }

          // Create notification
          try {
            const notificationId = nanoid();
            await db.insert(notifications).values({
              id: notificationId,
              userId: appointment.userId,
              type: 'payment_success',
              title: 'Payment Successful',
              message: `Your payment of ₹${amount} has been received. Appointment confirmed for ${appointment.appointmentDate} with Dr. ${appointment.doctor.name}.`,
              data: JSON.stringify({
                paymentId,
                appointmentId: appointment.id,
                amount,
                receiptNumber,
              }),
              isRead: false,
              sentAt: now,
              createdAt: now,
            });

            console.log('Notification created for payment success');
          } catch (notifError) {
            console.error('Failed to create notification:', notifError);
          }

        } catch (pdfError) {
          console.error('Failed to generate receipt:', pdfError);
        }
      }

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      console.error('Error details:', {
        message: dbError.message,
        stack: dbError.stack,
        code: dbError.code
      });
      return NextResponse.json(
        { error: 'Failed to save payment record' },
        { status: 500 }
      );
    }

    // Return verification result
    return NextResponse.json({
      success: verificationResult.success,
      verified: verificationResult.verified,
      paymentId,
      transactionId: razorpay_order_id,
      amount: amount,
      status: paymentStatus,
      appointmentId: appointmentId,
      razorpayPaymentId: razorpay_payment_id,
      paymentMethod: paymentDetails.method,
      errorMessage: verificationResult.errorDescription,
    });

  } catch (error) {
    console.error('=== Razorpay Payment Verification Error ===');
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Payment verification failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}