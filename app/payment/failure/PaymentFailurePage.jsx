'use client';

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { XCircle, RefreshCw, ArrowLeft, AlertTriangle, Phone, Mail, MessageCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentFailurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get payment response data from URL parameters
        const formData = new FormData();
        for (const [key, value] of searchParams.entries()) {
          formData.append(key, value);
        }

        // Verify payment with our backend
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          body: formData,
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

  const retryPayment = () => {
    // Go back to appointment booking
    router.back();
  };

  const getFailureReason = () => {
    if (paymentData?.errorMessage) {
      return paymentData.errorMessage;
    }
    
    // Common PayU error mappings
    const errorMappings = {
      'E000': 'Transaction was cancelled by user',
      'E001': 'Unauthorized payment mode for this merchant',
      'E002': 'Invalid hash',
      'E003': 'Invalid merchant key',
      'E004': 'Transaction failed at payment gateway',
      'E005': 'Payment gateway connection error',
      'E006': 'Invalid transaction amount',
      'E007': 'Insufficient funds',
      'E008': 'Transaction declined by bank',
      'E009': 'Invalid card details',
      'E010': 'Card expired',
      'E011': 'Invalid UPI PIN',
      'E012': 'UPI transaction failed',
    };

    return errorMappings[searchParams.get('error')] || 'Payment failed due to technical reasons';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-100 flex items-center justify-center">
        <motion.div 
          className="text-center p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-slate-600 text-lg">Processing payment response...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-100 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-pink-50 to-red-100 opacity-70 z-0" 
           style={{
             background: `
               radial-gradient(circle at 20% 30%, rgba(239, 68, 68, 0.08) 0%, transparent 40%),
               radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.06) 0%, transparent 40%),
               radial-gradient(circle at 40% 90%, rgba(248, 113, 113, 0.05) 0%, transparent 30%)
             `
           }} />

      {/* Floating warning icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-10 text-red-200 opacity-30"
          animate={{ 
            y: [10, -10, 10],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <AlertTriangle size={36} />
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
            {/* Failure Icon */}
            <motion.div
              className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <XCircle size={40} className="text-white" />
            </motion.div>

            {/* Failure Message */}
            <motion.h1 
              className="text-3xl font-bold text-slate-800 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Payment Failed 😞
            </motion.h1>
            
            <motion.p 
              className="text-slate-600 mb-8 text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Don't worry! Your appointment is still available. You can try again.
            </motion.p>

            {/* Failure Details */}
            <motion.div 
              className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 mb-8 border border-red-200"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-start gap-3 text-left">
                <AlertTriangle size={20} className="text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">What went wrong?</h3>
                  <p className="text-red-600 text-sm">{getFailureReason()}</p>
                  {paymentData?.transactionId && (
                    <p className="text-red-500 text-xs mt-2">
                      Reference: {paymentData.transactionId}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Common Solutions */}
            <motion.div 
              className="bg-blue-50 rounded-2xl p-6 mb-8 border border-blue-200 text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <RefreshCw size={20} className="text-blue-500" />
                Try These Solutions:
              </h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p>• Check your internet connection and try again</p>
                <p>• Ensure sufficient balance in your account</p>
                <p>• Verify your card/UPI details are correct</p>
                <p>• Try a different payment method</p>
                <p>• Contact your bank if the issue persists</p>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <motion.button 
                className="flex-1 border-2 border-slate-200 text-slate-600 py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:bg-slate-50 flex items-center justify-center gap-2"
                onClick={() => router.push('/')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowLeft size={20} />
                Go Home
              </motion.button>
              <motion.button 
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
                onClick={retryPayment}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw size={20} />
                Try Again
              </motion.button>
            </motion.div>

            {/* Support Options */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
                <Phone size={24} className="text-blue-500 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">Call Support</p>
                <p className="text-xs text-slate-500">1800-XXX-XXXX</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
                <Mail size={24} className="text-green-500 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">Email Us</p>
                <p className="text-xs text-slate-500">support@health.com</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
                <MessageCircle size={24} className="text-purple-500 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">Live Chat</p>
                <p className="text-xs text-slate-500">Available 24/7</p>
              </div>
            </motion.div>

            {/* Important Note */}
            <motion.div 
              className="bg-yellow-50 rounded-xl p-4 border border-yellow-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
                <div className="text-left">
                  <p className="text-xs text-yellow-800 font-medium">Important:</p>
                  <p className="text-xs text-yellow-700">
                    If money was debited from your account, it will be refunded within 3-5 business days. 
                    Contact support if you don't receive the refund.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}