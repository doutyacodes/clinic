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
  Filter,
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  RefreshCw
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

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
        // Show public access option or redirect to login
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

  const handlePayNow = async (appointmentId) => {
    try {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else if (data.paymentData) {
          // For PayU integration, submit form
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = data.paymentData.action;
          
          Object.keys(data.paymentData.params).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = data.paymentData.params[key];
            form.appendChild(input);
          });
          
          document.body.appendChild(form);
          form.submit();
        }
      } else {
        alert('Payment initiation failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle size={20} className="text-green-500" />;
      case 'completed': return <CheckCircle size={20} className="text-blue-500" />;
      case 'cancelled': return <XCircle size={20} className="text-red-500" />;
      case 'pending': return <Clock size={20} className="text-yellow-500" />;
      default: return <AlertCircle size={20} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const filteredBookings = bookings[selectedTab]?.filter(booking => 
    booking.doctor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.hospital?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: bookings.upcoming?.length || 0 },
    { id: 'completed', label: 'Completed', count: bookings.completed?.length || 0 },
    { id: 'cancelled', label: 'Cancelled', count: bookings.cancelled?.length || 0 },
    { id: 'pending', label: 'Pending', count: bookings.pending?.length || 0 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

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

  // Show public access for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 opacity-70 z-0" 
             style={{
               background: `
                 radial-gradient(circle at 20% 30%, rgba(14, 165, 233, 0.08) 0%, transparent 40%),
                 radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.06) 0%, transparent 40%),
                 radial-gradient(circle at 40% 90%, rgba(125, 211, 252, 0.05) 0%, transparent 30%)
               `
             }} />

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

      <div className="relative z-10">
        {/* Header */}
        <motion.header 
          className="p-8 text-center"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-2">My Bookings</h1>
          <p className="text-slate-600 text-lg">Track your appointments and medical consultations</p>
        </motion.header>

        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* Search and Filters */}
          <motion.div 
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 mb-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by doctor or hospital name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all duration-200"
                  />
                </div>
              </div>
              
              <button
                onClick={fetchBookings}
                className="flex items-center gap-2 bg-sky-500 text-white px-4 py-3 rounded-xl hover:bg-sky-600 transition-colors duration-200"
                disabled={loading}
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div 
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 mb-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                    selectedTab === tab.id
                      ? 'bg-sky-500 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {tab.label}
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    selectedTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600'
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
                className="bg-red-50 border border-red-200 rounded-3xl p-6 shadow-lg mb-8"
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
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {filteredBookings.length === 0 ? (
              <motion.div 
                className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 shadow-lg border border-white/20 text-center"
                variants={itemVariants}
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
              filteredBookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Booking Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-800 mb-1">
                            {booking.doctor?.name}
                          </h3>
                          <p className="text-sky-600 font-medium">{booking.doctor?.specialty}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(booking.status)}
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <MapPin size={18} className="text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-500">Hospital</p>
                            <p className="font-medium text-slate-800">{booking.hospital?.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Calendar size={18} className="text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-500">Date & Time</p>
                            <p className="font-medium text-slate-800">
                              {formatDate(booking.appointmentDate)}
                            </p>
                            <p className="text-sm text-slate-600">
                              {formatTime(booking.estimatedTime)} (Token #{booking.tokenNumber})
                            </p>
                          </div>
                        </div>

                        {booking.payment && (
                          <div className="flex items-center gap-3">
                            <CreditCard size={18} className="text-slate-400" />
                            <div>
                              <p className="text-sm text-slate-500">Payment</p>
                              <p className="font-medium text-slate-800">
                                ₹{booking.payment.amount}
                              </p>
                              <p className={`text-sm ${
                                booking.payment.status === 'completed' 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {booking.payment.status}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <Star size={18} className="text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-500">Doctor Rating</p>
                            <div className="flex items-center gap-1">
                              <Star size={14} className="text-yellow-500 fill-current" />
                              <span className="font-medium text-slate-800">
                                {booking.doctor?.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {booking.doctorNotes && (
                        <div className="bg-blue-50 rounded-xl p-4 mb-4">
                          <div className="flex items-start gap-2">
                            <FileText size={18} className="text-blue-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-800 mb-1">Doctor's Notes</p>
                              <p className="text-blue-700 text-sm">{booking.doctorNotes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 lg:w-48">
                      <motion.button
                        onClick={() => router.push(`/booking-status/${booking.id}`)}
                        className="bg-sky-500 text-white px-4 py-2 rounded-xl hover:bg-sky-600 transition-colors duration-200 flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FileText size={16} />
                        View Details
                      </motion.button>

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
                                a.download = `receipt-${booking.id}.html`;
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
                          className="border border-slate-300 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors duration-200 flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Download size={16} />
                          Receipt
                        </motion.button>
                      )}

                      {booking.status === 'pending' && !booking.payment && (
                        <motion.button
                          onClick={() => handlePayNow(booking.id)}
                          className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors duration-200 flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <CreditCard size={16} />
                          Pay Now
                        </motion.button>
                      )}

                      {booking.status === 'confirmed' && (
                        <motion.button
                          onClick={async () => {
                            if (confirm('Are you sure you want to cancel this appointment?')) {
                              try {
                                const response = await fetch('/api/appointments/cancel', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ appointmentId: booking.id })
                                });
                                if (response.ok) {
                                  alert('Appointment cancelled successfully');
                                  fetchBookings(); // Refresh the list
                                } else {
                                  const data = await response.json();
                                  alert(data.error || 'Failed to cancel appointment');
                                }
                              } catch (error) {
                                console.error('Cancel error:', error);
                                alert('Failed to cancel appointment');
                              }
                            }
                          }}
                          className="border border-red-300 text-red-600 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors duration-200 flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <XCircle size={16} />
                          Cancel
                        </motion.button>
                      )}

                      {booking.status === 'completed' && !booking.medicalRecord && (
                        <motion.button
                          className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors duration-200 flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Star size={16} />
                          Rate Doctor
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Total Stats */}
          {bookings.all?.length > 0 && (
            <motion.div 
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 mt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-sky-500">{bookings.all.length}</p>
                  <p className="text-slate-600 text-sm">Total Bookings</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{bookings.completed?.length || 0}</p>
                  <p className="text-slate-600 text-sm">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-500">{bookings.upcoming?.length || 0}</p>
                  <p className="text-slate-600 text-sm">Upcoming</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{bookings.pending?.length || 0}</p>
                  <p className="text-slate-600 text-sm">Pending</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}