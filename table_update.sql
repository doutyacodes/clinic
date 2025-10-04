-- Table Updates for Token Locking System and Enhanced Features
-- Run these SQL commands in your MySQL database

-- 1. Add token locking columns to appointments table
ALTER TABLE appointments
ADD COLUMN token_locked_at TIMESTAMP NULL AFTER token_number,
ADD COLUMN token_lock_expires_at TIMESTAMP NULL AFTER token_locked_at,
ADD COLUMN token_status VARCHAR(20) DEFAULT 'pending' AFTER token_lock_expires_at,
ADD COLUMN missed_appointment BOOLEAN DEFAULT FALSE AFTER token_status,
ADD COLUMN no_show_reason TEXT NULL AFTER missed_appointment,
ADD COLUMN token_changed_count INT DEFAULT 0 AFTER no_show_reason,
ADD COLUMN original_token_number INT NULL AFTER token_changed_count,
ADD COLUMN last_token_change_at TIMESTAMP NULL AFTER original_token_number;

-- Add index for better query performance
CREATE INDEX idx_token_status ON appointments(token_status);
CREATE INDEX idx_appointment_date_session ON appointments(appointment_date, session_id);
CREATE INDEX idx_token_lock_expires ON appointments(token_lock_expires_at);

-- 2. Create token_locks table for real-time locking mechanism
CREATE TABLE IF NOT EXISTS token_locks (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  appointment_date VARCHAR(10) NOT NULL,
  token_number INT NOT NULL,
  locked_by_user_id VARCHAR(36) NOT NULL,
  locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  appointment_id VARCHAR(36) NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_token_lock (session_id, appointment_date, token_number),
  INDEX idx_expires_at (expires_at),
  INDEX idx_locked_by (locked_by_user_id),
  INDEX idx_status (status),

  FOREIGN KEY (session_id) REFERENCES doctor_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (locked_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create appointment_history table for tracking changes
CREATE TABLE IF NOT EXISTS appointment_history (
  id VARCHAR(36) PRIMARY KEY,
  appointment_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  old_token_number INT NULL,
  new_token_number INT NULL,
  old_estimated_time VARCHAR(8) NULL,
  new_estimated_time VARCHAR(8) NULL,
  reason TEXT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_appointment_id (appointment_id),
  INDEX idx_user_id (user_id),
  INDEX idx_action_type (action_type),

  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create hospital_callback_queue table for missed appointments
CREATE TABLE IF NOT EXISTS hospital_callback_queue (
  id VARCHAR(36) PRIMARY KEY,
  appointment_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  doctor_id VARCHAR(36) NOT NULL,
  hospital_id VARCHAR(36) NOT NULL,
  missed_date VARCHAR(10) NOT NULL,
  missed_token_number INT NOT NULL,
  callback_status VARCHAR(20) DEFAULT 'pending',
  callback_attempts INT DEFAULT 0,
  last_callback_at TIMESTAMP NULL,
  callback_notes TEXT NULL,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_callback_status (callback_status),
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_missed_date (missed_date),

  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Update appointments status enum values
-- Note: MySQL doesn't have direct ENUM modification, so we use VARCHAR
-- The application will enforce these values:
-- 'pending', 'locked', 'confirmed', 'completed', 'cancelled', 'missed', 'rescheduled'

-- 6. Add current_token_number to doctor_sessions for real-time tracking
ALTER TABLE doctor_sessions
ADD COLUMN current_token_number INT DEFAULT 0 AFTER max_tokens,
ADD COLUMN last_token_called_at TIMESTAMP NULL AFTER current_token_number;

-- 7. Create stored procedure to clean expired locks (optional, for automation)
DELIMITER //

CREATE PROCEDURE clean_expired_token_locks()
BEGIN
  -- Free expired locks
  UPDATE token_locks
  SET status = 'expired'
  WHERE expires_at < NOW()
  AND status = 'active';

  -- Update appointments with expired locks back to pending
  UPDATE appointments
  SET token_status = 'available',
      token_lock_expires_at = NULL,
      token_locked_at = NULL
  WHERE token_lock_expires_at < NOW()
  AND token_status = 'locked'
  AND status = 'pending';
END //

DELIMITER ;

-- 8. Create event to auto-clean expired locks every minute (MySQL Event Scheduler)
-- Make sure event scheduler is enabled: SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS clean_expired_locks_event
ON SCHEDULE EVERY 1 MINUTE
DO
  CALL clean_expired_token_locks();

-- 9. Add receipt download tracking
ALTER TABLE payment_receipts
ADD COLUMN download_count INT DEFAULT 0 AFTER email_sent,
ADD COLUMN last_downloaded_at TIMESTAMP NULL AFTER download_count;

-- 10. Add queue position tracking
CREATE TABLE IF NOT EXISTS queue_positions (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  appointment_date VARCHAR(10) NOT NULL,
  current_token INT DEFAULT 0,
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(100) NULL,

  UNIQUE KEY unique_session_date (session_id, appointment_date),

  FOREIGN KEY (session_id) REFERENCES doctor_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Summary of changes:
-- ✓ Token locking system with 5-minute expiry
-- ✓ Token status tracking (pending, locked, confirmed, missed, etc.)
-- ✓ Appointment history for all changes
-- ✓ Hospital callback queue for missed appointments
-- ✓ Current token tracking for queue management
-- ✓ Automated lock cleanup via stored procedure and events
-- ✓ Receipt download tracking
-- ✓ Token change tracking (count and history)

-- Verification queries:
-- SELECT * FROM token_locks WHERE status = 'active';
-- SELECT * FROM appointments WHERE token_status = 'locked';
-- SELECT * FROM appointment_history ORDER BY changed_at DESC LIMIT 10;
-- SELECT * FROM hospital_callback_queue WHERE callback_status = 'pending';
