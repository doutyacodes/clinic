'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FileText,
  Calendar,
  User,
  Heart,
  Activity,
  Droplet,
  Pill,
  AlertCircle,
  Download,
  Eye,
  Clock,
  Stethoscope,
  TestTube,
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { calculateAge, formatDate as formatDateUtil } from "../../lib/utils/helpers";

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        fetchMedicalRecords();
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, isLoading]);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/medical-records');
      const data = await response.json();

      if (data.success) {
        setRecords(data.records || []);
      } else {
        setError(data.error || 'Failed to fetch medical records');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return formatDateUtil(dateString);
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = searchQuery === '' ||
      record.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.symptoms?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.doctor?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterType === 'all' || record.type === filterType;

    return matchesSearch && matchesFilter;
  });

  if (isLoading || (isAuthenticated && loading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex items-center justify-center pt-16">
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
          <p className="text-slate-600 text-lg">Loading medical records...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex items-center justify-center pt-16 p-4">
        <motion.div
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 max-w-md w-full text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-6xl mb-6">🏥</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Medical Records</h1>
          <p className="text-slate-600 mb-6">
            Please sign in to access your medical records and health history.
          </p>
          <button
            onClick={() => router.push('/login?redirect=/medical-records')}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 relative pt-16">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 opacity-70 z-0"
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
          className="p-8 text-center"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Medical Records</h1>
          <p className="text-slate-600 text-lg">Your complete health history and medical documentation</p>
        </motion.header>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-12">
          {/* Patient Info Card */}
          {user && (
            <motion.div
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 mb-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User size={24} className="text-sky-500" />
                Patient Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stats-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                      <User size={20} className="text-sky-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Name</p>
                      <p className="font-semibold text-slate-800">{user.firstName} {user.lastName}</p>
                    </div>
                  </div>
                </div>

                <div className="stats-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Calendar size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Age</p>
                      <p className="font-semibold text-slate-800">
                        {calculateAge(user.dateOfBirth) || 'N/A'} {calculateAge(user.dateOfBirth) ? 'years' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="stats-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <Droplet size={20} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Blood Group</p>
                      <p className="font-semibold text-slate-800">{user.bloodGroup || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div className="stats-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Heart size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Gender</p>
                      <p className="font-semibold text-slate-800 capitalize">{user.gender || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical History */}
              {(user.allergies || user.medicalHistory) && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.allergies && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                        <AlertCircle size={18} />
                        Allergies
                      </h3>
                      <p className="text-red-700 text-sm">{user.allergies}</p>
                    </div>
                  )}

                  {user.medicalHistory && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <FileText size={18} />
                        Medical History
                      </h3>
                      <p className="text-blue-700 text-sm">{user.medicalHistory}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Search and Filters */}
          <motion.div
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 mb-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by diagnosis, symptoms, or doctor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all duration-200"
                  />
                </div>
              </div>

              <button
                onClick={fetchMedicalRecords}
                className="flex items-center gap-2 bg-sky-500 text-white px-4 py-3 rounded-xl hover:bg-sky-600 transition-colors duration-200"
                disabled={loading}
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="bg-red-50 border border-red-200 rounded-3xl p-6 shadow-lg mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle size={24} className="text-red-500" />
                  <div>
                    <p className="text-red-800 font-semibold">Error loading records</p>
                    <p className="text-red-600">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Records List */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {filteredRecords.length === 0 ? (
              <motion.div
                className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 shadow-lg border border-white/20 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  {searchQuery ? 'No matching records found' : 'No medical records yet'}
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchQuery
                    ? `No records match your search "${searchQuery}"`
                    : 'Your medical records from appointments will appear here.'
                  }
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => router.push('/')}
                    className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    Book an Appointment
                  </button>
                )}
              </motion.div>
            ) : (
              filteredRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  className="card-futuristic p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-800 mb-1">
                            {record.diagnosis || 'General Consultation'}
                          </h3>
                          <p className="text-sky-600 font-medium flex items-center gap-2">
                            <Stethoscope size={16} />
                            Dr. {record.doctor?.name || 'Unknown'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                          <Calendar size={14} className="text-green-600" />
                          <span className="text-sm font-semibold text-green-800">
                            {formatDate(record.appointmentDate)}
                          </span>
                        </div>
                      </div>

                      {/* Symptoms */}
                      {record.symptoms && (
                        <div className="mb-4 bg-slate-50 rounded-xl p-4">
                          <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Activity size={16} className="text-sky-500" />
                            Symptoms
                          </h4>
                          <p className="text-slate-600 text-sm">{record.symptoms}</p>
                        </div>
                      )}

                      {/* Treatment */}
                      {record.treatment && (
                        <div className="mb-4 bg-blue-50 rounded-xl p-4">
                          <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                            <Pill size={16} className="text-blue-600" />
                            Treatment
                          </h4>
                          <p className="text-blue-700 text-sm">{record.treatment}</p>
                        </div>
                      )}

                      {/* Prescription */}
                      {record.prescription && (
                        <div className="bg-purple-50 rounded-xl p-4">
                          <h4 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                            <FileText size={16} className="text-purple-600" />
                            Prescription
                          </h4>
                          {typeof record.prescription === 'string' ? (
                            <p className="text-purple-700 text-sm">{record.prescription}</p>
                          ) : (
                            <pre className="text-purple-700 text-sm whitespace-pre-wrap">
                              {JSON.stringify(record.prescription, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}

                      {/* Vitals */}
                      {record.vitals && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.entries(record.vitals).map(([key, value]) => (
                            <div key={key} className="bg-white rounded-lg p-3 border border-slate-200">
                              <p className="text-xs text-slate-500 capitalize">{key}</p>
                              <p className="font-bold text-slate-800">{value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 lg:w-48">
                      <button
                        onClick={() => router.push(`/medical-records/${record.id}`)}
                        className="bg-sky-500 text-white px-4 py-2 rounded-xl hover:bg-sky-600 transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <Eye size={16} />
                        View Full Record
                      </button>

                      {record.prescription && (
                        <button
                          className="border border-slate-300 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      )}

                      {record.followUpDate && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                          <p className="text-xs text-amber-600 mb-1">Follow-up</p>
                          <p className="font-semibold text-amber-800 text-sm">
                            {formatDate(record.followUpDate)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Summary Stats */}
          {records.length > 0 && (
            <motion.div
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/20 mt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-sky-500">{records.length}</p>
                  <p className="text-slate-600 text-sm">Total Records</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    {records.filter(r => r.diagnosis).length}
                  </p>
                  <p className="text-slate-600 text-sm">Diagnoses</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-500">
                    {records.filter(r => r.prescription).length}
                  </p>
                  <p className="text-slate-600 text-sm">Prescriptions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-500">
                    {records.filter(r => r.followUpDate).length}
                  </p>
                  <p className="text-slate-600 text-sm">Follow-ups</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
