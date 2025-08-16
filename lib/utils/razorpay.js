// lib/utils/razorpay.js - Razorpay Implementation

import Razorpay from 'razorpay';
import { createHmac } from 'crypto';
import { nanoid } from 'nanoid';

export class RazorpayService {
  constructor(config) {
    this.config = config;
    this.validateConfig();
    this.razorpay = new Razorpay({
      key_id: this.config.keyId,
      key_secret: this.config.keySecret,
    });
  }

  validateConfig() {
    const required = ['keyId', 'keySecret'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing Razorpay configuration: ${missing.join(', ')}`);
    }
    
    console.log('Razorpay Service initialized:', {
      keyId: this.config.keyId.substring(0, 8) + '...',
    });
  }

  /**
   * Create Razorpay order
   */
  async createOrder(params) {
    try {
      const orderOptions = {
        amount: Math.round(parseFloat(params.amount) * 100), // Convert to paise
        currency: params.currency || 'INR',
        receipt: params.receipt || this.generateReceiptId(),
        notes: params.notes || {},
      };

      console.log('Creating Razorpay order:', orderOptions);
      
      const order = await this.razorpay.orders.create(orderOptions);
      
      console.log('Razorpay order created:', {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      });

      return order;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw new Error(`Failed to create payment order: ${error.message}`);
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(params) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.warn('Missing required parameters for signature verification');
      return false;
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = createHmac('sha256', this.config.keySecret)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;
    
    console.log('Payment signature verification:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      isValid: isValid
    });

    return isValid;
  }

  /**
   * Generate receipt ID
   */
  generateReceiptId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `receipt_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Generate transaction ID
   */
  generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `TXN_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Fetch payment details
   */
  async getPaymentDetails(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      
      console.log('Payment details fetched:', {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        method: payment.method
      });

      return payment;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw new Error(`Failed to fetch payment details: ${error.message}`);
    }
  }

  /**
   * Process payment response
   */
  processPaymentResponse(response) {
    const isVerified = this.verifyPaymentSignature(response);
    
    return {
      success: response.razorpay_payment_id && isVerified,
      verified: isVerified,
      paymentId: response.razorpay_payment_id,
      orderId: response.razorpay_order_id,
      signature: response.razorpay_signature,
      errorCode: response.error?.code || null,
      errorDescription: response.error?.description || null,
      errorSource: response.error?.source || null,
      errorStep: response.error?.step || null,
      errorReason: response.error?.reason || null
    };
  }

  /**
   * Create payment options for frontend
   */
  createPaymentOptions(order, user, callbacks) {
    return {
      key: this.config.keyId,
      amount: order.amount,
      currency: order.currency,
      name: process.env.NEXT_PUBLIC_APP_NAME || 'HealthCares',
      description: order.notes?.description || 'Payment for medical consultation',
      order_id: order.id,
      handler: callbacks.onSuccess,
      prefill: {
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        email: user.email,
        contact: user.phone
      },
      notes: order.notes,
      theme: {
        color: '#3399cc'
      },
      modal: {
        ondismiss: callbacks.onDismiss || function() {
          console.log('Payment modal dismissed');
        }
      }
    };
  }
}

/**
 * Get Razorpay service instance
 */
export function getRazorpayService() {
  const config = {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  };

  return new RazorpayService(config);
}

/**
 * Create payment request for appointment
 */
export async function createAppointmentPaymentOrder(appointment, user) {
  const razorpayService = getRazorpayService();
  
  const orderParams = {
    amount: appointment.amount,
    currency: 'INR',
    receipt: razorpayService.generateReceiptId(),
    notes: {
      appointmentId: appointment.id,
      doctorName: appointment.doctorName,
      hospitalName: appointment.hospitalName,
      patientEmail: user.email,
      patientPhone: user.phone,
      description: `Medical Consultation - ${appointment.doctorName}`
    }
  };

  return await razorpayService.createOrder(orderParams);
}

/**
 * Validate Razorpay environment variables
 */
export function validateRazorpayConfig() {
  const required = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
  const missing = required.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing Razorpay environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}