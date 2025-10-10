import { mysqlTable, varchar, text, int, decimal, boolean, timestamp, json, primaryKey } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// Users table for authentication and profile
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 191 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  dateOfBirth: varchar('date_of_birth', { length: 10 }),
  gender: varchar('gender', { length: 10 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  zipCode: varchar('zip_code', { length: 10 }),
  bloodGroup: varchar('blood_group', { length: 5 }),
  allergies: text('allergies'),
  medicalHistory: text('medical_history'),
  emergencyContact: varchar('emergency_contact', { length: 100 }),
  emergencyPhone: varchar('emergency_phone', { length: 20 }),
  termsAccepted: boolean('terms_accepted').notNull(),
  marketingEmails: boolean('marketing_emails').default(false),
  profileImage: varchar('profile_image', { length: 500 }),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Hospitals table
export const hospitals = mysqlTable('hospitals', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address').notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  zipCode: varchar('zip_code', { length: 10 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  description: text('description').notNull(),
  image: varchar('image', { length: 500 }),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  totalReviews: int('total_reviews').default(0),
  totalDoctors: int('total_doctors').default(0),
  established: int('established').notNull(),
  website: varchar('website', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Specialties table
export const specialties = mysqlTable('specialties', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 100 }).unique().notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Hospital specialties junction table
export const hospitalSpecialties = mysqlTable('hospital_specialties', {
  hospitalId: varchar('hospital_id', { length: 36 }).references(() => hospitals.id),
  specialtyId: varchar('specialty_id', { length: 36 }).references(() => specialties.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.hospitalId, table.specialtyId] })
}));

