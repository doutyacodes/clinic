import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { payments, paymentReceipts } from '../db/schema';



// Simulate payment gateway integration
export async function processPayment(paymentData) {
  try {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate 95% success rate
    const isSuccessful = Math.random() > 0.05;
    
    if (!isSuccessful) {
      return {
        success: false,
        error: 'Payment failed due to insufficient funds or network error',
      };
    }

    const transactionId = `TXN_${nanoid(10)}`;
    const gatewayTransactionId = `GW_${nanoid(12)}`;

    // Create payment record
    const paymentId = nanoid();
    const now = new Date().toISOString();
    
    // Calculate fees and earnings
    const platformFeePercentage = 5.0; // 5%
    const taxPercentage = 18.0; // 18% GST
    
    const platformFee = (paymentData.amount * platformFeePercentage) / 100;
    const taxAmount = (paymentData.amount * taxPercentage) / 100;
    const doctorEarnings = paymentData.amount - platformFee;
    const hospitalEarnings = platformFee * 0.3; // 30% of platform fee goes to hospital

    await db.insert(payments).values({
      id: paymentId,
      appointmentId: paymentData.appointmentId,
      userId: paymentData.userId,
      doctorId: paymentData.doctorId,
      paymentMethodId: paymentData.paymentMethodId,
      amount: paymentData.amount,
      currency: 'INR',
      status: 'completed',
      transactionId,
      gatewayTransactionId,
      gateway: paymentData.gateway || 'razorpay',
      gatewayResponse: JSON.stringify({
        status: 'success',
        method: 'upi', // Razorpay supports UPI prominently
        mode: 'UPI',
        bank: 'HDFC Bank',
        last4: '1234',
        razorpay_payment_id: `pay_${nanoid(12)}`,
      }),
      paidAt: now,
      platformFee,
      doctorEarnings,
      hospitalEarnings,
      taxAmount,
      createdAt: now,
      updatedAt: now,
    });

    // Generate payment receipt
    await generatePaymentReceipt(paymentId, paymentData);

    return {
      success: true,
      transactionId,
      gatewayTransactionId,
      gatewayResponse: {
        paymentId,
        status: 'success',
        method: 'upi',
        bank: 'HDFC Bank',
        last4: '1234',
      },
    };

  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: 'Payment processing failed due to system error',
    };
  }
}

export async function refundPayment(paymentId, refundAmount, reason) {
  try {
    const now = new Date().toISOString();
    
    // Update payment record with refund information
    await db.update(payments)
      .set({
        status: 'refunded',
        refundedAt: now,
        refundAmount,
        refundReason: reason,
        updatedAt: now,
      })
      .where(eq(payments.id, paymentId));

    return true;
  } catch (error) {
    console.error('Refund processing error:', error);
    return false;
  }
}

async function generatePaymentReceipt(paymentId, paymentData) {
  try {
    const receiptNumber = `RCP-${Date.now()}-${nanoid(6)}`;
    const receiptData = {
      receiptNumber,
      paymentId,
      appointmentId: paymentData.appointmentId,
      amount: paymentData.amount,
      currency: 'INR',
      paymentDate: new Date().toISOString(),
      items: [
        {
          description: 'Doctor Consultation Fee',
          amount: paymentData.amount,
        },
      ],
      taxes: [
        {
          name: 'GST (18%)',
          percentage: 18,
          amount: (paymentData.amount * 18) / 100,
        },
      ],
    };

    await db.insert(paymentReceipts).values({
      id: nanoid(),
      paymentId,
      receiptNumber,
      receiptData: JSON.stringify(receiptData),
      receiptUrl: `/api/receipts/${receiptNumber}`,
      emailSent: false,
      createdAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Receipt generation error:', error);
  }
}

// Utility functions for payment calculations
export function calculatePlatformFee(amount) {
  return (amount * 5.0) / 100; // 5% platform fee
}

export function calculateTax(amount) {
  return (amount * 18.0) / 100; // 18% GST
}

export function calculateDoctorEarnings(amount) {
  return amount - calculatePlatformFee(amount);
}

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}