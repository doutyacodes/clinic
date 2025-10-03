'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Calendar,
  CreditCard,
  AlertCircle,
  Info,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count (for polling)
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    const iconProps = { size: 20 };
    switch (type) {
      case 'payment_success':
        return <CreditCard {...iconProps} className="text-green-600" />;
      case 'appointment_confirmed':
        return <Calendar {...iconProps} className="text-blue-600" />;
      case 'appointment_reminder':
        return <Clock {...iconProps} className="text-amber-600" />;
      case 'alert':
        return <AlertCircle {...iconProps} className="text-red-600" />;
      default:
        return <Info {...iconProps} className="text-slate-600" />;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon Button */}
      <motion.button
        className="relative p-3 text-slate-600 hover:text-sky-600 hover:bg-white/80 rounded-xl transition-all duration-300 group"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} />

        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              <span className="text-white text-xs font-bold px-1.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse Animation */}
        {unreadCount > 0 && (
          <motion.span
            className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 top-full mt-3 w-96 max-h-[600px] glass-effect rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="sticky top-0 glass-effect border-b border-white/10 p-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-slate-500">{unreadCount} unread</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <motion.button
                    className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors duration-200 text-xs font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={markAllAsRead}
                  >
                    <CheckCheck size={16} />
                  </motion.button>
                )}
                <motion.button
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen(false)}
                >
                  <X size={18} />
                </motion.button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[500px] custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center">
                  <motion.div
                    className="w-10 h-10 border-3 border-slate-200 border-t-sky-500 rounded-full mx-auto"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <p className="text-slate-500 mt-3 text-sm">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={28} className="text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium">No notifications yet</p>
                  <p className="text-slate-400 text-sm mt-1">We'll notify you when something arrives</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      className={`p-4 hover:bg-white/50 transition-colors duration-200 cursor-pointer ${
                        !notification.isRead ? 'bg-sky-50/50' : ''
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          !notification.isRead ? 'bg-white shadow-sm' : 'bg-slate-50'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`font-semibold text-sm ${
                              !notification.isRead ? 'text-slate-900' : 'text-slate-700'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>

                          <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                            {notification.message}
                          </p>

                          <p className="text-xs text-slate-400">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="sticky bottom-0 glass-effect border-t border-white/10 p-3 text-center">
                <button className="text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors duration-200">
                  View All Notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
