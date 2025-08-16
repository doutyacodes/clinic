'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Phone, 
  Calendar,
  MapPin,
  Users,
  Heart,
  Shield,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Loader
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    
    // Address Information
    address: "",
    city: "",
    state: "",
    zipCode: "",
    
    // Account Security
    password: "",
    confirmPassword: "",
    
    // Health Information (Optional)
    bloodGroup: "",
    allergies: "",
    emergencyContact: "",
    emergencyPhone: "",
    
    // Preferences
    termsAccepted: false,
    marketingEmails: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup, isAuthenticated, isLoading: authLoading, error: authError, clearError } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  // Clear auth errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required";
      } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
        newErrors.phone = "Please enter a valid phone number";
      }
      if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
    }
    
    if (step === 2) {
      if (!formData.address.trim()) newErrors.address = "Address is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.state.trim()) newErrors.state = "State is required";
      if (!formData.zipCode.trim()) newErrors.zipCode = "ZIP code is required";
    }
    
    if (step === 3) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = "Password must contain uppercase, lowercase, and number";
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      
      if (!formData.termsAccepted) {
        newErrors.termsAccepted = "You must accept the terms and conditions";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;
    
    setIsLoading(true);
    
    const result = await signup(formData);
    
    if (result.success) {
      router.push('/');
    } else {
      if (result.errors) {
        setErrors(result.errors);
      }
      // If there are validation errors, go back to relevant step
      if (result.errors?.email) setCurrentStep(1);
      else if (result.errors?.address) setCurrentStep(2);
      else setCurrentStep(3);
    }
    
    setIsLoading(false);
  };

  const stepVariants = {
    hidden: { x: 100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: {
      x: -100,
      opacity: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const genders = ["Male", "Female", "Other", "Prefer not to say"];
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
    "Uttarakhand", "West Bengal"
  ];

  const renderStep1 = () => (
    <motion.div
      key="step1"
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
              <User size={18} />
            </div>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter first name"
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 ${
                errors.firstName 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                  : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
              }`}
              disabled={isLoading}
            />
          </div>
          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
              <User size={18} />
            </div>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter last name"
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 ${
                errors.lastName 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                  : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
              }`}
              disabled={isLoading}
            />
          </div>
          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
            <Mail size={18} />
          </div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 ${
              errors.email 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
            }`}
            disabled={isLoading}
          />
        </div>
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
            <Phone size={18} />
          </div>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 ${
              errors.phone 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
            }`}
            disabled={isLoading}
          />
        </div>
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
              <Calendar size={18} />
            </div>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 ${
                errors.dateOfBirth 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                  : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
              }`}
              disabled={isLoading}
            />
          </div>
          {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
              <Users size={18} />
            </div>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 appearance-none bg-white ${
                errors.gender 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                  : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
              }`}
              disabled={isLoading}
            >
              <option value="">Select gender</option>
              {genders.map(gender => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
          </div>
          {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
        </div>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
            <MapPin size={18} />
          </div>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter your full address"
            className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 ${
              errors.address 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
            }`}
            disabled={isLoading}
          />
        </div>
        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter city"
            className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 ${
              errors.city 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
            }`}
            disabled={isLoading}
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">ZIP Code</label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            placeholder="Enter ZIP code"
            className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 ${
              errors.zipCode 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
            }`}
            disabled={isLoading}
          />
          {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">State</label>
        <select
          name="state"
          value={formData.state}
          onChange={handleChange}
          className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 appearance-none bg-white ${
            errors.state 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
              : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
          }`}
          disabled={isLoading}
        >
          <option value="">Select state</option>
          {indianStates.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
        {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
      </div>

      {/* Health Information (Optional) */}
      <div className="border-t border-slate-200 pt-6">
        <h4 className="text-lg font-semibold text-slate-800 mb-4">Health Information (Optional)</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Blood Group</label>
            <select
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 focus:border-sky-400 focus:ring-sky-100 appearance-none bg-white"
              disabled={isLoading}
            >
              <option value="">Select blood group</option>
              {bloodGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Allergies</label>
            <input
              type="text"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              placeholder="Any known allergies"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 focus:border-sky-400 focus:ring-sky-100"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Emergency Contact Name</label>
            <input
              type="text"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              placeholder="Emergency contact name"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 focus:border-sky-400 focus:ring-sky-100"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Emergency Contact Phone</label>
            <input
              type="tel"
              name="emergencyPhone"
              value={formData.emergencyPhone}
              onChange={handleChange}
              placeholder="Emergency contact phone"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 focus:border-sky-400 focus:ring-sky-100"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step3"
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
            <Lock size={18} />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a strong password"
            className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 ${
              errors.password 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
            }`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
            disabled={isLoading}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        <div className="mt-2 text-xs text-slate-500">
          Password must contain at least 8 characters with uppercase, lowercase, and number
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
            <Lock size={18} />
          </div>
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl text-base transition-all duration-200 focus:outline-none focus:ring-4 ${
              errors.confirmPassword 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
            }`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
            disabled={isLoading}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
      </div>

      {/* Terms and Preferences */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              className="w-5 h-5 text-sky-600 border-2 border-slate-300 rounded focus:ring-sky-500 mt-0.5"
              disabled={isLoading}
            />
            <span className="text-sm text-slate-600 leading-relaxed">
              I agree to the{" "}
              <Link href="/terms" className="text-sky-600 hover:text-sky-700 font-medium">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-sky-600 hover:text-sky-700 font-medium">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.termsAccepted && <p className="text-red-500 text-sm mt-1">{errors.termsAccepted}</p>}
        </div>

        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              name="marketingEmails"
              checked={formData.marketingEmails}
              onChange={handleChange}
              className="w-5 h-5 text-sky-600 border-2 border-slate-300 rounded focus:ring-sky-500 mt-0.5"
              disabled={isLoading}
            />
            <span className="text-sm text-slate-600 leading-relaxed">
              I would like to receive health tips, appointment reminders, and promotional emails
            </span>
          </label>
        </div>
      </div>
    </motion.div>
  );

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex items-center justify-center">
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
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Loading...</h2>
          <p className="text-slate-500">Checking authentication status</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 opacity-70 z-0" 
           style={{
             background: `
               radial-gradient(circle at 20% 30%, rgba(14, 165, 233, 0.08) 0%, transparent 40%),
               radial-gradient(circle at 80% 70%, rgba(56, 189, 248, 0.06) 0%, transparent 40%),
               radial-gradient(circle at 40% 90%, rgba(125, 211, 252, 0.05) 0%, transparent 30%)
             `
           }} />

      {/* Floating medical icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 text-sky-200 opacity-30"
          animate={{ 
            y: [-10, 10, -10],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <CheckCircle size={40} />
        </motion.div>
        <motion.div
          className="absolute top-32 right-20 text-blue-200 opacity-20"
          animate={{ 
            y: [10, -10, 10],
            x: [-5, 5, -5]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
        >
          <Heart size={32} />
        </motion.div>
        <motion.div
          className="absolute bottom-20 left-20 text-indigo-200 opacity-25"
          animate={{ 
            rotate: [0, 360]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          <Shield size={36} />
        </motion.div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div 
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 lg:p-12 shadow-2xl border border-white/20">
            {/* Header */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-6xl mb-4">🏥</div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Create Your Account</h1>
              <p className="text-slate-600">Join our healthcare community and take control of your health</p>
            </motion.div>

            {/* Progress Indicator */}
            <motion.div 
              className="flex items-center justify-center mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center space-x-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      currentStep >= step 
                        ? 'bg-sky-500 text-white shadow-lg' 
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {currentStep > step ? <CheckCircle size={20} /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-300 ${
                        currentStep > step ? 'bg-sky-500' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Step Titles */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-xl font-semibold text-slate-800">
                {currentStep === 1 && "Personal Information"}
                {currentStep === 2 && "Address & Health Details"}
                {currentStep === 3 && "Account Security"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {currentStep === 1 && "Tell us about yourself"}
                {currentStep === 2 && "Where you live and health information"}
                {currentStep === 3 && "Secure your account"}
              </p>
            </motion.div>

            {/* Error Display */}
            <AnimatePresence>
              {authError && (
                <motion.div
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AlertCircle size={20} className="text-red-500 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-medium">Registration Failed</p>
                    <p className="text-red-600 text-sm">{authError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={currentStep === 3 ? handleSubmit : (e) => e.preventDefault()}>
              <AnimatePresence mode="wait">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <motion.div 
                className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                {currentStep > 1 ? (
                  <motion.button
                    type="button"
                    onClick={handlePrevious}
                    className="border-2 border-slate-200 text-slate-600 py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:bg-slate-50 hover:border-slate-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                  >
                    Previous
                  </motion.button>
                ) : (
                  <div></div>
                )}

                {currentStep < 3 ? (
                  <motion.button
                    type="button"
                    onClick={handleNext}
                    className="bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-sky-200 flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                  >
                    Next Step
                    <ArrowRight size={20} />
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-sky-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <>
                        <motion.div 
                          className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <CheckCircle size={20} />
                      </>
                    )}
                  </motion.button>
                )}
              </motion.div>
            </form>

            {/* Sign In Link */}
            <motion.div 
              className="text-center mt-8 pt-6 border-t border-slate-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <p className="text-slate-600">
                Already have an account?{" "}
                <Link 
                  href="/login" 
                  className="text-sky-600 hover:text-sky-700 font-semibold transition-colors duration-200"
                >
                  Sign In
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}