// Doctors table
export const doctors = mysqlTable('doctors', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 191 }).unique().notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  specialtyId: varchar('specialty_id', { length: 36 }).references(() => specialties.id),
  qualification: varchar('qualification', { length: 500 }).notNull(),
  experience: int('experience').notNull(),
  bio: text('bio').notNull(),
  image: varchar('image', { length: 500 }),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  totalReviews: int('total_reviews').default(0),
  consultationFee: decimal('consultation_fee', { precision: 8, scale: 2 }).notNull(),
  isAvailable: boolean('is_available').default(true),
  status: varchar('status', { length: 20 }).default('offline'),
  licenseNumber: varchar('license_number', { length: 100 }).unique().notNull(),
  dateOfBirth: varchar('date_of_birth', { length: 10 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  zipCode: varchar('zip_code', { length: 10 }),
  bankAccount: varchar('bank_account', { length: 255 }),
  breakType: varchar('break_type', { length: 20 }),
  breakStartTime: timestamp('break_start_time'),
  breakEndTime: timestamp('break_end_time'),
  breakReason: text('break_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Doctor admins table for authentication
export const doctorAdmins = mysqlTable('doctor_admins', {
  id: varchar('id', { length: 36 }).primaryKey(),
  doctorId: varchar('doctor_id', { length: 36 }).references(() => doctors.id).notNull(),
  email: varchar('email', { length: 191 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('doctor').notNull(),
  permissions: json('permissions'),
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Doctor sessions at hospitals
export const doctorSessions = mysqlTable('doctor_sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  doctorId: varchar('doctor_id', { length: 36 }).references(() => doctors.id),
  hospitalId: varchar('hospital_id', { length: 36 }).references(() => hospitals.id),
  dayOfWeek: varchar('day_of_week', { length: 10 }).notNull(),
  startTime: varchar('start_time', { length: 8 }).notNull(),
  endTime: varchar('end_time', { length: 8 }).notNull(),
  maxTokens: int('max_tokens').notNull(),
  currentTokenNumber: int('current_token_number').default(0),
  currentToken: int('current_token').default(0),
  lastRecallAt: int('last_recall_at').default(0),
  lastTokenCalledAt: timestamp('last_token_called_at'),
  avgMinutesPerPatient: int('avg_minutes_per_patient').default(15),
  roomNumber: varchar('room_number', { length: 50 }),
  floor: varchar('floor', { length: 20 }),
  buildingLocation: varchar('building_location', { length: 100 }),
  isActive: boolean('is_active').default(true),
  nextAvailableDate: varchar('next_available_date', { length: 10 }),
  nextAvailableToken: int('next_available_token'),
  approvalStatus: varchar('approval_status', { length: 20 }).default('approved'),
  approvedBy: varchar('approved_by', { length: 36 }),
  approvedAt: timestamp('approved_at'),
  notes: text('notes'),
  recallCheckInterval: int('recall_check_interval').default(5),
  recallEnabled: boolean('recall_enabled').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Appointments/Bookings table
export const appointments = mysqlTable('appointments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id),
  doctorId: varchar('doctor_id', { length: 36 }).references(() => doctors.id),
  hospitalId: varchar('hospital_id', { length: 36 }).references(() => hospitals.id),
  sessionId: varchar('session_id', { length: 36 }).references(() => doctorSessions.id),
  appointmentDate: varchar('appointment_date', { length: 10 }).notNull(),
  tokenNumber: int('token_number').notNull(),
  tokenLockedAt: timestamp('token_locked_at'),
  tokenLockExpiresAt: timestamp('token_lock_expires_at'),
  tokenStatus: varchar('token_status', { length: 20 }).default('pending'),
  missedAppointment: boolean('missed_appointment').default(false),
  noShowReason: text('no_show_reason'),
  tokenChangedCount: int('token_changed_count').default(0),
  originalTokenNumber: int('original_token_number'),
  lastTokenChangeAt: timestamp('last_token_change_at'),
  estimatedTime: varchar('estimated_time', { length: 8 }),
  actualStartTime: varchar('actual_start_time', { length: 8 }),
  actualEndTime: varchar('actual_end_time', { length: 8 }),
  consultationStartedAt: timestamp('consultation_started_at'),
  consultationEndedAt: timestamp('consultation_ended_at'),
  status: varchar('status', { length: 20 }).notNull(),
  bookingType: varchar('booking_type', { length: 20 }).notNull(),
  patientComplaints: text('patient_complaints'),
  doctorNotes: text('doctor_notes'),
  prescription: text('prescription'),
  consultationFee: decimal('consultation_fee', { precision: 8, scale: 2 }).notNull(),
  isRecalled: boolean('is_recalled').default(false),
  recallCount: int('recall_count').default(0),
  lastRecalledAt: timestamp('last_recalled_at'),
  attendedAfterRecall: boolean('attended_after_recall').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Payment methods table
export const paymentMethods = mysqlTable('payment_methods', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id),
  type: varchar('type', { length: 20 }).notNull(),
  provider: varchar('provider', { length: 50 }),
  lastFourDigits: varchar('last_four_digits', { length: 4 }),
  expiryDate: varchar('expiry_date', { length: 5 }),
  holderName: varchar('holder_name', { length: 255 }),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Payments table
export const payments = mysqlTable('payments', {
  id: varchar('id', { length: 36 }).primaryKey(),
  appointmentId: varchar('appointment_id', { length: 36 }).references(() => appointments.id),
  userId: varchar('user_id', { length: 36 }).references(() => users.id),
  doctorId: varchar('doctor_id', { length: 36 }).references(() => doctors.id),
  paymentMethodId: varchar('payment_method_id', { length: 36 }).references(() => paymentMethods.id),
  amount: decimal('amount', { precision: 8, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('INR'),
  status: varchar('status', { length: 20 }).notNull(),
  transactionId: varchar('transaction_id', { length: 50 }).unique(),
  gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }),
  gateway: varchar('gateway', { length: 50 }),
  gatewayResponse: json('gateway_response'),
  paidAt: timestamp('paid_at'),
  failedAt: timestamp('failed_at'),
  failureReason: text('failure_reason'),
  refundedAt: timestamp('refunded_at'),
  refundAmount: decimal('refund_amount', { precision: 8, scale: 2 }),
  refundReason: text('refund_reason'),
  platformFee: decimal('platform_fee', { precision: 8, scale: 2 }).default('0.00'),
  doctorEarnings: decimal('doctor_earnings', { precision: 8, scale: 2 }),
  hospitalEarnings: decimal('hospital_earnings', { precision: 8, scale: 2 }),
  taxAmount: decimal('tax_amount', { precision: 8, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Payment receipts/invoices
export const paymentReceipts = mysqlTable('payment_receipts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  paymentId: varchar('payment_id', { length: 36 }).references(() => payments.id),
  receiptNumber: varchar('receipt_number', { length: 50 }).unique().notNull(),
  receiptData: json('receipt_data').notNull(),
  receiptUrl: varchar('receipt_url', { length: 500 }),
  emailSent: boolean('email_sent').default(false),
  downloadCount: int('download_count').default(0),
  lastDownloadedAt: timestamp('last_downloaded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Medical records table
export const medicalRecords = mysqlTable('medical_records', {
  id: varchar('id', { length: 36 }).primaryKey(),
  appointmentId: varchar('appointment_id', { length: 36 }).references(() => appointments.id),
  userId: varchar('user_id', { length: 36 }).references(() => users.id),
  doctorId: varchar('doctor_id', { length: 36 }).references(() => doctors.id),
  diagnosis: text('diagnosis'),
  symptoms: text('symptoms'),
  treatment: text('treatment'),
  prescription: json('prescription'),
  vitals: json('vitals'),
  labReports: json('lab_reports'),
  followUpDate: varchar('follow_up_date', { length: 10 }),
  followUpInstructions: text('follow_up_instructions'),
  attachments: json('attachments'),
  isPrivate: boolean('is_private').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Reviews table
export const reviews = mysqlTable('reviews', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id),
  doctorId: varchar('doctor_id', { length: 36 }).references(() => doctors.id),
  hospitalId: varchar('hospital_id', { length: 36 }).references(() => hospitals.id),
  appointmentId: varchar('appointment_id', { length: 36 }).references(() => appointments.id),
  rating: int('rating').notNull(),
  title: varchar('title', { length: 255 }),
  comment: text('comment'),
  isAnonymous: boolean('is_anonymous').default(false),
  isVerified: boolean('is_verified').default(false),
  helpfulVotes: int('helpful_votes').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Notifications table
export const notifications = mysqlTable('notifications', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  data: json('data'),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  scheduledFor: timestamp('scheduled_for'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// System settings table
export const systemSettings = mysqlTable('system_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: text('value').notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).default('string'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Emergency contacts table
export const emergencyContacts = mysqlTable('emergency_contacts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  relationship: varchar('relationship', { length: 50 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Insurance table
export const insurance = mysqlTable('insurance', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id),
  provider: varchar('provider', { length: 255 }).notNull(),
  policyNumber: varchar('policy_number', { length: 100 }).notNull(),
  policyHolderName: varchar('policy_holder_name', { length: 255 }).notNull(),
  coverageAmount: decimal('coverage_amount', { precision: 10, scale: 2 }),
  deductible: decimal('deductible', { precision: 8, scale: 2 }),
  expiryDate: varchar('expiry_date', { length: 10 }),
  isActive: boolean('is_active').default(true),
  documents: json('documents'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Token locks table for 5-minute locking mechanism
export const tokenLocks = mysqlTable('token_locks', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sessionId: varchar('session_id', { length: 36 }).references(() => doctorSessions.id).notNull(),
  appointmentDate: varchar('appointment_date', { length: 10 }).notNull(),
  tokenNumber: int('token_number').notNull(),
  lockedByUserId: varchar('locked_by_user_id', { length: 36 }).references(() => users.id).notNull(),
  lockedAt: timestamp('locked_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  appointmentId: varchar('appointment_id', { length: 36 }).references(() => appointments.id),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Appointment history for tracking token changes
export const appointmentHistory = mysqlTable('appointment_history', {
  id: varchar('id', { length: 36 }).primaryKey(),
  appointmentId: varchar('appointment_id', { length: 36 }).references(() => appointments.id).notNull(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id).notNull(),
  actionType: varchar('action_type', { length: 50 }).notNull(),
  oldTokenNumber: int('old_token_number'),
  newTokenNumber: int('new_token_number'),
  oldEstimatedTime: varchar('old_estimated_time', { length: 8 }),
  newEstimatedTime: varchar('new_estimated_time', { length: 8 }),
  reason: text('reason'),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
});

// Hospital callback queue for missed appointments
export const hospitalCallbackQueue = mysqlTable('hospital_callback_queue', {
  id: varchar('id', { length: 36 }).primaryKey(),
  appointmentId: varchar('appointment_id', { length: 36 }).references(() => appointments.id).notNull(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id).notNull(),
  doctorId: varchar('doctor_id', { length: 36 }).references(() => doctors.id).notNull(),
  hospitalId: varchar('hospital_id', { length: 36 }).references(() => hospitals.id).notNull(),
  missedDate: varchar('missed_date', { length: 10 }).notNull(),
  missedTokenNumber: int('missed_token_number').notNull(),
  callbackStatus: varchar('callback_status', { length: 20 }).default('pending'),
  callbackAttempts: int('callback_attempts').default(0),
  lastCallbackAt: timestamp('last_callback_at'),
  callbackNotes: text('callback_notes'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Queue positions for current token tracking
export const queuePositions = mysqlTable('queue_positions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sessionId: varchar('session_id', { length: 36 }).references(() => doctorSessions.id).notNull(),
  appointmentDate: varchar('appointment_date', { length: 10 }).notNull(),
  currentToken: int('current_token').default(0),
  totalWaitTimeMinutes: int('total_wait_time_minutes').default(0),
  completedAppointmentsCount: int('completed_appointments_count').default(0),
  averageWaitTimeMinutes: int('average_wait_time_minutes').default(15),
  lastUpdatedAt: timestamp('last_updated_at').defaultNow().onUpdateNow().notNull(),
  updatedBy: varchar('updated_by', { length: 100 }),
});

// Hospital admins table for authentication
export const hospitalAdmins = mysqlTable('hospital_admins', {
  id: varchar('id', { length: 36 }).primaryKey(),
  hospitalId: varchar('hospital_id', { length: 36 }).references(() => hospitals.id).notNull(),
  email: varchar('email', { length: 191 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).default('admin').notNull(),
  permissions: json('permissions'),
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Hospital settings table
export const hospitalSettings = mysqlTable('hospital_settings', {
  id: varchar('id', { length: 36 }).primaryKey(),
  hospitalId: varchar('hospital_id', { length: 36 }).references(() => hospitals.id).notNull(),
  settingKey: varchar('setting_key', { length: 100 }).notNull(),
  settingValue: text('setting_value'),
  dataType: varchar('data_type', { length: 20 }).default('string'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Hospital-Doctor associations table
export const hospitalDoctorAssociations = mysqlTable('hospital_doctor_associations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  hospitalId: varchar('hospital_id', { length: 36 }).references(() => hospitals.id).notNull(),
  doctorId: varchar('doctor_id', { length: 36 }).references(() => doctors.id).notNull(),
  status: varchar('status', { length: 20 }).default('active'),
  startDate: varchar('start_date', { length: 10 }),
  endDate: varchar('end_date', { length: 10 }),
  contractType: varchar('contract_type', { length: 50 }),
  department: varchar('department', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Doctor-Hospital association requests table
export const doctorHospitalRequests = mysqlTable('doctor_hospital_requests', {
  id: varchar('id', { length: 36 }).primaryKey(),
  doctorId: varchar('doctor_id', { length: 36 }).references(() => doctors.id).notNull(),
  hospitalId: varchar('hospital_id', { length: 36 }).references(() => hospitals.id).notNull(),
  requestedBy: varchar('requested_by', { length: 20 }).notNull(),
  requestorId: varchar('requestor_id', { length: 36 }),
  status: varchar('status', { length: 20 }).default('pending'),
  message: text('message'),
  responseMessage: text('response_message'),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  respondedAt: timestamp('responded_at'),
  respondedBy: varchar('responded_by', { length: 36 }),
});

// Doctor session requests table
export const doctorSessionRequests = mysqlTable('doctor_session_requests', {
  id: varchar('id', { length: 36 }).primaryKey(),
  doctorId: varchar('doctor_id', { length: 36 }).references(() => doctors.id).notNull(),
  hospitalId: varchar('hospital_id', { length: 36 }).references(() => hospitals.id).notNull(),
  dayOfWeek: varchar('day_of_week', { length: 10 }).notNull(),
  startTime: varchar('start_time', { length: 8 }).notNull(),
  endTime: varchar('end_time', { length: 8 }).notNull(),
  maxTokens: int('max_tokens').notNull(),
  avgMinutesPerPatient: int('avg_minutes_per_patient').default(15),
  roomNumber: varchar('room_number', { length: 50 }),
  floor: varchar('floor', { length: 20 }),
  buildingLocation: varchar('building_location', { length: 100 }),
  status: varchar('status', { length: 20 }).default('pending'),
  notes: text('notes'),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  respondedAt: timestamp('responded_at'),
  respondedBy: varchar('responded_by', { length: 36 }),
  responseMessage: text('response_message'),
});

// Audit logs table for system tracking
export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }),
  userType: varchar('user_type', { length: 20 }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: varchar('entity_id', { length: 36 }),
  oldData: json('old_data'),
  newData: json('new_data'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Token call history table for tracking all token calls and recalls
export const tokenCallHistory = mysqlTable('token_call_history', {
  id: varchar('id', { length: 36 }).primaryKey(),
  sessionId: varchar('session_id', { length: 36 }).references(() => doctorSessions.id).notNull(),
  appointmentId: varchar('appointment_id', { length: 36 }).references(() => appointments.id),
  appointmentDate: varchar('appointment_date', { length: 10 }).notNull(),
  tokenNumber: int('token_number').notNull(),
  callType: varchar('call_type', { length: 20 }).notNull().default('normal'),
  isRecall: boolean('is_recall').default(false),
  recallReason: varchar('recall_reason', { length: 50 }),
  calledAt: timestamp('called_at').defaultNow().notNull(),
  calledBy: varchar('called_by', { length: 36 }),
  patientAttended: boolean('patient_attended').default(false),
  attendedAt: timestamp('attended_at'),
  skippedReason: text('skipped_reason'),
});

// Relations - same as before but updated for the new tables
export const usersRelations = relations(users, ({ many, one }) => ({
  appointments: many(appointments),
  paymentMethods: many(paymentMethods),
  payments: many(payments),
  medicalRecords: many(medicalRecords),
  reviews: many(reviews),
  notifications: many(notifications),
  emergencyContacts: many(emergencyContacts),
  insurance: many(insurance),
}));

export const hospitalsRelations = relations(hospitals, ({ many }) => ({
  hospitalSpecialties: many(hospitalSpecialties),
  doctorSessions: many(doctorSessions),
  appointments: many(appointments),
  reviews: many(reviews),
  hospitalAdmins: many(hospitalAdmins),
  hospitalSettings: many(hospitalSettings),
  hospitalDoctorAssociations: many(hospitalDoctorAssociations),
}));

export const specialtiesRelations = relations(specialties, ({ many }) => ({
  hospitalSpecialties: many(hospitalSpecialties),
  doctors: many(doctors),
}));

export const hospitalSpecialtiesRelations = relations(hospitalSpecialties, ({ one }) => ({
  hospital: one(hospitals, {
    fields: [hospitalSpecialties.hospitalId],
    references: [hospitals.id],
  }),
  specialty: one(specialties, {
    fields: [hospitalSpecialties.specialtyId],
    references: [specialties.id],
  }),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  specialty: one(specialties, {
    fields: [doctors.specialtyId],
    references: [specialties.id],
  }),
  sessions: many(doctorSessions),
  appointments: many(appointments),
  medicalRecords: many(medicalRecords),
  reviews: many(reviews),
  payments: many(payments),
  doctorAdmins: many(doctorAdmins),
  hospitalDoctorAssociations: many(hospitalDoctorAssociations),
  doctorHospitalRequests: many(doctorHospitalRequests),
  doctorSessionRequests: many(doctorSessionRequests),
}));

export const doctorSessionsRelations = relations(doctorSessions, ({ one, many }) => ({
  doctor: one(doctors, {
    fields: [doctorSessions.doctorId],
    references: [doctors.id],
  }),
  hospital: one(hospitals, {
    fields: [doctorSessions.hospitalId],
    references: [hospitals.id],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  user: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
  hospital: one(hospitals, {
    fields: [appointments.hospitalId],
    references: [hospitals.id],
  }),
  session: one(doctorSessions, {
    fields: [appointments.sessionId],
    references: [doctorSessions.id],
  }),
  payments: many(payments),
  medicalRecord: one(medicalRecords),
  review: one(reviews),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one, many }) => ({
  user: one(users, {
    fields: [paymentMethods.userId],
    references: [users.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  appointment: one(appointments, {
    fields: [payments.appointmentId],
    references: [appointments.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  doctor: one(doctors, {
    fields: [payments.doctorId],
    references: [doctors.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [payments.paymentMethodId],
    references: [paymentMethods.id],
  }),
  receipt: one(paymentReceipts),
}));

export const paymentReceiptsRelations = relations(paymentReceipts, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentReceipts.paymentId],
    references: [payments.id],
  }),
}));

export const medicalRecordsRelations = relations(medicalRecords, ({ one }) => ({
  appointment: one(appointments, {
    fields: [medicalRecords.appointmentId],
    references: [appointments.id],
  }),
  user: one(users, {
    fields: [medicalRecords.userId],
    references: [users.id],
  }),
  doctor: one(doctors, {
    fields: [medicalRecords.doctorId],
    references: [doctors.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  doctor: one(doctors, {
    fields: [reviews.doctorId],
    references: [doctors.id],
  }),
  hospital: one(hospitals, {
    fields: [reviews.hospitalId],
    references: [hospitals.id],
  }),
  appointment: one(appointments, {
    fields: [reviews.appointmentId],
    references: [appointments.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const emergencyContactsRelations = relations(emergencyContacts, ({ one }) => ({
  user: one(users, {
    fields: [emergencyContacts.userId],
    references: [users.id],
  }),
}));

export const insuranceRelations = relations(insurance, ({ one }) => ({
  user: one(users, {
    fields: [insurance.userId],
    references: [users.id],
  }),
}));

export const hospitalAdminsRelations = relations(hospitalAdmins, ({ one }) => ({
  hospital: one(hospitals, {
    fields: [hospitalAdmins.hospitalId],
    references: [hospitals.id],
  }),
}));

export const hospitalSettingsRelations = relations(hospitalSettings, ({ one }) => ({
  hospital: one(hospitals, {
    fields: [hospitalSettings.hospitalId],
    references: [hospitals.id],
  }),
}));

export const hospitalDoctorAssociationsRelations = relations(hospitalDoctorAssociations, ({ one }) => ({
  hospital: one(hospitals, {
    fields: [hospitalDoctorAssociations.hospitalId],
    references: [hospitals.id],
  }),
  doctor: one(doctors, {
    fields: [hospitalDoctorAssociations.doctorId],
    references: [doctors.id],
  }),
}));

export const doctorHospitalRequestsRelations = relations(doctorHospitalRequests, ({ one }) => ({
  doctor: one(doctors, {
    fields: [doctorHospitalRequests.doctorId],
    references: [doctors.id],
  }),
  hospital: one(hospitals, {
    fields: [doctorHospitalRequests.hospitalId],
    references: [hospitals.id],
  }),
}));

export const doctorSessionRequestsRelations = relations(doctorSessionRequests, ({ one }) => ({
  doctor: one(doctors, {
    fields: [doctorSessionRequests.doctorId],
    references: [doctors.id],
  }),
  hospital: one(hospitals, {
    fields: [doctorSessionRequests.hospitalId],
    references: [hospitals.id],
  }),
}));

export const doctorAdminsRelations = relations(doctorAdmins, ({ one }) => ({
  doctor: one(doctors, {
    fields: [doctorAdmins.doctorId],
    references: [doctors.id],
  }),
}));