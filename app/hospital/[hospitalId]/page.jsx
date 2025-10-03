"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Star,
  Clock,
  Calendar,
  ChevronRight,
  Loader,
} from "lucide-react";
import Image from "next/image";

export default function HospitalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hospitalId = params.hospitalId;

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hospitalId) {
      fetchHospitalDetails();
    }
  }, [hospitalId]);

  const fetchHospitalDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/hospitals/${hospitalId}`);
      const data = await response.json();

      if (response.ok) {
        setHospital(data.hospital);
      } else {
        setError(data.error || "Hospital not found");
      }
    } catch (error) {
      console.error("Error fetching hospital:", error);
      setError("Failed to fetch hospital details");
    } finally {
      setLoading(false);
    }
  };

  const availableDoctors = hospital?.doctors || [];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-sky-200 border-t-sky-500 rounded-full mb-4 mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            Loading Hospital Details
          </h2>
          <p className="text-slate-500">
            Please wait while we fetch hospital information...
          </p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error || !hospital) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-12 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20">
          <div className="text-6xl mb-4">🏥</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Hospital not found
          </h2>
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const handleDoctorClick = (doctor) => {
    router.push(`/doctor/${doctor.id}`);
  };

  const getTodaysAvailableSessions = (doctor) => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return (
      doctor.sessions?.filter((session) => session.dayOfWeek === today) || []
    );
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Background patterns */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 opacity-70 z-0"
        style={{
          background: `
               radial-gradient(circle at 20% 30%, rgba(14, 165, 233, 0.08) 0%, transparent 40%),
               radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.06) 0%, transparent 40%),
               radial-gradient(circle at 40% 90%, rgba(125, 211, 252, 0.05) 0%, transparent 30%)
             `,
        }}
      />

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
            onClick={() => router.push("/")}
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={20} />
            <span>Back to Hospitals</span>
          </motion.button>
        </motion.header>

        {/* Hospital Info Section */}
        <motion.section
          className="px-4 lg:px-8 pb-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur-xl rounded-3xl p-8 lg:p-12 shadow-2xl border border-white/20">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <motion.div
                className="w-32 h-32 lg:w-40 lg:h-40 bg-gradient-to-br from-sky-100 to-blue-100 rounded-3xl flex items-center justify-center overflow-hidden flex-shrink-0"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
              >
                {hospital.image && (hospital.image.startsWith('http://') || hospital.image.startsWith('https://')) ? (
                  <Image
                    src={hospital.image}
                    alt={hospital.name}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl lg:text-8xl">{hospital.image || "🏥"}</span>
                )}
              </motion.div>

              <div className="flex-1 space-y-6">
                <motion.h1
                  className="text-4xl lg:text-5xl font-bold text-slate-800 leading-tight"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {hospital.name}
                </motion.h1>

                <motion.div
                  className="flex items-center gap-4 text-lg flex-wrap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-xl border border-yellow-200">
                    <Star
                      size={20}
                      fill="currentColor"
                      className="text-yellow-600"
                    />
                    <span className="font-semibold text-yellow-800">
                      {hospital.rating} rating
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-xl border border-blue-200">
                    <span className="font-semibold text-blue-800">
                      Est. {hospital.established}
                    </span>
                  </div>
                </motion.div>

                <motion.p
                  className="text-xl text-slate-600 leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  {hospital.description}
                </motion.p>
              </div>
            </div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-200"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
            >
              <motion.div
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
                variants={itemVariants}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <MapPin size={18} className="text-blue-600" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-800">
                    Address
                  </span>
                  <span className="text-slate-600 text-sm">
                    {hospital.address}, {hospital.city}, {hospital.state}
                  </span>
                </div>
              </motion.div>
              <motion.div
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
                variants={itemVariants}
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Phone size={18} className="text-green-600" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-800">
                    Phone
                  </span>
                  <span className="text-slate-600 text-sm">
                    {hospital.phone}
                  </span>
                </div>
              </motion.div>
              <motion.div
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
                variants={itemVariants}
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Mail size={18} className="text-purple-600" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-800">
                    Email
                  </span>
                  <span className="text-slate-600 text-sm">
                    {hospital.email}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Specialties Section */}
        <motion.section
          className="px-4 lg:px-8 pb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.h2
              className="text-3xl font-bold text-slate-800 mb-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              🩺 Available Specialties
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {hospital.specialties.map((specialty, index) => (
                <motion.div
                  key={specialty}
                  className="bg-white/90 backdrop-blur-md p-4 rounded-2xl text-center font-semibold text-slate-700 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  whileHover={{
                    scale: 1.05,
                    y: -3,
                    transition: { type: "spring", stiffness: 300, damping: 20 },
                  }}
                >
                  <span className="text-sm lg:text-base">{specialty}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Doctors Section */}
        <motion.section
          className="px-4 lg:px-8 pb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.h2
              className="text-3xl font-bold text-slate-800 mb-8 text-center"
              variants={itemVariants}
            >
              👩‍⚕️ Available Doctors ({availableDoctors.length})
            </motion.h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {availableDoctors.map((doctor, index) => {
                const todaysSessions = getTodaysAvailableSessions(doctor);
                const isAvailableToday = todaysSessions.length > 0;

                return (
                  <motion.div
                    key={doctor.id}
                    className={`bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-lg border transition-all duration-300 ${
                      isAvailableToday
                        ? "border-white/30 hover:shadow-xl hover:border-sky-200 cursor-pointer"
                        : "border-slate-200 opacity-75"
                    }`}
                    variants={itemVariants}
                    whileHover={
                      isAvailableToday
                        ? {
                            scale: 1.02,
                            y: -5,
                            transition: {
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            },
                          }
                        : {
                            scale: 1.01,
                            y: -2,
                            transition: {
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            },
                          }
                    }
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      isAvailableToday && handleDoctorClick(doctor)
                    }
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                        {doctor.image ? (
                          <Image
                            src={doctor.image}
                            alt={doctor.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">👨‍⚕️</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-lg text-sm font-semibold text-yellow-800">
                        <Star size={14} fill="currentColor" />
                        <span>{doctor.rating}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-slate-800">
                        {doctor.name}
                      </h3>
                      <p className="text-sky-600 font-semibold">
                        {doctor.specialty}
                      </p>
                      <p className="text-sm text-slate-600">
                        {doctor.experience} years experience
                      </p>

                      {isAvailableToday ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2 text-green-700 font-medium">
                            <Clock size={14} />
                            <span className="text-sm">Available Today</span>
                          </div>
                          {todaysSessions.map((session, sessionIndex) => (
                            <div
                              key={sessionIndex}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-slate-700 font-medium">
                                {session.startTime} - {session.endTime}
                              </span>
                              <span className="text-green-600 font-semibold">
                                {session.maxTokens} slots available
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-500 bg-slate-100 rounded-xl p-3">
                          <Calendar size={14} />
                          <span className="text-sm">Not available today</span>
                        </div>
                      )}
                    </div>

                    {isAvailableToday && (
                      <motion.div
                        className="mt-4 flex items-center justify-between p-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-medium transition-all duration-200"
                        whileHover={{ x: 5 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                      >
                        <span>Book Appointment</span>
                        <ChevronRight size={16} />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>

            {availableDoctors.length === 0 && (
              <motion.div
                className="text-center p-12 bg-white/90 backdrop-blur-md rounded-3xl shadow-lg border border-white/30"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <div className="text-6xl mb-4">👨‍⚕️</div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  No doctors available
                </h3>
                <p className="text-slate-600">
                  Please check back later or contact the hospital directly.
                </p>
              </motion.div>
            )}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
