'use client';

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Calendar, User, MapPin, Clock, Download, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get payment response data from URL parameters
        const params = {};
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }

        // Check if this is a redirect from successful payment (has appointmentId and paymentId)
        if (params.appointmentId && params.paymentId) {
          console.log('Payment already verified, showing success page');
          setPaymentData({
            success: true,
            appointmentId: params.appointmentId,
            paymentId: params.paymentId,
            transactionId: params.paymentId,
            amount: params.amount || 'N/A',
            status: 'completed',
            paymentMethod: 'Razorpay'
          });
          setLoading(false);
          return;
        }

        // Only proceed if we have the required Razorpay parameters for verification
        if (!params.razorpay_order_id || !params.razorpay_payment_id || !params.razorpay_signature) {
          console.log('Missing Razorpay parameters, skipping verification');
          setLoading(false);
          return;
        }

        // Verify payment with our backend
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        const result = await response.json();
        setPaymentData(result);
      } catch (error) {
        console.error('Payment verification error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (searchParams.toString()) {
      verifyPayment();
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const downloadReceipt = () => {
    // TODO: Implement receipt download
    alert('Receipt download will be implemented');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-100 flex items-center justify-center">
        <motion.div 
          className="text-center p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-slate-600 text-lg">Verifying your payment...</p>
        </motion.div>
      </div>
    );
  }

  if (!paymentData || !paymentData.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-100 flex items-center justify-center p-4">
        <motion.div 
          className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md w-full"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Verification Failed</h1>
          <p className="text-slate-600 mb-6">
            {paymentData?.errorMessage || 'Unable to verify your payment. Please contact support.'}
          </p>
          <button 
            className="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
            onClick={() => router.push('/')}
          >
            Go Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-100 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-emerald-100 opacity-70 z-0" 
           style={{
             background: `
               radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.08) 0%, transparent 40%),
               radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.06) 0%, transparent 40%),
               radial-gradient(circle at 40% 90%, rgba(16, 185, 129, 0.05) 0%, transparent 30%)
             `
           }} />

      {/* Floating success icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 text-green-200 opacity-30"
          animate={{ 
            y: [-10, 10, -10],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <CheckCircle size={40} />
        </motion.div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div 
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 lg:p-12 shadow-2xl border border-white/20 text-center">
            {/* Success Icon */}
            <motion.div
              className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle size={40} className="text-white" />
            </motion.div>

            {/* Success Message */}
            <motion.h1 
              className="text-3xl font-bold text-slate-800 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Payment Successful! 🎉
            </motion.h1>
            
            <motion.p 
              className="text-slate-600 mb-8 text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Your appointment has been confirmed. We've sent the details to your email.
            </motion.p>

            {/* Payment Details */}
            <motion.div 
              className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8 border border-green-200"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block">Transaction ID</span>
                  <span className="font-semibold text-slate-800">{paymentData.transactionId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Amount Paid</span>
                  <span className="font-semibold text-slate-800">₹{paymentData.amount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Method</span>
                  <span className="font-semibold text-slate-800">{paymentData.paymentMethod || 'PayU'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status</span>
                  <span className="font-semibold text-green-600 capitalize">{paymentData.status}</span>
                </div>
              </div>
            </motion.div>

            {/* Next Steps */}
            <motion.div 
              className="bg-blue-50 rounded-2xl p-6 mb-8 border border-blue-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-blue-500" />
                What's Next?
              </h3>
              <div className="text-left space-y-2 text-sm text-slate-600">
                <p>• You'll receive appointment confirmation via email and SMS</p>
                <p>• Arrive 15 minutes early on your appointment date</p>
                <p>• Bring a valid ID and any previous medical reports</p>
                <p>• Download your receipt for your records</p>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <motion.button 
                className="flex-1 border-2 border-blue-200 text-blue-600 py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:bg-blue-50 flex items-center justify-center gap-2"
                onClick={downloadReceipt}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download size={20} />
                Download Receipt
              </motion.button>
              <motion.button 
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
                onClick={() => router.push('/')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Back to Home
                <ArrowRight size={20} />
              </motion.button>
            </motion.div>

            {/* Support */}
            <motion.div 
              className="mt-8 pt-6 border-t border-slate-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <p className="text-xs text-slate-500">
                Need help? Contact our support team at{' '}
                <a href="mailto:support@healthcares.com" className="text-blue-600 hover:underline">
                  support@healthcares.com
                </a>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}