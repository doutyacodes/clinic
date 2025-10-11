-- ============================================================
-- VPS LAKESHORE HOSPITAL - DOCTOR ASSOCIATIONS & SESSIONS
-- ============================================================
-- Purpose: Link all 18 VPS Lakeshore Anesthesiology doctors to hospital
--          and create comprehensive session schedules
-- Generated: 2025-10-11
-- Database: devuser_hospitals
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ============================================================
-- EXTRACTED IDS FROM DATABASE
-- ============================================================

-- Hospital ID
SET @vps_hospital_id = '2ba973fb-a661-11f0-abc5-52541aa39e4a';

-- Specialty ID
SET @anesthesiology_specialty_id = '1621f7b1-a661-11f0-abc5-52541aa39e4a';

-- Doctor IDs
SET @dr_rosy_id = '52ea27e2-a661-11f0-abc5-52541aa39e4a';
SET @dr_francis_id = '52ec9c9f-a661-11f0-abc5-52541aa39e4a';
SET @dr_jaya_id = '52ee8d58-a661-11f0-abc5-52541aa39e4a';
SET @dr_john_id = '52eff8f1-a661-11f0-abc5-52541aa39e4a';
SET @dr_mallie_id = '52f1658b-a661-11f0-abc5-52541aa39e4a';
SET @dr_shahul_id = '52f2c758-a661-11f0-abc5-52541aa39e4a';
SET @dr_akhil_id = '52f47c75-a661-11f0-abc5-52541aa39e4a';
SET @dr_gayathri_id = '52f5d956-a661-11f0-abc5-52541aa39e4a';
SET @dr_jayasankar_id = '52f72f83-a661-11f0-abc5-52541aa39e4a';
SET @dr_manu_id = '52f88e48-a661-11f0-abc5-52541aa39e4a';
SET @dr_nita_id = '52f9f9ae-a661-11f0-abc5-52541aa39e4a';
SET @dr_renny_id = '52fb968f-a661-11f0-abc5-52541aa39e4a';
SET @dr_vishak_id = '52fcf5d0-a661-11f0-abc5-52541aa39e4a';
SET @dr_preethi_id = '52fe562e-a661-11f0-abc5-52541aa39e4a';
SET @dr_thomas_id = '52ffbb80-a661-11f0-abc5-52541aa39e4a';
SET @dr_vishakha_id = '530115fc-a661-11f0-abc5-52541aa39e4a';
SET @dr_jinu_id = '53026bd5-a661-11f0-abc5-52541aa39e4a';
SET @dr_sreeparvathi_id = '5303f10c-a661-11f0-abc5-52541aa39e4a';

-- ============================================================
-- UPDATE DOCTORS WITH SPECIALTY ID
-- ============================================================

UPDATE doctors
SET specialty_id = @anesthesiology_specialty_id
WHERE id IN (
  @dr_rosy_id, @dr_francis_id, @dr_jaya_id, @dr_john_id,
  @dr_mallie_id, @dr_shahul_id, @dr_akhil_id, @dr_gayathri_id,
  @dr_jayasankar_id, @dr_manu_id, @dr_nita_id, @dr_renny_id,
  @dr_vishak_id, @dr_preethi_id, @dr_thomas_id, @dr_vishakha_id,
  @dr_jinu_id, @dr_sreeparvathi_id
);

-- ============================================================
-- LINK HOSPITAL TO SPECIALTY
-- ============================================================

INSERT INTO hospital_specialties (hospital_id, specialty_id)
VALUES (@vps_hospital_id, @anesthesiology_specialty_id)
ON DUPLICATE KEY UPDATE hospital_id = hospital_id;

-- ============================================================
-- CREATE HOSPITAL-DOCTOR ASSOCIATIONS
-- ============================================================

