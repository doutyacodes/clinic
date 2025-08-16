import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Users table for authentication and profile
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone').notNull(),
  dateOfBirth: text('date_of_birth').notNull(),
  gender: text('gender').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  bloodGroup: text('blood_group'),
  allergies: text('allergies'),
  emergencyContact: text('emergency_contact'),
  emergencyPhone: text('emergency_phone'),
  termsAccepted: integer('terms_accepted', { mode: 'boolean' }).notNull(),
  marketingEmails: integer('marketing_emails', { mode: 'boolean' }).default(0),
  profileImage: text('profile_image'),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(0),
  createdAt: text('created_at').default("datetime('now')").notNull(),
  updatedAt: text('updated_at').default("datetime('now')").notNull(),
});

// Hospitals table
export const hospitals = sqliteTable('hospitals', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  description: text('description').notNull(),
  image: text('image'),
  rating: real('rating').default(0.00),
  totalReviews: integer('total_reviews').default(0),
  totalDoctors: integer('total_doctors').default(0),
  established: integer('established').notNull(),
  website: text('website'),
  isActive: integer('is_active', { mode: 'boolean' }).default(1),
  createdAt: text('created_at').default("datetime('now')").notNull(),
  updatedAt: text('updated_at').default("datetime('now')").notNull(),
});

// Specialties table
export const specialties = sqliteTable('specialties', {
  id: text('id').primaryKey(),
  name: text('name').unique().notNull(),
  description: text('description'),
  icon: text('icon'),
  createdAt: text('created_at').default("datetime('now')").notNull(),
});

// Hospital specialties junction table
export const hospitalSpecialties = sqliteTable('hospital_specialties', {
  hospitalId: text('hospital_id').references(() => hospitals.id),
  specialtyId: text('specialty_id').references(() => specialties.id),
});

// Doctors table
export const doctors = sqliteTable('doctors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  phone: text('phone').notNull(),
  specialtyId: text('specialty_id').references(() => specialties.id),
  qualification: text('qualification').notNull(),
  experience: integer('experience').notNull(),
  bio: text('bio').notNull(),
  image: text('image'),
  rating: real('rating').default(0.00),
  totalReviews: integer('total_reviews').default(0),
  consultationFee: real('consultation_fee').notNull(),
  isAvailable: integer('is_available', { mode: 'boolean' }).default(1),
  licenseNumber: text('license_number').unique().notNull(),
  dateOfBirth: text('date_of_birth'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  bankAccount: text('bank_account'),
  createdAt: text('created_at').default("datetime('now')").notNull(),
  updatedAt: text('updated_at').default("datetime('now')").notNull(),
});

// Doctor sessions at hospitals
export const doctorSessions = sqliteTable('doctor_sessions', {
  id: text('id').primaryKey(),
  doctorId: text('doctor_id').references(() => doctors.id),
  hospitalId: text('hospital_id').references(() => hospitals.id),
  dayOfWeek: text('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  maxTokens: integer('max_tokens').notNull(),
  avgMinutesPerPatient: integer('avg_minutes_per_patient').default(15),
  isActive: integer('is_active', { mode: 'boolean' }).default(1),
  createdAt: text('created_at').default("datetime('now')").notNull(),
  updatedAt: text('updated_at').default("datetime('now')").notNull(),
});

// Appointments/Bookings table
export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  doctorId: text('doctor_id').references(() => doctors.id),
  hospitalId: text('hospital_id').references(() => hospitals.id),
  sessionId: text('session_id').references(() => doctorSessions.id),
  appointmentDate: text('appointment_date').notNull(),
  tokenNumber: integer('token_number').notNull(),
  estimatedTime: text('estimated_time'),
  actualStartTime: text('actual_start_time'),
  actualEndTime: text('actual_end_time'),
  status: text('status').notNull(),
  bookingType: text('booking_type').notNull(),
  patientComplaints: text('patient_complaints'),
  doctorNotes: text('doctor_notes'),
  prescription: text('prescription'),
  consultationFee: real('consultation_fee').notNull(),
  createdAt: text('created_at').default("datetime('now')").notNull(),
  updatedAt: text('updated_at').default("datetime('now')").notNull(),
});

// Payment methods table
export const paymentMethods = sqliteTable('payment_methods', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  type: text('type').notNull(),
  provider: text('provider'),
  lastFourDigits: text('last_four_digits'),
  expiryDate: text('expiry_date'),
  holderName: text('holder_name'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(1),
  createdAt: text('created_at').default("datetime('now')").notNull(),
  updatedAt: text('updated_at').default("datetime('now')").notNull(),
});

