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

          estimatedTime = calculateEstimatedTime(session.startTime, tokenNumber, session.avgMinutesPerPatient);
          estimatedDateTime = formatEstimatedDateTime(bookingData.appointmentDate, estimatedTime);

          setPredictedToken({
            tokenNumber,
            estimatedTime,
            estimatedDateTime,
            isOverLimit: tokenNumber > session.maxTokens,
            availableTokens: session.maxTokens - existingTokens.length
          });
          break;

        case 'time':
          if (!bookingData.preferredTime) {
            setError('Please select a preferred time');
            setIsCalculating(false);
            return;
          }

          // Calculate token from preferred time
          const preferredMinutes = timeToMinutes(bookingData.preferredTime);
          const sessionStartMinutes = timeToMinutes(session.startTime);
          const minutesDiff = preferredMinutes - sessionStartMinutes;

          tokenNumber = Math.ceil(minutesDiff / session.avgMinutesPerPatient) + 1;

          // Check if this time slot is already booked
          if (existingTimes.includes(bookingData.preferredTime)) {
            setError(`The time slot ${bookingData.preferredTime} is already booked. Please choose another time.`);
            setIsCalculating(false);
            return;
          }

          estimatedTime = bookingData.preferredTime;
          estimatedDateTime = formatEstimatedDateTime(bookingData.appointmentDate, estimatedTime);

          setPredictedToken({
            tokenNumber,
            estimatedTime,
            estimatedDateTime,
            isOverLimit: tokenNumber > session.maxTokens,
            availableTokens: session.maxTokens - existingTokens.length
          });
          break;

        case 'token':
          if (!bookingData.specificToken) {
            setError('Please enter a token number');
            setIsCalculating(false);
            return;
          }

          tokenNumber = parseInt(bookingData.specificToken);

          // Check if token is already booked
          if (existingTokens.includes(tokenNumber)) {
            setError(`Token #${tokenNumber} is already booked. Please choose another token.`);
            setIsCalculating(false);
            return;
          }

          estimatedTime = calculateEstimatedTime(session.startTime, tokenNumber, session.avgMinutesPerPatient);
          estimatedDateTime = formatEstimatedDateTime(bookingData.appointmentDate, estimatedTime);

          setPredictedToken({
            tokenNumber,
            estimatedTime,
            estimatedDateTime,
            isOverLimit: tokenNumber > session.maxTokens,
            availableTokens: session.maxTokens - existingTokens.length
          });
          break;
      }

    } catch (error) {
      console.error('Token calculation error:', error);
      setError(error.message || 'Failed to calculate token. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!predictedToken) {
      setError('Please calculate your token first');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: doctor.id,
          sessionId: session.id,
          hospitalId: session.hospitalId || timeSlot?.hospitalId,
          appointmentDate: bookingData.appointmentDate,
          tokenNumber: predictedToken.tokenNumber,
          estimatedTime: predictedToken.estimatedTime,
          bookingType: bookingData.bookingType,
          patientComplaints: bookingData.patientComplaints,
          emergencyContact: bookingData.emergencyContact,
          emergencyPhone: bookingData.emergencyPhone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);

        // If payment is required, redirect to payment URL
        if (data.paymentRequired && data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          // Show success message and redirect to booking status
          setTimeout(() => {
            window.location.href = `/booking-status/${data.booking.id}`;
          }, 2000);
        }
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

  // Helper functions
  const calculateEstimatedTime = (startTime, tokenNum, avgMinutes) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + ((tokenNum - 1) * avgMinutes);
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatEstimatedDateTime = (date, time) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const [hours, minutes] = time.split(':');
    const timeObj = new Date();
    timeObj.setHours(parseInt(hours), parseInt(minutes));
    const formattedTime = timeObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return `${formattedDate} at ${formattedTime}`;
  };

  const getNextAvailableDates = () => {
    const dates = [];
    const today = new Date();
    const sessionDayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(session.dayOfWeek);

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      if (date.getDay() === sessionDayIndex) {
        dates.push(date.toISOString().split('T')[0]);
      }

      if (dates.length >= 4) break;
    }

    return dates;
  };

  if (success) {
    return (
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
        >
          <motion.div
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <CheckCircle size={40} className="text-green-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Booking Successful!</h2>
          <p className="text-slate-600 mb-2">Your appointment has been booked.</p>
          <p className="text-sm text-slate-500">Redirecting to payment...</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 max-w-4xl w-full my-4 sm:my-8 max-h-[95vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 sticky top-0 bg-white pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full sm:rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl">
              <Heart size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Book Appointment</h2>
              <p className="text-xs sm:text-sm text-slate-600">{doctor.name} - {doctor.specialty}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} className="sm:w-6 sm:h-6 text-slate-500" />
          </button>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl flex items-start gap-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5 sm:w-5 sm:h-5" />
              <p className="text-xs sm:text-sm text-red-700">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Session Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-100">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-3 sm:mb-4">Session Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <MapPin size={14} className="text-blue-500 flex-shrink-0 sm:w-4 sm:h-4" />
                <div>
                  <p className="text-slate-600">Hospital</p>
                  <p className="font-semibold text-slate-800">{timeSlot?.hospitalName || session?.hospitalName || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Calendar size={14} className="text-blue-500 flex-shrink-0 sm:w-4 sm:h-4" />
                <div>
                  <p className="text-slate-600">Day</p>
                  <p className="font-semibold text-slate-800">{session.dayOfWeek}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock size={14} className="text-blue-500 flex-shrink-0 sm:w-4 sm:h-4" />
                <div>
                  <p className="text-slate-600">Time</p>
                  <p className="font-semibold text-slate-800">{session.startTime} - {session.endTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <CreditCard size={14} className="text-blue-500 flex-shrink-0 sm:w-4 sm:h-4" />
                <div>
                  <p className="text-slate-600">Fee</p>
                  <p className="font-semibold text-green-600">₹{doctor.consultationFee}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Date & Complaints */}
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
                            setSelectedToken(null);
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <label className="flex items-center p-2 sm:p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="radio"
                      name="bookingType"
                      value="next"
                      checked={bookingData.bookingType === 'next'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`w-3 h-3 sm:w-4 sm:h-4 border-2 rounded-full mr-2 ${
                      bookingData.bookingType === 'next' ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                    }`}>
                      {bookingData.bookingType === 'next' && (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-slate-800 flex items-center gap-1">
                        <Zap size={12} className="sm:w-3 sm:h-3" />
                        Next
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-2 sm:p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="radio"
                      name="bookingType"
                      value="time"
                      checked={bookingData.bookingType === 'time'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`w-3 h-3 sm:w-4 sm:h-4 border-2 rounded-full mr-2 ${
                      bookingData.bookingType === 'time' ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                    }`}>
                      {bookingData.bookingType === 'time' && (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-slate-800 flex items-center gap-1">
                        <Clock size={12} className="sm:w-3 sm:h-3" />
                        Time
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-2 sm:p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="radio"
                      name="bookingType"
                      value="token"
                      checked={bookingData.bookingType === 'token'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`w-3 h-3 sm:w-4 sm:h-4 border-2 rounded-full mr-2 ${
                      bookingData.bookingType === 'token' ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                    }`}>
                      {bookingData.bookingType === 'token' && (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-slate-800 flex items-center gap-1">
                        <Hash size={12} className="sm:w-3 sm:h-3" />
                        Token
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-2 sm:p-3 border-2 border-sky-300 bg-sky-50 rounded-xl cursor-pointer hover:border-sky-400 transition-colors">
                    <input
                      type="radio"
                      name="bookingType"
                      value="grid"
                      checked={bookingData.bookingType === 'grid'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`w-3 h-3 sm:w-4 sm:h-4 border-2 rounded-full mr-2 ${
                      bookingData.bookingType === 'grid' ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                    }`}>
                      {bookingData.bookingType === 'grid' && (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-sky-700 flex items-center gap-1">
                        <GridIcon size={12} className="sm:w-3 sm:h-3" />
                        Grid
                      </div>
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

              {/* TOKEN GRID DISPLAY */}
              {bookingData.bookingType === 'grid' && (
                <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      <GridIcon size={16} />
                      Available Tokens
                    </h4>
                    <button
                      type="button"
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        autoRefresh
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-white text-slate-600 border border-slate-300 hover:border-sky-300'
                      }`}
                    >
                      <RefreshCw size={10} className={`inline mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                      {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                    </button>
                  </div>

                  {/* Token Legend */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-slate-600">Available</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded flex items-center justify-center">
                        <Lock size={8} className="text-white" />
                      </div>
                      <span className="text-slate-600">Locked</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-slate-600">Booked</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-slate-600">Confirmed</span>
                    </div>
                  </div>

                  {/* Token Grid */}
                  {!bookingData.appointmentDate ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      Please select a date first to view available tokens
                    </div>
                  ) : loadingTokens ? (
                    <div className="flex justify-center py-8">
                      <Loader size={24} className="animate-spin text-sky-500" />
                    </div>
                  ) : tokenAvailability.length > 0 ? (
                    <>
                      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5 sm:gap-2">
                        {tokenAvailability.map((token) => {
                          const isSelected = selectedToken?.tokenNumber === token.tokenNumber;
                          const isAvailable = token.status === 'available';
                          const isLocked = token.status === 'locked';
                          const isBooked = token.status === 'booked';
                          const isConfirmed = token.status === 'confirmed';

                          let bgColor = 'bg-slate-300 cursor-not-allowed';
                          let textColor = 'text-slate-600';
                          let icon = null;

                          if (isAvailable) {
                            bgColor = isSelected
                              ? 'bg-green-600 ring-2 ring-white scale-110 shadow-lg'
                              : 'bg-green-500 hover:bg-green-600 cursor-pointer hover:scale-105';
                            textColor = 'text-white';
                          } else if (isLocked) {
                            bgColor = 'bg-yellow-500 cursor-not-allowed';
                            textColor = 'text-white';
                            icon = <Lock size={8} />;
                          } else if (isBooked) {
                            bgColor = 'bg-red-500 cursor-not-allowed';
                            textColor = 'text-white';
                          } else if (isConfirmed) {
                            bgColor = 'bg-blue-500 cursor-not-allowed';
                            textColor = 'text-white';
                          }

                          return (
                            <button
                              key={token.tokenNumber}
                              type="button"
                              onClick={() => handleTokenSelect(token)}
                              disabled={!isAvailable}
                              className={`relative p-2 sm:p-3 rounded-lg font-bold transition-all ${bgColor} ${textColor}`}
                              title={`Token ${token.tokenNumber} - ${token.estimatedTime} - ${token.status}`}
                            >
                              {icon && <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1">{icon}</div>}
                              <div className="text-xs sm:text-sm">{token.tokenNumber}</div>
                              <div className="text-[8px] sm:text-[10px] opacity-80 leading-tight">{token.estimatedTime}</div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Token Stats */}
                      <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-center">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <div className="font-bold text-green-700">
                            {tokenAvailability.filter(t => t.status === 'available').length}
                          </div>
                          <div className="text-green-600 text-[10px]">Available</div>
                        </div>
                        <div className="p-2 bg-yellow-50 rounded-lg">
                          <div className="font-bold text-yellow-700">
                            {tokenAvailability.filter(t => t.status === 'locked').length}
                          </div>
                          <div className="text-yellow-600 text-[10px]">Locked</div>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg">
                          <div className="font-bold text-red-700">
                            {tokenAvailability.filter(t => t.status === 'booked').length}
                          </div>
                          <div className="text-red-600 text-[10px]">Booked</div>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <div className="font-bold text-blue-700">
                            {tokenAvailability.filter(t => t.status === 'confirmed').length}
                          </div>
                          <div className="text-blue-600 text-[10px]">Confirmed</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No tokens available for this date
                    </div>
                  )}
                </div>
              )}

              {/* Calculate Button - Only for non-grid types */}
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
                        {selectedToken ? 'Selected Token' : 'Token Prediction'}
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

          {/* Important Info for Grid Mode */}
          {bookingData.bookingType === 'grid' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important Information:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Tokens are locked for 5 minutes during booking</li>
                    <li>• Complete payment to confirm your appointment</li>
                    <li>• Failed/incomplete payments will free the token</li>
                    <li>• You can change your token after booking without additional payment</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col gap-3 pt-4 sm:pt-6 border-t border-slate-200">
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