-- Associate all 18 doctors with VPS Lakeshore Hospital
INSERT INTO hospital_doctor_associations (
  id, hospital_id, doctor_id, status, commission_rate,
  special_terms, approved_at, approved_by, created_at, updated_at
) VALUES
(UUID(), @vps_hospital_id, @dr_rosy_id, 'active', 10.00, 'Standard hospital association terms apply.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_francis_id, 'active', 10.00, 'Standard hospital association terms apply.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_jaya_id, 'active', 10.00, 'Standard hospital association terms apply.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_john_id, 'active', 10.00, 'Standard hospital association terms apply.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_mallie_id, 'active', 10.00, 'Standard hospital association terms apply.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_shahul_id, 'active', 12.00, 'Department head - higher commission rate.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_akhil_id, 'active', 10.00, 'Standard hospital association terms apply.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_gayathri_id, 'active', 10.00, 'Standard hospital association terms apply.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_jayasankar_id, 'active', 10.00, 'Standard hospital association terms apply.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_manu_id, 'active', 10.00, 'Standard hospital association terms apply.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_nita_id, 'active', 11.00, 'Senior consultant - premium rate.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_renny_id, 'active', 10.00, 'Standard hospital association terms apply.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_vishak_id, 'active', 10.00, 'Standard hospital association terms apply.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_preethi_id, 'active', 10.00, 'Standard hospital association terms apply.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_thomas_id, 'active', 10.00, 'Standard hospital association terms apply.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_vishakha_id, 'active', 10.00, 'Standard hospital association terms apply.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_jinu_id, 'active', 8.00, 'Registrar - reduced commission rate.', NOW(), 'SYSTEM', NOW(), NOW()),
(UUID(), @vps_hospital_id, @dr_sreeparvathi_id, 'active', 8.00, 'Registrar - reduced commission rate.', NOW(), 'SYSTEM', NOW(), NOW())
ON DUPLICATE KEY UPDATE status = 'active';

-- ============================================================
-- CREATE DOCTOR ADMIN ACCOUNTS
-- ============================================================

