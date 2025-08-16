'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Calendar, 
  User,
  GraduationCap,
  Award,
  Building2
} from "lucide-react";
import BookingModal from "@/components/BookingModal";

// Hospitals data
const hospitals = [
  {
    id: "hosp-001",
    name: "CityCare Medical Center",
    address: "123 Healthcare Ave, Medical District",
    phone: "+1-555-0100",
    email: "info@citycare.com",
    image: "🏥",
    description: "A premier multi-specialty hospital with state-of-the-art facilities and experienced medical professionals.",
    specialties: ["Cardiology", "Neurology", "Orthopedics", "General Medicine", "Pediatrics"],
    rating: 4.8,
    totalDoctors: 25,
    established: 1985
  },
  {
    id: "hosp-002", 
    name: "MetroHealth Hospital",
    address: "456 Medical Plaza, Downtown",
    phone: "+1-555-0200",
    email: "contact@metrohealth.com",
    image: "🏨",
    description: "Modern healthcare facility specializing in emergency care and advanced surgical procedures.",
    specialties: ["Emergency Medicine", "Surgery", "ENT", "Dermatology", "Urology"],
    rating: 4.6,
    totalDoctors: 18,
    established: 1995
  },
  {
    id: "hosp-003",
    name: "WellnessPoint Clinic",
    address: "789 Wellness Blvd, Suburbs",
    phone: "+1-555-0300", 
    email: "hello@wellnesspoint.com",
    image: "🏩",
    description: "Community-focused clinic providing comprehensive family healthcare services.",
    specialties: ["Family Medicine", "Pediatrics", "Women's Health", "Preventive Care"],
    rating: 4.7,
    totalDoctors: 12,
    established: 2005
  }
];

