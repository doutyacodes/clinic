'use client';

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Phone,
  Star,
  Calendar,
  Users,
  ChevronRight,
  Loader,
  Heart,
  Shield,
  Clock,
  Award,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle
} from "lucide-react";
import Image from "next/image";

export default function ModernHomePage() {
  const [query, setQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('hospitals');
  const router = useRouter();
  
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -100]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.5]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch hospitals, doctors, and specialties in parallel
        const [hospitalsRes, doctorsRes, specialtiesRes] = await Promise.all([
          fetch('/api/hospitals'),
          fetch('/api/doctors'),
          fetch('/api/specialties')
        ]);

        const [hospitalsData, doctorsData, specialtiesData] = await Promise.all([
          hospitalsRes.json(),
          doctorsRes.json(),
          specialtiesRes.json()
        ]);

        if (hospitalsData.success) {
          setHospitals(hospitalsData.hospitals || []);
        }

        if (doctorsData.success) {
          setDoctors(doctorsData.doctors || []);
        }

        if (specialtiesData.success) {
          setSpecialties(specialtiesData.specialties || []);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get all unique specialties from hospitals data
  const allSpecialties = specialties.map(s => s.name).sort();

  // Filter hospitals based on search and specialty
  const filteredHospitals = hospitals.filter(hospital => {
    const matchesQuery = !query || 
      hospital.name.toLowerCase().includes(query.toLowerCase()) ||
      hospital.address.toLowerCase().includes(query.toLowerCase()) ||
      hospital.specialties.some(s => s.toLowerCase().includes(query.toLowerCase()));
    
    const matchesSpecialty = !selectedSpecialty || 
      hospital.specialties.includes(selectedSpecialty);
    
    return matchesQuery && matchesSpecialty;
  });

  // Also search doctors for the query
  const filteredDoctors = query ? doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(query.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(query.toLowerCase())
  ) : [];

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

  const handleHospitalClick = (hospital) => {
    router.push(`/hospital/${hospital.id}`);
  };

  const handleDoctorClick = (doctor) => {
    router.push(`/doctor/${doctor.id}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-sky-50"></div>
        <motion.div
          className="text-center relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-20 h-20 border-4 border-slate-200 border-t-sky-500 rounded-full mb-6 mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Loading MediCare</h2>
          <p className="text-slate-600">Preparing your healthcare experience...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-pink-50 to-red-50"></div>
        <motion.div
          className="text-center max-w-md mx-auto p-8 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <span className="text-2xl">⚠️</span>
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Something went wrong</h2>
          <p className="text-slate-600 mb-8">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-modern btn-primary"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Modern Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-sky-50 -z-10"></div>
      
      {/* Floating Elements */}
      <div className="fixed inset-0 -z-5 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-sky-200/20 rounded-full blur-xl"
          animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 right-20 w-24 h-24 bg-blue-200/20 rounded-full blur-xl"
          animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-40 h-40 bg-purple-200/20 rounded-full blur-xl"
          animate={{ y: [-30, 30, -30], x: [-15, 15, -15] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      <div className="relative z-10">
        {/* Ultra Modern Hero Section */}
        <motion.section 
          className="min-h-screen flex items-center justify-center px-6 pt-20 pb-16 relative"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <div className="container-modern text-center">
            {/* Floating Badge */}
            <motion.div
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Sparkles size={16} className="text-sky-500" />
              <span className="text-sm font-medium text-slate-700">Your Health, Our Priority</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="gradient-text">Modern</span>
              <br />
              <span className="text-slate-800">Healthcare</span>
              <br />
              <span className="text-slate-600 text-4xl md:text-5xl lg:text-6xl">Experience</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Connect with top healthcare professionals, book appointments instantly, and manage your health journey with cutting-edge technology.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <motion.button
                className="btn-modern btn-primary text-lg px-8 py-4 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('search-section').scrollIntoView({ behavior: 'smooth' })}
              >
                <Search size={20} />
                Find Healthcare
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </motion.button>
              
              <motion.button
                className="btn-modern btn-secondary text-lg px-8 py-4 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play size={20} />
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {[
                { icon: Users, value: "50K+", label: "Happy Patients" },
                { icon: Award, value: "200+", label: "Expert Doctors" },
                { icon: Heart, value: "15+", label: "Specialties" },
                { icon: Shield, value: "24/7", label: "Support" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                >
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <stat.icon size={24} className="text-sky-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Modern Search Section */}
        <motion.section 
          id="search-section"
          className="container-modern py-20"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Section Header */}
          <div className="text-center mb-12">
            <motion.h2 
              className="text-4xl md:text-5xl font-bold text-slate-800 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              Find Your Perfect <span className="gradient-text">Healthcare Match</span>
            </motion.h2>
            <motion.p 
              className="text-lg text-slate-600 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
            >
              Search through thousands of healthcare professionals and top-rated hospitals in your area
            </motion.p>
          </div>

          {/* Advanced Search Card */}
          <motion.div 
            className="card-modern p-8 mb-12 max-w-4xl mx-auto"
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Search Input */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text"
                    placeholder="Search hospitals, doctors, or specialties..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl bg-white text-base text-slate-900 transition-all duration-300 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              </div>
              
              {/* Specialty Filter */}
              <div>
                <select 
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl bg-white text-base text-slate-700 transition-all duration-300 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                  <option value="">All Specialties</option>
                  {allSpecialties.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-3 mb-8">
              {['Emergency Care', 'Cardiology', 'Pediatrics', 'Dermatology', 'Orthopedics'].map((filter) => (
                <motion.button
                  key={filter}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium hover:bg-sky-100 hover:text-sky-700 transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedSpecialty(filter)}
                >
                  {filter}
                </motion.button>
              ))}
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { icon: Users, value: hospitals.length || 0, label: "Hospitals", color: "sky" },
                { icon: Heart, value: doctors.length || 0, label: "Doctors", color: "blue" },
                { icon: Award, value: allSpecialties.length || 0, label: "Specialties", color: "purple" }
              ].map((stat, index) => (
                <motion.div 
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                    <stat.icon size={24} className={`text-${stat.color}-600`} />
                  </div>
                  <motion.div 
                    className="text-2xl font-bold text-slate-800"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1, type: "spring" }}
                    viewport={{ once: true }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-200">
              {[
                { id: 'hospitals', label: 'Hospitals', icon: MapPin },
                { id: 'doctors', label: 'Doctors', icon: Users }
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.section>

        {/* Results Section */}
        <motion.section 
          className="container-modern pb-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Doctors Section */}
          {activeTab === 'doctors' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-slate-800 mb-4">
                  Expert <span className="gradient-text">Doctors</span>
                </h3>
                <p className="text-slate-600">Connect with experienced healthcare professionals</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(query ? filteredDoctors : doctors.slice(0, 9)).map((doctor, index) => (
                  <motion.div
                    key={doctor.id}
                    className="card-modern p-6 cursor-pointer group"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -8 }}
                    onClick={() => handleDoctorClick(doctor)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {doctor.image || "👨‍⚕️"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 mb-1 group-hover:text-sky-600 transition-colors duration-200">
                          {doctor.name}
                        </h4>
                        <p className="text-sm text-slate-600 mb-2">{doctor.specialty}</p>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-500 fill-current" />
                            <span className="text-sm font-medium text-slate-700">{doctor.rating}</span>
                          </div>
                          <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                          <span className="text-sm text-slate-500">{doctor.experience}+ years</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin size={14} />
                          <span>{doctor.sessions?.length || 0} locations</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-slate-800">₹{doctor.consultationFee}</span>
                        <motion.div
                          className="flex items-center gap-1 text-sky-600 font-medium group-hover:gap-2 transition-all duration-200"
                          whileHover={{ x: 2 }}
                        >
                          <span className="text-sm">Book Now</span>
                          <ArrowRight size={16} />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {doctors.length > 9 && !query && (
                <div className="text-center mt-12">
                  <button className="btn-modern btn-secondary">
                    View All Doctors
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Hospitals Section */}
          {activeTab === 'hospitals' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-slate-800 mb-4">
                  Top-Rated <span className="gradient-text">Hospitals</span>
                </h3>
                <p className="text-slate-600">Discover leading healthcare facilities near you</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {(query ? filteredHospitals : hospitals.slice(0, 9)).map((hospital, index) => (
                  <motion.div
                    key={hospital.id}
                    className="card-modern p-6 cursor-pointer group relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -8 }}
                    onClick={() => handleHospitalClick(hospital)}
                  >
                    {/* Gradient Accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-blue-600 to-purple-600"></div>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl flex items-center justify-center overflow-hidden">
                        {hospital.image && (hospital.image.startsWith('http://') || hospital.image.startsWith('https://')) ? (
                          <Image
                            src={hospital.image}
                            alt={hospital.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">{hospital.image || "🏥"}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
                        <Star size={14} className="fill-current" />
                        <span>{hospital.rating}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-sky-600 transition-colors duration-200">
                      {hospital.name}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                      {hospital.description}
                    </p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <MapPin size={16} className="text-sky-500 flex-shrink-0" />
                        <span className="truncate">{hospital.address}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Users size={16} className="text-sky-500 flex-shrink-0" />
                        <span>{hospital.totalDoctors} Expert Doctors</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Calendar size={16} className="text-sky-500 flex-shrink-0" />
                        <span>Established {hospital.established}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {hospital.specialties.slice(0, 3).map(specialty => (
                        <span key={specialty} className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-medium">
                          {specialty}
                        </span>
                      ))}
                      {hospital.specialties.length > 3 && (
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                          +{hospital.specialties.length - 3}
                        </span>
                      )}
                    </div>

                    <motion.div 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-medium"
                      whileHover={{ x: 4 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <span>Explore Hospital</span>
                      <ArrowRight size={18} />
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {hospitals.length > 9 && !query && (
                <div className="text-center mt-12">
                  <button className="btn-modern btn-secondary">
                    View All Hospitals
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {filteredHospitals.length === 0 && query && (
                <motion.div 
                  className="text-center p-12 card-modern max-w-md mx-auto"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search size={24} className="text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">No Results Found</h3>
                  <p className="text-slate-600 mb-6">Try adjusting your search criteria or browse all hospitals.</p>
                  <button 
                    className="btn-modern btn-primary"
                    onClick={() => {
                      setQuery("");
                      setSelectedSpecialty("");
                    }}
                  >
                    Clear Filters
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.section>

        {/* Features Section */}
        <motion.section 
          className="container-modern py-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-16">
            <motion.h2 
              className="text-4xl md:text-5xl font-bold text-slate-800 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              Why Choose <span className="gradient-text">MediCare</span>
            </motion.h2>
            <motion.p 
              className="text-lg text-slate-600 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
            >
              Experience healthcare like never before with our cutting-edge platform
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: "Instant Booking",
                description: "Book appointments in seconds with real-time availability",
                color: "sky"
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your health data is protected with enterprise-grade security",
                color: "green"
              },
              {
                icon: TrendingUp,
                title: "Smart Matching",
                description: "AI-powered recommendations for the best healthcare providers",
                color: "purple"
              },
              {
                icon: Heart,
                title: "24/7 Support",
                description: "Round-the-clock assistance for all your healthcare needs",
                color: "red"
              },
              {
                icon: CheckCircle,
                title: "Verified Providers",
                description: "All doctors and hospitals are thoroughly verified and licensed",
                color: "blue"
              },
              {
                icon: Sparkles,
                title: "Modern Experience",
                description: "Intuitive interface designed for the modern patient",
                color: "amber"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="card-modern p-8 text-center group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
              >
                <div className={`w-16 h-16 bg-${feature.color}-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon size={28} className={`text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          className="container-modern py-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="card-modern p-12 text-center bg-gradient-to-r from-sky-500/5 via-blue-500/5 to-purple-500/5">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-slate-800 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              Ready to Take Control of Your Health?
            </motion.h2>
            <motion.p 
              className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
            >
              Join thousands of satisfied patients who trust MediCare for their healthcare needs
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
            >
              <button 
                className="btn-modern btn-primary text-lg px-8 py-4"
                onClick={() => document.getElementById('search-section').scrollIntoView({ behavior: 'smooth' })}
              >
                <Search size={20} />
                Find Healthcare Now
              </button>
              <button className="btn-modern btn-secondary text-lg px-8 py-4">
                <Play size={20} />
                Watch How It Works
              </button>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}