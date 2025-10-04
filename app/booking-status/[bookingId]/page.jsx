'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Star,
  CreditCard,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Heart,
  Stethoscope,
  Download,
  X,
  Loader,
  Edit3
} from 'lucide-react';
import ModifyAppointmentModal from '@/components/ModifyAppointmentModal';

export default function BookingStatusPage() {
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [previousTokensAhead, setPreviousTokensAhead] = useState(null);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId;

  useEffect(() => {
    if (bookingId) {
      fetchBookingStatus();
    }
  }, [bookingId]);

  // Auto-refresh for today's appointments
  useEffect(() => {
    if (!booking || !autoRefresh || !booking.isToday || booking.status !== 'confirmed') {
      return;
    }

    const interval = setInterval(() => {
      fetchBookingStatus(true); // Silent refresh
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [booking, autoRefresh]);

  // Request notification permission
  useEffect(() => {
    if (booking?.isToday && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationsEnabled(permission === 'granted');
        });
      } else {
        setNotificationsEnabled(Notification.permission === 'granted');
      }
    }
  }, [booking?.isToday]);

  // Show notifications when queue position improves
  useEffect(() => {
    if (!booking?.queueStatus || !notificationsEnabled || previousTokensAhead === null) {
      setPreviousTokensAhead(booking?.queueStatus?.tokensAhead);
      return;
    }

    const currentTokensAhead = booking.queueStatus.tokensAhead;
    
    // Notify when position improves significantly or when it's almost their turn
    if (previousTokensAhead > currentTokensAhead) {
      if (currentTokensAhead === 0) {
        new Notification('🎉 Your Turn!', {
          body: 'Please proceed to the consultation room.',
          icon: '/icon-192x192.png'
        });
      } else if (currentTokensAhead === 1) {
        new Notification('⚡ You\'re Next!', {
          body: 'Please be ready for your consultation.',
          icon: '/icon-192x192.png'
        });
      } else if (currentTokensAhead <= 3) {
        new Notification('🔔 Almost Your Turn', {
          body: `Only ${currentTokensAhead} patients ahead of you.`,
          icon: '/icon-192x192.png'
        });
      }
    }

    setPreviousTokensAhead(currentTokensAhead);
  }, [booking?.queueStatus?.tokensAhead, notificationsEnabled, previousTokensAhead]);

  const fetchBookingStatus = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      
      // Use public API endpoint that doesn't require authentication
      const response = await fetch(`/api/public/booking-status/${bookingId}`);
      const data = await response.json();
      
      if (response.ok) {
        setBooking(data.booking);
        setLastUpdated(new Date(data.timestamp));
        setError(null);
      } else {
        setError(data.error || 'Booking not found');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      setError('Failed to fetch booking status');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) {
      return;
    }

    try {
      setIsCancelling(true);
      const response = await fetch(`/api/appointments/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId: bookingId }),
      });

      const data = await response.json();

      if (response.ok) {
        setBooking(prev => ({ ...prev, status: 'cancelled' }));
        alert('Appointment cancelled successfully');
      } else {
        alert(data.error || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch(`/api/appointments/receipt/${bookingId}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${bookingId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to download receipt');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleModifySuccess = (updatedBooking) => {
    setBooking(updatedBooking);
    setShowModifyModal(false);
    fetchBookingStatus(); // Refresh the booking data
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle size={24} className="text-green-500" />;
      case 'completed': return <CheckCircle size={24} className="text-blue-500" />;
      case 'cancelled': return <XCircle size={24} className="text-red-500" />;
      case 'pending': return <Clock size={24} className="text-yellow-500" />;
      default: return <AlertTriangle size={24} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not specified';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div 
          className="text-center p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-slate-600 text-lg">Loading booking status...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div 
          className="text-center p-8 bg-white/90 backdrop-blur-lg rounded-3xl shadow-lg border border-white/20 max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Booking Not Found</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
          >
            Go to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 relative">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 opacity-70 z-0" 
           style={{
             background: `
               radial-gradient(circle at 20% 30%, rgba(14, 165, 233, 0.08) 0%, transparent 40%),
               radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.06) 0%, transparent 40%),
               radial-gradient(circle at 40% 90%, rgba(125, 211, 252, 0.05) 0%, transparent 30%)
             `
           }} />

      <div className="relative z-10 p-4 md:p-8">
        {/* Header */}
        <motion.div 
          className="max-w-4xl mx-auto mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-white/30 rounded-2xl px-6 py-3 text-slate-700 font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl mb-6"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Booking Status</h1>
            <p className="text-lg text-slate-600">Track your appointment details • No login required</p>
            {booking?.isToday && (
              <div className="mt-3 inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                Live updates available for today's appointment
              </div>
            )}
          </div>
        </motion.div>

        {/* Booking Details */}
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl">
                  <Heart size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Booking #{booking.id.slice(-8)}</h2>
                  <p className="text-slate-600">Appointment Details</p>
                </div>
              </div>
              
              <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                <span className="font-bold text-lg capitalize">{booking.status}</span>
              </div>
            </div>

            {/* Doctor & Hospital Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-slate-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Stethoscope size={24} className="text-sky-500" />
                  <h3 className="text-xl font-bold text-slate-800">Doctor Details</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Doctor Name</p>
                    <p className="font-semibold text-slate-800">{booking.doctor?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Specialty</p>
                    <p className="font-medium text-sky-600">{booking.doctor?.specialty || 'N/A'}</p>
                  </div>
                  {booking.doctor?.rating && (
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-yellow-500 fill-current" />
                      <span className="font-medium text-slate-800">{booking.doctor.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin size={24} className="text-sky-500" />
                  <h3 className="text-xl font-bold text-slate-800">Hospital Details</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Hospital Name</p>
                    <p className="font-semibold text-slate-800">{booking.hospital?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Address</p>
                    <p className="font-medium text-slate-600">{booking.hospital?.address || 'N/A'}</p>
                  </div>
                  {booking.hospital?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-slate-500" />
                      <span className="font-medium text-slate-600">{booking.hospital.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Appointment Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl border border-blue-100">
                <Calendar size={32} className="text-blue-500 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-1">Appointment Date</p>
                <p className="font-bold text-slate-800">{formatDate(booking.appointmentDate)}</p>
                {booking.isToday && (
                  <div className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Today
                  </div>
                )}
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                <Clock size={32} className="text-green-500 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-1">
                  {booking.queueStatus?.updatedEstimatedTime ? 'Updated Time' : 'Estimated Time'}
                </p>
                <p className="font-bold text-slate-800">
                  {booking.queueStatus?.updatedEstimatedTime || formatTime(booking.estimatedTime)}
                </p>
                {booking.queueStatus?.estimatedWaitingMinutes !== undefined && (
                  <p className="text-xs text-green-600 mt-1">
                    ~{booking.queueStatus.estimatedWaitingMinutes} min wait
                  </p>
                )}
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100">
                <User size={32} className="text-purple-500 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-1">Your Token</p>
                <p className="font-bold text-slate-800">#{booking.tokenNumber}</p>
                {booking.queueStatus?.queuePosition && (
                  <p className={`text-xs mt-1 font-medium ${
                    booking.queueStatus.queuePosition === 'current' 
                      ? 'text-green-600' 
                      : 'text-orange-600'
                  }`}>
                    {booking.queueStatus.queuePosition === 'current' 
                      ? 'Your turn!' 
                      : `${booking.queueStatus.tokensAhead} ahead`}
                  </p>
                )}
              </div>
            </div>

            {/* Real-time Queue Status - Only show if appointment is today */}
            {booking.isToday && booking.queueStatus && booking.status === 'confirmed' && (
              <motion.div 
                className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Clock size={24} className="text-white animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Live Queue Status</h3>
                      <p className="text-sm text-slate-600">Real-time updates every 30 seconds</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        autoRefresh 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {autoRefresh ? '🔄 Auto-refresh' : '⏸️ Paused'}
                    </button>

                    {('Notification' in window) && (
                      <button
                        onClick={() => {
                          if (Notification.permission === 'default') {
                            Notification.requestPermission().then(permission => {
                              setNotificationsEnabled(permission === 'granted');
                            });
                          } else {
                            setNotificationsEnabled(!notificationsEnabled);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          notificationsEnabled 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {notificationsEnabled ? '🔔 Notifications' : '🔕 Notify'}
                      </button>
                    )}
                    
                    {lastUpdated && (
                      <p className="text-xs text-slate-500">
                        Updated: {lastUpdated.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white/60 rounded-xl">
                    <p className="text-sm text-slate-500 mb-1">Currently Serving</p>
                    <p className="text-2xl font-bold text-orange-600">
                      #{booking.queueStatus.currentlyServing || booking.queueStatus.currentToken}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-white/60 rounded-xl">
                    <p className="text-sm text-slate-500 mb-1">Your Position</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {booking.queueStatus.queuePosition === 'current' ? 'NOW' : booking.queueStatus.tokensAhead}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-white/60 rounded-xl">
                    <p className="text-sm text-slate-500 mb-1">Completed Today</p>
                    <p className="text-2xl font-bold text-green-600">
                      {booking.queueStatus.completedToday}/{booking.queueStatus.totalTokensToday}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-white/60 rounded-xl">
                    <p className="text-sm text-slate-500 mb-1">Est. Wait</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {booking.queueStatus.estimatedWaitingMinutes}m
                    </p>
                  </div>
                </div>

                {/* Queue Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-600 mb-2">
                    <span>Session Progress</span>
                    <span>{Math.round((booking.queueStatus.completedToday / booking.queueStatus.totalTokensToday) * 100)}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${(booking.queueStatus.completedToday / booking.queueStatus.totalTokensToday) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Status Messages */}
                <div className="mt-4 p-3 bg-white/60 rounded-xl">
                  {booking.queueStatus.queuePosition === 'current' ? (
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle size={16} />
                      <span className="font-medium">🎉 It's your turn! Please proceed to the consultation room.</span>
                    </div>
                  ) : booking.queueStatus.tokensAhead === 1 ? (
                    <div className="flex items-center gap-2 text-yellow-700">
                      <Clock size={16} />
                      <span className="font-medium">⚡ You're next! Please be ready.</span>
                    </div>
                  ) : booking.queueStatus.tokensAhead <= 3 ? (
                    <div className="flex items-center gap-2 text-orange-700">
                      <AlertTriangle size={16} />
                      <span className="font-medium">🔔 Almost your turn! Please be nearby.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-blue-700">
                      <Clock size={16} />
                      <span className="font-medium">⏰ Please wait. We'll update your status as the queue moves.</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Payment Info */}
            {booking.payment && (
              <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard size={24} className="text-sky-500" />
                  <h3 className="text-xl font-bold text-slate-800">Payment Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Amount</p>
                    <p className="font-bold text-slate-800">₹{booking.payment.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <p className={`font-semibold ${
                      booking.payment.status === 'success' 
                        ? 'text-green-600' 
                        : booking.payment.status === 'pending'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {booking.payment.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Transaction ID</p>
                    <p className="font-mono text-sm text-slate-600">{booking.payment.transactionId || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Notes */}
            {(booking.patientComplaints || booking.doctorNotes) && (
              <div className="bg-slate-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText size={24} className="text-sky-500" />
                  <h3 className="text-xl font-bold text-slate-800">Notes</h3>
                </div>
                
                {booking.patientComplaints && (
                  <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-1">Patient Complaints</p>
                    <p className="text-slate-700 bg-white rounded-xl p-3">{booking.patientComplaints}</p>
                  </div>
                )}
                
                {booking.doctorNotes && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Doctor's Notes</p>
                    <p className="text-slate-700 bg-white rounded-xl p-3">{booking.doctorNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer Actions */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500 mb-6 text-center">
                Keep this booking ID for your records: <span className="font-mono font-semibold text-slate-700">{booking.id}</span>
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Manual Refresh Button */}
                <motion.button
                  onClick={() => fetchBookingStatus()}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 bg-sky-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-sky-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: 0 }}
                      key={lastUpdated?.toISOString()} // Re-trigger animation on update
                    >
                      <Clock size={18} />
                    </motion.div>
                  )}
                  {isLoading ? 'Refreshing...' : 'Refresh Status'}
                </motion.button>

                {/* Modify Appointment - Only if confirmed or pending */}
                {['confirmed', 'pending'].includes(booking.status) && (
                  <motion.button
                    onClick={() => setShowModifyModal(true)}
                    className="flex items-center justify-center gap-2 bg-purple-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-purple-600 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Edit3 size={18} />
                    Modify Appointment
                  </motion.button>
                )}

                {/* Download Receipt - Only if payment is completed */}
                {booking.payment?.status === 'completed' && (
                  <motion.button
                    onClick={handleDownloadReceipt}
                    disabled={isDownloading}
                    className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isDownloading ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <Download size={18} />
                    )}
                    {isDownloading ? 'Downloading...' : 'Download Receipt'}
                  </motion.button>
                )}

                {/* Cancel Appointment - Only if confirmed */}
                {booking.status === 'confirmed' && (
                  <motion.button
                    onClick={handleCancelBooking}
                    disabled={isCancelling}
                    className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isCancelling ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <X size={18} />
                    )}
                    {isCancelling ? 'Cancelling...' : 'Cancel Appointment'}
                  </motion.button>
                )}

                {/* Print Details */}
                <motion.button
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 bg-slate-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-slate-600 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FileText size={18} />
                  Print Details
                </motion.button>

                {/* Book Another Appointment */}
                <motion.button
                  onClick={() => router.push('/')}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Heart size={18} />
                  Book Another
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Modify Appointment Modal */}
        <AnimatePresence>
          {showModifyModal && booking && (
            <ModifyAppointmentModal
              booking={booking}
              onClose={() => setShowModifyModal(false)}
              onSuccess={handleModifySuccess}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}