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
  licenseNumber: varchar('license_number', { length: 50 }).unique().notNull(),
  dateOfBirth: varchar('date_of_birth', { length: 10 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  zipCode: varchar('zip_code', { length: 10 }),
  bankAccount: varchar('bank_account', { length: 255 }),
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
  avgMinutesPerPatient: int('avg_minutes_per_patient').default(15),
  isActive: boolean('is_active').default(true),
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
  estimatedTime: varchar('estimated_time', { length: 8 }),
  actualStartTime: varchar('actual_start_time', { length: 8 }),
  actualEndTime: varchar('actual_end_time', { length: 8 }),
  status: varchar('status', { length: 20 }).notNull(),
  bookingType: varchar('booking_type', { length: 20 }).notNull(),
  patientComplaints: text('patient_complaints'),
  doctorNotes: text('doctor_notes'),
  prescription: text('prescription'),
  consultationFee: decimal('consultation_fee', { precision: 8, scale: 2 }).notNull(),
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