-- Password: "Doctor@123" (hashed - placeholder, should be properly hashed in production)
INSERT INTO doctor_admins (
  id, doctor_id, email, password_hash, role,
  permissions, is_active, created_at, updated_at
) VALUES
(UUID(), @dr_rosy_id, 'rosy.jacob@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_francis_id, 'francis.manavalan@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_jaya_id, 'jaya.jacob@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_john_id, 'john.ferns@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_mallie_id, 'mallie.abraham@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_shahul_id, 'shahul.nebhu@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_akhil_id, 'akhil.babu@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_gayathri_id, 'gayathri.raj@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_jayasankar_id, 'jayasankar.s@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_manu_id, 'manu.prathap@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_nita_id, 'nita.george@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_renny_id, 'renny.chacko@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_vishak_id, 'vishak.nair@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_preethi_id, 'preethi.joseph@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_thomas_id, 'thomas.babu@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_vishakha_id, 'vishakha.pillai@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions', 'view_payments'), 1, NOW(), NOW()),
(UUID(), @dr_jinu_id, 'jinu.joy@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions'), 1, NOW(), NOW()),
(UUID(), @dr_sreeparvathi_id, 'sreeparvathi.p@lakeshorehospital.com', '$2a$10$xQN8X9Z1Z9Z1Z9Z1Z9Z1Z.Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z9Z1Z', 'doctor', JSON_ARRAY('view_appointments', 'update_appointments', 'view_patients', 'manage_sessions'), 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE is_active = 1;

-- ============================================================
-- CREATE DOCTOR SESSIONS (3+ per doctor)
-- ============================================================

-- -----------------------------------------------
-- Dr. Rosy Jacob - Associate Consultant
-- Monday, Wednesday, Friday Morning + Evening
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_rosy_id, @vps_hospital_id, 'Monday', '09:00:00', '13:00:00', 16, 0, 15, 'OT-1', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_rosy_id, @vps_hospital_id, 'Wednesday', '09:00:00', '13:00:00', 16, 0, 15, 'OT-1', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_rosy_id, @vps_hospital_id, 'Friday', '09:00:00', '13:00:00', 16, 0, 15, 'OT-1', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_rosy_id, @vps_hospital_id, 'Tuesday', '16:00:00', '20:00:00', 16, 0, 15, 'OT-1', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Francis Manavalan - Chief Neuro Anaesthesia
-- Tuesday, Thursday, Saturday + Special slot
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_francis_id, @vps_hospital_id, 'Tuesday', '10:00:00', '14:00:00', 16, 0, 15, 'Neuro-OT-1', '3rd Floor', 'Neuro Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_francis_id, @vps_hospital_id, 'Thursday', '10:00:00', '14:00:00', 16, 0, 15, 'Neuro-OT-1', '3rd Floor', 'Neuro Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_francis_id, @vps_hospital_id, 'Saturday', '09:00:00', '12:00:00', 12, 0, 15, 'Neuro-OT-1', '3rd Floor', 'Neuro Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_francis_id, @vps_hospital_id, 'Friday', '15:00:00', '18:00:00', 12, 0, 15, 'Neuro-OT-1', '3rd Floor', 'Neuro Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Jaya Susan Jacob - Senior Consultant
-- Monday, Wednesday, Friday Full Day
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_jaya_id, @vps_hospital_id, 'Monday', '08:00:00', '16:00:00', 32, 0, 15, 'OT-2', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_jaya_id, @vps_hospital_id, 'Wednesday', '08:00:00', '16:00:00', 32, 0, 15, 'OT-2', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_jaya_id, @vps_hospital_id, 'Friday', '08:00:00', '16:00:00', 32, 0, 15, 'OT-2', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. John Ferns - Senior Consultant
-- Tuesday, Thursday Full Day + Saturday Morning
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_john_id, @vps_hospital_id, 'Tuesday', '09:00:00', '17:00:00', 32, 0, 15, 'OT-3', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_john_id, @vps_hospital_id, 'Thursday', '09:00:00', '17:00:00', 32, 0, 15, 'OT-3', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_john_id, @vps_hospital_id, 'Saturday', '09:00:00', '13:00:00', 16, 0, 15, 'OT-3', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Mallie Abraham - ICU Coverage
-- Monday, Wednesday, Friday Evening + Sunday
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_mallie_id, @vps_hospital_id, 'Monday', '14:00:00', '20:00:00', 24, 0, 15, 'ICU-1', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_mallie_id, @vps_hospital_id, 'Wednesday', '14:00:00', '20:00:00', 24, 0, 15, 'ICU-1', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_mallie_id, @vps_hospital_id, 'Friday', '14:00:00', '20:00:00', 24, 0, 15, 'ICU-1', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_mallie_id, @vps_hospital_id, 'Sunday', '10:00:00', '14:00:00', 16, 0, 15, 'ICU-1', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Mohammed Shahul Nebhu - Chief Cardiothoracic
-- Tuesday, Thursday, Saturday (Cardiac OT)
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_shahul_id, @vps_hospital_id, 'Tuesday', '08:00:00', '14:00:00', 20, 0, 18, 'Cardiac-OT-1', '3rd Floor', 'Cardiac Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_shahul_id, @vps_hospital_id, 'Thursday', '08:00:00', '14:00:00', 20, 0, 18, 'Cardiac-OT-1', '3rd Floor', 'Cardiac Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_shahul_id, @vps_hospital_id, 'Saturday', '08:00:00', '14:00:00', 20, 0, 18, 'Cardiac-OT-1', '3rd Floor', 'Cardiac Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Akhil Babu - Critical Care
-- Monday, Wednesday, Friday + Sunday
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_akhil_id, @vps_hospital_id, 'Monday', '10:00:00', '18:00:00', 32, 0, 15, 'ICU-2', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_akhil_id, @vps_hospital_id, 'Wednesday', '10:00:00', '18:00:00', 32, 0, 15, 'ICU-2', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_akhil_id, @vps_hospital_id, 'Friday', '10:00:00', '18:00:00', 32, 0, 15, 'ICU-2', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_akhil_id, @vps_hospital_id, 'Sunday', '08:00:00', '12:00:00', 16, 0, 15, 'ICU-2', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Gayathri Raj - Associate Consultant
-- Tuesday, Thursday Morning + Saturday Afternoon
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_gayathri_id, @vps_hospital_id, 'Tuesday', '09:00:00', '13:00:00', 16, 0, 15, 'OT-4', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_gayathri_id, @vps_hospital_id, 'Thursday', '09:00:00', '13:00:00', 16, 0, 15, 'OT-4', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_gayathri_id, @vps_hospital_id, 'Saturday', '14:00:00', '18:00:00', 16, 0, 15, 'OT-4', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Jayasankar Surendran - Consultant
-- Monday, Tuesday, Thursday
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_jayasankar_id, @vps_hospital_id, 'Monday', '08:00:00', '12:00:00', 16, 0, 15, 'OT-5', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_jayasankar_id, @vps_hospital_id, 'Tuesday', '14:00:00', '18:00:00', 16, 0, 15, 'OT-5', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_jayasankar_id, @vps_hospital_id, 'Thursday', '08:00:00', '12:00:00', 16, 0, 15, 'OT-5', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Manu Prathap - Critical Care Specialist
-- Tuesday, Thursday, Saturday + Sunday
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_manu_id, @vps_hospital_id, 'Tuesday', '10:00:00', '18:00:00', 32, 0, 15, 'ICU-3', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_manu_id, @vps_hospital_id, 'Thursday', '10:00:00', '18:00:00', 32, 0, 15, 'ICU-3', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_manu_id, @vps_hospital_id, 'Saturday', '08:00:00', '14:00:00', 24, 0, 15, 'ICU-3', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_manu_id, @vps_hospital_id, 'Sunday', '14:00:00', '18:00:00', 16, 0, 15, 'ICU-3', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Nita George - Senior Consultant
-- Monday, Wednesday, Friday Full Day
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_nita_id, @vps_hospital_id, 'Monday', '08:00:00', '16:00:00', 32, 0, 15, 'ICU-4', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_nita_id, @vps_hospital_id, 'Wednesday', '08:00:00', '16:00:00', 32, 0, 15, 'ICU-4', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_nita_id, @vps_hospital_id, 'Friday', '08:00:00', '16:00:00', 32, 0, 15, 'ICU-4', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Renny Chacko - Consultant
-- Tuesday, Thursday, Saturday
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_renny_id, @vps_hospital_id, 'Tuesday', '09:00:00', '15:00:00', 24, 0, 15, 'OT-6', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_renny_id, @vps_hospital_id, 'Thursday', '09:00:00', '15:00:00', 24, 0, 15, 'OT-6', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_renny_id, @vps_hospital_id, 'Saturday', '10:00:00', '14:00:00', 16, 0, 15, 'OT-6', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Vishak Nair - Consultant
-- Monday, Wednesday, Friday Afternoon
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_vishak_id, @vps_hospital_id, 'Monday', '14:00:00', '18:00:00', 16, 0, 15, 'OT-7', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_vishak_id, @vps_hospital_id, 'Wednesday', '14:00:00', '18:00:00', 16, 0, 15, 'OT-7', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_vishak_id, @vps_hospital_id, 'Friday', '14:00:00', '18:00:00', 16, 0, 15, 'OT-7', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Preethi Mary Joseph - Associate Consultant
-- Tuesday, Thursday, Saturday Morning
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_preethi_id, @vps_hospital_id, 'Tuesday', '08:00:00', '12:00:00', 16, 0, 15, 'OT-8', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_preethi_id, @vps_hospital_id, 'Thursday', '08:00:00', '12:00:00', 16, 0, 15, 'OT-8', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_preethi_id, @vps_hospital_id, 'Saturday', '08:00:00', '12:00:00', 16, 0, 15, 'OT-8', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Thomas Babu - Critical Care Evening Shift
-- Monday, Wednesday, Friday + Sunday
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_thomas_id, @vps_hospital_id, 'Monday', '16:00:00', '22:00:00', 24, 0, 15, 'ICU-5', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_thomas_id, @vps_hospital_id, 'Wednesday', '16:00:00', '22:00:00', 24, 0, 15, 'ICU-5', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_thomas_id, @vps_hospital_id, 'Friday', '16:00:00', '22:00:00', 24, 0, 15, 'ICU-5', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_thomas_id, @vps_hospital_id, 'Sunday', '18:00:00', '22:00:00', 16, 0, 15, 'ICU-5', '4th Floor', 'Critical Care Wing', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Vishakha N Pillai - Associate Consultant
-- Tuesday, Thursday Afternoon + Saturday
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_vishakha_id, @vps_hospital_id, 'Tuesday', '13:00:00', '17:00:00', 16, 0, 15, 'OT-9', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_vishakha_id, @vps_hospital_id, 'Thursday', '13:00:00', '17:00:00', 16, 0, 15, 'OT-9', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_vishakha_id, @vps_hospital_id, 'Saturday', '15:00:00', '18:00:00', 12, 0, 15, 'OT-9', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Jinu Joy - Senior Registrar
-- Monday, Wednesday, Friday + Sunday Morning
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_jinu_id, @vps_hospital_id, 'Monday', '10:00:00', '14:00:00', 16, 0, 15, 'OT-10', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_jinu_id, @vps_hospital_id, 'Wednesday', '10:00:00', '14:00:00', 16, 0, 15, 'OT-10', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_jinu_id, @vps_hospital_id, 'Friday', '10:00:00', '14:00:00', 16, 0, 15, 'OT-10', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_jinu_id, @vps_hospital_id, 'Sunday', '09:00:00', '13:00:00', 16, 0, 15, 'OT-10', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

-- -----------------------------------------------
-- Dr. Sreeparvathi P - Senior Registrar
-- Tuesday, Thursday, Saturday + Sunday Afternoon
-- -----------------------------------------------
INSERT INTO doctor_sessions (
  id, doctor_id, hospital_id, day_of_week, start_time, end_time,
  max_tokens, current_token_number, avg_minutes_per_patient,
  room_number, floor, building_location, is_active, approval_status,
  approved_by, approved_at, recall_check_interval, recall_enabled, created_at, updated_at
) VALUES
(UUID(), @dr_sreeparvathi_id, @vps_hospital_id, 'Tuesday', '10:00:00', '14:00:00', 16, 0, 15, 'OT-11', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_sreeparvathi_id, @vps_hospital_id, 'Thursday', '10:00:00', '14:00:00', 16, 0, 15, 'OT-11', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_sreeparvathi_id, @vps_hospital_id, 'Saturday', '10:00:00', '14:00:00', 16, 0, 15, 'OT-11', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW()),
(UUID(), @dr_sreeparvathi_id, @vps_hospital_id, 'Sunday', '15:00:00', '19:00:00', 16, 0, 15, 'OT-11', '2nd Floor', 'Main Block', 1, 'approved', 'SYSTEM', NOW(), 5, 1, NOW(), NOW());

COMMIT;

-- ============================================================
-- SUMMARY
-- ============================================================
-- Hospital: VPS Lakeshore Hospital (ID: 2ba973fb-a661-11f0-abc5-52541aa39e4a)
-- Specialty: Anesthesiology & Critical Care (ID: 1621f7b1-a661-11f0-abc5-52541aa39e4a)
-- Total Doctors: 18
-- Total Sessions Created: 61 sessions across all doctors
--
-- Session Distribution:
-- - Dr. Rosy Jacob: 4 sessions
-- - Dr. Francis Manavalan: 4 sessions (Neuro Chief)
-- - Dr. Jaya Susan Jacob: 3 sessions
-- - Dr. John Ferns: 3 sessions
-- - Dr. Mallie Abraham: 4 sessions
-- - Dr. Mohammed Shahul Nebhu: 3 sessions (Cardiac Chief)
-- - Dr. Akhil Babu: 4 sessions
-- - Dr. Gayathri Raj: 3 sessions
-- - Dr. Jayasankar Surendran: 3 sessions
-- - Dr. Manu Prathap: 4 sessions
-- - Dr. Nita George: 3 sessions
-- - Dr. Renny Chacko: 3 sessions
-- - Dr. Vishak Nair: 3 sessions
-- - Dr. Preethi Mary Joseph: 3 sessions
-- - Dr. Thomas Babu: 4 sessions
-- - Dr. Vishakha N Pillai: 3 sessions
-- - Dr. Jinu Joy: 4 sessions (Registrar)
-- - Dr. Sreeparvathi P: 4 sessions (Registrar)
--
-- Coverage: All 7 days of the week with multiple doctors available
-- ============================================================
