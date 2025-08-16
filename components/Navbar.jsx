'use client';

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  LogOut, 
  Calendar, 
  Heart, 
  Menu, 
  X, 
  Bell,
  Settings,
  FileText,
  Home,
  ChevronDown,
  Stethoscope,
  Plus
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileDropdownOpen(false);
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
      setIsProfileDropdownOpen(false);
      setIsMenuOpen(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/bookings", label: "My Appointments", icon: Calendar },
    { href: "/medical-records", label: "Medical Records", icon: FileText },
  ];

  const profileMenuItems = [
    { href: "/profile", label: "My Profile", icon: User },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'glass-effect shadow-xl border-b border-white/20' 
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container-modern">
        <div className="flex justify-between items-center h-20">
          {/* Modern Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Link 
              href="/" 
              className="flex items-center gap-3 group"
            >
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Stethoscope size={24} className="text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">MediCare</h1>
                <p className="text-xs text-slate-500 -mt-1">Your Health Partner</p>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div 
            className="hidden lg:flex items-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {!authLoading && isAuthenticated && (
              <>
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
                  >
                    <Link
                      href={link.href}
                      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 group ${
                        pathname === link.href
                          ? 'text-sky-600 bg-sky-50 shadow-md'
                          : 'text-slate-600 hover:text-sky-600 hover:bg-white/80'
                      }`}
                    >
                      <link.icon size={18} className="transition-transform duration-300 group-hover:scale-110" />
                      <span className="text-sm">{link.label}</span>
                      {pathname === link.href && (
                        <motion.div
                          className="absolute bottom-0 left-1/2 w-1 h-1 bg-sky-500 rounded-full"
                          layoutId="activeNav"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>

          {/* Right Side Actions */}
          <motion.div 
            className="hidden md:flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {authLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-2xl loading-modern"></div>
                <div className="w-20 h-4 bg-slate-200 rounded loading-modern"></div>
              </div>
            ) : isAuthenticated ? (
              <>
                {/* Modern Notifications */}
                <motion.button
                  className="relative p-3 text-slate-600 hover:text-sky-600 hover:bg-white/80 rounded-xl transition-all duration-300 group"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bell size={20} />
                  <motion.span 
                    className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.button>

                {/* Enhanced Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-3 p-2 pr-4 rounded-xl hover:bg-white/80 transition-all duration-300 group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-sky-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {user?.firstName?.charAt(0) || 'U'}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-semibold text-slate-800">{user?.firstName || 'User'}</p>
                      <p className="text-xs text-slate-500">Online</p>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`text-slate-400 transition-all duration-300 group-hover:text-sky-500 ${
                        isProfileDropdownOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </motion.button>

                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <motion.div
                        className="absolute right-0 top-full mt-3 w-64 glass-effect rounded-2xl shadow-2xl border border-white/20 py-3 z-50 overflow-hidden"
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-sky-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                              {user?.firstName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{user?.firstName} {user?.lastName}</p>
                              <p className="text-sm text-slate-500">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="py-2">
                          {profileMenuItems.map((item, index) => (
                            <motion.div
                              key={item.href}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Link
                                href={item.href}
                                onClick={() => setIsProfileDropdownOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-white/50 transition-all duration-200 group"
                              >
                                <item.icon size={18} className="text-slate-500 group-hover:text-sky-500 transition-colors duration-200" />
                                <span className="font-medium">{item.label}</span>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                        
                        <div className="border-t border-white/10 mt-2 pt-2">
                          <motion.button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50/80 transition-all duration-200 group"
                            whileHover={{ x: 4 }}
                          >
                            <LogOut size={18} className="group-hover:scale-110 transition-transform duration-200" />
                            <span className="font-medium">Sign Out</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="btn-modern btn-secondary text-sm"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="btn-modern btn-primary text-sm"
                >
                  <Plus size={16} />
                  Get Started
                </Link>
              </div>
            )}
          </motion.div>

          {/* Enhanced Mobile Menu Button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 rounded-xl text-slate-600 hover:text-sky-600 hover:bg-white/80 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: isMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden glass-effect border-t border-white/20 backdrop-blur-xl"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <motion.div 
              className="container-modern py-6 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {authLoading ? (
                <div className="flex items-center gap-4 p-4 card-modern">
                  <div className="w-12 h-12 bg-slate-200 rounded-2xl loading-modern"></div>
                  <div className="space-y-2 flex-1">
                    <div className="w-3/4 h-4 bg-slate-200 rounded loading-modern"></div>
                    <div className="w-1/2 h-3 bg-slate-200 rounded loading-modern"></div>
                  </div>
                </div>
              ) : isAuthenticated ? (
                <>
                  {/* Enhanced User Info */}
                  <motion.div 
                    className="flex items-center gap-4 p-4 card-modern"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-sky-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                        {user?.firstName?.charAt(0) || 'U'}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-sm text-slate-500">{user?.email}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600 font-medium">Online</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Navigation Links */}
                  <div className="space-y-2">
                    {navLinks.map((link, index) => (
                      <motion.div
                        key={link.href}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * (index + 2) }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                            pathname === link.href
                              ? 'bg-sky-50 text-sky-600 shadow-md'
                              : 'text-slate-700 hover:bg-white/50'
                          }`}
                        >
                          <link.icon size={22} className="transition-transform duration-300" />
                          <span className="font-medium">{link.label}</span>
                          {pathname === link.href && (
                            <motion.div 
                              className="ml-auto w-2 h-2 bg-sky-500 rounded-full"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 400 }}
                            />
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Profile Links */}
                  <div className="border-t border-white/10 pt-4 space-y-2">
                    {profileMenuItems.map((item, index) => (
                      <motion.div
                        key={item.href}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * (index + 5) }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-4 p-4 text-slate-700 hover:bg-white/50 rounded-xl transition-all duration-300"
                        >
                          <item.icon size={22} />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Logout Button */}
                  <motion.button
                    onClick={handleLogout}
                    className="flex items-center gap-4 w-full p-4 text-red-600 hover:bg-red-50/80 rounded-xl transition-all duration-300"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ x: 4 }}
                  >
                    <LogOut size={22} />
                    <span className="font-medium">Sign Out</span>
                  </motion.button>
                </>
              ) : (
                <div className="space-y-3">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Link
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="btn-modern btn-secondary w-full justify-center"
                    >
                      Sign In
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Link
                      href="/signup"
                      onClick={() => setIsMenuOpen(false)}
                      className="btn-modern btn-primary w-full justify-center"
                    >
                      <Plus size={18} />
                      Get Started
                    </Link>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}