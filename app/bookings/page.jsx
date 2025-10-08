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
  Eye
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
      confirmed: { label: 'Active', color: 'green', icon: CheckCircle },
      completed: { label: 'Completed', color: 'blue', icon: CheckCircle },
      cancelled: { label: 'Cancelled', color: 'red', icon: XCircle },
      pending: { label: 'Pending', color: 'yellow', icon: Clock },
      no_show: { label: 'No-Show', color: 'orange', icon: AlertCircle },
      rescheduled: { label: 'Rescheduled', color: 'purple', icon: RefreshCw }
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
    { id: 'upcoming', label: 'Upcoming', count: bookings.upcoming?.length || 0, color: 'sky' },
    { id: 'completed', label: 'Completed', count: bookings.completed?.length || 0, color: 'blue' },
    { id: 'cancelled', label: 'Cancelled', count: bookings.cancelled?.length || 0, color: 'red' },
    { id: 'pending', label: 'Pending', count: bookings.pending?.length || 0, color: 'yellow' },
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
            className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-slate-600 text-lg">Loading your bookings...</p>
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
            <div className="text-6xl mb-6">📋</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Access Your Bookings</h1>
            <p className="text-slate-600 mb-6">
              To view your complete booking history, please sign in to your account.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
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
                    className="bg-slate-200 text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-300 transition-colors duration-200"
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 relative overflow-hidden py-8">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          className="px-4 sm:px-6 lg:px-8 mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-2">My Appointments</h1>
            <p className="text-slate-600 text-lg">Track and manage your healthcare bookings</p>
          </div>
        </motion.header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Filters */}
          <motion.div
            className="card-futuristic p-4 sm:p-6 mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full sm:min-w-[300px]">
                <div className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by doctor or hospital..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all duration-200"
                  />
                </div>
              </div>

              <button
                onClick={fetchBookings}
                className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                disabled={loading}
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            className="card-futuristic p-4 sm:p-6 mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                    selectedTab === tab.id
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg scale-105'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                  whileHover={{ scale: selectedTab === tab.id ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-sm sm:text-base">{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-lg mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle size={24} className="text-red-500" />
                  <div>
                    <p className="text-red-800 font-semibold">Error loading bookings</p>
                    <p className="text-red-600">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bookings List */}
          <div className="space-y-4 sm:space-y-6">
            {filteredBookings.length === 0 ? (
              <motion.div
                className="card-futuristic p-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  No {selectedTab} bookings found
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchQuery
                    ? `No bookings match your search "${searchQuery}"`
                    : `You don't have any ${selectedTab} appointments yet.`
                  }
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                >
                  Book New Appointment
                </button>
              </motion.div>
            ) : (
              filteredBookings.map((booking, index) => {
                const statusConfig = getStatusConfig(booking.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={booking.id}
                    className="card-futuristic p-4 sm:p-6 hover:shadow-2xl transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Main Info */}
                      <div className="flex-1 space-y-4">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Stethoscope size={24} className="text-sky-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-800">
                                {booking.doctor?.name}
                              </h3>
                              <p className="text-sky-600 font-medium">{booking.doctor?.specialty}</p>
                              {booking.doctor?.qualification && (
                                <p className="text-xs text-slate-500 mt-1">{booking.doctor.qualification}</p>
                              )}
                            </div>
                          </div>
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-${statusConfig.color}-50 border border-${statusConfig.color}-200`}>
                            <StatusIcon size={16} className={`text-${statusConfig.color}-600`} />
                            <span className={`text-sm font-semibold text-${statusConfig.color}-700`}>
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* Hospital */}
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <Building2 size={18} className="text-sky-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-slate-500">Hospital</p>
                              <p className="font-semibold text-slate-800 truncate">{booking.hospital?.name}</p>
                              {booking.hospital?.address && (
                                <p className="text-xs text-slate-600 truncate">{booking.hospital.address}</p>
                              )}
                            </div>
                          </div>

                          {/* Token Number */}
                          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                            <Hash size={18} className="text-purple-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-slate-500">Token Number</p>
                              <p className="font-bold text-lg text-purple-700">#{booking.tokenNumber}</p>
                              {booking.bookingType && (
                                <p className="text-xs text-purple-600 capitalize">{booking.bookingType}</p>
                              )}
                            </div>
                          </div>

                          {/* Date */}
                          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                            <Calendar size={18} className="text-blue-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-slate-500">Appointment Date</p>
                              <p className="font-semibold text-slate-800 text-sm truncate">
                                {formatDate(booking.appointmentDate)}
                              </p>
                              {booking.session && (
                                <p className="text-xs text-blue-600">
                                  {booking.session.startTime} - {booking.session.endTime}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Time */}
                          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                            <Clock size={18} className="text-green-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-slate-500">Estimated Time</p>
                              <p className="font-semibold text-slate-800">{formatTime(booking.estimatedTime)}</p>
                              {booking.actualStartTime && booking.actualEndTime && (
                                <p className="text-xs text-green-600">
                                  Actual: {formatTime(booking.actualStartTime)} - {formatTime(booking.actualEndTime)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Payment Status */}
                          {booking.payment && (
                            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                              <CreditCard size={18} className="text-amber-600 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-slate-500">Payment</p>
                                <p className="font-bold text-slate-800">₹{booking.payment.amount}</p>
                                <p className={`text-xs ${
                                  booking.payment.status === 'completed'
                                    ? 'text-green-600'
                                    : 'text-amber-600'
                                }`}>
                                  {booking.payment.status === 'completed' ? '✓ Paid' : 'Pending'}
                                </p>
                                {booking.payment.transactionId && (
                                  <p className="text-xs text-slate-500 truncate">
                                    Txn: {booking.payment.transactionId}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Doctor Rating */}
                          {booking.doctor?.rating && (
                            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
                              <Star size={18} className="text-yellow-600 flex-shrink-0 fill-current" />
                              <div>
                                <p className="text-xs text-slate-500">Doctor Rating</p>
                                <p className="font-bold text-slate-800">{booking.doctor.rating} / 5</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Contact Information */}
                        {(booking.hospital?.phone || booking.doctor?.phone || booking.doctor?.email) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                            {booking.hospital?.phone && (
                              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
                                <Phone size={18} className="text-indigo-600 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs text-slate-500">Hospital Contact</p>
                                  <p className="font-semibold text-slate-800 truncate">{booking.hospital.phone}</p>
                                </div>
                              </div>
                            )}
                            {booking.doctor?.phone && (
                              <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl">
                                <Phone size={18} className="text-teal-600 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs text-slate-500">Doctor Contact</p>
                                  <p className="font-semibold text-slate-800 truncate">{booking.doctor.phone}</p>
                                </div>
                              </div>
                            )}
                            {booking.doctor?.email && (
                              <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl">
                                <User size={18} className="text-rose-600 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs text-slate-500">Doctor Email</p>
                                  <p className="font-semibold text-slate-800 text-sm truncate">{booking.doctor.email}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Additional Info */}
                        {booking.patientComplaints && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                            <div className="flex items-start gap-2">
                              <MessageSquare size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-blue-700 mb-1">Your Symptoms</p>
                                <p className="text-sm text-blue-600">{booking.patientComplaints}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Doctor Notes */}
                        {booking.doctorNotes && (
                          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                            <div className="flex items-start gap-2">
                              <FileText size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-purple-700 mb-1">Doctor's Notes</p>
                                <p className="text-sm text-purple-600">{booking.doctorNotes}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Prescription */}
                        {booking.prescription && (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                            <div className="flex items-start gap-2">
                              <Heart size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-green-700 mb-1">Prescription</p>
                                <p className="text-sm text-green-600 whitespace-pre-wrap">{booking.prescription}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Medical Record */}
                        {booking.medicalRecord && (
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Activity size={18} className="text-emerald-600" />
                              <p className="text-sm font-bold text-emerald-800">Medical Record</p>
                            </div>
                            <div className="space-y-3">
                              {booking.medicalRecord.diagnosis && (
                                <div>
                                  <p className="text-xs font-semibold text-emerald-700 mb-1">Diagnosis</p>
                                  <p className="text-sm text-emerald-600">{booking.medicalRecord.diagnosis}</p>
                                </div>
                              )}
                              {booking.medicalRecord.symptoms && (
                                <div>
                                  <p className="text-xs font-semibold text-emerald-700 mb-1">Symptoms</p>
                                  <p className="text-sm text-emerald-600">{booking.medicalRecord.symptoms}</p>
                                </div>
                              )}
                              {booking.medicalRecord.treatment && (
                                <div>
                                  <p className="text-xs font-semibold text-emerald-700 mb-1">Treatment</p>
                                  <p className="text-sm text-emerald-600 whitespace-pre-wrap">{booking.medicalRecord.treatment}</p>
                                </div>
                              )}
                              {booking.medicalRecord.prescription && (
                                <div>
                                  <p className="text-xs font-semibold text-emerald-700 mb-1">Prescribed Medication</p>
                                  <p className="text-sm text-emerald-600 whitespace-pre-wrap">{booking.medicalRecord.prescription}</p>
                                </div>
                              )}
                              {booking.medicalRecord.followUpDate && (
                                <div className="flex items-center gap-2 pt-2 border-t border-emerald-200">
                                  <Calendar size={14} className="text-emerald-600" />
                                  <div>
                                    <p className="text-xs font-semibold text-emerald-700">Follow-up Date</p>
                                    <p className="text-sm text-emerald-600">{formatDate(booking.medicalRecord.followUpDate)}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Booking Metadata */}
                        {booking.createdAt && (
                          <div className="pt-3 border-t border-slate-200">
                            <p className="text-xs text-slate-500">
                              Booked on {formatDate(booking.createdAt)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex lg:flex-col gap-2 lg:w-40">
                        <Link href={`/booking-status/${booking.id}`}>
                        <motion.button
                          onClick={() => router.push(`/booking-status/${booking.id}`)}
                          className="flex-1 lg:w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white px-3 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm touch-manipulation min-h-[44px]"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Eye size={18} className="flex-shrink-0" />
                          <span>View Details</span>
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
                            className="flex-1 lg:w-full border-2 border-purple-300 text-purple-600 px-3 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-200 flex items-center justify-center gap-2 text-sm touch-manipulation min-h-[44px]"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Download size={18} className="flex-shrink-0" />
                            <span>Receipt</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Stats Summary */}
          {bookings.all?.length > 0 && (
            <motion.div
              className="card-futuristic p-6 mt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl">
                  <p className="text-3xl font-bold text-sky-600">{bookings.all.length}</p>
                  <p className="text-slate-600 text-sm mt-1">Total Bookings</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <p className="text-3xl font-bold text-green-600">{bookings.completed?.length || 0}</p>
                  <p className="text-slate-600 text-sm mt-1">Completed</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                  <p className="text-3xl font-bold text-blue-600">{bookings.upcoming?.length || 0}</p>
                  <p className="text-slate-600 text-sm mt-1">Upcoming</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl">
                  <p className="text-3xl font-bold text-yellow-600">{bookings.pending?.length || 0}</p>
                  <p className="text-slate-600 text-sm mt-1">Pending</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
