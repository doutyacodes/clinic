'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Calendar,
  Hash,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  Lock,
  RefreshCw,
  Grid3x3 as GridIcon,
  Zap,
  Edit3
} from "lucide-react";

export default function ModifyAppointmentModal({ booking, onClose, onSuccess }) {
  // Debug: Log booking data
  console.log('ModifyAppointmentModal - Booking data:', {
    id: booking.id,
    sessionId: booking.sessionId,
    session: booking.session,
    appointmentDate: booking.appointmentDate,
    tokenNumber: booking.tokenNumber
  });

  const [modifyData, setModifyData] = useState({
    appointmentDate: booking.appointmentDate,
    modifyType: 'grid', // 'next' or 'grid'
    preferredTime: '',
    specificToken: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [predictedToken, setPredictedToken] = useState({
    tokenNumber: booking.tokenNumber,
    estimatedTime: booking.estimatedTime
  });
  const [isCalculating, setIsCalculating] = useState(false);

  // Token Grid States
  const [tokenAvailability, setTokenAvailability] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedToken, setSelectedToken] = useState({
    tokenNumber: booking.tokenNumber,
    estimatedTime: booking.estimatedTime
  });

  // Fetch token availability when date is selected and modify type is 'grid'
  useEffect(() => {
    if (modifyData.modifyType === 'grid' && modifyData.appointmentDate && booking.sessionId) {
      fetchTokenAvailability();
    }
  }, [modifyData.modifyType, modifyData.appointmentDate]);

  // Auto-refresh token grid every 30 seconds if enabled
  useEffect(() => {
    if (autoRefresh && modifyData.modifyType === 'grid' && modifyData.appointmentDate && booking.sessionId) {
      const interval = setInterval(() => {
        fetchTokenAvailability();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, modifyData.modifyType, modifyData.appointmentDate]);

  const fetchTokenAvailability = async () => {
    setLoadingTokens(true);
    setError(null);

    // Validate date is selected
    if (!modifyData.appointmentDate) {
      setError('Please select a date first');
      setLoadingTokens(false);
      return;
    }

    // Validate session data exists
    if (!booking.sessionId) {
      setError('Session information is missing. Please refresh and try again.');
      setLoadingTokens(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/appointments/token-availability?sessionId=${booking.sessionId}&date=${modifyData.appointmentDate}`
      );
      const data = await response.json();

      if (response.ok) {
        setTokenAvailability(data.tokens || []);
        console.log('Token availability loaded:', data.tokens?.length, 'tokens');
      } else {
        setError(data.error || 'Failed to load token availability');
        console.error('Token availability API error:', data);
      }
    } catch (err) {
      console.error('Token availability network error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoadingTokens(false);
    }
  };

  const handleTokenSelect = (token) => {
    if (token.status === 'available' || token.tokenNumber === booking.tokenNumber) {
      setSelectedToken(token);
      setPredictedToken({
        tokenNumber: token.tokenNumber,
        estimatedTime: token.estimatedTime,
        estimatedDateTime: formatEstimatedDateTime(modifyData.appointmentDate, token.estimatedTime)
      });
      setModifyData(prev => ({
        ...prev,
        specificToken: token.tokenNumber.toString()
      }));
      setError(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setModifyData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear prediction when changing modify type or date
    if (name === 'modifyType' || name === 'appointmentDate') {
      if (value !== modifyData[name]) {
        setPredictedToken(null);
        setSelectedToken(null);
        setTokenAvailability([]);
        setError(null);
      }
    }

    // Validate date selection immediately
    if (name === 'appointmentDate' && value) {
      const selectedDate = new Date(value);
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

      if (booking.session?.dayOfWeek && booking.session.dayOfWeek !== dayOfWeek) {
        setError(`Doctor is not available on ${dayOfWeek}. Please select a ${booking.session.dayOfWeek}.`);
      }
    }
  };

  const calculateTokenPrediction = async () => {
    setIsCalculating(true);
    setError(null);

    if (!modifyData.appointmentDate) {
      setError('Please select an appointment date first');
      setIsCalculating(false);
      return;
    }

    // Validate date is available for this session
    const selectedDate = new Date(modifyData.appointmentDate);
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    if (booking.session?.dayOfWeek && booking.session.dayOfWeek !== dayOfWeek) {
      setError(`Doctor is not available on ${dayOfWeek}. Available on ${booking.session.dayOfWeek}`);
      setIsCalculating(false);
      return;
    }

    try {
      const existingBookingsResponse = await fetch(
        `/api/appointments/check-availability?sessionId=${booking.sessionId}&date=${modifyData.appointmentDate}`
      );
      const existingBookingsData = await existingBookingsResponse.json();

      if (!existingBookingsResponse.ok) {
        throw new Error(existingBookingsData.error || 'Failed to check availability');
      }

      // Exclude current booking's token
      const existingTokens = (existingBookingsData.bookedTokens || []).filter(
        token => token !== booking.tokenNumber
      );

      let tokenNumber, estimatedTime, estimatedDateTime;

      switch (modifyData.modifyType) {
        case 'next':
          tokenNumber = 1;
          while (existingTokens.includes(tokenNumber) && tokenNumber <= booking.session.maxTokens) {
            tokenNumber++;
          }
          if (tokenNumber > booking.session.maxTokens) {
            setError(`All tokens are booked for this date. Maximum ${booking.session.maxTokens} tokens allowed.`);
            setIsCalculating(false);
            return;
          }
          estimatedTime = calculateEstimatedTime(tokenNumber);
          estimatedDateTime = formatEstimatedDateTime(modifyData.appointmentDate, estimatedTime);
          break;

        case 'grid':
          // Grid mode handles token selection separately via handleTokenSelect
          if (!modifyData.specificToken) {
            setError('Please select a token from the grid');
            setIsCalculating(false);
            return;
          }
          tokenNumber = parseInt(modifyData.specificToken);
          estimatedTime = calculateEstimatedTime(tokenNumber);
          estimatedDateTime = formatEstimatedDateTime(modifyData.appointmentDate, estimatedTime);
          break;

        default:
          tokenNumber = booking.tokenNumber;
          estimatedTime = booking.estimatedTime;
          estimatedDateTime = formatEstimatedDateTime(modifyData.appointmentDate, estimatedTime);
      }

      if (tokenNumber > booking.session.maxTokens) {
        setError(`Token number exceeds maximum limit of ${booking.session.maxTokens}`);
        setPredictedToken(null);
      } else {
        setPredictedToken({
          tokenNumber,
          estimatedTime,
          estimatedDateTime
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
    // Handle both single parameter (for backward compatibility) and two parameters
    if (!date && !time) {
      return '';
    }

    // If only one parameter, treat it as time with current appointmentDate
    if (!time && date) {
      time = date;
      date = modifyData.appointmentDate;
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

  const getNextAvailableDates = () => {
    const dates = [];
    const today = new Date();
    const sessionDayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(booking.session?.dayOfWeek || '');

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      if (date.getDay() === sessionDayIndex) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }

    return dates.slice(0, 4);
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
    const sessionStartMinutes = convertTimeToMinutes(booking.session.startTime);
    const estimatedMinutes = sessionStartMinutes + ((tokenNumber - 1) * (booking.session.avgMinutesPerPatient || 15));
    return convertMinutesToTime(estimatedMinutes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!modifyData.appointmentDate) {
      setError('Please select an appointment date');
      return;
    }

    if (!predictedToken) {
      setError('Please calculate your token first');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/appointments/modify', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: booking.id,
          appointmentDate: modifyData.appointmentDate,
          tokenNumber: predictedToken.tokenNumber,
          estimatedTime: predictedToken.estimatedTime,
          modifyType: modifyData.modifyType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess(data.booking);
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Failed to modify appointment');
      }
    } catch (error) {
      console.error('Modify appointment error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 50 },
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
    exit: { opacity: 0, scale: 0.9, y: 50, transition: { duration: 0.2 } }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
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
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Appointment Modified!</h3>
            <p className="text-slate-600 mb-6">
              Your appointment has been successfully updated. No additional payment required.
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
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white">
              <Edit3 size={16} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-800">Modify Appointment</h2>
              <p className="text-sm sm:text-base text-slate-600 hidden sm:block">Change date, time, or token • No extra charge</p>
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

        {/* Current Appointment Info */}
        <div className="bg-slate-50 rounded-2xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Current Appointment</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-slate-500">Date</p>
              <p className="font-semibold text-slate-800">{new Date(booking.appointmentDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-slate-500">Token</p>
              <p className="font-semibold text-slate-800">#{booking.tokenNumber}</p>
            </div>
            <div>
              <p className="text-slate-500">Time</p>
              <p className="font-semibold text-slate-800">{booking.estimatedTime}</p>
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

        {/* Modify Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Appointment Date *
            </label>
            <input
              type="date"
              name="appointmentDate"
              value={modifyData.appointmentDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
            />
            <p className="text-xs text-slate-500 mt-1">
              Doctor is available on {booking.session?.dayOfWeek}s from {booking.session?.startTime} to {booking.session?.endTime}
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
                        setModifyData(prev => ({ ...prev, appointmentDate: date }));
                        setPredictedToken(null);
                        setError(null);
                      }}
                      className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                        modifyData.appointmentDate === date
                          ? 'bg-purple-100 border-purple-300 text-purple-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-purple-200'
                      }`}
                    >
                      {dateLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Token Selection Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              How would you like to modify?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'next', label: 'Next Available Token', desc: 'Get the next available slot automatically', icon: 'Zap' },
                { value: 'grid', label: 'Select from Grid', desc: 'Choose your preferred time slot visually', icon: 'Grid' }
              ].map((option) => (
                <label key={option.value} className="flex items-center p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-200">
                  <input
                    type="radio"
                    name="modifyType"
                    value={option.value}
                    checked={modifyData.modifyType === option.value}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 border-2 rounded-full mr-3 flex-shrink-0 flex items-center justify-center ${
                    modifyData.modifyType === option.value ? 'border-purple-500 bg-purple-500' : 'border-slate-300'
                  }`}>
                    {modifyData.modifyType === option.value && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${modifyData.modifyType === option.value ? 'bg-purple-100' : 'bg-slate-100'}`}>
                      {option.icon === 'Zap' ? (
                        <Zap size={20} className={modifyData.modifyType === option.value ? 'text-purple-600' : 'text-slate-600'} />
                      ) : (
                        <GridIcon size={20} className={modifyData.modifyType === option.value ? 'text-purple-600' : 'text-slate-600'} />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{option.label}</div>
                      <div className="text-xs text-slate-500">{option.desc}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Token Grid */}
          {modifyData.modifyType === 'grid' && (
            <div className="space-y-4">
              {!modifyData.appointmentDate ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <AlertCircle size={24} className="text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-700 font-medium">
                    Please select an appointment date first
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Select Token</h4>
                      <p className="text-xs text-slate-500">Click on an available token</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={fetchTokenAvailability}
                        disabled={loadingTokens}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <RefreshCw size={16} className={`text-slate-600 ${loadingTokens ? 'animate-spin' : ''}`} />
                      </button>
                      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoRefresh}
                          onChange={(e) => setAutoRefresh(e.target.checked)}
                          className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        Auto
                      </label>
                    </div>
                  </div>

                  {loadingTokens ? (
                    <div className="flex items-center justify-center py-12">
                      <motion.div
                        className="w-8 h-8 border-4 border-slate-200 border-t-purple-500 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  ) : tokenAvailability.length > 0 ? (
                    <>
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

                      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                        {tokenAvailability.map((token) => {
                          const isCurrentToken = token.tokenNumber === booking.tokenNumber;
                          return (
                            <motion.button
                              key={token.tokenNumber}
                              type="button"
                              onClick={() => handleTokenSelect(token)}
                              disabled={!token.isAvailable && !isCurrentToken}
                              className={`
                                relative aspect-square rounded-lg font-semibold text-sm
                                transition-all duration-200
                                ${isCurrentToken
                                  ? 'bg-blue-100 border-2 border-blue-400 text-blue-700'
                                  : token.status === 'available'
                                  ? 'bg-green-100 border-2 border-green-300 text-green-700 hover:bg-green-200 hover:scale-105 cursor-pointer'
                                  : token.status === 'booked'
                                  ? 'bg-red-100 border-2 border-red-300 text-red-400 cursor-not-allowed opacity-60'
                                  : 'bg-yellow-100 border-2 border-yellow-300 text-yellow-400 cursor-not-allowed opacity-60'
                                }
                                ${selectedToken?.tokenNumber === token.tokenNumber
                                  ? 'ring-4 ring-purple-400 scale-105 bg-purple-500 border-purple-600 text-white'
                                  : ''
                                }
                              `}
                              whileHover={(token.isAvailable || isCurrentToken) ? { scale: 1.05 } : {}}
                              whileTap={(token.isAvailable || isCurrentToken) ? { scale: 0.95 } : {}}
                            >
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-lg font-bold">
                                  {token.tokenNumber}
                                </div>
                                <div className="text-[10px] mt-0.5 opacity-75">
                                  {token.estimatedTime}
                                </div>
                              </div>
                              {!token.isAvailable && !isCurrentToken && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Lock size={12} className="opacity-50" />
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 border-2 border-blue-400 rounded"></div>
                          <span className="text-slate-600">Current</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded"></div>
                          <span className="text-slate-600">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-500 border-2 border-purple-600 rounded ring-2 ring-purple-300"></div>
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

          {/* Calculate Button */}
          {modifyData.modifyType !== 'grid' && (
            <button
              type="button"
              onClick={calculateTokenPrediction}
              disabled={isCalculating || !modifyData.appointmentDate}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
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
                  Calculate New Token
                </>
              )}
            </button>
          )}

          {/* Token Prediction Display */}
          <AnimatePresence>
            {predictedToken && (
              <motion.div
                className="p-4 rounded-xl border-2 bg-purple-50 border-purple-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle size={20} className="text-purple-500" />
                  <h4 className="font-semibold text-purple-800">New Appointment Details</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Token Number:</span>
                    <div className="font-bold text-lg">#{predictedToken.tokenNumber}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Estimated Time:</span>
                    <div className="font-bold text-lg">{predictedToken.estimatedDateTime || predictedToken.estimatedTime}</div>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-white rounded-lg text-xs text-slate-600">
                  ✓ No additional payment required
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Buttons */}
          <div className="flex flex-col gap-3 pt-6 border-t border-slate-200">
            {modifyData.modifyType === 'grid' && !predictedToken && modifyData.appointmentDate && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm text-purple-700 text-center">
                <Zap size={16} className="inline mr-2" />
                Select a token from the grid above to continue
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !predictedToken}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit3 size={18} />
                  Update Appointment
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
