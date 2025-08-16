'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Loader,
  Heart,
  Shield,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Stethoscope,
  UserCheck,
  Key,
  Clock
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function ModernLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('login'); // 'login' or 'forgot'
  
  const { login, isAuthenticated, isLoading: authLoading, error: authError, clearError } = useAuth();
  const router = useRouter();
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 500], [0, -100]);

  // Get redirect URL from search params
  const [redirectTo, setRedirectTo] = useState('/');

  useEffect(() => {
    // Get redirect parameter from URL
    const searchParams = new URLSearchParams(window.location.search);
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectTo(redirect);
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, authLoading, router, redirectTo]);

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
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    const result = await login(formData.email, formData.password, formData.rememberMe);
    
    if (result.success) {
      // Redirect to the intended destination or home
      router.push(redirectTo);
    } else {
      if (result.errors) {
        setErrors(result.errors);
      }
    }
    
    setIsLoading(false);
  };


  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-sky-50 -z-10"></div>
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
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Authenticating...</h2>
          <p className="text-slate-600">Verifying your credentials</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ultra Modern Background */}
      <motion.div 
        className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-sky-50 -z-10"
        style={{ y: backgroundY }}
      />
      
      {/* Floating Elements */}
      <div className="fixed inset-0 -z-5 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-10 w-32 h-32 bg-sky-200/20 rounded-full blur-xl"
          animate={{ 
            y: [-20, 20, -20], 
            x: [-10, 10, -10],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 right-20 w-24 h-24 bg-blue-200/20 rounded-full blur-xl"
          animate={{ 
            y: [20, -20, 20], 
            x: [10, -10, 10],
            scale: [1.1, 1, 1.1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-purple-200/20 rounded-full blur-xl"
          animate={{ 
            y: [-30, 30, -30], 
            x: [-15, 15, -15],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Decorative Icons */}
      <div className="fixed inset-0 -z-5 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-16 text-sky-200/40"
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
          <Heart size={32} />
        </motion.div>
        <motion.div
          className="absolute bottom-32 right-16 text-blue-200/40"
          animate={{ 
            rotate: [0, 360]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          <Shield size={28} />
        </motion.div>
        <motion.div
          className="absolute top-1/2 left-20 text-purple-200/40"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <Stethoscope size={24} />
        </motion.div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Main Login Card */}
          <motion.div 
            className="card-modern p-8 relative overflow-hidden"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Gradient Header Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-purple-600"></div>
            
            {/* Header Section */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {/* Logo */}
              <motion.div 
                className="relative mb-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Stethoscope size={32} className="text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 rounded-2xl blur-lg opacity-30"></div>
              </motion.div>

              {/* Welcome Text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h1>
                <p className="text-slate-600">Sign in to your MediCare account</p>
              </motion.div>

              {/* Status Badge */}
              <motion.div
                className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium mt-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <Shield size={14} />
                <span>Secure Login</span>
              </motion.div>
            </motion.div>

            {/* Error Display */}
            <AnimatePresence>
              {authError && (
                <motion.div
                  className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl flex items-start gap-3"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                >
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={16} className="text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-red-800 font-semibold text-sm">Authentication Failed</p>
                    <p className="text-red-600 text-sm mt-1">{authError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {/* Email Field */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors duration-200">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl text-base transition-all duration-300 focus:outline-none focus:ring-4 bg-white/50 backdrop-blur-sm ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                        : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100 hover:border-slate-300'
                    }`}
                    disabled={isLoading}
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p 
                      className="text-red-500 text-sm mt-2 flex items-center gap-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AlertCircle size={14} />
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Password Field */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors duration-200">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl text-base transition-all duration-300 focus:outline-none focus:ring-4 bg-white/50 backdrop-blur-sm ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                        : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100 hover:border-slate-300'
                    }`}
                    disabled={isLoading}
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200 p-1 rounded-lg hover:bg-slate-100"
                    disabled={isLoading}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p 
                      className="text-red-500 text-sm mt-2 flex items-center gap-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AlertCircle size={14} />
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div 
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="w-5 h-5 text-sky-600 border-2 border-slate-300 rounded-lg focus:ring-sky-500 focus:ring-2 transition-all duration-200"
                      disabled={isLoading}
                    />
                    {formData.rememberMe && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <CheckCircle size={20} className="text-sky-600" />
                      </motion.div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors duration-200">
                    Remember me for 30 days
                  </span>
                </label>
                
                <motion.button
                  type="button"
                  onClick={() => setStep('forgot')}
                  className="text-sm text-sky-600 hover:text-sky-700 font-semibold transition-colors duration-200 hover:underline"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Forgot password?
                </motion.button>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="btn-modern btn-primary w-full text-lg py-4 group relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Signing you in...</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={20} />
                    <span>Sign In to MediCare</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </motion.button>
            </motion.form>

            {/* Divider */}
            <motion.div 
              className="my-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500 font-medium">New to MediCare?</span>
                </div>
              </div>
            </motion.div>

            {/* Sign Up Link */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <p className="text-slate-600 mb-4">
                Join thousands of patients managing their health with MediCare
              </p>
              <Link 
                href="/signup" 
                className="btn-modern btn-secondary w-full group"
              >
                <Sparkles size={18} />
                <span>Create New Account</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
            >
              <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-xl">
                <Shield size={18} className="text-green-600" />
                <span className="text-xs text-green-700 font-semibold">Bank-Level Security</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-xl">
                <CheckCircle size={18} className="text-blue-600" />
                <span className="text-xs text-blue-700 font-semibold">HIPAA Compliant</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Side Information Panel - Hidden on Mobile */}
          <motion.div 
            className="hidden lg:block absolute right-8 top-1/2 transform -translate-y-1/2 w-80"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="card-modern p-6 bg-gradient-to-br from-sky-50/50 to-blue-50/50">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Why Choose MediCare?</h3>
              
              <div className="space-y-4">
                {[
                  {
                    icon: Clock,
                    title: "Instant Booking",
                    description: "Book appointments in under 60 seconds"
                  },
                  {
                    icon: Heart,
                    title: "Expert Care",
                    description: "Access to 500+ verified specialists"
                  },
                  {
                    icon: Shield,
                    title: "Secure Platform",
                    description: "Your health data is always protected"
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <feature.icon size={18} className="text-sky-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{feature.title}</h4>
                      <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Stats */}
              <motion.div 
                className="mt-8 pt-6 border-t border-slate-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-sky-600">50K+</div>
                    <div className="text-xs text-slate-600">Happy Patients</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">4.9★</div>
                    <div className="text-xs text-slate-600">Average Rating</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}