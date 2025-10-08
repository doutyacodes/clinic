'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Star, 
  User, 
  GraduationCap, 
  Award,
  CreditCard,
  ChevronRight,
  Heart,
  ThumbsUp,
  CheckCircle,
  AlertCircle,
  Loader
} from "lucide-react";
import AppointmentBookingModal from "../../../components/AppointmentBookingModal";
import { useAuth } from "../../../contexts/AuthContext";
import Image from "next/image";

// Helper function to convert 24hr to 12hr format
const convertTo12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.doctorId;
  const { isAuthenticated } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (doctorId) {
      fetchDoctorDetails();
    }
  }, [doctorId]);

  const fetchDoctorDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/doctors/${doctorId}`);
      const data = await response.json();
      
      if (response.ok) {
        setDoctor(data.doctor);
      } else {
        setError(data.error || 'Doctor not found');
      }
    } catch (error) {
      console.error('Error fetching doctor:', error);
      setError('Failed to fetch doctor details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = (sessionData, timeSlot) => {
    if (!isAuthenticated) {
      // Redirect to login with current page as redirect parameter
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    
    // Ensure session has hospitalId from timeSlot if missing
    const sessionWithHospitalId = {
      ...sessionData,
      hospitalId: sessionData.hospitalId || timeSlot.hospitalId
    };
    
    setSelectedSession(sessionWithHospitalId);
    setSelectedTimeSlot(timeSlot);
    setShowBookingModal(true);
  };

  const getTodaysAvailability = () => {
    if (!doctor?.sessionsByHospital) return [];
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return doctor.sessionsByHospital.filter(hospitalSession => 
      hospitalSession.sessions.some(session => 
        session.dayOfWeek === today && session.availableSlots > 0
      )
    );
  };

  const isAvailableToday = getTodaysAvailability().length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center pt-16">
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
          <p className="text-slate-600 text-lg">Loading doctor details...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center pt-16">
        <div className="text-center p-12 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20">
          <div className="text-6xl mb-4">👨‍⚕️</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Doctor not found</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            onClick={() => router.push("/")}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative pt-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Background patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 opacity-70 z-0" 
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
          className="p-4 lg:p-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.button 
            className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-white/30 rounded-2xl px-6 py-3 text-slate-700 font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl"
            onClick={() => router.back()}
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </motion.button>
        </motion.header>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-12">
          {/* Doctor Info Section */}
          <motion.section 
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 lg:p-12 shadow-2xl border border-white/20 mb-8"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <motion.div 
                className="text-8xl lg:text-9xl text-center lg:text-left"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                {doctor.image ? <Image src={doctor.image} alt={doctor.image} width={400} height={300} /> : '👨‍⚕️'}
              </motion.div>
              
              <div className="flex-1 space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 leading-tight mb-2">
                    {doctor.name}
                  </h1>
                  <p className="text-2xl text-sky-600 font-semibold mb-4">{doctor.specialty}</p>
                  
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-xl border border-yellow-200">
                      <Star size={20} fill="currentColor" className="text-yellow-600" />
                      <span className="font-bold text-yellow-800">{doctor.rating}</span>
                      <span className="text-yellow-700">({doctor.totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-xl border border-green-200">
                      <GraduationCap size={20} className="text-green-600" />
                      <span className="font-semibold text-green-800">{doctor.experience} years exp.</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-xl border border-blue-200">
                      <CreditCard size={20} className="text-blue-600" />
                      <span className="font-semibold text-blue-800">₹{doctor.consultationFee}</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="flex items-center gap-3">
                    <Award size={20} className="text-sky-500" />
                    <span className="text-slate-700 font-medium">{doctor.qualification}</span>
                  </div>
                  
                  <p className="text-lg text-slate-600 leading-relaxed">
                    {doctor.bio}
                  </p>
                </motion.div>

                {/* Quick Action Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  {isAvailableToday ? (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={20} className="text-green-600" />
                        <span className="text-green-700 font-semibold">Available Today</span>
                      </div>
                      <button 
                        onClick={() => setActiveTab('availability')}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                      >
                        <Calendar size={18} />
                        Book Today
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={20} className="text-yellow-600" />
                        <span className="text-yellow-700 font-semibold">Not Available Today</span>
                      </div>
                      <button 
                        onClick={() => setActiveTab('availability')}
                        className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                      >
                        <Calendar size={18} />
                        View Schedule
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* Navigation Tabs */}
          <motion.div 
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 mb-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'availability', label: 'Availability & Booking', icon: Calendar },
                { id: 'reviews', label: 'Reviews', icon: Star }
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-sky-500 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'availability' && (
              <motion.div
                key="availability"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-white/20">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Schedule & Availability</h2>
                  
                  <div className="space-y-6">
                    {doctor.sessionsByHospital?.map((hospitalData, hospitalIndex) => (
                      <div key={hospitalIndex} className="border border-slate-200 rounded-2xl p-6 hover:border-sky-300 transition-colors duration-200">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{hospitalData.hospitalName}</h3>
                            <div className="flex items-center gap-2 text-slate-600 mb-2">
                              <MapPin size={16} className="text-sky-500" />
                              <span>{hospitalData.hospitalAddress}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone size={16} className="text-sky-500" />
                              <span>{hospitalData.hospitalPhone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {hospitalData.sessions?.map((session, sessionIndex) => (
                            <motion.div
                              key={sessionIndex}
                              className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-sky-300 transition-all duration-200"
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Clock size={16} className="text-sky-500" />
                                  <span className="font-semibold text-slate-800">
                                    {convertTo12Hour(session.startTime)} - {convertTo12Hour(session.endTime)}
                                  </span>
                                </div>
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                                  {session.dayOfWeek}
                                </span>
                              </div>
                              
                              <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">Available slots:</span>
                                  <span className="font-semibold text-green-600">
                                    {session.availableSlots}/{session.maxTokens}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">Avg. time:</span>
                                  <span className="font-semibold text-slate-700">
                                    {session.avgMinutesPerPatient} min
                                  </span>
                                </div>
                              </div>

                              <motion.button
                                onClick={() => {
                                  const sessionWithHospital = {
                                    ...session,
                                    hospitalId: hospitalData.hospitalId,
                                    hospitalName: hospitalData.hospitalName
                                  };
                                  handleBookAppointment(sessionWithHospital, {
                                    hospitalName: hospitalData.hospitalName,
                                    hospitalId: hospitalData.hospitalId
                                  });
                                }}
                                disabled={session.availableSlots <= 0}
                                className={`w-full py-2 px-4 rounded-xl font-semibold transition-all duration-200 ${
                                  session.availableSlots > 0
                                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:shadow-lg'
                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                }`}
                                whileHover={{ scale: session.availableSlots > 0 ? 1.05 : 1 }}
                                whileTap={{ scale: session.availableSlots > 0 ? 0.95 : 1 }}
                              >
                                {session.availableSlots > 0 ? 'Book Now' : 'Fully Booked'}
                              </motion.button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <AppointmentBookingModal
            doctor={doctor}
            session={selectedSession}
            timeSlot={selectedTimeSlot}
            onClose={() => {
              setShowBookingModal(false);
              setSelectedSession(null);
              setSelectedTimeSlot(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}