-- Database Schema Alterations for Enhanced Booking System
-- Execute these statements in production MySQL database

-- ============================================================
-- 1. Add doctor status tracking to doctors table
-- ============================================================
ALTER TABLE doctors
ADD COLUMN status ENUM('online', 'consulting', 'on_break', 'emergency', 'offline')
DEFAULT 'offline'
AFTER is_available;

-- ============================================================
-- 2. Add physical location fields to doctor_sessions table
-- ============================================================
ALTER TABLE doctor_sessions
ADD COLUMN room_number VARCHAR(50) AFTER avg_minutes_per_patient,
ADD COLUMN floor VARCHAR(20) AFTER room_number,
ADD COLUMN building_location VARCHAR(100) AFTER floor;

-- ============================================================
-- 3. Update appointments status to include new statuses
-- ============================================================
ALTER TABLE appointments
MODIFY COLUMN status ENUM(
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled'
) NOT NULL;

-- ============================================================
-- 4. Add current consultation tracking to appointments
-- ============================================================
ALTER TABLE appointments
ADD COLUMN consultation_started_at TIMESTAMP NULL AFTER actual_start_time,
ADD COLUMN consultation_ended_at TIMESTAMP NULL AFTER actual_end_time;

-- ============================================================
-- 5. Add average wait time tracking to queue_positions table
-- ============================================================
ALTER TABLE queue_positions
ADD COLUMN total_wait_time_minutes INT DEFAULT 0 AFTER current_token,
ADD COLUMN completed_appointments_count INT DEFAULT 0 AFTER total_wait_time_minutes,
ADD COLUMN average_wait_time_minutes INT DEFAULT 15 AFTER completed_appointments_count;

-- ============================================================
-- 6. Add next availability tracking to doctor_sessions
-- ============================================================
ALTER TABLE doctor_sessions
ADD COLUMN next_available_date VARCHAR(10) AFTER is_active,
ADD COLUMN next_available_token INT AFTER next_available_date;

-- ============================================================
-- 7. Update booking_type to restrict to only 'next' and 'grid'
-- ============================================================
-- Note: Existing data should be migrated before applying this constraint
-- Update existing 'time' and 'token' bookings to 'grid'
UPDATE appointments
SET booking_type = 'grid'
WHERE booking_type IN ('time', 'token');

-- Now restrict the enum
ALTER TABLE appointments
MODIFY COLUMN booking_type ENUM('next', 'grid') NOT NULL;

-- ============================================================
-- 8. Add indexes for better query performance
-- ============================================================
CREATE INDEX idx_doctors_status ON doctors(status);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_status ON appointments(appointment_date, status);
CREATE INDEX idx_queue_positions_session_date ON queue_positions(session_id, appointment_date);

-- ============================================================
-- 9. Add receipt URL support to payment_receipts
-- ============================================================
-- This column already exists in schema, adding comment for completeness
-- ALTER TABLE payment_receipts ADD COLUMN receipt_url VARCHAR(500) AFTER receipt_data;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these after executing the alterations to verify success

-- Verify doctor status column
-- SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'doctors' AND COLUMN_NAME = 'status';

-- Verify doctor_sessions location fields
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'doctor_sessions' AND COLUMN_NAME IN ('room_number', 'floor', 'building_location');

-- Verify appointments status enum
-- SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'appointments' AND COLUMN_NAME = 'status';

-- Verify booking_type restriction
-- SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'appointments' AND COLUMN_NAME = 'booking_type';

-- ============================================================
-- ROLLBACK SCRIPT (Use if needed to undo changes)
-- ============================================================
-- ALTER TABLE doctors DROP COLUMN status;
-- ALTER TABLE doctor_sessions DROP COLUMN room_number, DROP COLUMN floor, DROP COLUMN building_location;
-- ALTER TABLE appointments DROP COLUMN consultation_started_at, DROP COLUMN consultation_ended_at;
-- ALTER TABLE queue_positions DROP COLUMN total_wait_time_minutes, DROP COLUMN completed_appointments_count, DROP COLUMN average_wait_time_minutes;
-- ALTER TABLE doctor_sessions DROP COLUMN next_available_date, DROP COLUMN next_available_token;
-- DROP INDEX idx_doctors_status ON doctors;
-- DROP INDEX idx_appointments_status ON appointments;
-- DROP INDEX idx_appointments_date_status ON appointments;
-- DROP INDEX idx_queue_positions_session_date ON queue_positions;
