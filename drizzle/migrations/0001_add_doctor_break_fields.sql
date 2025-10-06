-- Add break management fields to doctors table
ALTER TABLE doctors
ADD COLUMN break_type VARCHAR(20),
ADD COLUMN break_start_time TIMESTAMP,
ADD COLUMN break_end_time TIMESTAMP,
ADD COLUMN break_reason TEXT;