// Doctors data
const doctors = [
  {
    id: "doc-1000",
    name: "Dr. Anita Sharma",
    specialty: "Cardiology",
    bio: "Leading cardiologist with 15+ years of experience in interventional cardiology and heart disease prevention.",
    qualification: "MBBS, MD (Cardiology), DM (Cardiology)",
    experience: 15,
    rating: 4.9,
    image: "👩‍⚕️",
    sessions: [
      {
        hospitalId: "hosp-001",
        hospitalName: "CityCare Medical Center",
        days: ["Monday", "Wednesday", "Friday"],
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "13:00", 
            maxTokens: 20,
            currentToken: 3,
            lastAssigned: 8,
            avgMinutesPerPatient: 20,
            status: "active"
          }
        ]
      },
      {
        hospitalId: "hosp-002",
        hospitalName: "MetroHealth Hospital", 
        days: ["Tuesday", "Thursday"],
        timeSlots: [
          {
            startTime: "14:00",
            endTime: "18:00",
            maxTokens: 15,
            currentToken: 2,
            lastAssigned: 5,
            avgMinutesPerPatient: 15,
            status: "active"
          }
        ]
      }
    ],
    reserved: [],
    phone: "+1-555-1001",
    email: "dr.anita.sharma@citycare.com"
  },
  {
    id: "doc-1001", 
    name: "Dr. Rajesh Iyer",
    specialty: "General Medicine",
    bio: "Experienced general physician focused on preventive care and chronic disease management.",
    qualification: "MBBS, MD (Internal Medicine)",
    experience: 12,
    rating: 4.7,
    image: "👨‍⚕️",
    sessions: [
      {
        hospitalId: "hosp-001",
        hospitalName: "CityCare Medical Center",
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        timeSlots: [
          {
            startTime: "08:00",
            endTime: "12:00",
            maxTokens: 25,
            currentToken: 5,
            lastAssigned: 12,
            avgMinutesPerPatient: 10,
            status: "active"
          },
          {
            startTime: "14:00", 
            endTime: "17:00",
            maxTokens: 18,
            currentToken: 2,
            lastAssigned: 8,
            avgMinutesPerPatient: 10,
            status: "active"
          }
        ]
      }
    ],
    reserved: [],
    phone: "+1-555-1002",
    email: "dr.rajesh.iyer@citycare.com"
  },
  {
    id: "doc-1002",
    name: "Dr. Kiran Menon", 
    specialty: "Orthopedics",
    bio: "Orthopedic surgeon specializing in joint replacement and sports medicine.",
    qualification: "MBBS, MS (Orthopedics)",
    experience: 18,
    rating: 4.8,
    image: "👨‍⚕️",
    sessions: [
      {
        hospitalId: "hosp-001",
        hospitalName: "CityCare Medical Center",
        days: ["Monday", "Wednesday", "Friday"],
        timeSlots: [
          {
            startTime: "10:00",
            endTime: "14:00",
            maxTokens: 12,
            currentToken: 3,
            lastAssigned: 7,
            avgMinutesPerPatient: 25,
            status: "active"
          }
        ]
      }
    ],
    reserved: [],
    phone: "+1-555-1003", 
    email: "dr.kiran.menon@citycare.com"
  },
  {
    id: "doc-1003",
    name: "Dr. Priya Nair",
    specialty: "Dermatology", 
    bio: "Dermatologist with expertise in cosmetic and medical dermatology procedures.",
    qualification: "MBBS, MD (Dermatology)",
    experience: 10,
    rating: 4.6,
    image: "👩‍⚕️",
    sessions: [
      {
        hospitalId: "hosp-002",
        hospitalName: "MetroHealth Hospital",
        days: ["Tuesday", "Thursday", "Saturday"],
        timeSlots: [
          {
            startTime: "11:00",
            endTime: "16:00", 
            maxTokens: 15,
            currentToken: 4,
            lastAssigned: 9,
            avgMinutesPerPatient: 20,
            status: "active"
          }
        ]
      }
    ],
    reserved: [],
    phone: "+1-555-2001",
    email: "dr.priya.nair@metrohealth.com"
  },
  {
    id: "doc-1004",
    name: "Dr. Suresh Kumar",
    specialty: "Pediatrics",
    bio: "Pediatrician dedicated to providing comprehensive healthcare for children and adolescents.",
    qualification: "MBBS, MD (Pediatrics)",
    experience: 14,
    rating: 4.9,
    image: "👨‍⚕️", 
    sessions: [
      {
        hospitalId: "hosp-001",
        hospitalName: "CityCare Medical Center",
        days: ["Monday", "Tuesday", "Friday"],
        timeSlots: [
          {
            startTime: "09:00",
            endTime: "13:00",
            maxTokens: 20,
            currentToken: 6,
            lastAssigned: 14,
            avgMinutesPerPatient: 15,
            status: "active"
          }
        ]
      },
      {
        hospitalId: "hosp-003",
        hospitalName: "WellnessPoint Clinic", 
        days: ["Wednesday", "Thursday", "Saturday"],
        timeSlots: [
          {
            startTime: "15:00",
            endTime: "19:00",
            maxTokens: 16,
            currentToken: 3,
            lastAssigned: 8,
            avgMinutesPerPatient: 15,
            status: "active"
          }
        ]
      }
    ],
    reserved: [],
    phone: "+1-555-1004",
    email: "dr.suresh.kumar@citycare.com"
  },
  {
    id: "doc-1005",
    name: "Dr. Meera Das",
    specialty: "ENT",
    bio: "ENT specialist with expertise in ear, nose, and throat disorders and surgeries.",
    qualification: "MBBS, MS (ENT)",
    experience: 13,
    rating: 4.7,
    image: "👩‍⚕️",
    sessions: [
      {
        hospitalId: "hosp-002", 
        hospitalName: "MetroHealth Hospital",
        days: ["Monday", "Wednesday", "Friday"],
        timeSlots: [
          {
            startTime: "10:00",
            endTime: "14:00",
            maxTokens: 12,
            currentToken: 2,
            lastAssigned: 6,
            avgMinutesPerPatient: 25,
            status: "active"
          }
        ]
      }
    ],
    reserved: [],
    phone: "+1-555-2002",
    email: "dr.meera.das@metrohealth.com"
  },
  {
    id: "doc-1006",
    name: "Dr. Arjun Varma",
    specialty: "Neurology",
    bio: "Neurologist specializing in brain and nervous system disorders with advanced diagnostic capabilities.",
    qualification: "MBBS, MD (Medicine), DM (Neurology)", 
    experience: 16,
    rating: 4.8,
    image: "👨‍⚕️",
    sessions: [
      {
        hospitalId: "hosp-001",
        hospitalName: "CityCare Medical Center",
        days: ["Tuesday", "Thursday"],
        timeSlots: [
          {
            startTime: "14:00",
            endTime: "18:00",
            maxTokens: 10,
            currentToken: 1,
            lastAssigned: 4,
            avgMinutesPerPatient: 30,
            status: "active"
          }
        ]
      }
    ],
    reserved: [],
    phone: "+1-555-1006", 
    email: "dr.arjun.varma@citycare.com"
  }
];