// Payments table
export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  appointmentId: text('appointment_id').references(() => appointments.id),
  userId: text('user_id').references(() => users.id),
  doctorId: text('doctor_id').references(() => doctors.id),
  paymentMethodId: text('payment_method_id').references(() => paymentMethods.id),
  amount: real('amount').notNull(),
  currency: text('currency').default('INR'),
  status: text('status').notNull(),
  transactionId: text('transaction_id').unique(),
  gatewayTransactionId: text('gateway_transaction_id'),
  gateway: text('gateway'),
  gatewayResponse: text('gateway_response'), // JSON stored as text
  paidAt: text('paid_at'),
  failedAt: text('failed_at'),
  failureReason: text('failure_reason'),
  refundedAt: text('refunded_at'),
  refundAmount: real('refund_amount'),
  refundReason: text('refund_reason'),
  platformFee: real('platform_fee').default(0.00),
  doctorEarnings: real('doctor_earnings'),
  hospitalEarnings: real('hospital_earnings'),
  taxAmount: real('tax_amount').default(0.00),
  createdAt: text('created_at').default("datetime('now')").notNull(),
  updatedAt: text('updated_at').default("datetime('now')").notNull(),
});

// Payment receipts/invoices
export const paymentReceipts = sqliteTable('payment_receipts', {
  id: text('id').primaryKey(),
  paymentId: text('payment_id').references(() => payments.id),
  receiptNumber: text('receipt_number').unique().notNull(),
  receiptData: text('receipt_data').notNull(), // JSON stored as text
  receiptUrl: text('receipt_url'),
  emailSent: integer('email_sent', { mode: 'boolean' }).default(0),
  createdAt: text('created_at').default("datetime('now')").notNull(),
});

// Medical records table
export const medicalRecords = sqliteTable('medical_records', {
  id: text('id').primaryKey(),
  appointmentId: text('appointment_id').references(() => appointments.id),
  userId: text('user_id').references(() => users.id),
  doctorId: text('doctor_id').references(() => doctors.id),
  diagnosis: text('diagnosis'),
  symptoms: text('symptoms'),
  treatment: text('treatment'),
  prescription: text('prescription'), // JSON stored as text
  vitals: text('vitals'), // JSON stored as text
  labReports: text('lab_reports'), // JSON stored as text
  followUpDate: text('follow_up_date'),
  followUpInstructions: text('follow_up_instructions'),
  attachments: text('attachments'), // JSON stored as text
  isPrivate: integer('is_private', { mode: 'boolean' }).default(0),
  createdAt: text('created_at').default("datetime('now')").notNull(),
  updatedAt: text('updated_at').default("datetime('now')").notNull(),
});

// Reviews table
export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  doctorId: text('doctor_id').references(() => doctors.id),
  hospitalId: text('hospital_id').references(() => hospitals.id),
  appointmentId: text('appointment_id').references(() => appointments.id),
  rating: integer('rating').notNull(),
  title: text('title'),
  comment: text('comment'),
  isAnonymous: integer('is_anonymous', { mode: 'boolean' }).default(0),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(0),
  helpfulVotes: integer('helpful_votes').default(0),
  createdAt: text('created_at').default("datetime('now')").notNull(),
  updatedAt: text('updated_at').default("datetime('now')").notNull(),
});

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: text('data'), // JSON stored as text
  isRead: integer('is_read', { mode: 'boolean' }).default(0),
  readAt: text('read_at'),
  scheduledFor: text('scheduled_for'),
  sentAt: text('sent_at'),
  createdAt: text('created_at').default("datetime('now')").notNull(),
});

// System settings table
export const systemSettings = sqliteTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  description: text('description'),
  type: text('type').default('string'),
  updatedAt: text('updated_at').default("datetime('now')").notNull(),
});

// Emergency contacts table
export const emergencyContacts = sqliteTable('emergency_contacts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  name: text('name').notNull(),
  relationship: text('relationship').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(0),
  createdAt: text('created_at').default("datetime('now')").notNull(),
  updatedAt: text('updated_at').default("datetime('now')").notNull(),
});

// Insurance table
export const insurance = sqliteTable('insurance', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  provider: text('provider').notNull(),
  policyNumber: text('policy_number').notNull(),
  policyHolderName: text('policy_holder_name').notNull(),
  coverageAmount: real('coverage_amount'),
  deductible: real('deductible'),
  expiryDate: text('expiry_date'),
  isActive: integer('is_active', { mode: 'boolean' }).default(1),
  documents: text('documents'), // JSON stored as text
  createdAt: text('created_at').default("datetime('now')").notNull(),
  updatedAt: text('updated_at').default("datetime('now')").notNull(),
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