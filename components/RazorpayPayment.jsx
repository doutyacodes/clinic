import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Smartphone, Wallet, Building2, AlertCircle, CheckCircle, Loader } from "lucide-react";

export default function RazorpayPayment({ appointmentId, amount, onSuccess, onFailure, onClose }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [error, setError] = useState(null);

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      description: 'Pay using Google Pay, PhonePe, Paytm',
      icon: Smartphone,
      popular: true,
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, RuPay',
      icon: CreditCard,
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      description: 'All major banks supported',
      icon: Building2,
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      description: 'Paytm, Mobikwik, Freecharge',
      icon: Wallet,
    },
  ];

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const initiatePayment = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Call our API to create Razorpay order
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
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
          // Payment successful
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

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err) {
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
          appointmentId,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        onSuccess(verifyData);
      } else {
        throw new Error(verifyData.error || 'Payment verification failed');
      }
    } catch (err) {
      setError(err.message);
      onFailure(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Secure Payment</h2>
            <p className="text-slate-600">Complete your consultation booking</p>
          </div>

          {/* Amount Display */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100">
            <div className="text-center">
              <span className="text-sm text-slate-600 block mb-1">Total Amount</span>
              <span className="text-3xl font-bold text-slate-800">₹{amount.toFixed(2)}</span>
              <span className="text-sm text-slate-500 block mt-1">Including all taxes</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Select Payment Method</h3>
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <motion.div
                    key={method.id}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      paymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                    onClick={() => setPaymentMethod(method.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        paymentMethod === method.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <IconComponent size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{method.name}</span>
                          {method.popular && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              Popular
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-slate-600">{method.description}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        paymentMethod === method.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300'
                      }`}>
                        {paymentMethod === method.id && (
                          <CheckCircle size={16} className="text-white m-[-2px]" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={20} className="text-red-500 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Payment Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Security Info */}
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">Secure Payment</span>
            </div>
            <p className="text-xs text-green-700">
              Your payment is processed securely by Razorpay. We don't store your payment details.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <motion.button
              className="flex-1 border-2 border-slate-200 text-slate-600 py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:bg-slate-50"
              onClick={onClose}
              disabled={isProcessing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              onClick={initiatePayment}
              disabled={isProcessing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
                  Pay ₹{amount.toFixed(2)}
                </>
              )}
            </motion.button>
          </div>

          {/* Payment Methods Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Powered by <span className="font-semibold text-blue-600">Razorpay</span> • 
              All major payment methods supported
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}