// Helper functions
const getDoctorById = (id) => doctors.find(d => d.id === id);
const getHospitalById = (id) => hospitals.find(h => h.id === id);

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.doctorId;
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [userTokens, setUserTokens] = useState([]);
  
  const doctor = getDoctorById(doctorId);

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-12 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20">
          <div className="text-6xl mb-4">👨‍⚕️</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Doctor not found</h2>
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

  const openBooking = (session, timeSlot, mode) => {
    setSelectedSession({ ...session, timeSlot });
    setModalMode(mode);
  };

  const confirmBooking = ({doctorId, tokenNumber, predictedTime, mode}) => {
    const id = Math.random().toString(36).slice(2,9);
    const token = {
      id,
      doctorId,
      tokenNumber,
      predictedTime,
      mode,
      hospitalId: selectedSession.hospitalId,
      hospitalName: selectedSession.hospitalName,
      createdAt: new Date().toISOString(),
      status: "booked"
    };
    setUserTokens(prev => [token, ...prev]);
    setModalMode(null);
    setSelectedSession(null);
  };

  const getTodaysAvailableSessions = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return doctor.sessions.filter(session => session.days.includes(today));
  };

  const isSessionActiveToday = (session) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return session.days.includes(today);
  };

  const getNextAvailableDay = (session) => {
    const today = new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayIndex = today.getDay();
    
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (todayIndex + i) % 7;
      const nextDay = daysOfWeek[nextDayIndex];
      if (session.days.includes(nextDay)) {
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + i);
        return nextDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      }
    }
    return null;
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-x-hidden"
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

        {/* Doctor Profile Section */}
        <motion.section 
          className="px-4 lg:px-8 pb-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur-xl rounded-3xl p-8 lg:p-12 shadow-2xl border border-white/20">
            <motion.div 
              className="flex flex-col lg:flex-row gap-8 items-start"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <motion.div 
                className="text-8xl lg:text-9xl"
                variants={itemVariants}
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {doctor.image}
              </motion.div>
              
              <div className="flex-1 space-y-6">
                <motion.h1
                  className="text-4xl lg:text-5xl font-bold text-slate-800 leading-tight"
                  variants={itemVariants}
                >
                  {doctor.name}
                </motion.h1>
                
                <motion.div 
                  className="inline-block bg-sky-100 px-4 py-2 rounded-xl border border-sky-200"
                  variants={itemVariants}
                >
                  <span className="text-sky-700 font-semibold text-lg">{doctor.specialty}</span>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-4 text-lg"
                  variants={itemVariants}
                >
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={18} 
                        fill={i < Math.floor(doctor.rating) ? "currentColor" : "none"}
                        className="text-yellow-500"
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-slate-700">{doctor.rating} ({Math.floor(Math.random() * 200) + 50} reviews)</span>
                </motion.div>
                
                <motion.p 
                  className="text-xl text-slate-600 leading-relaxed"
                  variants={itemVariants}
                >
                  {doctor.bio}
                </motion.p>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-200"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
            >
              <motion.div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl" variants={itemVariants}>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <GraduationCap size={18} className="text-purple-600" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-800">Qualification</span>
                  <span className="text-slate-600 text-sm">{doctor.qualification}</span>
                </div>
              </motion.div>
              <motion.div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl" variants={itemVariants}>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Award size={18} className="text-green-600" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-800">Experience</span>
                  <span className="text-slate-600 text-sm">{doctor.experience} years</span>
                </div>
              </motion.div>
              <motion.div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl" variants={itemVariants}>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Phone size={18} className="text-blue-600" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-800">Contact</span>
                  <span className="text-slate-600 text-sm">{doctor.phone}</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Active Bookings */}
        {userTokens.length > 0 && (
          <motion.section 
            className="px-4 lg:px-8 pb-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/20">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                📋 Your Bookings with {doctor.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userTokens.map((token) => (
                  <motion.div
                    key={token.id}
                    className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-4 rounded-2xl border border-yellow-300 shadow-md"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    whileHover={{ scale: 1.01, x: 5 }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-lg font-bold text-slate-800">#{token.tokenNumber}</span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold text-white ${
                        token.status === 'booked' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {token.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-sm text-slate-700 font-medium">{token.hospitalName}</span>
                      <span className="block text-sm text-slate-600">ETA: {token.predictedTime}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Sessions Section */}
        <motion.section 
          className="px-4 lg:px-8 pb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.7 }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.h2 
              className="text-3xl font-bold text-slate-800 mb-8 text-center"
              variants={itemVariants}
            >
              🏥 Hospital Sessions & Availability
            </motion.h2>
            
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {doctor.sessions.map((session, index) => {
                const hospital = getHospitalById(session.hospitalId);
                const isActiveToday = isSessionActiveToday(session);
                const nextAvailableDay = !isActiveToday ? getNextAvailableDay(session) : null;
                
                return (
                  <motion.div
                    key={`${session.hospitalId}-${index}`}
                    className={`bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-lg border transition-all duration-300 ${
                      isActiveToday ? 'border-green-200 bg-green-50/50' : 'border-slate-200'
                    }`}
                    variants={itemVariants}
                    whileHover={{ 
                      scale: 1.02,
                      y: -5,
                      transition: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Building2 size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-800">{session.hospitalName}</h4>
                          <p className="text-sm text-slate-600">{hospital?.address}</p>
                        </div>
                      </div>
                      {isActiveToday && (
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          Today
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
                      <Calendar size={16} />
                      <span>{session.days.join(', ')}</span>
                    </div>

                    <div className="space-y-4">
                      {session.timeSlots.map((timeSlot, slotIndex) => (
                        <div 
                          key={slotIndex} 
                          className={`p-4 rounded-2xl border-2 ${
                            isActiveToday 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-slate-200 bg-slate-50 opacity-75'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-slate-600" />
                              <span className="font-semibold text-slate-800">
                                {timeSlot.startTime} - {timeSlot.endTime}
                              </span>
                            </div>
                            {isActiveToday && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-semibold">
                                Active
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                            <div>
                              <span className="block text-slate-500">Available Tokens</span>
                              <span className="font-semibold text-slate-800">
                                {timeSlot.maxTokens - timeSlot.currentToken} / {timeSlot.maxTokens}
                              </span>
                            </div>
                            <div>
                              <span className="block text-slate-500">Current Token</span>
                              <span className="font-semibold text-slate-800">#{timeSlot.currentToken}</span>
                            </div>
                            <div>
                              <span className="block text-slate-500">Avg Time</span>
                              <span className="font-semibold text-slate-800">{timeSlot.avgMinutesPerPatient} min</span>
                            </div>
                          </div>

                          {isActiveToday ? (
                            <div className="flex gap-2 flex-wrap">
                              <motion.button 
                                className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-lg flex-1 min-w-[120px]"
                                onClick={() => openBooking(session, timeSlot, 'next')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                Get Next Token
                              </motion.button>
                              <motion.button 
                                className="border-2 border-sky-400 text-sky-600 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 hover:bg-sky-50 flex-1 min-w-[120px]"
                                onClick={() => openBooking(session, timeSlot, 'time')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                Book by Time
                              </motion.button>
                            </div>
                          ) : (
                            <div className="text-center py-2 text-slate-500">
                              <span className="text-sm">Next available: {nextAvailableDay}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.section>

        {/* Booking Modal */}
        <AnimatePresence>
          {selectedSession && modalMode && (
            <BookingModal 
              mode={modalMode} 
              doctor={{
                ...doctor,
                // Convert session data to the format expected by BookingModal
                current_token: selectedSession.timeSlot.currentToken,
                max_tokens: selectedSession.timeSlot.maxTokens,
                avg_seconds: selectedSession.timeSlot.avgMinutesPerPatient * 60,
                last_assigned: selectedSession.timeSlot.lastAssigned
              }}
              onClose={() => {setModalMode(null); setSelectedSession(null)}} 
              onConfirm={confirmBooking} 
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}