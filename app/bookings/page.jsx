'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Star,
  CreditCard,
  FileText,
  Download,
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Building2,
  Activity,
  Timer,
  Users,
  TrendingUp,
  Navigation,
  DoorClosed,
  Stethoscope,
  Hash,
  Info,
  Heart,
  MessageSquare,
  Eye,
  ArrowRight,
  Sparkles,
  Zap
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";

export default function BookingsPage() {
  const [bookings, setBookings] = useState({
    upcoming: [],
    completed: [],
    cancelled: [],
    pending: [],
    all: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        fetchBookings();
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, isLoading]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/bookings');
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings);
      } else {
        setError(data.error || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      confirmed: {
        label: 'Active',
        color: 'green',
        icon: CheckCircle,
        gradient: 'from-green-500 to-emerald-600',
        bgGradient: 'from-green-50 to-emerald-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200'
      },
      completed: {
        label: 'Completed',
        color: 'blue',
        icon: CheckCircle,
        gradient: 'from-blue-500 to-indigo-600',
        bgGradient: 'from-blue-50 to-indigo-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200'
      },
      cancelled: {
        label: 'Cancelled',
        color: 'red',
        icon: XCircle,
        gradient: 'from-red-500 to-rose-600',
        bgGradient: 'from-red-50 to-rose-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200'
      },
      pending: {
        label: 'Pending',
        color: 'yellow',
        icon: Clock,
        gradient: 'from-yellow-500 to-amber-600',
        bgGradient: 'from-yellow-50 to-amber-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200'
      },
      no_show: {
        label: 'No-Show',
        color: 'orange',
        icon: AlertCircle,
        gradient: 'from-orange-500 to-red-600',
        bgGradient: 'from-orange-50 to-red-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200'
      },
      rescheduled: {
        label: 'Rescheduled',
        color: 'purple',
        icon: RefreshCw,
        gradient: 'from-purple-500 to-indigo-600',
        bgGradient: 'from-purple-50 to-indigo-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200'
      }
    };
    return configs[status] || configs.pending;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not specified';
    return timeString;
  };

  const filteredBookings = bookings[selectedTab]?.filter(booking =>
    booking.doctor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.hospital?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: bookings.upcoming?.length || 0, icon: Calendar, color: 'sky' },
    { id: 'completed', label: 'Completed', count: bookings.completed?.length || 0, icon: CheckCircle, color: 'green' },
    { id: 'pending', label: 'Pending', count: bookings.pending?.length || 0, icon: Clock, color: 'amber' },
    { id: 'cancelled', label: 'Cancelled', count: bookings.cancelled?.length || 0, icon: XCircle, color: 'red' },
  ];

  if (isLoading || (isAuthenticated && loading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          className="text-center p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-20 h-20 mx-auto mb-6 relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="absolute inset-0 border-4 border-sky-200 border-t-sky-600 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 border-4 border-indigo-200 border-b-indigo-600 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
          <p className="text-slate-600 text-lg font-medium">Loading your appointments...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 left-10 w-72 h-72 bg-sky-300 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 max-w-md w-full text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="text-6xl mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              📋
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Access Your Bookings</h1>
            <p className="text-slate-600 mb-6">
              To view your complete booking history, please sign in to your account.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg active:scale-95 transition-all duration-200"
              >
                Sign In to View Bookings
              </button>

              <div className="flex items-center gap-4">
                <hr className="flex-1 border-slate-200" />
                <span className="text-sm text-slate-500">OR</span>
                <hr className="flex-1 border-slate-200" />
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Have an Appointment ID?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Appointment ID"
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        router.push(`/booking-status/${e.target.value.trim()}`);
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.target.parentElement.querySelector('input');
                      if (input.value.trim()) {
                        router.push(`/booking-status/${input.value.trim()}`);
                      }
                    }}
                    className="bg-slate-200 text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-300 active:scale-95 transition-all duration-200"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 relative overflow-hidden pt-24 pb-6 sm:pt-28 sm:pb-8">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <motion.div
          className="mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <Sparkles className="text-sky-600" size={36} />
                My Appointments
              </h1>
              <p className="text-slate-600 text-lg">Track and manage your healthcare journey</p>
            </div>

            <button
              onClick={fetchBookings}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm text-slate-700 px-6 py-3 rounded-xl font-semibold border-2 border-slate-200 hover:border-sky-300 hover:bg-white active:scale-95 transition-all duration-200 shadow-sm"
              disabled={loading}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Search Bar - Modern Design */}
          <motion.div
            className="relative"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by doctor or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all duration-200 shadow-sm hover:shadow-md"
            />
          </motion.div>
        </motion.div>

        {/* Modern Tabs */}
        <motion.div
          className="mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = selectedTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`relative p-4 rounded-2xl font-semibold transition-all duration-300 overflow-hidden group ${
                    isSelected
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-200'
                      : 'bg-white/80 backdrop-blur-sm text-slate-600 hover:bg-white border-2 border-slate-200 hover:border-sky-300'
                  }`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Shine effect on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />

                  <div className="relative flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <TabIcon size={20} />
                      <span className="text-sm sm:text-base">{tab.label}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tab.count}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="bg-red-50/80 backdrop-blur-sm border-2 border-red-200 rounded-2xl p-6 shadow-lg mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-3">
                <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-semibold">Error loading bookings</p>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bookings Grid */}
        <AnimatePresence mode="wait">
          {filteredBookings.length === 0 ? (
            <motion.div
              key="empty"
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center border-2 border-slate-200 shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <motion.div
                className="text-7xl mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                📅
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                No {selectedTab} appointments
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? `No appointments match your search "${searchQuery}"`
                  : `You don't have any ${selectedTab} appointments yet.`
                }
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg active:scale-95 transition-all duration-200 inline-flex items-center gap-2"
              >
                <Calendar size={20} />
                Book New Appointment
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="bookings"
              className="grid grid-cols-1 gap-4 sm:gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {filteredBookings.map((booking, index) => {
                const statusConfig = getStatusConfig(booking.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={booking.id}
                    className="group bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-slate-200 hover:border-sky-300 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Section - Main Info */}
                        <div className="flex-1 space-y-6">
                          {/* Header with Doctor & Status */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex items-start gap-4">
                              {/* Doctor Avatar */}
                              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                <Stethoscope size={32} className="text-white" />
                              </div>

                              <div className="flex-1">
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1 group-hover:text-sky-600 transition-colors">
                                  Dr. {booking.doctor?.name}
                                </h3>
                                <p className="text-sky-600 font-semibold mb-1">{booking.doctor?.specialty}</p>
                                {booking.doctor?.qualification && (
                                  <p className="text-xs text-slate-500">{booking.doctor.qualification}</p>
                                )}
                              </div>
                            </div>

                            {/* Status Badge */}
                            <motion.div
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-md ${statusConfig.textColor} bg-gradient-to-r ${statusConfig.bgGradient} border-2 ${statusConfig.borderColor}`}
                              whileHover={{ scale: 1.05 }}
                            >
                              <StatusIcon size={18} />
                              <span>{statusConfig.label}</span>
                            </motion.div>
                          </div>

                          {/* Info Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {/* Hospital */}
                            <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                              <Building2 size={20} className="text-blue-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-blue-600 font-medium">Hospital</p>
                                <p className="font-semibold text-slate-800 truncate text-sm">{booking.hospital?.name}</p>
                              </div>
                            </div>

                            {/* Token */}
                            <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                              <Hash size={20} className="text-purple-600 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-purple-600 font-medium">Token</p>
                                <p className="font-bold text-lg text-purple-700">#{booking.tokenNumber}</p>
                              </div>
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                              <Calendar size={20} className="text-green-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-green-600 font-medium">Date</p>
                                <p className="font-semibold text-slate-800 text-sm truncate">
                                  {new Date(booking.appointmentDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>

                            {/* Time */}
                            <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                              <Clock size={20} className="text-amber-600 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-amber-600 font-medium">Time</p>
                                <p className="font-semibold text-slate-800 text-sm">{formatTime(booking.estimatedTime)}</p>
                              </div>
                            </div>

                            {/* Payment */}
                            {booking.payment && (
                              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                                <CreditCard size={20} className="text-emerald-600 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-emerald-600 font-medium">Payment</p>
                                  <p className="font-bold text-slate-800">₹{booking.payment.amount}</p>
                                </div>
                              </div>
                            )}

                            {/* Rating */}
                            {booking.doctor?.rating && (
                              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-100">
                                <Star size={20} className="text-yellow-600 flex-shrink-0 fill-yellow-600" />
                                <div>
                                  <p className="text-xs text-yellow-600 font-medium">Rating</p>
                                  <p className="font-bold text-slate-800">{booking.doctor.rating}/5</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Complaints/Notes */}
                          {booking.patientComplaints && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
                              <div className="flex items-start gap-2">
                                <MessageSquare size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-blue-700 mb-1">Your Symptoms</p>
                                  <p className="text-sm text-blue-600">{booking.patientComplaints}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Section - Actions */}
                        <div className="flex lg:flex-col gap-3 lg:w-48">
                          <Link
                            href={`/booking-status/${booking.id}`}
                            className="flex-1 lg:w-full"
                          >
                            <motion.button
                              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Eye size={20} className="flex-shrink-0" />
                              <span>View Details</span>
                              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                          </Link>

                          {booking.payment?.status === 'completed' && (
                            <motion.button
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/appointments/receipt/${booking.id}`);
                                  if (response.ok) {
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `receipt-${booking.id}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                  } else {
                                    alert('Failed to download receipt');
                                  }
                                } catch (error) {
                                  console.error('Download error:', error);
                                  alert('Failed to download receipt');
                                }
                              }}
                              className="flex-1 lg:w-full border-2 border-purple-300 bg-white text-purple-600 px-6 py-4 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-200 flex items-center justify-center gap-2"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Download size={20} className="flex-shrink-0" />
                              <span>Receipt</span>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom shine effect */}
                    <motion.div
                      className="h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Summary - Modern Cards */}
        {bookings.all?.length > 0 && (
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {[
              { label: 'Total', value: bookings.all.length, color: 'from-sky-400 to-blue-600', icon: Calendar },
              { label: 'Completed', value: bookings.completed?.length || 0, color: 'from-green-400 to-emerald-600', icon: CheckCircle },
              { label: 'Upcoming', value: bookings.upcoming?.length || 0, color: 'from-purple-400 to-indigo-600', icon: Zap },
              { label: 'Pending', value: bookings.pending?.length || 0, color: 'from-amber-400 to-orange-600', icon: Clock },
            ].map((stat, index) => {
              const StatIcon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className={`relative overflow-hidden bg-gradient-to-r ${stat.color} rounded-2xl p-6 text-white shadow-lg`}
                  whileHover={{ scale: 1.05, y: -5 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="relative z-10">
                    <StatIcon size={24} className="mb-2 opacity-80" />
                    <p className="text-4xl font-bold mb-1">{stat.value}</p>
                    <p className="text-sm font-medium opacity-90">{stat.label}</p>
                  </div>

                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Powered by Medicare */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-xs text-slate-400">
            Powered by{' '}
            <span className="font-semibold text-sky-600">Medicare</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
