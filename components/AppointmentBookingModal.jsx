'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  Heart,
  Hash,
  Lock,
  RefreshCw,
  Grid as GridIcon,
  Zap
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function AppointmentBookingModal({ doctor, session, timeSlot, onClose }) {
  const [bookingData, setBookingData] = useState({
    appointmentDate: '',
    patientComplaints: '',
    emergencyContact: '',
    emergencyPhone: '',
    bookingType: 'next', // 'next', 'time', 'token', 'grid'
    preferredTime: '',
    specificToken: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [predictedToken, setPredictedToken] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { user } = useAuth();

  // Token Grid States
  const [tokenAvailability, setTokenAvailability] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  // Fetch token availability when date is selected and booking type is 'grid'
  useEffect(() => {
    if (bookingData.bookingType === 'grid' && bookingData.appointmentDate && session?.id) {
      fetchTokenAvailability();
    }
  }, [bookingData.bookingType, bookingData.appointmentDate, session?.id]);

  // Auto-refresh token grid every 30 seconds if enabled
  useEffect(() => {
    if (autoRefresh && bookingData.bookingType === 'grid' && bookingData.appointmentDate && session?.id) {
      const interval = setInterval(() => {
        fetchTokenAvailability();
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, bookingData.bookingType, bookingData.appointmentDate, session?.id]);

  const fetchTokenAvailability = async () => {
    setLoadingTokens(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/appointments/token-availability?sessionId=${session.id}&date=${bookingData.appointmentDate}`
      );
      const data = await response.json();

      if (response.ok) {
        setTokenAvailability(data.tokens || []);
      } else {
        setError(data.error || 'Failed to load token availability');
      }
    } catch (err) {
      console.error('Token availability error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoadingTokens(false);
    }
  };

  const handleTokenSelect = (token) => {
    if (token.status === 'available') {
      setSelectedToken(token);
      setPredictedToken({
        tokenNumber: token.tokenNumber,
        estimatedTime: token.estimatedTime,
        estimatedDateTime: formatEstimatedDateTime(bookingData.appointmentDate, token.estimatedTime)
      });
      setBookingData(prev => ({
        ...prev,
        specificToken: token.tokenNumber.toString()
      }));
      setError(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear prediction when changing booking type or date
    if (name === 'bookingType' || name === 'appointmentDate') {
      setPredictedToken(null);
      setSelectedToken(null);
      setTokenAvailability([]);
      setError(null);
    }

    // Validate date selection immediately
    if (name === 'appointmentDate' && value) {
      const selectedDate = new Date(value);
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

      if (session.dayOfWeek !== dayOfWeek) {
        setError(`Doctor is not available on ${dayOfWeek}. Please select a ${session.dayOfWeek}.`);
      }
    }
  };

  const calculateTokenPrediction = async () => {
    setIsCalculating(true);
    setError(null);
    
    if (!bookingData.appointmentDate) {
      setError('Please select an appointment date first');
      setIsCalculating(false);
      return;
    }

    // Validate date is available for this session
    const selectedDate = new Date(bookingData.appointmentDate);
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (session.dayOfWeek !== dayOfWeek) {
      setError(`Doctor is not available on ${dayOfWeek}. Available on ${session.dayOfWeek}`);
      setIsCalculating(false);
      return;
    }
    
    try {
      // Fetch existing bookings for this date and session
      const existingBookingsResponse = await fetch(`/api/appointments/check-availability?sessionId=${session.id}&date=${bookingData.appointmentDate}`);
      const existingBookingsData = await existingBookingsResponse.json();
      
      if (!existingBookingsResponse.ok) {
        throw new Error(existingBookingsData.error || 'Failed to check availability');
      }

      const existingTokens = existingBookingsData.bookedTokens || [];
      const existingTimes = existingBookingsData.bookedTimes || [];
      
      let tokenNumber, estimatedTime, estimatedDateTime;
      
      switch (bookingData.bookingType) {
        case 'next':
          // Get next available token (dynamic)
          tokenNumber = 1;
          while (existingTokens.includes(tokenNumber) && tokenNumber <= session.maxTokens) {
            tokenNumber++;
          }
          if (tokenNumber > session.maxTokens) {
            setError(`All tokens are booked for this date. Maximum ${session.maxTokens} tokens allowed.`);
            setIsCalculating(false);
            return;
          }
          estimatedTime = calculateEstimatedTime(tokenNumber);
          estimatedDateTime = formatEstimatedDateTime(estimatedTime);
          break;
          
        case 'time':
          if (!bookingData.preferredTime) {
            setError('Please select a preferred time');
            setIsCalculating(false);
            return;
          }

          // Check if this time is already booked
          const requestedTime = bookingData.preferredTime;
          const timeConflict = existingTimes.find(bookedTime => {
            const timeDiff = Math.abs(convertTimeToMinutes(bookedTime) - convertTimeToMinutes(requestedTime));
            return timeDiff < (session.avgMinutesPerPatient || 15); // Within consultation window
          });

          if (timeConflict) {
            setError(`Time slot ${requestedTime} is not available. Try a different time.`);
            setIsCalculating(false);
            return;
          }

          // Calculate token based on time
          const timeInMinutes = convertTimeToMinutes(bookingData.preferredTime);
          const sessionStartMinutes = convertTimeToMinutes(session.startTime);
          const sessionEndMinutes = convertTimeToMinutes(session.endTime);
          
          if (timeInMinutes < sessionStartMinutes || timeInMinutes > sessionEndMinutes) {
            setError(`Please select a time between ${session.startTime} and ${session.endTime}`);
            setIsCalculating(false);
            return;
          }

          const minutesFromStart = timeInMinutes - sessionStartMinutes;
          tokenNumber = Math.max(1, Math.ceil(minutesFromStart / (session.avgMinutesPerPatient || 15)));
          
          // Check if calculated token is available
          if (existingTokens.includes(tokenNumber)) {
            setError(`Token ${tokenNumber} for this time is already booked. Please choose a different time.`);
            setIsCalculating(false);
            return;
          }
          
          estimatedTime = bookingData.preferredTime;
          estimatedDateTime = formatEstimatedDateTime(estimatedTime);
          break;
          
        case 'token':
          if (!bookingData.specificToken) {
            setError('Please enter a token number');
            setIsCalculating(false);
            return;
          }
          
          tokenNumber = parseInt(bookingData.specificToken);
          
          if (existingTokens.includes(tokenNumber)) {
            setError(`Token ${tokenNumber} is already booked for this date. Please choose a different token.`);
            setIsCalculating(false);
            return;
          }
          
          estimatedTime = calculateEstimatedTime(tokenNumber);
          estimatedDateTime = formatEstimatedDateTime(estimatedTime);
          break;
          
        default:
          tokenNumber = 1;
          estimatedTime = session.startTime;
          estimatedDateTime = formatEstimatedDateTime(estimatedTime);
      }
      
      // Validate token number
      if (tokenNumber > session.maxTokens) {
        setError(`Token number exceeds maximum limit of ${session.maxTokens}`);
        setPredictedToken(null);
      } else {
        setPredictedToken({
          tokenNumber,
          estimatedTime,
          estimatedDateTime,
          isOverLimit: tokenNumber > session.maxTokens,
          availableTokens: session.maxTokens - existingTokens.length
        });
      }
      
    } catch (err) {
      console.error('Token calculation error:', err);
      setError(err.message || 'Failed to calculate token prediction');
    } finally {
      setIsCalculating(false);
    }
  };

  const formatEstimatedDateTime = (date, time) => {
    if (!date && !time) {
      // Fallback to old signature
      const actualTime = date || time;
      if (!bookingData.appointmentDate || !actualTime) return actualTime;
      date = bookingData.appointmentDate;
      time = actualTime;
    }

    if (!date || !time) return time;

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() === today.getTime()) {
      return `Today at ${time}`;
    } else {
      const dateStr = selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      return `${dateStr} at ${time}`;
    }
  };

  // Generate the next few available dates for this session
  const getNextAvailableDates = () => {
    const dates = [];
    const today = new Date();
    const sessionDayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(session.dayOfWeek);
    
    for (let i = 0; i < 14; i++) { // Next 2 weeks
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (date.getDay() === sessionDayIndex) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates.slice(0, 4); // Return next 4 available dates
  };

  const convertTimeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const convertMinutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const calculateEstimatedTime = (tokenNumber) => {
    const sessionStartMinutes = convertTimeToMinutes(session.startTime);
    const estimatedMinutes = sessionStartMinutes + ((tokenNumber - 1) * (session.avgMinutesPerPatient || 15));
    return convertMinutesToTime(estimatedMinutes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!bookingData.appointmentDate) {
      setError('Please select an appointment date');
      return;
    }

    if (!predictedToken) {
      setError('Please calculate your token first');
      return;
    }

    // Validate that the selected date is not in the past
    const selectedDate = new Date(bookingData.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setError('Please select a future date');
      return;
    }

    // Validate required fields
    const hospitalId = timeSlot?.hospitalId || session?.hospitalId;
    if (!doctor?.id || !session?.id || !hospitalId) {
      setError('Missing required booking information. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const bookingPayload = {
        doctorId: doctor.id,
        sessionId: session.id,
        hospitalId,
        appointmentDate: bookingData.appointmentDate,
        tokenNumber: predictedToken.tokenNumber,
        estimatedTime: predictedToken.estimatedTime,
        bookingType: bookingData.bookingType,
        patientComplaints: bookingData.patientComplaints,
        emergencyContact: bookingData.emergencyContact,
        emergencyPhone: bookingData.emergencyPhone,
      };
      
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        
        // Auto-redirect to payment or booking status
        setTimeout(() => {
          if (data.paymentRequired && data.paymentUrl) {
            window.location.href = data.paymentUrl;
          } else if (data.booking?.id) {
            window.location.href = `/booking-status/${data.booking.id}`;
          } else {
            onClose();
            window.location.reload();
          }
        }, 2000);
      } else {
        setError(data.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
      y: 50
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 50,
      transition: {
        duration: 0.2
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  if (success) {
    return (
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          variants={modalVariants}
        >
          <div className="text-center">
            <motion.div
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
            >
              <CheckCircle size={32} className="text-green-600" />
            </motion.div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Booking Confirmed!</h3>
            <p className="text-slate-600 mb-6">
              Your appointment has been successfully booked. You will be redirected shortly.
            </p>
            <div className="flex items-center justify-center">
              <motion.div
                className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <motion.div
        className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl mx-2 sm:mx-4"
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white">
              <Heart size={16} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Book Appointment</h2>
              <p className="text-sm sm:text-base text-slate-600 hidden sm:block">Schedule your consultation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Doctor & Session Info */}
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-3">Doctor Details</h3>
              <div className="space-y-2">
                <p className="text-sm sm:text-base text-slate-700">{doctor.name}</p>
                <p className="text-sm sm:text-base text-sky-600 font-medium">{doctor.specialty}</p>
                <div className="flex items-center gap-2">
                  <CreditCard size={14} className="text-slate-500 sm:w-4 sm:h-4" />
                  <span className="text-sm sm:text-base text-slate-600">₹{doctor.consultationFee}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-3">Session Details</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-500 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-slate-600 break-words">{timeSlot.hospitalName || session.hospitalName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-500 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-slate-600">
                    {session.startTime} - {session.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-500 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-slate-600">{session.dayOfWeek}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-slate-500 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-slate-600">Max {session.maxTokens} tokens</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertCircle size={20} className="text-red-500" />
              <p className="text-red-700">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Patient Information */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-3 sm:mb-4">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={`${user?.firstName || ''} ${user?.lastName || ''}`}
                  readOnly
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-3 sm:mb-4">Appointment Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  name="appointmentDate"
                  value={bookingData.appointmentDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Doctor is available on {session.dayOfWeek}s from {session.startTime} to {session.endTime}
                </p>
                
                {/* Quick Date Selection */}
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-600 mb-2">Quick Select:</p>
                  <div className="flex flex-wrap gap-2">
                    {getNextAvailableDates().map((date) => {
                      const dateObj = new Date(date);
                      const isToday = dateObj.toDateString() === new Date().toDateString();
                      const dateLabel = isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      });
                      
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => {
                            setBookingData(prev => ({ ...prev, appointmentDate: date }));
                            setPredictedToken(null);
                            setError(null);
                          }}
                          className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                            bookingData.appointmentDate === date
                              ? 'bg-sky-100 border-sky-300 text-sky-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-sky-200'
                          }`}
                        >
                          {dateLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Patient Complaints / Symptoms
                </label>
                <textarea
                  name="patientComplaints"
                  value={bookingData.patientComplaints}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Describe your symptoms or reason for consultation..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Token Selection */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-3 sm:mb-4">Token Selection</h3>
            <div className="space-y-4">
              {/* Booking Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  How would you like to book your appointment?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center p-3 sm:p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="radio"
                      name="bookingType"
                      value="next"
                      checked={bookingData.bookingType === 'next'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded-full mr-3 flex-shrink-0 ${
                      bookingData.bookingType === 'next' ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                    }`}>
                      {bookingData.bookingType === 'next' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">Next</div>
                      <div className="text-xs text-slate-500">Auto assign</div>
                    </div>
                  </label>

                  <label className="flex items-center p-3 sm:p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="radio"
                      name="bookingType"
                      value="time"
                      checked={bookingData.bookingType === 'time'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded-full mr-3 flex-shrink-0 ${
                      bookingData.bookingType === 'time' ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                    }`}>
                      {bookingData.bookingType === 'time' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">Time</div>
                      <div className="text-xs text-slate-500">Pick time</div>
                    </div>
                  </label>

                  <label className="flex items-center p-3 sm:p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="radio"
                      name="bookingType"
                      value="token"
                      checked={bookingData.bookingType === 'token'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded-full mr-3 flex-shrink-0 ${
                      bookingData.bookingType === 'token' ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                    }`}>
                      {bookingData.bookingType === 'token' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">Token</div>
                      <div className="text-xs text-slate-500">Type number</div>
                    </div>
                  </label>

                  <label className="flex items-center p-3 sm:p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="radio"
                      name="bookingType"
                      value="grid"
                      checked={bookingData.bookingType === 'grid'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded-full mr-3 flex-shrink-0 ${
                      bookingData.bookingType === 'grid' ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                    }`}>
                      {bookingData.bookingType === 'grid' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">Grid</div>
                      <div className="text-xs text-slate-500">Visual select</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Time Input for 'time' booking type */}
              {bookingData.bookingType === 'time' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Preferred Time
                  </label>
                  <input
                    type="time"
                    name="preferredTime"
                    value={bookingData.preferredTime}
                    onChange={handleInputChange}
                    min={session.startTime}
                    max={session.endTime}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Session time: {session.startTime} - {session.endTime}
                  </p>
                </div>
              )}

              {/* Token Input for 'token' booking type */}
              {bookingData.bookingType === 'token' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Token Number
                  </label>
                  <input
                    type="number"
                    name="specificToken"
                    value={bookingData.specificToken}
                    onChange={handleInputChange}
                    min="1"
                    max={session.maxTokens}
                    placeholder="Enter token number"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Available tokens: 1 - {session.maxTokens}
                  </p>
                </div>
              )}

              {/* Token Grid for 'grid' booking type */}
              {bookingData.bookingType === 'grid' && (
                <div className="space-y-4">
                  {!bookingData.appointmentDate ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                      <AlertCircle size={24} className="text-yellow-600 mx-auto mb-2" />
                      <p className="text-sm text-yellow-700 font-medium">
                        Please select an appointment date first
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Grid Header with Auto Refresh */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800">Select Token</h4>
                          <p className="text-xs text-slate-500">Click on an available token to select</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={fetchTokenAvailability}
                            disabled={loadingTokens}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Refresh availability"
                          >
                            <RefreshCw size={16} className={`text-slate-600 ${loadingTokens ? 'animate-spin' : ''}`} />
                          </button>
                          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoRefresh}
                              onChange={(e) => setAutoRefresh(e.target.checked)}
                              className="w-4 h-4 text-sky-500 rounded border-slate-300 focus:ring-sky-400"
                            />
                            Auto refresh
                          </label>
                        </div>
                      </div>

                      {/* Token Grid */}
                      {loadingTokens ? (
                        <div className="flex items-center justify-center py-12">
                          <motion.div
                            className="w-8 h-8 border-4 border-slate-200 border-t-sky-500 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                      ) : tokenAvailability.length > 0 ? (
                        <>
                          {/* Statistics */}
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                              <div className="font-bold text-green-700">
                                {tokenAvailability.filter(t => t.status === 'available').length}
                              </div>
                              <div className="text-green-600">Available</div>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                              <div className="font-bold text-red-700">
                                {tokenAvailability.filter(t => t.status === 'booked').length}
                              </div>
                              <div className="text-red-600">Booked</div>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                              <div className="font-bold text-yellow-700">
                                {tokenAvailability.filter(t => t.status === 'locked').length}
                              </div>
                              <div className="text-yellow-600">Locked</div>
                            </div>
                          </div>

                          {/* Grid of Tokens */}
                          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                            {tokenAvailability.map((token) => (
                              <motion.button
                                key={token.tokenNumber}
                                type="button"
                                onClick={() => handleTokenSelect(token)}
                                disabled={!token.isAvailable}
                                className={`
                                  relative aspect-square rounded-lg font-semibold text-sm
                                  transition-all duration-200
                                  ${token.status === 'available'
                                    ? 'bg-green-100 border-2 border-green-300 text-green-700 hover:bg-green-200 hover:scale-105 cursor-pointer'
                                    : token.status === 'booked'
                                    ? 'bg-red-100 border-2 border-red-300 text-red-400 cursor-not-allowed opacity-60'
                                    : 'bg-yellow-100 border-2 border-yellow-300 text-yellow-400 cursor-not-allowed opacity-60'
                                  }
                                  ${selectedToken?.tokenNumber === token.tokenNumber
                                    ? 'ring-4 ring-sky-400 scale-105 bg-sky-500 border-sky-600 text-white'
                                    : ''
                                  }
                                `}
                                whileHover={token.isAvailable ? { scale: 1.05 } : {}}
                                whileTap={token.isAvailable ? { scale: 0.95 } : {}}
                              >
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <div className="text-lg font-bold">
                                    {token.tokenNumber}
                                  </div>
                                  <div className="text-[10px] mt-0.5 opacity-75">
                                    {token.estimatedTime}
                                  </div>
                                </div>
                                {!token.isAvailable && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Lock size={12} className="opacity-50" />
                                  </div>
                                )}
                              </motion.button>
                            ))}
                          </div>

                          {/* Legend */}
                          <div className="flex flex-wrap gap-4 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded"></div>
                              <span className="text-slate-600">Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded opacity-60"></div>
                              <span className="text-slate-600">Booked</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-yellow-100 border-2 border-yellow-300 rounded opacity-60"></div>
                              <span className="text-slate-600">Locked (5 min)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-sky-500 border-2 border-sky-600 rounded ring-2 ring-sky-300"></div>
                              <span className="text-slate-600">Selected</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                          <GridIcon size={32} className="text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">
                            Click refresh to load token availability
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Calculate Button - Hidden for grid mode */}
              {bookingData.bookingType !== 'grid' && (
                <button
                  type="button"
                  onClick={calculateTokenPrediction}
                  disabled={isCalculating || !bookingData.appointmentDate ||
                    (bookingData.bookingType === 'time' && !bookingData.preferredTime) ||
                    (bookingData.bookingType === 'token' && !bookingData.specificToken)}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isCalculating ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Hash size={18} />
                      Calculate Token & Time
                    </>
                  )}
                </button>
              )}

              {/* Token Prediction Display */}
              <AnimatePresence>
                {predictedToken && (
                  <motion.div
                    className={`p-4 rounded-xl border-2 ${
                      predictedToken.isOverLimit 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-green-50 border-green-200'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {predictedToken.isOverLimit ? (
                        <AlertCircle size={20} className="text-red-500" />
                      ) : (
                        <CheckCircle size={20} className="text-green-500" />
                      )}
                      <h4 className={`font-semibold ${
                        predictedToken.isOverLimit ? 'text-red-800' : 'text-green-800'
                      }`}>
                        Token Prediction
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Token Number:</span>
                        <div className="font-bold text-lg">#{predictedToken.tokenNumber}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">Estimated Time:</span>
                        <div className="font-bold text-lg">{predictedToken.estimatedDateTime || predictedToken.estimatedTime}</div>
                      </div>
                      {predictedToken.availableTokens !== undefined && (
                        <div className="sm:col-span-2">
                          <span className="text-slate-600">Available Tokens:</span>
                          <div className="font-medium text-green-600">{predictedToken.availableTokens} out of {session.maxTokens} remaining</div>
                        </div>
                      )}
                    </div>
                    {predictedToken.isOverLimit && (
                      <p className="text-red-600 text-xs mt-2">
                        This token exceeds the daily limit. You may be placed on a waiting list.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-3 sm:mb-4">Emergency Contact (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={bookingData.emergencyContact}
                  onChange={handleInputChange}
                  placeholder="Emergency contact name"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={bookingData.emergencyPhone}
                  onChange={handleInputChange}
                  placeholder="Emergency contact phone"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col gap-3 pt-4 sm:pt-6 border-t border-slate-200">
            {/* Grid mode helper text */}
            {bookingData.bookingType === 'grid' && !predictedToken && bookingData.appointmentDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 text-center">
                <Zap size={16} className="inline mr-2" />
                Select a token from the grid above to continue
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !predictedToken}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader size={16} className="animate-spin sm:w-5 sm:h-5" />
                  Booking...
                </>
              ) : (
                <>
                  Book & Pay ₹{doctor.consultationFee}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full px-4 sm:px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}