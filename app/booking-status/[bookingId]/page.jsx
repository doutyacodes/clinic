'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Star,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Stethoscope,
  Download,
  Loader,
  Edit3,
  Users,
  Activity,
  Navigation,
  RefreshCw,
  AlertCircle,
  CheckCheck,
  Building2,
  Hash,
  Timer,
  TrendingUp,
  DoorClosed,
  Info,
  MessageSquare,
  Bell,
  Heart,
  Zap,
  Eye,
  Wifi,
  WifiOff,
  Coffee,
  Siren
} from 'lucide-react';
import ModifyAppointmentModal from '@/components/ModifyAppointmentModal';

// Break Timer Component with Countdown
function BreakTimerBox({ doctorName, breakEndTime, breakType }) {
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (breakType !== 'timed' || !breakEndTime) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(breakEndTime);
      const diff = Math.max(0, Math.floor((end - now) / 1000)); // seconds
      setTimeRemaining(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [breakEndTime, breakType]);

  const formatTime = (seconds) => {
    if (seconds === null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (breakType === 'indefinite') {
    return (
      <motion.div
        className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
      >
        <div className="flex items-center gap-2">
          <Coffee size={18} />
          <div className="flex-1">
            <p className="text-sm font-bold">On Break - Indefinite</p>
            <p className="text-xs opacity-90">Will resume shortly</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (breakType === 'timed' && timeRemaining !== null) {
    return (
      <motion.div
        className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
      >
        <div className="flex items-center gap-2">
          <Coffee size={18} />
          <div className="flex-1">
            <p className="text-sm font-bold">On Break - Resuming in</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="bg-white/20 rounded px-2 py-0.5">
                <p className="text-lg font-mono font-bold">{formatTime(timeRemaining)}</p>
              </div>
              <p className="text-xs opacity-90">min</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}

// Emergency Status Box Component (matching Break UI style)
function EmergencyStatusBox({ doctorName }) {
  return (
    <motion.div
      className="p-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl text-white"
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
    >
      <div className="flex items-center gap-2">
        <Siren size={18} />
        <div className="flex-1">
          <p className="text-sm font-bold">Medical Emergency - Indefinite</p>
          <p className="text-xs opacity-90">Will resume when emergency is resolved</p>
        </div>
      </div>
    </motion.div>
  );
}

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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const params = useParams();
  const router = useRouter();

  // Handle async params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setBookingId(resolvedParams.bookingId);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (bookingId) {
      fetchBookingStatus();
    }
  }, [bookingId]);

  // Auto-refresh for today's appointments
  useEffect(() => {
    if (!booking || !autoRefresh || !booking.isToday || !['confirmed', 'pending'].includes(booking.status)) {
      return;
    }

    const interval = setInterval(() => {
      fetchBookingStatus(true); // Silent refresh
    }, 5000); // Refresh every 5 seconds

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

  // Show notifications when queue position improves or doctor status changes
  useEffect(() => {
    if (!booking?.queueStatus || !notificationsEnabled || previousTokensAhead === null) {
      setPreviousTokensAhead(booking?.queueStatus?.tokensAhead);
      return;
    }

    const currentTokensAhead = booking.queueStatus.tokensAhead;
    const patientName = booking.patientName || `${booking.user?.firstName || 'Patient'} ${booking.user?.lastName || ''}`.trim();
    const doctorStatus = booking.doctor?.status || 'offline';
    const doctorStatusConfig = getDoctorStatusConfig(doctorStatus);

    // Check if doctor is unavailable (on break or emergency)
    const isDoctorUnavailable = ['on_break', 'emergency', 'offline'].includes(doctorStatus);

    if (previousTokensAhead > currentTokensAhead) {
      if (currentTokensAhead === 0) {
        // It's the user's turn
        if (isDoctorUnavailable) {
          new Notification(`⏸️ ${patientName} - Please Wait`, {
            body: `Dr. ${booking.doctor?.name} is currently ${doctorStatusConfig.label}. Please wait, you'll be called when doctor is available.`,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'queue-update'
          });
        } else {
          new Notification(`🎉 ${patientName} - Your Turn!`, {
            body: `Dr. ${booking.doctor?.name} is ${doctorStatusConfig.label}. Please proceed to consultation room.`,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'queue-update'
          });
        }
      } else if (currentTokensAhead === 1) {
        // User is next
        if (isDoctorUnavailable) {
          new Notification(`⚠️ ${patientName} - Possible Delay`, {
            body: `You're next, but Dr. ${booking.doctor?.name} is ${doctorStatusConfig.label}. There may be a delay.`,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'queue-update'
          });
        } else {
          new Notification(`⚡ ${patientName} - You're Next!`, {
            body: `Dr. ${booking.doctor?.name} is ${doctorStatusConfig.label}. Token #${booking.tokenNumber}`,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'queue-update'
          });
        }
      } else if (currentTokensAhead <= 3) {
        // User is in top 3
        if (isDoctorUnavailable) {
          new Notification(`📋 ${patientName} - Queue Update`, {
            body: `${currentTokensAhead} patients ahead. Note: Dr. ${booking.doctor?.name} is ${doctorStatusConfig.label}, there may be delays.`,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'queue-update'
          });
        } else {
          new Notification(`🔔 ${patientName} - Almost Your Turn`, {
            body: `Dr. ${booking.doctor?.name} is ${doctorStatusConfig.label}. Current: #${booking.queueStatus.currentToken}, Your Token: #${booking.tokenNumber}`,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'queue-update'
          });
        }
      }
    }

    setPreviousTokensAhead(currentTokensAhead);
  }, [booking?.queueStatus?.tokensAhead, booking?.doctor?.status, notificationsEnabled, previousTokensAhead]);

  const fetchBookingStatus = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetch(`/api/public/booking-status/${bookingId}`);
      const data = await response.json();

      if (response.ok) {
        setBooking(data.booking);
        setLastUpdated(new Date());
      } else {
        setError(data.error || 'Failed to fetch booking status');
      }
    } catch (err) {
      console.error('Fetch booking error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/appointments/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: bookingId })
      });

      if (response.ok) {
        await fetchBookingStatus();
        setShowCancelConfirm(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to cancel appointment');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadReceipt = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/appointments/receipt/${booking.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${booking.payment?.transactionId || booking.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download receipt. Please try again.');
      }
    } catch (err) {
      console.error('Receipt download error:', err);
      alert('Network error. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Get status configurations
  const getBookingStatusConfig = (status) => {
    const configs = {
      confirmed: {
        label: 'Active',
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        icon: CheckCircle,
        gradient: 'from-green-500 to-emerald-600'
      },
      pending: {
        label: 'Pending Payment',
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-700',
        icon: Clock,
        gradient: 'from-yellow-500 to-amber-600'
      },
      completed: {
        label: 'Completed',
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
        icon: CheckCheck,
        gradient: 'from-blue-500 to-indigo-600'
      },
      cancelled: {
        label: 'Cancelled',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        icon: XCircle,
        gradient: 'from-red-500 to-rose-600'
      },
      no_show: {
        label: 'No-Show',
        color: 'orange',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-700',
        icon: AlertTriangle,
        gradient: 'from-orange-500 to-red-600'
      },
      rescheduled: {
        label: 'Rescheduled',
        color: 'purple',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-700',
        icon: RefreshCw,
        gradient: 'from-purple-500 to-indigo-600'
      }
    };
    return configs[status] || configs.pending;
  };

  const getDoctorStatusConfig = (status) => {
    const configs = {
      online: {
        label: 'Available',
        icon: Wifi,
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        dotColor: 'bg-green-500'
      },
      consulting: {
        label: 'Consulting',
        icon: Activity,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        dotColor: 'bg-blue-500'
      },
      on_break: {
        label: 'On Break',
        icon: Coffee,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        dotColor: 'bg-yellow-500'
      },
      emergency: {
        label: 'Emergency',
        icon: Siren,
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        dotColor: 'bg-red-500'
      },
      offline: {
        label: 'Offline',
        icon: WifiOff,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        dotColor: 'bg-gray-500'
      }
    };
    return configs[status] || configs.offline;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-sky-200 border-t-sky-600 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-slate-600 font-medium">Loading booking details...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Booking Not Found</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            Go to Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (!booking) return null;

  const statusConfig = getBookingStatusConfig(booking.status);
  const StatusIcon = statusConfig.icon;
  const doctorStatusConfig = getDoctorStatusConfig(booking.doctor?.status || 'offline');
  const DoctorStatusIcon = doctorStatusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 pt-24 pb-8 sm:pt-28 sm:pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-sky-600 transition-colors duration-200 mb-4 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-1">Appointment Details</h1>
              <p className="text-slate-500">Real-time tracking and management</p>
            </div>

            {booking.isToday && ['confirmed', 'pending'].includes(booking.status) && (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 text-sm ${
                    autoRefresh
                      ? 'bg-sky-100 text-sky-700 border-2 border-sky-300'
                      : 'bg-white text-slate-600 border-2 border-slate-200'
                  }`}
                >
                  <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Auto-refresh</span>
                </button>
                <button
                  onClick={() => fetchBookingStatus()}
                  className="px-3 sm:px-4 py-2 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-medium hover:border-sky-300 hover:text-sky-600 transition-all duration-200"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Compact Hero Card - Mobile First */}
            <motion.div
              className={`card-futuristic ${statusConfig.bgColor} ${statusConfig.borderColor} border-2 p-4 sm:p-6`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Hospital Image - Top Banner */}
              {booking.hospital?.image && (
                <div className="mb-4 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6">
                  <img
                    src={booking.hospital.image}
                    alt={booking.hospital.name}
                    className="w-full h-32 sm:h-40 object-cover rounded-t-2xl"
                  />
                </div>
              )}

              {/* Doctor Name - Most Prominent */}
              <div className="mb-4">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-1">
                  Dr. {booking.doctor?.name}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sky-600 font-semibold text-sm sm:text-base">{booking.doctor?.specialty}</p>
                  <span className="text-slate-300">•</span>
                  <p className="text-slate-600 text-sm">{booking.hospital?.name}</p>
                </div>
              </div>

              {/* Session Timing & Status - Enhanced */}
              <div className="mb-4 pb-4 border-b border-slate-200 space-y-3">
                {/* Appointment Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/70 rounded-xl p-3 border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={14} className="text-blue-600" />
                      <p className="text-xs text-slate-500 font-medium">Date</p>
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      {new Date(booking.appointmentDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-3 border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-purple-600" />
                      <p className="text-xs text-slate-500 font-medium">Your Time</p>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{booking.estimatedTime}</p>
                  </div>
                </div>

                {/* Session Timing with Doctor Status */}
                {booking.session && (() => {
                  const now = new Date();
                  const appointmentDate = new Date(booking.appointmentDate);
                  const [startHours, startMinutes] = booking.session.startTime.split(':').map(Number);
                  const [endHours, endMinutes] = booking.session.endTime.split(':').map(Number);

                  const sessionStart = new Date(appointmentDate);
                  sessionStart.setHours(startHours, startMinutes, 0, 0);

                  const sessionEnd = new Date(appointmentDate);
                  sessionEnd.setHours(endHours, endMinutes, 0, 0);

                  const isSameDay = now.toDateString() === appointmentDate.toDateString();
                  const hasStarted = now >= sessionStart;
                  const hasEnded = now >= sessionEnd;

                  // Determine doctor status and styling
                  const doctorStatus = booking.doctor?.status || 'offline';
                  const isSessionActive = isSameDay && hasStarted && !hasEnded;

                  // Dynamic background colors based on doctor status (only when session is active)
                  let boxBgClass = 'bg-gradient-to-r from-orange-50 to-amber-50';
                  let boxBorderClass = 'border-orange-200';
                  let iconColorClass = 'text-orange-600';
                  let textColorClass = 'text-orange-700';

                  if (isSessionActive) {
                    if (doctorStatus === 'emergency') {
                      boxBgClass = 'bg-gradient-to-r from-red-100 to-rose-100';
                      boxBorderClass = 'border-red-300';
                      iconColorClass = 'text-red-600';
                      textColorClass = 'text-red-700';
                    } else if (doctorStatus === 'on_break') {
                      boxBgClass = 'bg-gradient-to-r from-yellow-100 to-amber-100';
                      boxBorderClass = 'border-yellow-300';
                      iconColorClass = 'text-yellow-600';
                      textColorClass = 'text-yellow-700';
                    } else if (doctorStatus === 'offline') {
                      boxBgClass = 'bg-gradient-to-r from-gray-100 to-slate-100';
                      boxBorderClass = 'border-gray-300';
                      iconColorClass = 'text-gray-600';
                      textColorClass = 'text-gray-700';
                    } else if (doctorStatus === 'consulting' || doctorStatus === 'online') {
                      boxBgClass = 'bg-gradient-to-r from-green-50 to-emerald-50';
                      boxBorderClass = 'border-green-200';
                      iconColorClass = 'text-green-600';
                      textColorClass = 'text-green-700';
                    }
                  }

                  return (
                    <div className={`${boxBgClass} rounded-xl p-3 border ${boxBorderClass}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Timer size={16} className={iconColorClass} />
                          <p className={`text-xs ${textColorClass} font-semibold`}>Session Timing</p>
                        </div>
                        <p className="text-sm font-bold text-slate-800">
                          {booking.session.startTime} - {booking.session.endTime}
                        </p>
                      </div>

                      {/* Session Status & Doctor Status Combined */}
                      {!isSameDay ? (
                        // Future date
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-slate-600 font-medium">
                            Session starts in {Math.ceil((appointmentDate - now) / (1000 * 60 * 60 * 24))} {Math.ceil((appointmentDate - now) / (1000 * 60 * 60 * 24)) === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                      ) : hasEnded ? (
                        // Session ended
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                          <span className="text-slate-600 font-medium">Session has ended</span>
                        </div>
                      ) : hasStarted ? (
                        // Session is active - show doctor status
                        <div className="space-y-2">
                          {doctorStatus === 'emergency' ? (
                            <EmergencyStatusBox doctorName={booking.doctor.name} />
                          ) : doctorStatus === 'on_break' && booking.doctor?.breakType === 'timed' && booking.doctor?.breakEndTime ? (
                            <BreakTimerBox
                              doctorName={booking.doctor.name}
                              breakEndTime={booking.doctor.breakEndTime}
                              breakType={booking.doctor.breakType}
                            />
                          ) : doctorStatus === 'on_break' ? (
                            <div className="flex items-center gap-2 text-xs">
                              <Coffee size={14} className="text-yellow-600" />
                              <span className="text-yellow-700 font-bold">☕ Doctor on Break - Will resume shortly</span>
                            </div>
                          ) : doctorStatus === 'offline' ? (
                            <div className="flex items-center gap-2 text-xs">
                              <WifiOff size={14} className="text-gray-600" />
                              <span className="text-gray-700 font-bold">📵 Doctor Unavailable</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-green-700 font-semibold">✓ Session is active - Doctor Available</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Session starting soon
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                            <span className="text-amber-700 font-semibold">Starting soon</span>
                          </div>
                          <div className="flex items-center gap-1 bg-white/80 rounded-lg px-2 py-1">
                            <Clock size={12} className="text-amber-600" />
                            <span className="font-mono font-bold text-amber-700">
                              {(() => {
                                const timeRemaining = Math.max(0, Math.floor((sessionStart - now) / 1000));
                                const hoursRemaining = Math.floor(timeRemaining / 3600);
                                const minutesRemaining = Math.floor((timeRemaining % 3600) / 60);
                                return `${hoursRemaining > 0 ? `${hoursRemaining}h ` : ''}${minutesRemaining}m`;
                              })()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Patient Info - Small */}
              <div className="mb-4 pb-4 border-b border-slate-200">
                <p className="text-xs text-slate-500">Patient</p>
                <p className="text-sm font-medium text-slate-700">
                  {booking.patientName || `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`.trim()}
                </p>
              </div>

              {/* Live Queue Status */}
              {booking.isToday && booking.queueStatus && ['confirmed', 'pending'].includes(booking.status) && (
                <div className="space-y-3">
                  {/* Token Grid - Compact */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Your Token */}
                    <div className={`rounded-xl p-3 text-center shadow-lg col-span-1 ${
                      booking.isRecalled
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                        : 'bg-gradient-to-br from-sky-500 to-blue-600'
                    }`}>
                      <p className="text-2xl sm:text-3xl font-bold text-white">{booking.tokenNumber}</p>
                      <p className="text-[10px] sm:text-xs text-white/90 mt-1 font-semibold">
                        {booking.isRecalled ? '🔁 Your Token' : 'Your Token'}
                      </p>
                      {booking.isRecalled && booking.recallCount > 0 && (
                        <p className="text-[8px] sm:text-[10px] text-white/80 mt-0.5">
                          Recalled {booking.recallCount}x
                        </p>
                      )}
                    </div>

                    {/* Current Token - Shows if it's a recall */}
                    <div className={`bg-white rounded-xl p-3 text-center shadow-sm col-span-1 ${
                      booking.queueStatus.isCurrentTokenRecalled
                        ? 'border-2 border-amber-400 ring-2 ring-amber-200'
                        : 'border-2 border-blue-200'
                    }`}>
                      <div className="flex items-center justify-center gap-1">
                        {booking.queueStatus.isCurrentTokenRecalled && (
                          <RefreshCw size={12} className="text-amber-600 animate-spin" />
                        )}
                        <p className={`text-xl sm:text-2xl font-bold ${
                          booking.queueStatus.isCurrentTokenRecalled ? 'text-amber-600' : 'text-blue-600'
                        }`}>
                          {booking.queueStatus.currentToken}
                        </p>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-600 mt-1">
                        {booking.queueStatus.isCurrentTokenRecalled ? 'Recall' : 'Current'}
                      </p>
                    </div>

                    {/* Total Tokens (Processed / Total Booked) */}
                    <div className="bg-white rounded-xl p-3 text-center border-2 border-purple-200 col-span-2">
                      <p className="text-xl sm:text-2xl font-bold text-purple-600">
                        {booking.queueStatus.processedToday || 0}
                        <span className="text-slate-400 mx-1">/</span>
                        {booking.queueStatus.totalTokensToday || 0}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-600 mt-1">Total Tokens</p>
                    </div>
                  </div>

                  {/* Additional Stats Row */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Total Calls (including recalls) */}
                    {booking.queueStatus.totalTokensCalled > booking.queueStatus.uniqueTokensCalled && (
                      <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-200">
                        <p className="text-sm font-bold text-amber-600">{booking.queueStatus.totalTokensCalled}</p>
                        <p className="text-[9px] text-amber-700">Total Calls</p>
                      </div>
                    )}

                    {/* Wait Time */}
                    <div className="bg-purple-50 rounded-lg p-2 text-center border border-purple-200">
                      <p className="text-sm font-bold text-purple-600">{booking.queueStatus.estimatedWaitingMinutes} min</p>
                      <p className="text-[9px] text-purple-700">Est. Wait</p>
                    </div>
                  </div>

                  {/* Recall Alert Banner */}
                  {booking.queueStatus.isCurrentTokenRecalled && (
                    <motion.div
                      className="p-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl text-white shadow-lg"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-start gap-2">
                        <RefreshCw size={18} className="flex-shrink-0 mt-0.5 animate-spin" />
                        <div className="flex-1">
                          <p className="text-sm font-bold mb-1">🔁 Token Being Recalled</p>
                          <p className="text-xs opacity-95">
                            Token #{booking.queueStatus.currentToken} is being called again as the patient didn't show up initially.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* User's Token Recalled Alert */}
                  {booking.isRecalled && booking.queueStatus.queuePosition === 'current' && (
                    <motion.div
                      className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white shadow-lg"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-start gap-2">
                        <Bell size={18} className="flex-shrink-0 mt-0.5 animate-bounce" />
                        <div className="flex-1">
                          <p className="text-sm font-bold mb-1">⚠️ FINAL CALL - Token #{booking.tokenNumber}</p>
                          <p className="text-xs opacity-95">
                            Your token has been recalled. Please proceed to consultation room IMMEDIATELY or your appointment may be marked as no-show.
                          </p>
                          {booking.recallCount > 1 && (
                            <p className="text-xs mt-1 font-bold">
                              This is recall #{booking.recallCount} - Final chance!
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Dynamic Status Alert - Real-time Updates */}
                  {booking.queueStatus.queuePosition === 'current' && !booking.isRecalled ? (
                    // User's turn - status dependent
                    <>
                      {booking.doctor?.status === 'on_break' && booking.doctor?.breakType === 'timed' && booking.doctor?.breakEndTime ? (
                        <BreakTimerBox
                          doctorName={booking.doctor.name}
                          breakEndTime={booking.doctor.breakEndTime}
                          breakType={booking.doctor.breakType}
                        />
                      ) : booking.doctor?.status === 'on_break' && booking.doctor?.breakType === 'indefinite' ? (
                        <motion.div
                          className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white"
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                        >
                          <div className="flex items-center gap-2">
                            <Coffee size={20} />
                            <div className="flex-1">
                              <p className="text-sm font-bold">⏸️ Doctor on Break</p>
                              <p className="text-xs opacity-90">It's your turn, but please wait. You'll be called shortly.</p>
                            </div>
                          </div>
                        </motion.div>
                      ) : booking.doctor?.status === 'emergency' ? (
                        <EmergencyStatusBox doctorName={booking.doctor.name} />
                      ) : booking.doctor?.status === 'offline' ? (
                        <motion.div
                          className="p-3 bg-gradient-to-r from-slate-500 to-slate-600 rounded-xl text-white"
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                        >
                          <div className="flex items-center gap-2">
                            <WifiOff size={20} />
                            <div className="flex-1">
                              <p className="text-sm font-bold">⏸️ Doctor Unavailable</p>
                              <p className="text-xs opacity-90">It's your turn. Please wait for updates.</p>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white"
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle size={20} />
                            <div className="flex-1">
                              <p className="text-sm font-bold">🎉 It's Your Turn!</p>
                              <p className="text-xs opacity-90">Please proceed to the consultation room</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </>
                  ) : booking.queueStatus.tokensAhead <= 3 && ['on_break', 'emergency', 'offline'].includes(booking.doctor?.status) ? (
                    // User is close but doctor unavailable
                    <>
                      {booking.doctor?.status === 'on_break' && booking.doctor?.breakType === 'timed' && booking.doctor?.breakEndTime ? (
                        <BreakTimerBox
                          doctorName={booking.doctor.name}
                          breakEndTime={booking.doctor.breakEndTime}
                          breakType={booking.doctor.breakType}
                        />
                      ) : booking.doctor?.status === 'on_break' ? (
                        <motion.div
                          className="p-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl text-white"
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                        >
                          <div className="flex items-center gap-2">
                            <Coffee size={18} />
                            <div className="flex-1">
                              <p className="text-sm font-bold">⚠️ Possible Delay</p>
                              <p className="text-xs opacity-90">Doctor is on break. {booking.queueStatus.tokensAhead} ahead of you.</p>
                            </div>
                          </div>
                        </motion.div>
                      ) : booking.doctor?.status === 'emergency' ? (
                        <EmergencyStatusBox doctorName={booking.doctor.name} />
                      ) : (
                        <motion.div
                          className="p-3 bg-gradient-to-r from-slate-400 to-slate-500 rounded-xl text-white"
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                        >
                          <div className="flex items-center gap-2">
                            <WifiOff size={18} />
                            <div className="flex-1">
                              <p className="text-sm font-bold">⚠️ Doctor Unavailable</p>
                              <p className="text-xs opacity-90">Possible delays. {booking.queueStatus.tokensAhead} ahead of you.</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </>
                  ) : null}

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                      <span>Queue Progress</span>
                      <span>
                        {booking.queueStatus.completedToday}/{booking.queueStatus.totalTokensToday} completed
                      </span>
                    </div>
                    <div className="w-full h-3 bg-white/70 rounded-full overflow-hidden border border-white/50">
                      <motion.div
                        className="h-full bg-gradient-to-r from-sky-500 to-blue-600"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(booking.queueStatus.completedToday / booking.queueStatus.totalTokensToday) * 100}%`
                        }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Doctor Information Card */}
            <motion.div
              className="card-futuristic p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Stethoscope size={20} className="text-sky-600" />
                Doctor Information
              </h3>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                {booking.doctor?.image ? (
                  <img
                    src={booking.doctor.image}
                    alt={booking.doctor.name}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-sky-100 to-blue-100 rounded-xl flex items-center justify-center">
                    <Stethoscope size={32} className="text-sky-600" />
                  </div>
                )}

                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{booking.doctor?.name}</h3>
                      <p className="text-sky-600 font-medium">{booking.doctor?.specialty}</p>
                      {booking.doctor?.qualification && (
                        <p className="text-xs text-slate-500 mt-1">{booking.doctor.qualification}</p>
                      )}
                    </div>
                    {booking.doctor?.rating && (
                      <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                        <Star size={16} className="text-amber-500 fill-amber-500" />
                        <span className="font-bold text-amber-700">{booking.doctor.rating}</span>
                        <span className="text-xs text-amber-600">/5</span>
                      </div>
                    )}
                  </div>

                  {/* Doctor Status */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${doctorStatusConfig.bgColor} rounded-lg`}>
                    <div className={`w-2 h-2 ${doctorStatusConfig.dotColor} rounded-full animate-pulse`} />
                    <DoctorStatusIcon size={14} className={doctorStatusConfig.textColor} />
                    <span className={`text-sm font-semibold ${doctorStatusConfig.textColor}`}>
                      {doctorStatusConfig.label}
                    </span>
                  </div>

                  {/* Doctor Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <Clock size={16} className="text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Avg. Consultation</p>
                        <p className="text-sm font-semibold text-slate-700">
                          {booking.session?.avgMinutesPerPatient || 15} mins
                        </p>
                      </div>
                    </div>
                    {booking.doctor?.experience && (
                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        <Stethoscope size={16} className="text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Experience</p>
                          <p className="text-sm font-semibold text-slate-700">
                            {booking.doctor.experience} years
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Appointment Details Card */}
            <motion.div
              className="card-futuristic p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-sky-600" />
                Appointment Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <Calendar size={20} className="text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-blue-600 font-medium">Appointment Date</p>
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {new Date(booking.appointmentDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Estimated Time */}
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <Clock size={20} className="text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-purple-600 font-medium">Estimated Time</p>
                    <p className="text-sm font-bold text-slate-800">{booking.estimatedTime}</p>
                  </div>
                </div>

                {/* Session Timing */}
                {booking.session && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                    <Timer size={20} className="text-orange-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-orange-600 font-medium">Session Timing</p>
                      <p className="text-sm font-bold text-slate-800">
                        {booking.session.startTime} - {booking.session.endTime}
                      </p>
                    </div>
                  </div>
                )}

                {/* Token Created */}
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-green-600 font-medium">Token Created</p>
                    <p className="text-sm font-bold text-slate-800">
                      {new Date(booking.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>

                {/* Token Expiry */}
                {booking.tokenLockExpiresAt && new Date(booking.tokenLockExpiresAt) > new Date() && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-amber-600 font-medium">Token Expires</p>
                      <p className="text-sm font-bold text-amber-800">
                        {new Date(booking.tokenLockExpiresAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Consultation Start Time */}
                {booking.actualStartTime && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                    <Activity size={20} className="text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-green-600 font-medium">Consultation Started</p>
                      <p className="text-sm font-bold text-green-800">{booking.actualStartTime}</p>
                    </div>
                  </div>
                )}

                {/* Consultation End Time */}
                {booking.actualEndTime && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <CheckCheck size={20} className="text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Consultation Ended</p>
                      <p className="text-sm font-bold text-blue-800">{booking.actualEndTime}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Patient Complaints */}
              {booking.patientComplaints && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-2">
                    <MessageSquare size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-800 mb-1 text-sm">Your Symptoms/Complaints</p>
                      <p className="text-blue-700">{booking.patientComplaints}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Hospital Information */}
            <motion.div
              className="card-futuristic p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Building2 size={20} className="text-sky-600" />
                Hospital Details
              </h3>

              {booking.hospital?.image && (
                <img
                  src={booking.hospital.image}
                  alt={booking.hospital.name}
                  className="w-full h-32 object-cover rounded-xl mb-4"
                />
              )}

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 size={18} className="text-sky-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Hospital Name</p>
                    <p className="text-sm font-semibold text-slate-800">{booking.hospital?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Address</p>
                    <p className="text-sm text-slate-700">
                      {booking.hospital?.address}
                      {booking.hospital?.city && `, ${booking.hospital.city}`}
                      {booking.hospital?.state && `, ${booking.hospital.state}`}
                    </p>
                  </div>
                </div>

                {booking.hospital?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500">Contact Number</p>
                      <a
                        href={`tel:${booking.hospital.phone}`}
                        className="text-sm font-semibold text-green-700 hover:underline"
                      >
                        {booking.hospital.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Room Location */}
                {booking.session?.roomNumber && (
                  <div className="mt-4 p-3 bg-sky-50 rounded-xl border border-sky-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DoorClosed size={18} className="text-sky-600" />
                      <p className="text-xs font-semibold text-sky-700">Consultation Room</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-800">
                        <span className="font-medium">Room:</span> {booking.session.roomNumber}
                      </p>
                      {booking.session.floor && (
                        <p className="text-slate-800">
                          <span className="font-medium">Floor:</span> {booking.session.floor}
                        </p>
                      )}
                      {booking.session.buildingLocation && (
                        <p className="text-slate-800">
                          <span className="font-medium">Building:</span> {booking.session.buildingLocation}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Button */}
                {booking.hospital?.address && (
                  <button
                    onClick={() => {
                      const address = encodeURIComponent(booking.hospital.address);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                    }}
                    className="w-full mt-3 px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Navigation size={16} />
                    Get Directions
                  </button>
                )}
              </div>
            </motion.div>

            {/* Payment Information */}
            {booking.payment && (
              <motion.div
                className="card-futuristic p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-sky-600" />
                  Payment Details
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2">
                      <CreditCard size={18} className="text-green-600" />
                      <span className="text-sm text-slate-600 font-medium">Amount Paid</span>
                    </div>
                    <span className="text-xl font-bold text-green-700">₹{booking.payment.amount}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-600 font-medium">Payment Status</span>
                    <span className={`text-sm font-bold ${
                      booking.payment.status === 'completed' ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {booking.payment.status === 'completed' ? '✓ Completed' : 'Pending'}
                    </span>
                  </div>

                  {booking.payment.transactionId && (
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-600 font-medium block mb-1">Transaction ID</span>
                      <span className="text-xs font-mono text-slate-700 break-all">
                        {booking.payment.transactionId}
                      </span>
                    </div>
                  )}

                  {booking.payment.paidAt && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-600 font-medium">Paid On</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {new Date(booking.payment.paidAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  {/* Download Receipt Button */}
                  {booking.payment.status === 'completed' && (
                    <button
                      onClick={handleDownloadReceipt}
                      disabled={isDownloading}
                      className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {isDownloading ? (
                        <>
                          <Loader size={16} className="animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          Download Receipt
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Today's Average Wait Time */}
            {booking.isToday && booking.queueStatus?.averageWaitTimeMinutes && (
              <motion.div
                className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-amber-200"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp size={20} className="text-amber-600" />
                  <h3 className="text-lg font-bold text-slate-800">Today's Stats</h3>
                </div>
                <p className="text-sm text-slate-600 mb-3">Average waiting time</p>
                <p className="text-4xl font-bold text-amber-700">
                  {booking.queueStatus.averageWaitTimeMinutes}
                  <span className="text-lg ml-1">mins</span>
                </p>
              </motion.div>
            )}

            {/* Next Availability */}
            {booking.session?.nextAvailableDate && (
              <motion.div
                className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-purple-200"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Calendar size={20} className="text-purple-600" />
                  <h3 className="text-lg font-bold text-slate-800">Next Availability</h3>
                </div>
                <p className="text-sm font-semibold text-purple-700">
                  {new Date(booking.session.nextAvailableDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
                {booking.session.nextAvailableToken && (
                  <p className="text-xs text-slate-600 mt-1">
                    Token #{booking.session.nextAvailableToken} onwards
                  </p>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            {['confirmed', 'pending'].includes(booking.status) && (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <button
                  onClick={() => setShowModifyModal(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Edit3 size={18} />
                  Reschedule Appointment
                </button>

                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full px-4 py-3 bg-white border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <XCircle size={18} />
                  Cancel Appointment
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Last Updated & Powered By */}
        <div className="mt-6 space-y-2">
          {lastUpdated && (
            <motion.div
              className="text-center text-sm text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Last updated: {lastUpdated.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })}
            </motion.div>
          )}

          {/* Powered by Medicare */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs text-slate-400">
              Powered by{' '}
              <span className="font-semibold text-sky-600">Medicare</span>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Modify Modal */}
      <AnimatePresence>
        {showModifyModal && (
          <ModifyAppointmentModal
            booking={booking}
            onClose={() => setShowModifyModal(false)}
            onSuccess={() => {
              setShowModifyModal(false);
              fetchBookingStatus();
            }}
          />
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">
                Cancel Appointment?
              </h3>
              <p className="text-slate-600 text-center mb-6">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors duration-200"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isCancelling ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      Yes, Cancel
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
