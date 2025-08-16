'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Edit3, 
  Save, 
  X, 
  Camera,
  Shield,
  Bell,
  Heart,
  Activity,
  Award,
  Clock,
  Settings,
  LogOut,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function ProfilePage() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    bloodGroup: '',
    allergies: '',
    medicalHistory: ''
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || '',
        bloodGroup: user.bloodGroup || '',
        allergies: user.allergies || '',
        medicalHistory: user.medicalHistory || ''
      });
    }
  }, [user, isAuthenticated, isLoading, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setIsEditing(false);
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    // Reset form data to original user data
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || '',
        bloodGroup: user.bloodGroup || '',
        allergies: user.allergies || '',
        medicalHistory: user.medicalHistory || ''
      });
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      router.push('/');
    }
  };

  if (isLoading) {
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
          <p className="text-slate-600 text-lg">Loading profile...</p>
        </motion.div>
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

      <div className="relative z-10 p-4 lg:p-8">
        {/* Header */}
        <motion.div 
          className="max-w-4xl mx-auto mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-white/30 rounded-2xl px-6 py-3 text-slate-700 font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl mb-6"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">My Profile</h1>
            <p className="text-lg text-slate-600">Manage your personal information</p>
          </div>
        </motion.div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              className="max-w-4xl mx-auto mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-green-500" />
                <p className="text-green-700">Profile updated successfully!</p>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              className="max-w-4xl mx-auto mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle size={20} className="text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Content */}
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-8 text-white relative">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl">
                    {user?.firstName?.charAt(0) || '👤'}
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-sky-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200">
                    <Camera size={16} />
                  </button>
                </div>
                
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-2xl font-bold mb-1">
                    {profileData.firstName} {profileData.lastName}
                  </h2>
                  <p className="text-sky-100 mb-2">{profileData.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Patient</span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <Shield size={14} />
                      Verified
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!isEditing ? (
                    <motion.button
                      onClick={() => setIsEditing(true)}
                      className="bg-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/30 transition-all duration-200 flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Edit3 size={18} />
                      Edit Profile
                    </motion.button>
                  ) : (
                    <div className="flex gap-2">
                      <motion.button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: isSaving ? 1 : 1.05 }}
                        whileTap={{ scale: isSaving ? 1 : 0.95 }}
                      >
                        {isSaving ? (
                          <Loader size={18} className="animate-spin" />
                        ) : (
                          <Save size={18} />
                        )}
                        {isSaving ? 'Saving...' : 'Save'}
                      </motion.button>
                      <motion.button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="bg-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/30 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                        whileHover={{ scale: isSaving ? 1 : 1.05 }}
                        whileTap={{ scale: isSaving ? 1 : 0.95 }}
                      >
                        <X size={18} />
                        Cancel
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-8">
              {/* Personal Information */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <User size={20} className="text-sky-500" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      First Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                      />
                    ) : (
                      <p className="text-slate-800 bg-slate-50 px-4 py-3 rounded-xl">
                        {profileData.firstName || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Last Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                      />
                    ) : (
                      <p className="text-slate-800 bg-slate-50 px-4 py-3 rounded-xl">
                        {profileData.lastName || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address
                    </label>
                    <p className="text-slate-800 bg-slate-50 px-4 py-3 rounded-xl flex items-center gap-2">
                      <Mail size={16} className="text-slate-500" />
                      {profileData.email || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                      />
                    ) : (
                      <p className="text-slate-800 bg-slate-50 px-4 py-3 rounded-xl flex items-center gap-2">
                        <Phone size={16} className="text-slate-500" />
                        {profileData.phone || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date of Birth
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={profileData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                      />
                    ) : (
                      <p className="text-slate-800 bg-slate-50 px-4 py-3 rounded-xl flex items-center gap-2">
                        <Calendar size={16} className="text-slate-500" />
                        {profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Gender
                    </label>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={profileData.gender}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <p className="text-slate-800 bg-slate-50 px-4 py-3 rounded-xl">
                        {profileData.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Address
                    </label>
                    {isEditing ? (
                      <textarea
                        name="address"
                        value={profileData.address}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 resize-none"
                      />
                    ) : (
                      <p className="text-slate-800 bg-slate-50 px-4 py-3 rounded-xl flex items-start gap-2">
                        <MapPin size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                        {profileData.address || 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Shield size={20} className="text-sky-500" />
                  Emergency Contact
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Contact Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="emergencyContact"
                        value={profileData.emergencyContact}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                      />
                    ) : (
                      <p className="text-slate-800 bg-slate-50 px-4 py-3 rounded-xl">
                        {profileData.emergencyContact || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Contact Phone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="emergencyPhone"
                        value={profileData.emergencyPhone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                      />
                    ) : (
                      <p className="text-slate-800 bg-slate-50 px-4 py-3 rounded-xl">
                        {profileData.emergencyPhone || 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Heart size={20} className="text-sky-500" />
                  Medical Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Blood Group
                    </label>
                    {isEditing ? (
                      <select
                        name="bloodGroup"
                        value={profileData.bloodGroup}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    ) : (
                      <p className="text-slate-800 bg-slate-50 px-4 py-3 rounded-xl flex items-center gap-2">
                        <Activity size={16} className="text-slate-500" />
                        {profileData.bloodGroup || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Allergies
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="allergies"
                        value={profileData.allergies}
                        onChange={handleInputChange}
                        placeholder="e.g., Penicillin, Peanuts"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                      />
                    ) : (
                      <p className="text-slate-800 bg-slate-50 px-4 py-3 rounded-xl">
                        {profileData.allergies || 'None reported'}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Medical History
                    </label>
                    {isEditing ? (
                      <textarea
                        name="medicalHistory"
                        value={profileData.medicalHistory}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Previous surgeries, chronic conditions, medications..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 resize-none"
                      />
                    ) : (
                      <p className="text-slate-800 bg-slate-50 px-4 py-3 rounded-xl">
                        {profileData.medicalHistory || 'No medical history provided'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="border-t border-slate-200 pt-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Settings size={20} className="text-sky-500" />
                  Account Settings
                </h3>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    onClick={() => router.push('/bookings')}
                    className="flex items-center justify-center gap-2 bg-sky-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-600 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Clock size={18} />
                    View My Bookings
                  </motion.button>
                  
                  <motion.button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 border border-red-300 text-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-50 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut size={18} />
                    Logout
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}