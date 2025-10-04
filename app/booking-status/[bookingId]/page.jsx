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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
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
            {/* Status Hero Card */}
            <motion.div
              className={`card-futuristic ${statusConfig.bgColor} ${statusConfig.borderColor} border-2 p-6 sm:p-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 ${statusConfig.bgColor} rounded-2xl flex items-center justify-center border-2 ${statusConfig.borderColor}`}>
                    <StatusIcon size={32} className={statusConfig.textColor} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">#{booking.tokenNumber}</h2>
                    <p className={`text-sm font-semibold ${statusConfig.textColor}`}>
                      {statusConfig.label}
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${statusConfig.gradient} text-white font-bold text-sm`}>
                  Booking ID: {booking.id}
                </div>
              </div>

              {/* Live Queue Status */}
              {booking.isToday && booking.queueStatus && ['confirmed', 'pending'].includes(booking.status) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {/* Current Token Being Served */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Activity size={20} className="text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-800">{booking.queueStatus.currentToken}</p>
                      <p className="text-xs text-slate-600 mt-1">Current Token</p>
                    </div>

                    {/* Position in Queue */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Users size={20} className="text-orange-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-800">{booking.queueStatus.tokensAhead}</p>
                      <p className="text-xs text-slate-600 mt-1">Ahead of You</p>
                    </div>

                    {/* Estimated Wait Time */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Timer size={20} className="text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-800">{booking.queueStatus.estimatedWaitingMinutes}</p>
                      <p className="text-xs text-slate-600 mt-1">Mins Wait</p>
                    </div>

                    {/* Next Token */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <TrendingUp size={20} className="text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-800">{booking.queueStatus.currentToken + 1}</p>
                      <p className="text-xs text-slate-600 mt-1">Next Token</p>
                    </div>
                  </div>

                  {/* Your Turn Alert */}
                  {booking.queueStatus.queuePosition === 'current' && (
                    <motion.div
                      className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white text-center"
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <p className="text-lg font-bold">🎉 It's Your Turn!</p>
                      <p className="text-sm mt-1">Please proceed to the consultation room</p>
                    </motion.div>
                  )}

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

        {/* Last Updated */}
        {lastUpdated && (
          <motion.div
            className="mt-6 text-center text-sm text-slate-500"
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
