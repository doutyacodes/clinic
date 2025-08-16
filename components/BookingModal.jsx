import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Calendar, Hash, CheckCircle, AlertCircle, X } from "lucide-react";

export default function BookingModal({mode, doctor, onClose, onConfirm}) {
  const [input, setInput] = useState("");
  const [pred, setPred] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
      y: 30
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.5
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 30,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.25, 0, 1]
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  function calcNext() {
    setIsCalculating(true);
    setTimeout(() => {
      const token = Math.max(doctor.last_assigned || doctor.current_token, doctor.current_token) + 1;
      const etaSeconds = (token - doctor.current_token) * doctor.avg_seconds;
      const eta = new Date(Date.now() + etaSeconds*1000).toLocaleTimeString();
      setPred({token, eta});
      setIsCalculating(false);
    }, 800);
  }

  function calcTime(timeStr) {
    if (!timeStr.trim()) return;
    
    setIsCalculating(true);
    setTimeout(() => {
      // parse hh:mm (simple)
      const parts = timeStr.split(":");
      if (parts.length < 2) {
        setPred(null);
        setIsCalculating(false);
        return;
      }
      
      const now = new Date();
      const target = new Date();
      target.setHours(parseInt(parts[0],10), parseInt(parts[1],10),0,0);
      if (target < now) target.setDate(target.getDate()+1);
      
      // estimate tokens until then
      const secsUntil = Math.round((target.getTime() - now.getTime())/1000);
      const estTokens = Math.ceil(secsUntil / doctor.avg_seconds);
      const predictedToken = doctor.current_token + estTokens;
      const eta = target.toLocaleTimeString();
      setPred({token: predictedToken, eta});
      setIsCalculating(false);
    }, 800);
  }

  function calcSpecific(num) {
    if (!num.trim()) return;
    
    setIsCalculating(true);
    setTimeout(() => {
      const token = parseInt(num,10);
      if (isNaN(token)) {
        setPred(null);
        setIsCalculating(false);
        return;
      }
      
      const etaSeconds = (token - doctor.current_token) * doctor.avg_seconds;
      const eta = new Date(Date.now() + etaSeconds*1000).toLocaleTimeString();
      setPred({token, eta});
      setIsCalculating(false);
    }, 800);
  }

  function handleConfirm() {
    if (!pred) return alert("Calculate prediction first.");
    if (pred.token > doctor.max_tokens) {
      if (!confirm("Selected token/time likely exceeds today's max tokens. Proceed and place on overflow?")) {
        return;
      }
    }
    onConfirm({doctorId: doctor.id, tokenNumber: pred.token, predictedTime: pred.eta, mode});
  }

  const getModeIcon = () => {
    switch(mode) {
      case 'next': return <Calendar size={24} />;
      case 'time': return <Clock size={24} />;
      case 'token': return <Hash size={24} />;
      default: return <Calendar size={24} />;
    }
  };

  const getModeTitle = () => {
    switch(mode) {
      case 'next': return 'Next Available Token';
      case 'time': return 'Book by Preferred Time';
      case 'token': return 'Pick Specific Token Number';
      default: return 'Booking';
    }
  };

  const getModeDescription = () => {
    switch(mode) {
      case 'next': return 'Get the next available token in the queue.';
      case 'time': return 'Enter your preferred time and we\'ll predict the closest available token.';
      case 'token': return 'Choose a specific token number and see the estimated wait time.';
      default: return 'Book an appointment.';
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-start gap-4 mb-6 relative">
            <motion.div 
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center flex-shrink-0"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: 0.2,
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
            >
              {getModeIcon()}
            </motion.div>
            <div className="flex-1">
              <motion.h3
                className="text-xl font-bold text-slate-800 mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {getModeTitle()}
              </motion.h3>
              <motion.p 
                className="text-sm text-slate-600"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                {doctor.name} • {doctor.specialty}
              </motion.p>
            </div>
            <motion.button 
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all duration-200"
              onClick={onClose}
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ 
                scale: 1.1, 
                rotate: 90,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </motion.button>
          </div>

          <motion.p 
            className="text-slate-600 mb-6 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {getModeDescription()}
          </motion.p>
          
          {mode === 'next' && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <motion.button 
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-sky-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                onClick={calcNext}
                disabled={isCalculating}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.3 }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 400, damping: 25 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                {isCalculating ? (
                  <motion.div 
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Calendar size={18} />
                    </motion.div>
                    Calculate Next Token
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
          
          {mode === 'time' && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <motion.div 
                className="relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <Clock size={18} />
                </div>
                <motion.input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  placeholder="Enter time (e.g., 17:30)" 
                  type="text"
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl text-base transition-all duration-200 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              </motion.div>
              <motion.button 
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                onClick={() => calcTime(input)}
                disabled={isCalculating || !input.trim()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.3 }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 400, damping: 25 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                {isCalculating ? (
                  <motion.div 
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Clock size={18} />
                    </motion.div>
                    Predict Token
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
          
          {mode === 'token' && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <Hash size={18} />
                </div>
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  placeholder="Enter token number (e.g., 28)" 
                  type="number"
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl text-base transition-all duration-200 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
                />
              </div>
              <motion.button 
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                onClick={() => calcSpecific(input)}
                disabled={isCalculating || !input.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isCalculating ? (
                  <motion.div 
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <>
                    <Hash size={18} />
                    Estimate Time
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
          
          <AnimatePresence>
            {pred && (
              <motion.div 
                className="mt-6 p-4 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-cyan-600 mt-1">
                    <CheckCircle size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="text-slate-800 font-semibold mb-1">
                      Token: <span className="text-sky-600 text-lg">#{pred.token}</span>
                    </div>
                    <div className="text-slate-700 mb-3">
                      Estimated Time: <span className="font-semibold text-cyan-600">{pred.eta}</span>
                    </div>
                    {pred.token > doctor.max_tokens && (
                      <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
                        <AlertCircle size={16} />
                        <span>This token exceeds daily limit</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 mt-8">
            <motion.button 
              className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              onClick={handleConfirm}
              disabled={!pred}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <CheckCircle size={18} />
              Confirm Booking
            </motion.button>
            <motion.button 
              className="border-2 border-slate-200 text-slate-600 py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:bg-slate-50 hover:border-slate-300"
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}