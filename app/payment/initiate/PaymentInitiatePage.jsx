'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Loader, 
  AlertCircle, 
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export default function PaymentInitiatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Get data from URL params or state
  const appointmentId = searchParams.get('appointmentId');
  const amount = searchParams.get('amount');
  const doctorName = searchParams.get('doctorName');
  const hospitalName = searchParams.get('hospitalName');

  useEffect(() => {
    // Only redirect to login if auth is fully loaded and user is not authenticated
    if (!authLoading && !isAuthenticated) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // Only proceed if user is authenticated
    if (!authLoading && isAuthenticated) {
      if (!appointmentId) {
        setError('Missing appointment information');
        setIsLoading(false);
        return;
      }

      // If we have URL params, use them
      if (appointmentId && amount && doctorName && hospitalName) {
        setPaymentData({
          appointmentId,
          amount: parseFloat(amount),
          doctorName,
          hospitalName
        });
        setIsLoading(false);
      } else {
        // Otherwise, fetch appointment details
        fetchAppointmentDetails();
      }
    }
  }, [authLoading, isAuthenticated, appointmentId, amount, doctorName, hospitalName, router]);

  const fetchAppointmentDetails = async () => {
    try {
      const response = await fetch(`/api/booking-status/${appointmentId}`);
      const data = await response.json();

      if (response.ok && data.booking) {
        setPaymentData({
          appointmentId: data.booking.id,
          amount: parseFloat(data.booking.consultationFee),
          doctorName: data.booking.doctor?.name,
          hospitalName: data.booking.hospital?.name,
          appointmentDate: data.booking.appointmentDate,
          tokenNumber: data.booking.tokenNumber
        });
      } else {
        setError(data.error || 'Failed to load appointment details');
      }
    } catch (err) {
      console.error('Error fetching appointment:', err);
      setError('Failed to load appointment details');
    } finally {
      setIsLoading(false);
    }
  };

  const initiatePayment = async () => {
    if (!paymentData) return;

    try {
      setIsProcessing(true);
      setError(null);

      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: paymentData.appointmentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      // Configure Razorpay options
      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'HealthCares',
        description: 'Medical Consultation Payment',
        order_id: data.order.id,
        handler: function (response) {
          // Payment successful - verify on server
          handlePaymentSuccess(response);
        },
        prefill: data.prefill,
        notes: data.order.notes,
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            console.log('Payment modal dismissed');
          }
        }
      };

      // Load Razorpay script and open checkout
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const razorpay = new window.Razorpay(options);
          razorpay.open();
        };
        document.head.appendChild(script);
      } else {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }

    } catch (err) {
      console.error('Payment initiation error:', err);
      setError(err.message);
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      // Verify payment on server
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          appointmentId: paymentData.appointmentId,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        // Redirect to success page
        router.push(`/payment/success?appointmentId=${paymentData.appointmentId}&paymentId=${verifyData.paymentId}`);
      } else {
        throw new Error(verifyData.error || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setError(err.message);
      router.push(`/payment/failure?error=${encodeURIComponent(err.message)}&appointmentId=${paymentData.appointmentId}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (appointmentId) {
      router.push(`/booking-status/${appointmentId}`);
    } else {
      router.push('/bookings');
    }
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center p-4">
        <motion.div
          className="bg-white rounded-3xl p-8 shadow-2xl text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Checking Authentication</h2>
          <p className="text-slate-600">Please wait...</p>
        </motion.div>
      </div>
    );
  }

  // Show loading while fetching payment data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center p-4">
        <motion.div
          className="bg-white rounded-3xl p-8 shadow-2xl text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Loading Payment Details</h2>
          <p className="text-slate-600">Please wait while we prepare your payment...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center p-4">
        <motion.div
          className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Payment Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/bookings')}
              className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
              Go to Bookings
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-sky-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-sky-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              disabled={isProcessing}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Secure Payment</h1>
              <p className="text-sky-100">Complete your consultation booking</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Appointment Summary */}
          <div className="bg-slate-50 rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Appointment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Doctor</span>
                <span className="font-semibold text-slate-800">{paymentData?.doctorName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Hospital</span>
                <span className="font-semibold text-slate-800">{paymentData?.hospitalName}</span>
              </div>
              {paymentData?.appointmentDate && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Date</span>
                  <span className="font-semibold text-slate-800">{paymentData.appointmentDate}</span>
                </div>
              )}
              {paymentData?.tokenNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Token Number</span>
                  <span className="font-semibold text-slate-800">#{paymentData.tokenNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Amount Display */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border border-green-200">
            <div className="text-center">
              <span className="text-sm text-slate-600 block mb-1">Total Amount</span>
              <span className="text-4xl font-bold text-slate-800">₹{paymentData?.amount?.toFixed(2)}</span>
              <span className="text-sm text-slate-500 block mt-1">Including all taxes</span>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <Shield size={20} className="text-blue-600" />
              <span className="font-semibold text-blue-800">Secure Payment</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-slate-700">SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-slate-700">PCI Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-slate-700">Bank Grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-slate-700">Instant Refunds</span>
              </div>
            </div>
          </div>

          {/* Payment Methods Info */}
          <div className="text-center mb-6">
            <p className="text-sm text-slate-600 mb-3">Accepted Payment Methods</p>
            <div className="flex justify-center items-center gap-2 text-xs text-slate-500">
              <span className="bg-slate-100 px-3 py-1 rounded-full">UPI</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full">Cards</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full">Net Banking</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full">Wallets</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex-1 border-2 border-slate-200 text-slate-600 py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <motion.button
              onClick={initiatePayment}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              whileHover={{ scale: isProcessing ? 1 : 1.02 }}
              whileTap={{ scale: isProcessing ? 1 : 0.98 }}
            >
              {isProcessing ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Pay ₹{paymentData?.amount?.toFixed(2)}
                </>
              )}
            </motion.button>
          </div>

          {/* Powered by */}
          <div className="text-center mt-6">
            <p className="text-xs text-slate-500">
              Payments powered by <span className="font-semibold text-blue-600">Razorpay</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}