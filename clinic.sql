-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 11, 2025 at 05:17 AM
-- Server version: 8.0.43
-- PHP Version: 8.4.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `devuser_hospitals`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`devuser`@`localhost` PROCEDURE `sp_get_missed_tokens_for_recall` (IN `p_session_id` VARCHAR(36), IN `p_appointment_date` VARCHAR(10), IN `p_current_token` INT)   BEGIN
  -- Get all missed tokens (pending tokens that are less than current token)
  SELECT
    a.id,
    a.token_number,
    a.user_id,
    a.is_recalled,
    a.recall_count,
    a.last_recalled_at,
    CONCAT(u.first_name, ' ', u.last_name) AS patient_name,
    u.phone AS patient_phone,
    -- Calculate priority (lower token number = higher priority)
    (p_current_token - a.token_number) AS tokens_behind
  FROM appointments a
  LEFT JOIN users u ON a.user_id = u.id
  WHERE a.session_id = p_session_id
    AND a.appointment_date = p_appointment_date
    AND a.token_number < p_current_token
    AND a.token_status = 'pending'
    AND a.status NOT IN ('cancelled', 'completed', 'no_show')
  ORDER BY a.token_number ASC;
END$$

CREATE DEFINER=`devuser`@`localhost` PROCEDURE `sp_record_token_call` (IN `p_id` VARCHAR(36), IN `p_session_id` VARCHAR(36), IN `p_appointment_id` VARCHAR(36), IN `p_appointment_date` VARCHAR(10), IN `p_token_number` INT, IN `p_is_recall` TINYINT(1), IN `p_recall_reason` VARCHAR(50), IN `p_called_by` VARCHAR(36))   BEGIN
  INSERT INTO token_call_history (
    id,
    session_id,
    appointment_id,
    appointment_date,
    token_number,
    call_type,
    is_recall,
    recall_reason,
    called_at,
    called_by
  ) VALUES (
    p_id,
    p_session_id,
    p_appointment_id,
    p_appointment_date,
    p_token_number,
    IF(p_is_recall = 1, 'recall', 'normal'),
    p_is_recall,
    p_recall_reason,
    NOW(),
    p_called_by
  );

  -- If it's a recall, update the appointment
  IF p_is_recall = 1 AND p_appointment_id IS NOT NULL THEN
    UPDATE appointments
    SET
      is_recalled = 1,
      recall_count = recall_count + 1,
      last_recalled_at = NOW()
    WHERE id = p_appointment_id;
  END IF;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `doctor_id` varchar(36) DEFAULT NULL,
  `hospital_id` varchar(36) DEFAULT NULL,
  `session_id` varchar(36) DEFAULT NULL,
  `appointment_date` varchar(10) NOT NULL,
  `token_number` int NOT NULL,
  `token_locked_at` timestamp NULL DEFAULT NULL,
  `token_lock_expires_at` timestamp NULL DEFAULT NULL,
  `token_status` varchar(20) DEFAULT 'pending',
  `missed_appointment` tinyint(1) DEFAULT '0',
  `no_show_reason` text,
  `token_changed_count` int DEFAULT '0',
  `original_token_number` int DEFAULT NULL,
  `last_token_change_at` timestamp NULL DEFAULT NULL,
  `estimated_time` varchar(8) DEFAULT NULL,
  `actual_start_time` varchar(8) DEFAULT NULL,
  `consultation_started_at` timestamp NULL DEFAULT NULL,
  `actual_end_time` varchar(8) DEFAULT NULL,
  `consultation_ended_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','confirmed','completed','cancelled','no_show','rescheduled') NOT NULL,
  `booking_type` enum('next','grid') NOT NULL,
  `patient_complaints` text,
  `doctor_notes` text,
  `prescription` text,
  `consultation_fee` decimal(8,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_recalled` tinyint(1) DEFAULT '0' COMMENT 'Whether this token has been recalled',
  `recall_count` int DEFAULT '0' COMMENT 'Number of times this token has been recalled',
  `last_recalled_at` timestamp NULL DEFAULT NULL COMMENT 'Last time this token was recalled',
  `attended_after_recall` tinyint(1) DEFAULT '0' COMMENT 'Whether patient attended after being recalled'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `user_id`, `doctor_id`, `hospital_id`, `session_id`, `appointment_date`, `token_number`, `token_locked_at`, `token_lock_expires_at`, `token_status`, `missed_appointment`, `no_show_reason`, `token_changed_count`, `original_token_number`, `last_token_change_at`, `estimated_time`, `actual_start_time`, `consultation_started_at`, `actual_end_time`, `consultation_ended_at`, `status`, `booking_type`, `patient_complaints`, `doctor_notes`, `prescription`, `consultation_fee`, `created_at`, `updated_at`, `is_recalled`, `recall_count`, `last_recalled_at`, `attended_after_recall`) VALUES
('LIv6w8ElORRxUykkIX9ji', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-005', 'hosp-002', 'sess-005-1', '2025-08-18', 2, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '08:20', NULL, NULL, NULL, NULL, 'pending', 'next', 'Nausea', NULL, NULL, 950.00, '2025-08-17 13:55:32', '2025-08-17 13:55:32', 0, 0, NULL, 0),
('bleru3iaiBCPjxJQu3uKA', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-001', 'hosp-001', 'sess-001-1', '2025-08-18', 2, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:15', NULL, NULL, NULL, NULL, 'confirmed', 'next', 'Nausea', NULL, NULL, 800.00, '2025-08-17 14:01:51', '2025-08-17 14:02:26', 0, 0, NULL, 0),
('L_Zz2r3BM6_LAS4qQzkQN', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-001', 'hosp-001', 'sess-001-1', '2025-08-25', 1, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Nausea', NULL, NULL, 800.00, '2025-08-18 20:05:39', '2025-10-04 19:33:19', 0, 0, NULL, 0),
('cWaZlImwneEl4MCatUoGZ', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-006', 'hosp-001', 'sess-006-1', '2025-08-19', 2, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:20', NULL, NULL, NULL, NULL, 'confirmed', 'next', 'Nausea', NULL, NULL, 900.00, '2025-08-19 02:16:36', '2025-08-19 02:17:54', 0, 0, NULL, 0),
('FwVN0U13aRDWv6oNrHarh', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-006', 'hosp-001', 'sess-006-1', '2025-08-26', 2, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:20', NULL, NULL, NULL, NULL, 'cancelled', 'next', 'Nausea', NULL, NULL, 900.00, '2025-08-19 02:21:17', '2025-08-19 02:22:49', 0, 0, NULL, 0),
('UwccFA60tP-Px4JD_3D5n', 'u7WpsoFG-dt8oASj2DO_V', 'doc-006', 'hosp-001', 'sess-006-2', '2025-08-19', 2, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:20', NULL, NULL, NULL, NULL, 'pending', 'next', 'test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test test ', NULL, NULL, 900.00, '2025-08-19 05:40:40', '2025-08-19 05:40:40', 0, 0, NULL, 0),
('gVfIFc8FNgajmAWfD4Rg4', 'u7WpsoFG-dt8oASj2DO_V', 'doc-002', 'hosp-002', 'sess-002-1', '2025-08-21', 1, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '08:30', NULL, NULL, NULL, NULL, 'confirmed', 'grid', NULL, NULL, NULL, 750.00, '2025-08-21 11:03:13', '2025-10-04 19:33:19', 0, 0, NULL, 0),
('m3BGOUeP7ltVsnn_d8vPt', 'u7WpsoFG-dt8oASj2DO_V', 'doc-030', 'hosp-008', 'sess-030-1', '2025-08-21', 2, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:36', NULL, NULL, NULL, NULL, 'pending', 'grid', NULL, NULL, NULL, 750.00, '2025-08-21 11:06:18', '2025-10-04 19:33:19', 0, 0, NULL, 0),
('C2feX5H4Vnnql5QR6sdZ_', 'u7WpsoFG-dt8oASj2DO_V', 'doc-028', 'hosp-007', 'sess-028-1', '2025-08-21', 3, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '08:38', NULL, NULL, NULL, NULL, 'confirmed', 'grid', NULL, NULL, NULL, 650.00, '2025-08-21 11:08:58', '2025-10-04 19:33:19', 0, 0, NULL, 0),
('6XzvRW77qZClR-yAd02q4', 'u7WpsoFG-dt8oASj2DO_V', 'doc-008', 'hosp-001', 'sess-008-3', '2025-08-28', 5, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:48', NULL, NULL, NULL, NULL, 'confirmed', 'grid', NULL, NULL, NULL, 550.00, '2025-08-21 11:15:59', '2025-10-04 19:33:19', 0, 0, NULL, 0),
('LH1ZIVhs_9D_arxWITQmo', 'u7WpsoFG-dt8oASj2DO_V', 'doc-012', 'hosp-002', 'sess-012-2', '2025-09-04', 1, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '04:48', NULL, NULL, NULL, NULL, 'pending', 'grid', NULL, NULL, NULL, 750.00, '2025-08-21 11:18:10', '2025-10-04 19:33:19', 0, 0, NULL, 0),
('RWkKagtPA6Ulu_a8GdwF5', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-001', 'hosp-001', 'sess-001-2', '2025-08-27', 8, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '15:57', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Nausea', NULL, NULL, 800.00, '2025-08-22 03:28:10', '2025-10-04 19:33:19', 0, 0, NULL, 0),
('gx_-u10HwpmwI03ik9QZk', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-003', 'hosp-001', 'sess-003-2', '2025-10-01', 8, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:20', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Hello World', NULL, NULL, 900.00, '2025-10-01 06:00:07', '2025-10-04 19:33:19', 0, 0, NULL, 0),
('OE3ot4noVFdiV3Ft5aDHF', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-CoK__KzNkTPm', 'gmc-kottayam-OeSnZmuiLV', 'sess-apvJKwaV2sGP', '2025-10-08', 1, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '14:00', NULL, NULL, NULL, NULL, 'confirmed', 'next', 'Hello world', NULL, NULL, 600.00, '2025-10-03 06:00:30', '2025-10-08 05:48:02', 0, 0, NULL, 0),
('LeKuO1UocxKDvurEoevxM', 'bEE24k5iA7bBDIDHZ0ocQ', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-H_gvP1FAGLhx', '2025-10-03', 1, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '14:00', NULL, NULL, NULL, NULL, 'confirmed', 'next', NULL, NULL, NULL, 500.00, '2025-10-03 09:04:23', '2025-10-03 09:06:12', 0, 0, NULL, 0),
('7GFjNRAvzBkovHt6hPsMo', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-H_gvP1FAGLhx', '2025-10-03', 2, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '14:15', NULL, NULL, NULL, NULL, 'confirmed', 'next', NULL, NULL, NULL, 500.00, '2025-10-03 09:07:22', '2025-10-03 09:08:06', 0, 0, NULL, 0),
('-QuUWqtxo3beKtp6dSKTj', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-03', 1, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:00', NULL, NULL, NULL, NULL, 'pending', 'next', NULL, NULL, NULL, 700.00, '2025-10-03 09:53:45', '2025-10-03 09:53:45', 0, 0, NULL, 0),
('uj94xqmigauoTgU_Lt4AP', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-006', 'hosp-001', 'sess-006-3', '2025-10-11', 4, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '15:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', NULL, NULL, NULL, 900.00, '2025-10-04 19:36:39', '2025-10-04 19:37:50', 0, 0, NULL, 0),
('Lqr3r9-xNmahcHPngngYS', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-41jKi0kKkm3L', 'gmc-kottayam-OeSnZmuiLV', 'sess-SFHfq_IHMOLZ', '2025-10-06', 1, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:00', '12:06', NULL, '12:07', NULL, 'completed', 'grid', 'Hello', 'Second', 'Hello World', 600.00, '2025-10-06 06:22:16', '2025-10-06 06:37:25', 0, 0, NULL, 0),
('EFGs2xLbwxRAIbIUu86pX', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-41jKi0kKkm3L', 'gmc-kottayam-OeSnZmuiLV', 'sess-SFHfq_IHMOLZ', '2025-10-06', 2, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:15', NULL, NULL, NULL, NULL, 'pending', 'next', 'Hello World', NULL, NULL, 600.00, '2025-10-06 06:26:31', '2025-10-06 06:26:31', 0, 0, NULL, 0),
('oVTDAux1kldZaihBjPf03', '_rJ5SR9AwAH28uqiDasov', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-QQaPQrDqsqxX', '2025-10-06', 1, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', NULL, NULL, NULL, 500.00, '2025-10-06 09:05:13', '2025-10-06 09:06:21', 0, 0, NULL, 0),
('LjkzSVms--7MuoKG7KCJG', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-CoK__KzNkTPm', 'gmc-kottayam-OeSnZmuiLV', 'sess-y9nzGYiT7Goh', '2025-10-07', 23, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '15:30', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Nausea', NULL, NULL, 600.00, '2025-10-07 06:41:35', '2025-10-07 06:43:21', 0, 0, NULL, 0),
('appt-test-001', 'test-user-001', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 1, NULL, NULL, 'missed', 1, 'Patient did not show up for consultation', 0, NULL, NULL, '09:00', '11:30', '2025-10-08 06:00:02', '12:15', '2025-10-08 06:45:37', 'no_show', 'grid', 'Headache and fever', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 06:45:44', 0, 0, NULL, 0),
('appt-test-002', 'test-user-002', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 2, NULL, NULL, 'missed', 1, 'Patient did not show up for consultation', 0, NULL, NULL, '09:15', NULL, NULL, '12:36', '2025-10-08 07:06:15', 'completed', 'grid', 'Breathing difficulty', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 07:06:15', 1, 1, '2025-10-08 07:05:57', 0),
('appt-test-003', 'test-user-003', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 3, NULL, NULL, 'missed', 1, 'Patient did not show up for consultation', 0, NULL, NULL, '09:30', NULL, NULL, '12:36', '2025-10-08 07:06:21', 'completed', 'grid', 'Blood sugar check', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 07:06:21', 1, 1, '2025-10-08 07:06:16', 0),
('appt-test-004', 'test-user-004', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 4, NULL, NULL, 'missed', 1, 'Patient did not show up for consultation', 0, NULL, NULL, '09:45', NULL, NULL, '12:36', '2025-10-08 07:06:26', 'completed', 'grid', 'High BP consultation', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 07:06:26', 1, 1, '2025-10-08 07:06:22', 0),
('appt-test-005', 'test-user-005', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 5, NULL, NULL, 'missed', 1, 'Patient did not show up for consultation', 0, NULL, NULL, '10:00', '11:53', '2025-10-08 06:23:49', '12:13', '2025-10-08 06:43:30', 'no_show', 'grid', 'General checkup', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 06:43:44', 0, 0, NULL, 0),
('appt-test-006', 'test-user-006', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 6, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:15', NULL, NULL, '12:20', '2025-10-08 06:50:16', 'completed', 'grid', 'Thyroid follow-up', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 06:50:16', 0, 0, NULL, 0),
('appt-test-007', 'test-user-007', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 7, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:30', NULL, NULL, '12:20', '2025-10-08 06:50:21', 'completed', 'grid', 'Stomach pain', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 06:50:21', 0, 0, NULL, 0),
('appt-test-008', 'test-user-008', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 8, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:45', NULL, NULL, '12:21', '2025-10-08 06:51:03', 'completed', 'grid', 'Severe migraine', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 06:51:03', 0, 0, NULL, 0),
('appt-test-009', 'test-user-009', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 9, NULL, NULL, 'missed', 1, 'Patient did not show up for consultation', 0, NULL, NULL, '11:00', NULL, NULL, '12:36', '2025-10-08 07:06:38', 'completed', 'grid', 'Routine checkup', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 07:06:38', 1, 1, '2025-10-08 07:06:28', 0),
('appt-test-010', 'test-user-010', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 10, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:15', NULL, NULL, '12:21', '2025-10-08 06:51:06', 'completed', 'grid', 'Joint pain', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 06:51:06', 0, 0, NULL, 0),
('appt-test-011', 'test-user-011', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 11, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:30', NULL, NULL, '12:21', '2025-10-08 06:51:10', 'completed', 'grid', 'Cholesterol review', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 06:51:10', 0, 0, NULL, 0),
('appt-test-012', 'test-user-012', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 12, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:45', NULL, NULL, '12:21', '2025-10-08 06:51:13', 'completed', 'grid', 'Health checkup', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 06:51:13', 0, 0, NULL, 0),
('appt-test-013', 'test-user-013', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 13, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '12:00', NULL, NULL, '12:21', '2025-10-08 06:51:15', 'completed', 'grid', 'Skin rash', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 06:51:15', 0, 0, NULL, 0),
('appt-test-014', 'test-user-014', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 14, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '12:15', NULL, NULL, '12:21', '2025-10-08 06:51:18', 'completed', 'grid', 'PCOD consultation', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 06:51:18', 0, 0, NULL, 0),
('appt-test-015', 'test-user-015', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 15, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '12:30', NULL, NULL, '12:21', '2025-10-08 06:51:22', 'completed', 'grid', 'Lower back pain', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 06:51:22', 0, 0, NULL, 0),
('appt-test-016', 'test-user-016', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 16, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '12:45', NULL, NULL, '12:21', '2025-10-08 06:51:27', 'completed', 'grid', 'General consultation', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 06:51:27', 0, 0, NULL, 0),
('appt-test-017', 'test-user-017', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 17, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '13:00', NULL, NULL, '12:30', '2025-10-08 07:00:34', 'completed', 'grid', 'Acid reflux', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 07:00:34', 0, 0, NULL, 0),
('appt-test-018', 'test-user-018', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 18, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '13:15', NULL, NULL, '12:30', '2025-10-08 07:00:39', 'completed', 'grid', 'Low hemoglobin', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 07:00:39', 0, 0, NULL, 0),
('appt-test-019', 'test-user-019', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 19, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '13:30', NULL, NULL, '12:30', '2025-10-08 07:00:43', 'completed', 'grid', 'Allergy checkup', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 07:00:43', 0, 0, NULL, 0),
('appt-test-020', 'test-user-020', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 20, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '13:45', NULL, NULL, '12:30', '2025-10-08 07:00:47', 'completed', 'grid', 'Routine wellness check', NULL, NULL, 500.00, '2025-10-08 05:42:00', '2025-10-08 07:00:47', 0, 0, NULL, 0),
('g_e6hBdiXXbbMl7G3U94D', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'sess-OW5f8aRGw9oS', '2025-10-08', 21, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '14:00', NULL, NULL, '12:35', '2025-10-08 07:05:55', 'completed', 'next', NULL, NULL, NULL, 500.00, '2025-10-08 06:06:10', '2025-10-08 07:05:55', 0, 0, NULL, 0),
('9Y6-bwu90-XQ15Ki5692Q', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 16, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '17:45', NULL, NULL, NULL, NULL, 'confirmed', 'grid', NULL, NULL, NULL, 700.00, '2025-10-08 08:41:17', '2025-10-08 08:42:12', 0, 0, NULL, 0),
('appt-tests-001', 'test-user--001', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 1, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Headache and fever', NULL, NULL, 500.00, '2025-10-08 08:58:28', '2025-10-08 08:58:28', 0, 0, NULL, 0),
('appt-tests-002', 'test-user--002', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 2, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:15', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Breathing difficulty', NULL, NULL, 500.00, '2025-10-08 08:58:28', '2025-10-08 08:58:28', 0, 0, NULL, 0),
('appt-tests-003', 'test-user--003', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 3, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:30', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Blood sugar check', NULL, NULL, 500.00, '2025-10-08 08:58:28', '2025-10-08 08:58:28', 0, 0, NULL, 0),
('appt-tests-004', 'test-user--004', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 4, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:45', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'High BP consultation', NULL, NULL, 500.00, '2025-10-08 08:58:28', '2025-10-08 08:58:28', 0, 0, NULL, 0),
('appt-tests-005', 'test-user--005', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 5, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'General checkup', NULL, NULL, 500.00, '2025-10-08 08:58:28', '2025-10-08 08:58:28', 0, 0, NULL, 0),
('appt-tests-006', 'test-user--006', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 6, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:15', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Thyroid follow-up', NULL, NULL, 500.00, '2025-10-08 08:58:28', '2025-10-08 08:58:28', 0, 0, NULL, 0),
('appt-tests-007', 'test-user--007', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 7, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:30', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Stomach pain', NULL, NULL, 500.00, '2025-10-08 08:58:28', '2025-10-08 08:58:28', 0, 0, NULL, 0),
('appt-tests-008', 'test-user--008', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 8, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:45', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Severe migraine', NULL, NULL, 500.00, '2025-10-08 08:58:28', '2025-10-08 08:58:28', 0, 0, NULL, 0),
('appt-tests-009', 'test-user--009', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 9, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Routine checkup', NULL, NULL, 500.00, '2025-10-08 08:58:28', '2025-10-08 08:58:28', 0, 0, NULL, 0),
('appt-tests-010', 'test-user--010', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 10, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:15', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Joint pain', NULL, NULL, 500.00, '2025-10-08 09:00:40', '2025-10-08 09:00:40', 0, 0, NULL, 0),
('appt-tests-011', 'test-user--011', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 11, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:30', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Cholesterol review', NULL, NULL, 500.00, '2025-10-08 09:00:40', '2025-10-08 09:00:40', 0, 0, NULL, 0),
('appt-tests-012', 'test-user--012', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 12, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:45', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Health checkup', NULL, NULL, 500.00, '2025-10-08 09:00:40', '2025-10-08 09:00:40', 0, 0, NULL, 0),
('appt-tests-013', 'test-user--013', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 13, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '12:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Skin rash', NULL, NULL, 500.00, '2025-10-08 09:00:40', '2025-10-08 09:00:40', 0, 0, NULL, 0),
('appt-tests-014', 'test-user--014', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 14, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '12:15', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'PCOD consultation', NULL, NULL, 500.00, '2025-10-08 09:00:40', '2025-10-08 09:00:40', 0, 0, NULL, 0),
('appt-tests-015', 'test-user--015', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 15, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '12:30', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Lower back pain', NULL, NULL, 500.00, '2025-10-08 09:00:40', '2025-10-08 09:00:40', 0, 0, NULL, 0),
('appt-tests-017', 'test-user--017', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 17, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '13:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Acid reflux', NULL, NULL, 500.00, '2025-10-08 09:00:40', '2025-10-08 09:00:40', 0, 0, NULL, 0),
('appt-tests-018', 'test-user--018', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 18, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '13:15', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Low hemoglobin', NULL, NULL, 500.00, '2025-10-08 09:00:40', '2025-10-08 09:00:40', 0, 0, NULL, 0),
('appt-tests-019', 'test-user--019', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 19, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '13:30', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Allergy checkup', NULL, NULL, 500.00, '2025-10-08 09:00:40', '2025-10-08 09:00:40', 0, 0, NULL, 0),
('appt-tests-020', 'test-user--020', 'doc-027', 'hosp-005', 'sess-027-2', '2025-10-08', 20, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '13:45', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Routine wellness check', NULL, NULL, 500.00, '2025-10-08 09:00:40', '2025-10-08 09:00:40', 0, 0, NULL, 0),
('udtufmAlGEtWL37H3eFxQ', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 16, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '17:45', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Hello', NULL, NULL, 800.00, '2025-10-08 11:20:08', '2025-10-08 11:20:52', 0, 0, NULL, 0),
('appt-tested-001', 'test-users--001', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 1, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:00', NULL, NULL, '17:04', '2025-10-08 11:34:43', 'completed', 'grid', 'Headache and fever', NULL, NULL, 500.00, '2025-10-08 11:31:02', '2025-10-08 11:34:43', 0, 0, NULL, 0),
('appt-tested-002', 'test-users--002', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 2, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:15', NULL, NULL, '17:05', '2025-10-08 11:35:24', 'completed', 'grid', 'Breathing difficulty', NULL, NULL, 500.00, '2025-10-08 11:31:02', '2025-10-08 11:35:24', 0, 0, NULL, 0),
('appt-tested-003', 'test-users--003', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 3, NULL, NULL, 'missed', 1, 'Patient did not show up for consultation', 0, NULL, NULL, '09:30', NULL, NULL, '17:08', '2025-10-08 11:38:54', 'completed', 'grid', 'Blood sugar check', NULL, NULL, 500.00, '2025-10-08 11:31:02', '2025-10-08 11:38:54', 1, 1, '2025-10-08 11:38:21', 0),
('appt-tested-004', 'test-users--004', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 4, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:45', NULL, NULL, '17:07', '2025-10-08 11:37:59', 'completed', 'grid', 'High BP consultation', NULL, NULL, 500.00, '2025-10-08 11:31:02', '2025-10-08 11:37:59', 0, 0, NULL, 0),
('appt-tested-005', 'test-users--005', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 5, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:00', NULL, NULL, '17:08', '2025-10-08 11:38:08', 'completed', 'grid', 'General checkup', NULL, NULL, 500.00, '2025-10-08 11:31:02', '2025-10-08 11:38:08', 0, 0, NULL, 0),
('appt-tested-006', 'test-users--006', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 6, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:15', NULL, NULL, '17:08', '2025-10-08 11:38:19', 'completed', 'grid', 'Thyroid follow-up', NULL, NULL, 500.00, '2025-10-08 11:31:02', '2025-10-08 11:38:19', 0, 0, NULL, 0),
('appt-tested-007', 'test-users--007', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 7, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:30', NULL, NULL, '17:09', '2025-10-08 11:39:05', 'completed', 'grid', 'Stomach pain', NULL, NULL, 500.00, '2025-10-08 11:31:02', '2025-10-08 11:39:05', 0, 0, NULL, 0),
('appt-tested-008', 'test-users--008', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 8, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:45', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Severe migraine', NULL, NULL, 500.00, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 0, 0, NULL, 0),
('appt-tested-009', 'test-users--009', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 9, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Routine checkup', NULL, NULL, 500.00, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 0, 0, NULL, 0),
('appt-tested-010', 'test-users--010', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 10, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:15', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Joint pain', NULL, NULL, 500.00, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 0, 0, NULL, 0),
('appt-tested-011', 'test-users--011', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 11, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:30', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Cholesterol review', NULL, NULL, 500.00, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 0, 0, NULL, 0),
('appt-tested-012', 'test-users--012', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 12, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:45', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Health checkup', NULL, NULL, 500.00, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 0, 0, NULL, 0),
('appt-tested-013', 'test-users--013', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 13, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '12:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Skin rash', NULL, NULL, 500.00, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 0, 0, NULL, 0),
('appt-tested-014', 'test-users--014', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 14, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '12:15', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'PCOD consultation', NULL, NULL, 500.00, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 0, 0, NULL, 0),
('appt-tested-015', 'test-users--015', 'doc-001', 'hosp-001', 'sess-001-2', '2025-10-08', 15, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '12:30', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Lower back pain', NULL, NULL, 500.00, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 0, 0, NULL, 0),
('g4rBGlWnpnD7MBGxRkIKq', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-005', 'hosp-002', 'sess-005-3', '2025-10-10', 11, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:20', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'hey', NULL, NULL, 950.00, '2025-10-10 04:14:49', '2025-10-10 04:46:04', 0, 0, NULL, 0),
('appt-tests1-001', 'test-user--001', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-08', 1, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Headache and fever', NULL, NULL, 500.00, '2025-10-10 04:32:06', '2025-10-10 04:32:06', 0, 0, NULL, 0),
('appt-tests1-002', 'test-user--002', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-08', 2, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:15', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Breathing difficulty', NULL, NULL, 500.00, '2025-10-10 04:32:06', '2025-10-10 04:32:06', 0, 0, NULL, 0),
('appt-tests1-003', 'test-user--003', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-08', 3, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:30', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Blood sugar check', NULL, NULL, 500.00, '2025-10-10 04:32:06', '2025-10-10 04:32:06', 0, 0, NULL, 0),
('appt-tests1-004', 'test-user--004', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-08', 4, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:45', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'High BP consultation', NULL, NULL, 500.00, '2025-10-10 04:32:06', '2025-10-10 04:32:06', 0, 0, NULL, 0),
('appt-tests1-005', 'test-user--005', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-08', 5, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'General checkup', NULL, NULL, 500.00, '2025-10-10 04:32:06', '2025-10-10 04:32:06', 0, 0, NULL, 0),
('appt-tests1-006', 'test-user--006', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-08', 6, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:15', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Thyroid follow-up', NULL, NULL, 500.00, '2025-10-10 04:32:06', '2025-10-10 04:32:06', 0, 0, NULL, 0),
('appt-tests1-007', 'test-user--007', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-08', 7, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:30', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Stomach pain', NULL, NULL, 500.00, '2025-10-10 04:32:06', '2025-10-10 04:32:06', 0, 0, NULL, 0),
('appt-tests1-008', 'test-user--008', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-08', 8, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:45', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Severe migraine', NULL, NULL, 500.00, '2025-10-10 04:32:06', '2025-10-10 04:32:06', 0, 0, NULL, 0),
('appt-tests1-009', 'test-user--009', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-08', 9, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Routine checkup', NULL, NULL, 500.00, '2025-10-10 04:32:06', '2025-10-10 04:32:06', 0, 0, NULL, 0),
('appt-tests1-010', 'test-user--010', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-08', 10, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:15', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Joint pain', NULL, NULL, 500.00, '2025-10-10 04:32:06', '2025-10-10 04:32:06', 0, 0, NULL, 0),
('appt-tests2-001', 'test-user--001', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-10', 1, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Headache and fever', NULL, NULL, 500.00, '2025-10-10 04:43:28', '2025-10-10 04:43:28', 0, 0, NULL, 0),
('appt-tests2-002', 'test-user--002', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-10', 2, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:15', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Breathing difficulty', NULL, NULL, 500.00, '2025-10-10 04:43:28', '2025-10-10 04:43:28', 0, 0, NULL, 0),
('appt-tests2-003', 'test-user--003', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-10', 3, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:30', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Blood sugar check', NULL, NULL, 500.00, '2025-10-10 04:43:28', '2025-10-10 04:43:28', 0, 0, NULL, 0),
('appt-tests2-004', 'test-user--004', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-10', 4, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:45', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'High BP consultation', NULL, NULL, 500.00, '2025-10-10 04:43:28', '2025-10-10 04:43:28', 0, 0, NULL, 0),
('appt-tests2-005', 'test-user--005', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-10', 5, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'General checkup', NULL, NULL, 500.00, '2025-10-10 04:43:28', '2025-10-10 04:43:28', 0, 0, NULL, 0),
('appt-tests2-006', 'test-user--006', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-10', 6, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:15', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Thyroid follow-up', NULL, NULL, 500.00, '2025-10-10 04:43:28', '2025-10-10 04:43:28', 0, 0, NULL, 0),
('appt-tests2-007', 'test-user--007', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-10', 7, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:30', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Stomach pain', NULL, NULL, 500.00, '2025-10-10 04:43:28', '2025-10-10 04:43:28', 0, 0, NULL, 0),
('appt-tests2-008', 'test-user--008', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-10', 8, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:45', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Severe migraine', NULL, NULL, 500.00, '2025-10-10 04:43:28', '2025-10-10 04:43:28', 0, 0, NULL, 0),
('appt-tests2-009', 'test-user--009', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-10', 9, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Routine checkup', NULL, NULL, 500.00, '2025-10-10 04:43:28', '2025-10-10 04:43:28', 0, 0, NULL, 0),
('appt-tests2-010', 'test-user--010', 'doc-005', 'hosp-005', 'sess-005-3', '2025-10-10', 10, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:15', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Joint pain', NULL, NULL, 500.00, '2025-10-10 04:43:28', '2025-10-10 04:43:28', 0, 0, NULL, 0),
('X5lzFpL5t4Rq1-rDZVY_T', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 20, NULL, NULL, 'missed', 1, 'Patient did not show up for consultation', 0, NULL, NULL, '13:45', NULL, NULL, '12:10', '2025-10-10 06:40:06', 'completed', 'grid', NULL, NULL, NULL, 700.00, '2025-10-10 04:50:51', '2025-10-10 06:40:06', 1, 2, '2025-10-10 06:39:31', 0),
('appt-tests3-001', 'test-user--001', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 1, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:00', NULL, NULL, '10:26', '2025-10-10 04:56:44', 'completed', 'grid', 'Headache and fever', NULL, NULL, 500.00, '2025-10-10 04:54:40', '2025-10-10 04:56:44', 0, 0, NULL, 0),
('appt-tests3-002', 'test-user--002', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 2, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:15', NULL, NULL, '10:26', '2025-10-10 04:56:51', 'completed', 'grid', 'Breathing difficulty', NULL, NULL, 500.00, '2025-10-10 04:54:40', '2025-10-10 04:56:51', 0, 0, NULL, 0),
('appt-tests3-003', 'test-user--003', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 3, NULL, NULL, 'missed', 1, 'Patient did not show up for consultation', 0, NULL, NULL, '09:30', NULL, NULL, '11:05', '2025-10-10 05:35:42', 'completed', 'grid', 'Blood sugar check', NULL, NULL, 500.00, '2025-10-10 04:54:40', '2025-10-10 05:35:42', 1, 1, '2025-10-10 04:57:23', 0),
('appt-tests3-004', 'test-user--004', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 4, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:45', NULL, NULL, '10:27', '2025-10-10 04:57:02', 'completed', 'grid', 'High BP consultation', NULL, NULL, 500.00, '2025-10-10 04:54:40', '2025-10-10 04:57:02', 0, 0, NULL, 0),
('appt-tests3-005', 'test-user--005', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 5, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:00', NULL, NULL, '10:27', '2025-10-10 04:57:14', 'completed', 'grid', 'General checkup', NULL, NULL, 500.00, '2025-10-10 04:54:40', '2025-10-10 04:57:14', 0, 0, NULL, 0),
('appt-tests3-006', 'test-user--006', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 6, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:15', NULL, NULL, '10:27', '2025-10-10 04:57:22', 'completed', 'grid', 'Thyroid follow-up', NULL, NULL, 500.00, '2025-10-10 04:54:40', '2025-10-10 04:57:22', 0, 0, NULL, 0),
('appt-tests3-007', 'test-user--007', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 7, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:30', NULL, NULL, '11:07', '2025-10-10 05:37:38', 'completed', 'grid', 'Stomach pain', NULL, NULL, 500.00, '2025-10-10 04:54:40', '2025-10-10 05:37:38', 0, 0, NULL, 0),
('appt-tests3-008', 'test-user--008', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 8, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:45', NULL, NULL, '11:10', '2025-10-10 05:40:18', 'completed', 'grid', 'Severe migraine', NULL, NULL, 500.00, '2025-10-10 04:54:40', '2025-10-10 05:40:18', 0, 0, NULL, 0),
('appt-tests3-009', 'test-user--009', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 9, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:00', NULL, NULL, '11:10', '2025-10-10 05:40:30', 'completed', 'grid', 'Routine checkup', NULL, NULL, 500.00, '2025-10-10 04:54:40', '2025-10-10 05:40:30', 0, 0, NULL, 0),
('appt-tests3-010', 'test-user--010', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 10, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:15', NULL, NULL, '11:10', '2025-10-10 05:40:35', 'completed', 'grid', 'Joint pain', NULL, NULL, 500.00, '2025-10-10 04:54:40', '2025-10-10 05:40:35', 0, 0, NULL, 0),
('appt-tests4-001', 'test-user--001', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 11, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:00', NULL, NULL, '11:10', '2025-10-10 05:40:45', 'completed', 'grid', 'Headache and fever', NULL, NULL, 500.00, '2025-10-10 05:39:49', '2025-10-10 05:40:45', 0, 0, NULL, 0),
('appt-tests4-002', 'test-user--002', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 12, NULL, NULL, 'missed', 1, 'Patient did not show up for consultation', 0, NULL, NULL, '09:15', NULL, NULL, '11:11', '2025-10-10 05:41:08', 'completed', 'grid', 'Breathing difficulty', NULL, NULL, 500.00, '2025-10-10 05:39:49', '2025-10-10 05:41:08', 1, 1, '2025-10-10 05:41:03', 0),
('appt-tests4-003', 'test-user--003', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 13, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:30', NULL, NULL, '11:11', '2025-10-10 05:41:02', 'completed', 'grid', 'Blood sugar check', NULL, NULL, 500.00, '2025-10-10 05:39:49', '2025-10-10 05:41:02', 0, 0, NULL, 0),
('appt-tests4-004', 'test-user--004', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 14, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:45', NULL, NULL, '11:11', '2025-10-10 05:41:12', 'completed', 'grid', 'High BP consultation', NULL, NULL, 500.00, '2025-10-10 05:39:49', '2025-10-10 05:41:12', 0, 0, NULL, 0),
('appt-tests4-005', 'test-user--005', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 15, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:00', NULL, NULL, '11:11', '2025-10-10 05:41:16', 'completed', 'grid', 'General checkup', NULL, NULL, 500.00, '2025-10-10 05:39:49', '2025-10-10 05:41:16', 0, 0, NULL, 0),
('appt-tests4-006', 'test-user--006', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 16, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:15', NULL, NULL, '11:11', '2025-10-10 05:41:19', 'completed', 'grid', 'Thyroid follow-up', NULL, NULL, 500.00, '2025-10-10 05:39:49', '2025-10-10 05:41:19', 0, 0, NULL, 0),
('appt-tests4-007', 'test-user--007', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 17, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:30', NULL, NULL, '11:11', '2025-10-10 05:41:25', 'completed', 'grid', 'Stomach pain', NULL, NULL, 500.00, '2025-10-10 05:39:49', '2025-10-10 05:41:25', 0, 0, NULL, 0),
('appt-tests4-008', 'test-user--008', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 18, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:45', NULL, NULL, '11:11', '2025-10-10 05:41:31', 'completed', 'grid', 'Severe migraine', NULL, NULL, 500.00, '2025-10-10 05:39:49', '2025-10-10 05:41:31', 0, 0, NULL, 0),
('appt-tests4-009', 'test-user--009', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 19, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:00', NULL, NULL, '11:11', '2025-10-10 05:41:39', 'completed', 'grid', 'Routine checkup', NULL, NULL, 500.00, '2025-10-10 05:39:49', '2025-10-10 05:41:39', 0, 0, NULL, 0),
('appt-tests5-001', 'test-user--001', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 21, NULL, NULL, 'missed', 1, 'Patient did not show up for consultation', 0, NULL, NULL, '09:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Headache and fever', NULL, NULL, 500.00, '2025-10-10 06:14:29', '2025-10-10 11:12:33', 1, 2, '2025-10-10 11:12:32', 0),
('appt-tests5-002', 'test-user--002', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 22, NULL, NULL, 'missed', 1, 'Patient did not show up for consultation', 0, NULL, NULL, '09:15', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Breathing difficulty', NULL, NULL, 500.00, '2025-10-10 06:14:29', '2025-10-10 07:02:33', 0, 0, NULL, 0),
('appt-tests5-003', 'test-user--003', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 23, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:30', NULL, NULL, '12:10', '2025-10-10 06:40:31', 'completed', 'grid', 'Blood sugar check', NULL, NULL, 500.00, '2025-10-10 06:14:29', '2025-10-10 06:40:31', 0, 0, NULL, 0),
('appt-tests5-004', 'test-user--004', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 24, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:45', NULL, NULL, '12:10', '2025-10-10 06:40:43', 'completed', 'grid', 'High BP consultation', NULL, NULL, 500.00, '2025-10-10 06:14:29', '2025-10-10 06:40:43', 0, 0, NULL, 0),
('appt-tests5-005', 'test-user--005', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 25, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:00', NULL, NULL, '12:10', '2025-10-10 06:40:49', 'completed', 'grid', 'General checkup', NULL, NULL, 500.00, '2025-10-10 06:14:29', '2025-10-10 06:40:49', 0, 0, NULL, 0),
('appt-tests5-006', 'test-user--006', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 26, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:15', NULL, NULL, '12:10', '2025-10-10 06:40:55', 'completed', 'grid', 'Thyroid follow-up', NULL, NULL, 500.00, '2025-10-10 06:14:29', '2025-10-10 06:40:55', 0, 0, NULL, 0),
('appt-tests5-007', 'test-user--007', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 27, NULL, NULL, 'missed', 1, 'Patient did not show up for consultation', 0, NULL, NULL, '10:30', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Stomach pain', NULL, NULL, 500.00, '2025-10-10 06:14:29', '2025-10-10 07:02:43', 0, 0, NULL, 0),
('appt-tests5-008', 'test-user--008', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 28, NULL, NULL, 'missed', 1, 'Patient did not show up for consultation', 0, NULL, NULL, '10:45', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Severe migraine', NULL, NULL, 500.00, '2025-10-10 06:14:29', '2025-10-10 07:02:55', 0, 0, NULL, 0),
('appt-tests5-009', 'test-user--009', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 29, NULL, NULL, 'missed', 1, 'Patient did not show up for consultation', 0, NULL, NULL, '11:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Routine checkup', NULL, NULL, 500.00, '2025-10-10 06:14:29', '2025-10-10 11:11:23', 0, 0, NULL, 0),
('appt-tests6-001', 'tests2-user--001', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 31, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:00', NULL, NULL, '16:42', '2025-10-10 11:12:06', 'completed', 'grid', 'Headache and fever', NULL, NULL, 500.00, '2025-10-10 06:58:51', '2025-10-10 11:12:06', 0, 0, NULL, 0),
('appt-tests6-002', 'tests2-user--002', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 32, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:15', NULL, NULL, '16:42', '2025-10-10 11:12:14', 'completed', 'grid', 'Breathing difficulty', NULL, NULL, 500.00, '2025-10-10 06:58:51', '2025-10-10 11:12:14', 0, 0, NULL, 0),
('appt-tests6-003', 'tests2-user--003', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 33, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:30', NULL, NULL, '16:42', '2025-10-10 11:12:21', 'completed', 'grid', 'Blood sugar check', NULL, NULL, 500.00, '2025-10-10 06:58:51', '2025-10-10 11:12:21', 0, 0, NULL, 0),
('appt-tests6-004', 'tests2-user--004', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 34, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '09:45', NULL, NULL, '16:42', '2025-10-10 11:12:26', 'completed', 'grid', 'High BP consultation', NULL, NULL, 500.00, '2025-10-10 06:58:51', '2025-10-10 11:12:26', 0, 0, NULL, 0),
('appt-tests6-005', 'tests2-user--005', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 35, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:00', NULL, NULL, '16:42', '2025-10-10 11:12:30', 'completed', 'grid', 'General checkup', NULL, NULL, 500.00, '2025-10-10 06:58:51', '2025-10-10 11:12:30', 0, 0, NULL, 0),
('appt-tests6-006', 'tests2-user--006', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 36, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:15', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Thyroid follow-up', NULL, NULL, 500.00, '2025-10-10 06:58:51', '2025-10-10 06:58:51', 0, 0, NULL, 0),
('appt-tests6-007', 'tests2-user--007', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 37, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:30', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Stomach pain', NULL, NULL, 500.00, '2025-10-10 06:58:51', '2025-10-10 06:58:51', 0, 0, NULL, 0),
('appt-tests6-008', 'tests2-user--008', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 38, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '10:45', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Severe migraine', NULL, NULL, 500.00, '2025-10-10 06:58:51', '2025-10-10 06:58:51', 0, 0, NULL, 0),
('appt-tests6-009', 'tests2-user--009', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'sess-sSWSlQ6lyCMG', '2025-10-10', 39, NULL, NULL, 'pending', 0, NULL, 0, NULL, NULL, '11:00', NULL, NULL, NULL, NULL, 'confirmed', 'grid', 'Routine checkup', NULL, NULL, 500.00, '2025-10-10 06:58:51', '2025-10-10 06:58:51', 0, 0, NULL, 0);

--
-- Triggers `appointments`
--
DELIMITER $$
CREATE TRIGGER `trg_appointments_status_change` AFTER UPDATE ON `appointments` FOR EACH ROW BEGIN
  -- If token_status changed from pending to attended or completed
  IF OLD.token_status = 'pending' AND NEW.token_status IN ('attended', 'completed') THEN
    -- Update token call history if exists
    UPDATE token_call_history
    SET
      patient_attended = 1,
      attended_at = NOW()
    WHERE appointment_id = NEW.id
      AND patient_attended = 0
    ORDER BY called_at DESC
    LIMIT 1;

    -- Update attended_after_recall flag
    IF NEW.is_recalled = 1 THEN
      UPDATE appointments
      SET attended_after_recall = 1
      WHERE id = NEW.id;
    END IF;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `appointment_history`
--

CREATE TABLE `appointment_history` (
  `id` varchar(36) NOT NULL,
  `appointment_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `action_type` varchar(50) NOT NULL,
  `old_token_number` int DEFAULT NULL,
  `new_token_number` int DEFAULT NULL,
  `old_estimated_time` varchar(8) DEFAULT NULL,
  `new_estimated_time` varchar(8) DEFAULT NULL,
  `reason` text,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` varchar(36) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` varchar(36) NOT NULL,
  `action` varchar(50) NOT NULL,
  `user_type` varchar(20) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `specialty_id` varchar(36) DEFAULT NULL,
  `qualification` varchar(500) NOT NULL,
  `experience` int NOT NULL,
  `bio` text NOT NULL,
  `image` varchar(500) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT '0.00',
  `total_reviews` int DEFAULT '0',
  `consultation_fee` decimal(8,2) NOT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `status` enum('online','consulting','on_break','emergency','offline') DEFAULT 'offline',
  `license_number` varchar(100) NOT NULL,
  `date_of_birth` varchar(10) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `zip_code` varchar(10) DEFAULT NULL,
  `bank_account` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `break_type` varchar(20) DEFAULT NULL,
  `break_start_time` timestamp NULL DEFAULT NULL,
  `break_end_time` timestamp NULL DEFAULT NULL,
  `break_reason` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`id`, `name`, `email`, `phone`, `specialty_id`, `qualification`, `experience`, `bio`, `image`, `rating`, `total_reviews`, `consultation_fee`, `is_available`, `status`, `license_number`, `date_of_birth`, `address`, `city`, `state`, `zip_code`, `bank_account`, `created_at`, `updated_at`, `break_type`, `break_start_time`, `break_end_time`, `break_reason`) VALUES
('52ea27e2-a661-11f0-abc5-52541aa39e4a', 'Dr. Rosy Jacob', 'rosy.jacob@lakeshorehospital.com', '+91 98470 12001', NULL, 'MBBS, MD, DNB', 8, 'Dr. Rosy Jacob is an Associate Consultant in Anaesthesiology with extensive experience in perioperative care and pain management. She specializes in general anesthesia, regional anesthesia techniques, and critical care management.', 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg', 4.70, 142, 800.00, 1, 'online', 'KMC-ANS-2016-001', '1988-03-15', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('52ec9c9f-a661-11f0-abc5-52541aa39e4a', 'Dr. Francis Manavalan', 'francis.manavalan@lakeshorehospital.com', '+91 98470 12002', NULL, 'MBBS, DA, DNB', 18, 'Dr. Francis Manavalan is the Chief of Neuro Anaesthesia, Neuro Critical Care, and Neuro Pain Management at VPS Lakeshore Hospital. With over 18 years of experience, he specializes in complex neurosurgical anesthesia, neuro critical care, and advanced pain management techniques for neurological conditions.', 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg', 4.90, 287, 1200.00, 1, 'online', 'KMC-ANS-2007-002', '1978-07-22', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('52ee8d58-a661-11f0-abc5-52541aa39e4a', 'Dr. Jaya Susan Jacob', 'jaya.jacob@lakeshorehospital.com', '+91 98470 12003', NULL, 'MBBS, MD (Anaesthesia), DNB (Anaesthesia)', 15, 'Dr. Jaya Susan Jacob is a Senior Consultant Anesthesiologist with dual postgraduate qualifications in anaesthesia. She has extensive experience in all aspects of anesthesia practice including cardiac, neuro, and pediatric anesthesia.', 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg', 4.80, 203, 1000.00, 1, 'online', 'KMC-ANS-2010-003', '1982-11-08', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('52eff8f1-a661-11f0-abc5-52541aa39e4a', 'Dr. John Ferns', 'john.ferns@lakeshorehospital.com', '+91 98470 12004', NULL, 'MBBS, DA, MD (Anaesthesia)', 16, 'Dr. John Ferns is a Senior Consultant in Anaesthesia with comprehensive expertise in all forms of anesthesia delivery. His special interests include regional anesthesia, acute pain management, and perioperative patient care.', 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg', 4.70, 178, 1000.00, 1, 'online', 'KMC-ANS-2009-004', '1980-05-14', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('52f1658b-a661-11f0-abc5-52541aa39e4a', 'Dr. Mallie Abraham', 'mallie.abraham@lakeshorehospital.com', '+91 98470 12005', NULL, 'MBBS, MD (Anaesthesia)', 14, 'Dr. Mallie Abraham is a Senior Consultant in Anaesthesia and Critical Care. She has extensive experience in managing critically ill patients in ICU settings and provides expert anesthesia care for complex surgical procedures.', 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg', 4.80, 195, 1000.00, 1, 'online', 'KMC-ANS-2011-005', '1983-09-21', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('52f2c758-a661-11f0-abc5-52541aa39e4a', 'Dr. Mohammed Shahul Nebhu', 'shahul.nebhu@lakeshorehospital.com', '+91 98470 12006', NULL, 'MBBS, MD, DA, Fellow in Cardiovascular and Thoracic Anesthesia (National Heart Centre, Singapore)', 18, 'Dr. Mohammed Shahul Nebhu is the Senior Consultant and Chief of Cardiothoracic Anesthesia with fellowship training from National Heart Centre, Singapore. He is the Director and Co-ordinator of ECMO Service at VPS Lakeshore and serves as Secretary of ESOI (ECMO Society of India) Kerala State Branch. With 17-18 years of specialized experience in cardiac anesthesia, he is an expert in ECMO management and complex cardiothoracic procedures.', 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg', 4.90, 312, 1500.00, 1, 'online', 'KMC-ANS-2007-006', '1978-12-10', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('52f47c75-a661-11f0-abc5-52541aa39e4a', 'Dr. Akhil Babu', 'akhil.babu@lakeshorehospital.com', '+91 98470 12007', NULL, 'MBBS, MD Anaesthesia, IDCCM', 9, 'Dr. Akhil Babu is a Consultant in Critical Care Medicine with specialized training in intensive care management. He holds the Indian Diploma in Critical Care Medicine (IDCCM) and manages critically ill patients requiring advanced life support.', 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg', 4.70, 156, 900.00, 1, 'online', 'KMC-ANS-2016-007', '1987-04-18', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('52f5d956-a661-11f0-abc5-52541aa39e4a', 'Dr. Gayathri Raj', 'gayathri.raj@lakeshorehospital.com', '+91 98470 12008', NULL, 'MBBS, MD (Anaesthesiology), IDCCM', 7, 'Dr. Gayathri Raj is an Associate Consultant in Anaesthesiology with additional training in critical care medicine. She provides comprehensive anesthesia services and intensive care management for critically ill patients.', 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg', 4.60, 128, 800.00, 1, 'online', 'KMC-ANS-2018-008', '1989-08-25', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('52f72f83-a661-11f0-abc5-52541aa39e4a', 'Dr. Jayasankar Surendran', 'jayasankar.s@lakeshorehospital.com', '+91 98470 12009', NULL, 'MBBS, MD Anaesthesiology', 10, 'Dr. Jayasankar Surendran is a Consultant Anaesthesiologist providing comprehensive anesthesia services across various surgical specialties. He has expertise in general, regional, and specialized anesthesia techniques.', 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg', 4.70, 164, 900.00, 1, 'online', 'KMC-ANS-2015-009', '1985-06-12', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('52f88e48-a661-11f0-abc5-52541aa39e4a', 'Dr. Manu Prathap', 'manu.prathap@lakeshorehospital.com', '+91 98470 12010', NULL, 'MBBS, DNB (Anaesthesiology), FNB (Critical Care), IFCCM, EDIC, MNAMS', 11, 'Dr. Manu Prathap is a Consultant in Critical Care Medicine with extensive qualifications including FNB in Critical Care, Indian Fellowship in Critical Care Medicine (IFCCM), European Diploma in Intensive Care Medicine (EDIC), and Membership of National Academy of Medical Sciences (MNAMS). He specializes in managing complex critical care cases.', 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg', 4.80, 189, 1100.00, 1, 'online', 'KMC-ANS-2014-010', '1984-10-30', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('52f9f9ae-a661-11f0-abc5-52541aa39e4a', 'Dr. Nita George', 'nita.george@lakeshorehospital.com', '+91 98470 12011', NULL, 'MBBS, MD (Anaesthesia), FRCA (UK), EDIC, CCT (Oxford), FICCM', 16, 'Dr. Nita George is a Senior Consultant Intensivist and Anaesthesiologist with prestigious international qualifications including FRCA (UK), EDIC, and CCT from Oxford. She is a Fellow of Indian College of Critical Care Medicine (FICCM) and brings extensive expertise in both anesthesia and intensive care management.', 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg', 4.90, 248, 1300.00, 1, 'online', 'KMC-ANS-2009-011', '1981-02-14', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('52fb968f-a661-11f0-abc5-52541aa39e4a', 'Dr. Renny Chacko', 'renny.chacko@lakeshorehospital.com', '+91 98470 12012', NULL, 'MBBS, MD (Anesthesia), FTRA, FHBST', 12, 'Dr. Renny Chacko is a Consultant Anaesthesiologist with fellowship training in Thoracic and Regional Anesthesia (FTRA) and Fellowship in Human Blood and Stem Cell Transplantation (FHBST). He has specialized expertise in complex anesthesia procedures.', 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg', 4.70, 171, 950.00, 1, 'online', 'KMC-ANS-2013-012', '1983-07-19', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('52fcf5d0-a661-11f0-abc5-52541aa39e4a', 'Dr. Vishak Nair', 'vishak.nair@lakeshorehospital.com', '+91 98470 12013', NULL, 'MBBS, MD (Anaesthesiology)', 9, 'Dr. Vishak Nair is a Consultant Anaesthesiologist providing comprehensive anesthesia services for various surgical procedures. He is skilled in general, regional, and monitored anesthesia care.', 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg', 4.60, 147, 900.00, 1, 'online', 'KMC-ANS-2016-013', '1986-11-05', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('52fe562e-a661-11f0-abc5-52541aa39e4a', 'Dr. Preethi Mary Joseph', 'preethi.joseph@lakeshorehospital.com', '+91 98470 12014', NULL, 'MBBS (St Johns Medical College Bangalore), MD (St Johns Medical College Bangalore)', 13, 'Dr. Preethi Mary Joseph is an Associate Consultant in Anaesthesiology. She completed her MBBS and MD from the prestigious St Johns Medical College, Bangalore in 2012. She has comprehensive experience in perioperative anesthesia management.', 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg', 4.70, 159, 850.00, 1, 'online', 'KMC-ANS-2012-014', '1985-04-28', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('52ffbb80-a661-11f0-abc5-52541aa39e4a', 'Dr. Thomas Babu', 'thomas.babu@lakeshorehospital.com', '+91 98470 12015', NULL, 'MBBS, MD (Anaesthesia), DrNB (Critical Care)', 10, 'Dr. Thomas Babu is an Associate Consultant in Critical Care with dual postgraduate qualifications in Anaesthesia and Critical Care. His DrNB in Critical Care provides him with advanced skills in managing critically ill patients in ICU settings.', 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg', 4.70, 165, 950.00, 1, 'online', 'KMC-ANS-2015-015', '1985-09-16', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('530115fc-a661-11f0-abc5-52541aa39e4a', 'Dr. Vishakha N Pillai', 'vishakha.pillai@lakeshorehospital.com', '+91 98470 12016', NULL, 'MBBS, DNB Anaesthesiology', 6, 'Dr. Vishakha N Pillai is an Associate Consultant in Anaesthesiology. She holds a DNB in Anaesthesiology and provides comprehensive anesthesia care for various surgical procedures with a focus on patient safety and comfort.', 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg', 4.60, 132, 800.00, 1, 'online', 'KMC-ANS-2019-016', '1990-01-23', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('53026bd5-a661-11f0-abc5-52541aa39e4a', 'Dr. Jinu Joy', 'jinu.joy@lakeshorehospital.com', '+91 98470 12017', NULL, 'MBBS', 4, 'Dr. Jinu Joy is a Senior Registrar in the Anesthesiology department. As a senior registrar, he assists in anesthesia management and is pursuing further specialization in the field.', 'https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg', 4.50, 87, 600.00, 1, 'online', 'KMC-ANS-2021-017', '1992-06-08', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('5303f10c-a661-11f0-abc5-52541aa39e4a', 'Dr. Sreeparvathi P', 'sreeparvathi.p@lakeshorehospital.com', '+91 98470 12018', NULL, 'MBBS', 3, 'Dr. Sreeparvathi P is a Senior Registrar in the Anesthesiology department. She is gaining valuable experience in anesthesia practice while pursuing postgraduate specialization.', 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg', 4.40, 72, 600.00, 1, 'online', 'KMC-ANS-2022-018', '1993-08-14', 'VPS Lakeshore Hospital, Nettoor', 'Kochi', 'Kerala', '682040', NULL, '2025-10-11 05:15:38', '2025-10-11 05:15:38', NULL, NULL, NULL, NULL),
('8nUR3VxYs_icvhLxVzFhp', 'Cole Monroe', 'apple@mail.com', '+1 (752) 428-4864', 'ent', 'MBBS , MD', 7, 'test Bio', NULL, 0.00, 0, 800.00, 0, 'offline', 'HL_2024-1933', '2017-12-30', 'Consectetur Nam eum ', 'Bangalore', 'Karnataka', '49944', NULL, '2025-10-06 05:46:58', '2025-10-06 05:56:04', NULL, NULL, NULL, NULL),
('doc-001', 'Rajesh Kumar', 'rajesh.kumar@citycare.com', '+91-98765-43210', 'cardiology', 'MBBS, MD Cardiology, DM Interventional Cardiology', 15, 'Experienced cardiologist specializing in interventional procedures and heart disease management. Published researcher with expertise in coronary angioplasty.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.80, 245, 800.00, 0, 'emergency', 'MH-CARD-2010-001', '1978-03-15', '12 Medical Complex, Bandra West', 'Mumbai', 'Maharashtra', '400050', 'ACC-789123456', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-002', 'Priya Sharma', 'priya.sharma@metrohealth.com', '+91-98765-43211', 'cardiology', 'MBBS, MD Internal Medicine, DM Cardiology', 12, 'Leading cardiologist with focus on preventive cardiology and women\'s heart health. Specializes in non-invasive cardiac procedures.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.70, 189, 750.00, 1, 'offline', 'DL-CARD-2012-002', '1981-07-22', '45 Heart Care Center, CP', 'Delhi', 'Delhi', '110001', 'ACC-789123457', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-003', 'Amit Patel', 'amit.patel@citycare.com', '+91-98765-43212', 'neurology', 'MBBS, MD Neurology, Fellowship in Stroke Medicine', 18, 'Renowned neurologist with expertise in stroke management, epilepsy, and movement disorders. International training in advanced neuroimaging.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.90, 156, 900.00, 1, 'offline', 'MH-NEURO-2007-003', '1975-11-08', '78 Brain Care Institute, Andheri', 'Mumbai', 'Maharashtra', '400058', 'ACC-789123458', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-004', 'Sunita Reddy', 'sunita.reddy@wellnesspoint.com', '+91-98765-43213', 'neurology', 'MBBS, MD Neurology, PhD Neurosciences', 14, 'Specialist in pediatric neurology and developmental disorders. Research focus on autism spectrum disorders and ADHD in children.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.60, 134, 850.00, 1, 'offline', 'KA-NEURO-2011-004', '1979-09-14', '23 Neuro Wellness Center, Whitefield', 'Bangalore', 'Karnataka', '560066', 'ACC-789123459', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-005', 'Vikram Singh', 'vikram.singh@metrohealth.com', '+91-98765-43214', 'orthopedics', 'MBBS, MS Orthopedics, Fellowship in Joint Replacement', 16, 'Leading orthopedic surgeon specializing in joint replacement and sports medicine. Performed over 2000 successful joint replacement surgeries.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.85, 298, 950.00, 1, 'online', 'DL-ORTHO-2009-005', '1977-05-20', '67 Bone & Joint Hospital, Dwarka', 'Delhi', 'Delhi', '110075', 'ACC-789123460', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-006', 'Kavita Joshi', 'kavita.joshi@citycare.com', '+91-98765-43215', 'orthopedics', 'MBBS, MS Orthopedics, Fellowship in Spine Surgery', 11, 'Expert spine surgeon with focus on minimally invasive spine procedures. Specializes in treatment of back pain and spinal deformities.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.75, 167, 900.00, 1, 'offline', 'MH-ORTHO-2014-006', '1982-01-12', '34 Spine Care Center, Powai', 'Mumbai', 'Maharashtra', '400076', 'ACC-789123461', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-007', 'Suresh Gupta', 'suresh.gupta@wellnesspoint.com', '+91-98765-43216', 'general_medicine', 'MBBS, MD Internal Medicine', 20, 'Experienced general physician with comprehensive knowledge of internal medicine. Expert in managing diabetes, hypertension, and chronic diseases.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.65, 445, 500.00, 1, 'offline', 'KA-GM-2005-007', '1973-12-03', '56 General Health Clinic, Jayanagar', 'Bangalore', 'Karnataka', '560011', 'ACC-789123462', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-008', 'Meera Agarwal', 'meera.agarwal@citycare.com', '+91-98765-43217', 'general_medicine', 'MBBS, MD Internal Medicine, Fellowship in Geriatric Medicine', 13, 'Specialist in geriatric medicine and age-related health issues. Focus on comprehensive care for elderly patients and preventive medicine.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.70, 234, 550.00, 1, 'offline', 'MH-GM-2012-008', '1980-08-25', '89 Senior Care Medical Center, Thane', 'Mumbai', 'Maharashtra', '400601', 'ACC-789123463', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-009', 'Ravi Krishnan', 'ravi.krishnan@wellnesspoint.com', '+91-98765-43218', 'pediatrics', 'MBBS, MD Pediatrics, Fellowship in Pediatric Cardiology', 17, 'Renowned pediatrician with expertise in congenital heart diseases and pediatric intensive care. Gentle approach with children and families.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.95, 356, 700.00, 1, 'offline', 'KA-PEDS-2008-009', '1976-04-18', '12 Children\'s Heart Center, Koramangala', 'Bangalore', 'Karnataka', '560034', 'ACC-789123464', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-010', 'Anita Kapoor', 'anita.kapoor@metrohealth.com', '+91-98765-43219', 'pediatrics', 'MBBS, MD Pediatrics', 9, 'Caring pediatrician specializing in newborn care and childhood development. Expert in vaccination and pediatric nutrition counseling.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.80, 278, 600.00, 1, 'offline', 'DL-PEDS-2016-010', '1984-06-10', '45 Kids Care Clinic, Vasant Vihar', 'Delhi', 'Delhi', '110057', 'ACC-789123465', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-011', 'Rohit Malhotra', 'rohit.malhotra@metrohealth.com', '+91-98765-43220', 'dermatology', 'MBBS, MD Dermatology, Fellowship in Dermatopathology', 10, 'Expert dermatologist specializing in skin cancer detection and cosmetic dermatology. Advanced training in laser treatments and anti-aging procedures.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.60, 189, 800.00, 1, 'offline', 'DL-DERM-2015-011', '1983-10-05', '78 Skin Care Institute, Greater Kailash', 'Delhi', 'Delhi', '110048', 'ACC-789123466', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-012', 'Sanjay Yadav', 'sanjay.yadav@metrohealth.com', '+91-98765-43221', 'ent', 'MBBS, MS ENT, Fellowship in Head & Neck Surgery', 14, 'Experienced ENT surgeon with expertise in endoscopic sinus surgery and hearing restoration procedures. Specializes in voice disorders treatment.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.75, 198, 750.00, 1, 'offline', 'DL-ENT-2011-012', '1979-02-28', '23 ENT Care Center, Lajpat Nagar', 'Delhi', 'Delhi', '110024', 'ACC-789123467', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-013', 'Arjun Nair', 'arjun.nair@metrohealth.com', '+91-98765-43222', 'emergency_medicine', 'MBBS, MD Emergency Medicine, ATLS Certification', 8, 'Emergency medicine specialist with expertise in trauma care and critical care medicine. Quick decision-making skills and emergency procedures expert.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.85, 167, 650.00, 1, 'offline', 'DL-EM-2017-013', '1985-09-12', '56 Emergency Care Unit, Aiims', 'Delhi', 'Delhi', '110029', 'ACC-789123468', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-014', 'Deepak Agrawal', 'deepak.agrawal@metrohealth.com', '+91-98765-43223', 'surgery', 'MBBS, MS General Surgery, MCh Surgical Gastroenterology', 19, 'Senior surgeon with expertise in laparoscopic and robotic surgery. Specializes in gastrointestinal surgeries and minimally invasive procedures.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.90, 234, 1200.00, 1, 'offline', 'DL-SURG-2006-014', '1974-07-16', '89 Advanced Surgery Center, Safdarjung', 'Delhi', 'Delhi', '110029', 'ACC-789123469', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-015', 'Manoj Tiwari', 'manoj.tiwari@metrohealth.com', '+91-98765-43224', 'urology', 'MBBS, MS Urology, MCh Urology', 16, 'Expert urologist specializing in kidney stone treatment and prostate care. Advanced training in robotic urological surgeries and male fertility.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.70, 145, 850.00, 1, 'offline', 'DL-URO-2009-015', '1977-11-30', '34 Urology Excellence Center, Karol Bagh', 'Delhi', 'Delhi', '110005', 'ACC-789123470', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-016', 'Lakshmi Iyer', 'lakshmi.iyer@wellnesspoint.com', '+91-98765-43225', 'family_medicine', 'MBBS, MD Family Medicine', 12, 'Comprehensive family medicine practitioner focusing on preventive care and health maintenance for all age groups. Holistic approach to healthcare.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.65, 289, 450.00, 1, 'offline', 'KA-FM-2013-016', '1981-04-08', '67 Family Health Center, Indiranagar', 'Bangalore', 'Karnataka', '560038', 'ACC-789123471', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-017', 'Shilpa Menon', 'shilpa.menon@wellnesspoint.com', '+91-98765-43226', 'womens_health', 'MBBS, MD Obstetrics & Gynecology', 11, 'Specialist in women\'s reproductive health, pregnancy care, and gynecological procedures. Focus on high-risk pregnancy management and fertility treatments.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.80, 312, 700.00, 1, 'offline', 'KA-WH-2014-017', '1982-12-19', '45 Women\'s Health Clinic, HSR Layout', 'Bangalore', 'Karnataka', '560102', 'ACC-789123472', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-018', 'Ashish Verma', 'ashish.verma@wellnesspoint.com', '+91-98765-43227', 'preventive_care', 'MBBS, MPH Public Health', 7, 'Public health specialist focusing on disease prevention and health promotion. Expert in health screenings and lifestyle medicine approaches.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.55, 134, 400.00, 1, 'offline', 'KA-PC-2018-018', '1986-03-25', '78 Preventive Health Center, Electronic City', 'Bangalore', 'Karnataka', '560100', 'ACC-789123473', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-019', 'Neha Saxena', 'neha.saxena@metrohealth.com', '+91-98765-43228', 'general_medicine', 'MBBS, MD Internal Medicine, Fellowship in Endocrinology', 9, 'Internal medicine physician with specialization in diabetes and endocrine disorders. Expert in hormone-related health issues and metabolic disorders.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.75, 198, 650.00, 1, 'offline', 'DL-GM-2016-019', '1984-08-14', '123 Endocrine Care Center, Nehru Place', 'Delhi', 'Delhi', '110019', 'ACC-789123474', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-020', 'Kiran Kumar', 'kiran.kumar@wellnesspoint.com', '+91-98765-43229', 'cardiology', 'MBBS, MD Cardiology', 6, 'Young and dynamic cardiologist with focus on preventive cardiology and cardiac rehabilitation. Expert in managing young adults with heart conditions.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.50, 87, 700.00, 1, 'offline', 'KA-CARD-2019-020', '1987-01-05', '56 Heart Health Center, Marathahalli', 'Bangalore', 'Karnataka', '560037', 'ACC-789123475', '2025-08-13 22:08:52', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-021', 'Ramesh Agarwal', 'ramesh.agarwal@apollohospitals.com', '+91-98765-43230', 'cardiology', 'MBBS, MD Cardiology, DM Interventional Cardiology', 22, 'Senior interventional cardiologist with expertise in complex coronary procedures and structural heart interventions.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.90, 320, 1200.00, 1, 'offline', 'TN-CARD-2003-021', '1971-08-12', '21 Greams Lane Medical Complex', 'Chennai', 'Tamil Nadu', '600006', 'ACC-789123476', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-022', 'Shalini Gupta', 'shalini.gupta@fortishealthcare.com', '+91-98765-43231', 'cardiology', 'MBBS, MD Cardiology, Fellowship in Electrophysiology', 18, 'Cardiac electrophysiologist specializing in arrhythmia management and device implantation.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.85, 275, 1100.00, 1, 'offline', 'UP-CARD-2007-022', '1975-02-28', 'B-22 Cardiac Care Unit, Sector 62', 'Noida', 'Uttar Pradesh', '201301', 'ACC-789123477', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-023', 'Ashok Kumar', 'ashok.kumar@maxhealthcare.com', '+91-98765-43232', 'neurology', 'MBBS, MD Neurology, DM Clinical Neurophysiology', 20, 'Expert neurologist with specialization in epilepsy, sleep disorders, and neurophysiology.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.88, 240, 1000.00, 1, 'offline', 'DL-NEURO-2005-023', '1973-11-15', 'FC-50 Neurology Wing, Shalimar Bagh', 'Delhi', 'Delhi', '110088', 'ACC-789123478', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-024', 'Priyanka Sharma', 'priyanka.sharma@manipalhospitals.com', '+91-98765-43233', 'neurology', 'MBBS, MD Neurology, Fellowship in Movement Disorders', 15, 'Movement disorder specialist with expertise in Parkinson\'s disease and dystonia management.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.75, 185, 950.00, 1, 'offline', 'KA-NEURO-2010-024', '1978-06-20', '98 Movement Disorder Center, Airport Road', 'Bangalore', 'Karnataka', '560017', 'ACC-789123479', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-025', 'Raj Khanna', 'raj.khanna@aiims.edu', '+91-98765-43234', 'orthopedics', 'MBBS, MS Orthopedics, MCh Spine Surgery', 25, 'Renowned spine surgeon and professor with expertise in complex spinal deformity corrections.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.95, 410, 1500.00, 1, 'offline', 'DL-ORTHO-2000-025', '1968-04-10', 'Dept. of Orthopedics, AIIMS', 'Delhi', 'Delhi', '110029', 'ACC-789123480', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-026', 'Nisha Patel', 'nisha.patel@apollohospitals.com', '+91-98765-43235', 'orthopedics', 'MBBS, MS Orthopedics, Fellowship in Arthroscopy', 12, 'Sports medicine specialist with expertise in arthroscopic surgery and joint preservation.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.70, 195, 900.00, 1, 'offline', 'TN-ORTHO-2013-026', '1981-09-05', '21 Sports Medicine Center, Greams Lane', 'Chennai', 'Tamil Nadu', '600006', 'ACC-789123481', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-027', 'Sunil Verma', 'sunil.verma@fortishealthcare.com', '+91-98765-43236', 'general_medicine', 'MBBS, MD Internal Medicine, DM Gastroenterology', 19, 'Internal medicine physician with subspecialty in gastroenterology and liver diseases.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.65, 320, 700.00, 1, 'consulting', 'UP-GM-2006-027', '1974-12-18', 'B-22 Internal Medicine Dept, Sector 62', 'Noida', 'Uttar Pradesh', '201301', 'ACC-789123482', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-028', 'Kavitha Reddy', 'kavitha.reddy@manipalhospitals.com', '+91-98765-43237', 'general_medicine', 'MBBS, MD Internal Medicine, Fellowship in Critical Care', 14, 'Intensivist and internal medicine specialist with expertise in critical care management.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.72, 265, 650.00, 1, 'offline', 'KA-GM-2011-028', '1979-07-25', '98 Critical Care Unit, Airport Road', 'Bangalore', 'Karnataka', '560017', 'ACC-789123483', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-029', 'Ravi Agarwal', 'ravi.agarwal@maxhealthcare.com', '+91-98765-43238', 'pediatrics', 'MBBS, MD Pediatrics, Fellowship in Pediatric Intensive Care', 16, 'Pediatric intensivist with expertise in neonatal care and pediatric emergency medicine.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.88, 290, 800.00, 1, 'offline', 'DL-PEDS-2009-029', '1977-03-12', 'FC-50 Pediatric ICU, Shalimar Bagh', 'Delhi', 'Delhi', '110088', 'ACC-789123484', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-030', 'Sneha Joshi', 'sneha.joshi@aiims.edu', '+91-98765-43239', 'pediatrics', 'MBBS, MD Pediatrics, DM Pediatric Neurology', 13, 'Pediatric neurologist specializing in childhood epilepsy and developmental disorders.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.85, 225, 750.00, 1, 'offline', 'DL-PEDS-2012-030', '1980-10-08', 'Dept. of Pediatrics, AIIMS', 'Delhi', 'Delhi', '110029', 'ACC-789123485', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-031', 'Anita Singh', 'anita.singh@apollohospitals.com', '+91-98765-43240', 'dermatology', 'MBBS, MD Dermatology, Fellowship in Dermatosurgery', 11, 'Dermatosurgeon with expertise in skin cancer treatment and cosmetic dermatology procedures.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.60, 175, 850.00, 1, 'offline', 'TN-DERM-2014-031', '1982-05-30', '21 Dermatology Center, Greams Lane', 'Chennai', 'Tamil Nadu', '600006', 'ACC-789123486', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-032', 'Mahesh Kumar', 'mahesh.kumar@fortishealthcare.com', '+91-98765-43241', 'dermatology', 'MBBS, MD Dermatology, Fellowship in Pediatric Dermatology', 9, 'Pediatric dermatologist specializing in childhood skin conditions and genetic skin disorders.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.55, 145, 800.00, 1, 'offline', 'UP-DERM-2016-032', '1984-01-22', 'B-22 Pediatric Dermatology Unit', 'Noida', 'Uttar Pradesh', '201301', 'ACC-789123487', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-033', 'Rajiv Mehta', 'rajiv.mehta@manipalhospitals.com', '+91-98765-43242', 'ent', 'MBBS, MS ENT, Fellowship in Cochlear Implants', 17, 'ENT surgeon with expertise in cochlear implants and hearing restoration surgeries.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.80, 210, 900.00, 1, 'offline', 'KA-ENT-2008-033', '1976-08-14', '98 Hearing Center, Airport Road', 'Bangalore', 'Karnataka', '560017', 'ACC-789123488', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-034', 'Sunita Agarwal', 'sunita.agarwal@maxhealthcare.com', '+91-98765-43243', 'ent', 'MBBS, MS ENT, Fellowship in Rhinoplasty', 12, 'Facial plastic surgeon specializing in rhinoplasty and facial reconstruction procedures.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.75, 165, 850.00, 1, 'offline', 'DL-ENT-2013-034', '1981-11-28', 'FC-50 Facial Surgery Unit, Shalimar Bagh', 'Delhi', 'Delhi', '110088', 'ACC-789123489', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-035', 'Vikram Choudhary', 'vikram.choudhary@aiims.edu', '+91-98765-43244', 'emergency_medicine', 'MBBS, MD Emergency Medicine, Fellowship in Trauma Surgery', 10, 'Emergency medicine specialist with expertise in trauma care and disaster management.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.85, 195, 700.00, 1, 'offline', 'DL-EM-2015-035', '1983-04-16', 'Emergency Department, AIIMS', 'Delhi', 'Delhi', '110029', 'ACC-789123490', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-036', 'Harish Patel', 'harish.patel@apollohospitals.com', '+91-98765-43245', 'surgery', 'MBBS, MS General Surgery, MCh Cardiothoracic Surgery', 21, 'Cardiothoracic surgeon with expertise in heart and lung transplant surgeries.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.92, 280, 1800.00, 1, 'offline', 'TN-SURG-2004-036', '1972-09-20', '21 Cardiothoracic Surgery Dept', 'Chennai', 'Tamil Nadu', '600006', 'ACC-789123491', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-037', 'Preeti Sharma', 'preeti.sharma@fortishealthcare.com', '+91-98765-43246', 'surgery', 'MBBS, MS General Surgery, MCh Plastic Surgery', 15, 'Plastic and reconstructive surgeon specializing in aesthetic and reconstructive procedures.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.70, 220, 1200.00, 1, 'offline', 'UP-SURG-2010-037', '1978-12-05', 'B-22 Plastic Surgery Unit, Sector 62', 'Noida', 'Uttar Pradesh', '201301', 'ACC-789123492', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-038', 'Anil Kumar', 'anil.kumar@manipalhospitals.com', '+91-98765-43247', 'urology', 'MBBS, MS Urology, MCh Uro-Oncology', 18, 'Uro-oncologist with expertise in kidney, bladder, and prostate cancer treatments.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.78, 190, 1000.00, 1, 'offline', 'KA-URO-2007-038', '1975-07-18', '98 Uro-Oncology Center, Airport Road', 'Bangalore', 'Karnataka', '560017', 'ACC-789123493', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-039', 'Rekha Jain', 'rekha.jain@maxhealthcare.com', '+91-98765-43248', 'family_medicine', 'MBBS, MD Family Medicine, Fellowship in Geriatrics', 14, 'Family physician with specialization in geriatric care and chronic disease management.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.68, 285, 500.00, 1, 'offline', 'DL-FM-2011-039', '1979-03-08', 'FC-50 Family Medicine Dept', 'Delhi', 'Delhi', '110088', 'ACC-789123494', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-040', 'Deepika Rao', 'deepika.rao@aiims.edu', '+91-98765-43249', 'womens_health', 'MBBS, MD Obstetrics & Gynecology, Fellowship in Maternal-Fetal Medicine', 16, 'Maternal-fetal medicine specialist with expertise in high-risk pregnancies and fetal interventions.', 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg', 4.85, 310, 900.00, 1, 'offline', 'DL-WH-2009-040', '1977-10-25', 'Dept. of Obstetrics & Gynecology, AIIMS', 'Delhi', 'Delhi', '110029', 'ACC-789123495', '2025-08-16 06:30:06', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-2alPVsvQmPrr', 'Sujatha Y', 'dr.sujathay@gmckottayam.ac.in', '9487850444', 'spec-obstetrics-gynecology', 'MBBS, MD (OBG), FMAS', 22, 'Professor in Department of Obstetrics & Gynaecology at Government Medical College, Kottayam. Expert in minimal access surgery, infertility management, and high-risk obstetrics. Committed to advancing women\'s healthcare through clinical excellence and research.', NULL, 4.50, 0, 700.00, 1, 'offline', 'KMC-OBG-O2BVI9PN', NULL, 'Arpookara, Gandhinagar P.O', 'Kottayam', 'Kerala', '686008', NULL, '2025-10-02 01:44:02', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-41jKi0kKkm3L', 'Jiji Mary Antony', 'jijimaryantony@yahoo.com', '9447521855', 'spec-paediatrics', 'MBBS, MD (Paediatrics), DCH', 15, 'Assistant Professor in Department of Paediatrics at Government Medical College, Kottayam. Expert in child healthcare, neonatal care, and pediatric emergencies. Dedicated to providing comprehensive care for children from infancy through adolescence.', NULL, 4.50, 0, 600.00, 0, 'online', 'KMC-PAED-26NNK3LR', NULL, 'Arpookara, Gandhinagar P.O', 'Kottayam', 'Kerala', '686008', NULL, '2025-10-02 01:44:02', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-CoK__KzNkTPm', 'Kala Kesavan', 'dr.kalakesavan@yahoo.co.in', '9847034504', 'spec-pharmacology', 'MBBS, MD (Pharmacology)', 18, 'Professor in Department of Pharmacology at Government Medical College, Kottayam. Also serves as MEU (Medical Education Unit) coordinator. Extensive experience in rational drug therapy, adverse drug reaction monitoring, and pharmacovigilance. Active in medical education technology and curriculum development.', NULL, 4.50, 0, 600.00, 1, 'offline', 'KMC-PHARM-GGKS4EIP', NULL, 'Arpookara, Gandhinagar P.O', 'Kottayam', 'Kerala', '686008', NULL, '2025-10-02 01:44:02', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-lYmc71t79BFF', 'Shaila S', 'dr.shailas@gmckottayam.ac.in', '9447493080', 'spec-obstetrics-gynecology', 'MBBS, MD (OBG), DGO', 20, 'Professor in Department of Obstetrics & Gynaecology at Government Medical College, Kottayam. Highly experienced in high-risk pregnancy management, gynecological surgeries, and women\'s reproductive health. Known for compassionate patient care and excellence in teaching.', NULL, 4.50, 0, 700.00, 1, 'consulting', 'KMC-OBG-G6SHHYM4', NULL, 'Arpookara, Gandhinagar P.O', 'Kottayam', 'Kerala', '686008', NULL, '2025-10-02 01:44:02', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('doc-oHogdcuTq28T', 'Dhanya SP', 'dr.spdhanya@gmail.com', '9747263211', 'spec-pharmacology', 'MBBS, MD (Pharmacology)', 12, 'Assistant Professor in Department of Pharmacology at Government Medical College, Kottayam. Specializes in clinical pharmacology and drug therapy. Experienced in teaching medical students and conducting pharmacological research.', NULL, 4.50, 0, 500.00, 1, 'online', 'KMC-PHARM-EOHNUB2X', NULL, 'Arpookara, Gandhinagar P.O', 'Kottayam', 'Kerala', '686008', NULL, '2025-10-02 01:44:02', '2025-10-10 11:36:45', NULL, NULL, NULL, NULL),
('O_lMx_upkvL8G0MHR-dNL', 'Alan Rickman', 'info@citygeneralhospital.com', '15272175566', 'dermatology', 'MBBS MD', 4, 'Sed debitis fuga Do Sed debitis fuga Do Sed debitis fuga Do ', NULL, 0.00, 0, 800.00, 1, 'offline', 'HL_2024-193', NULL, '87 West White New Parkway\nPariatur At cupidat', 'Bangalore', 'Karnataka', '560021', NULL, '2025-10-06 05:39:15', '2025-10-06 05:39:15', NULL, NULL, NULL, NULL),
('WSzdToeZ8hqHrG1FWcacS', 'Cole Monroe', 'apple@mailinator.com', '+1 (752) 428-4864', 'ent', 'MBBS , MD', 7, 'test Bio', NULL, 0.00, 0, 800.00, 1, 'offline', 'HL_2024-1921', '2017-12-30', 'Consectetur Nam eum ', 'Bangalore', 'Karnataka', '49944', NULL, '2025-10-06 05:45:43', '2025-10-06 05:45:43', NULL, NULL, NULL, NULL),
('ZaiCqj2f0nSVahXkKizZl', 'Cole Monroe', 'qihyjixaly@mailinator.com', '+1 (752) 428-4864', 'ent', 'MBBS , MD', 7, 'test Bio', NULL, 0.00, 0, 800.00, 1, 'offline', 'HL_2024-1931', '2017-12-30', 'Consectetur Nam eum ', 'Bangalore', 'Karnataka', '49944', NULL, '2025-10-06 05:41:14', '2025-10-06 05:41:14', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `doctor_admins`
--

CREATE TABLE `doctor_admins` (
  `id` varchar(36) NOT NULL,
  `doctor_id` char(36) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'doctor',
  `permissions` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `doctor_admins`
--

INSERT INTO `doctor_admins` (`id`, `doctor_id`, `email`, `password_hash`, `role`, `permissions`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
('4a518e21-a423-11f0-abc5-52541aa39e4a', 'doc-lYmc71t79BFF', 'dr.shailas@gmckottayam.ac.in', '$2b$12$nscH2K435O39H2GEru51FuBV00uV1.xO/S/Ptq/bXwLyTNizlmyK.', 'doctor', NULL, 1, '2025-10-10 04:55:40', '2025-10-06 05:46:58', '2025-10-10 04:55:41'),
('6uwAkaUZNnUnSiqZfd1y4', 'doc-41jKi0kKkm3L', 'apple@mail.com', '$2b$12$nscH2K435O39H2GEru51FuBV00uV1.xO/S/Ptq/bXwLyTNizlmyK.', 'doctor', NULL, 1, '2025-10-06 06:21:14', '2025-10-06 05:46:58', '2025-10-06 06:21:13'),
('d2dde73a-a29c-11f0-abc5-52541aa39e4a', 'doc-oHogdcuTq28T', 'dr.spdhanya@gmail.com', '$2b$12$nscH2K435O39H2GEru51FuBV00uV1.xO/S/Ptq/bXwLyTNizlmyK.', 'doctor', NULL, 1, '2025-10-08 08:47:30', '2025-10-06 05:46:58', '2025-10-08 08:47:29'),
('doc-admin-001', 'doc-001', 'rajesh.kumar.admin@citycare.com', '$2b$12$nscH2K435O39H2GEru51FuBV00uV1.xO/S/Ptq/bXwLyTNizlmyK.', 'doctor', '[\"read\", \"write\", \"appointments\", \"patients\"]', 1, '2025-10-08 11:33:18', '2025-08-19 01:26:18', '2025-10-08 11:33:18'),
('doc-admin-002', 'doc-002', 'priya.sharma.admin@metrohealth.com', '$2b$12$p0Fp0HUaLYAbsMuGfXQDxOJ0LyOvly9CN4.VEnSW2WZHdGjrLTsWS', 'doctor', '[\"read\", \"write\", \"appointments\", \"patients\"]', 1, '2025-08-18 19:57:44', '2025-08-19 01:26:18', '2025-08-19 01:27:44'),
('doc-admin-003', 'doc-003', 'amit.patel.admin@citycare.com', '$2b$12$p0Fp0HUaLYAbsMuGfXQDxOJ0LyOvly9CN4.VEnSW2WZHdGjrLTsWS', 'doctor', '[\"read\", \"write\", \"appointments\", \"patients\"]', 1, NULL, '2025-08-19 01:26:18', '2025-08-19 01:27:15'),
('fFSLGi82snSHCWscB_5lr', 'WSzdToeZ8hqHrG1FWcacS', 'apple@mailinator.com', '$2b$12$Uurnk70zLT/zmFtjkCVSzO8Wc7zfoJuAi/hUlHn5DHvwMLW/pYUAy', 'doctor', NULL, 1, NULL, '2025-10-06 05:45:43', '2025-10-06 05:45:43');

-- --------------------------------------------------------

--
-- Table structure for table `doctor_hospital_requests`
--

CREATE TABLE `doctor_hospital_requests` (
  `id` varchar(36) NOT NULL,
  `doctor_id` varchar(36) NOT NULL,
  `hospital_id` varchar(36) NOT NULL,
  `requested_by` varchar(20) NOT NULL,
  `requestor_id` varchar(36) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `message` text,
  `response_message` text,
  `requested_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `responded_at` timestamp NULL DEFAULT NULL,
  `responded_by` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `doctor_sessions`
--

CREATE TABLE `doctor_sessions` (
  `id` varchar(36) NOT NULL,
  `doctor_id` varchar(36) DEFAULT NULL,
  `hospital_id` varchar(36) DEFAULT NULL,
  `day_of_week` varchar(10) NOT NULL,
  `start_time` varchar(8) NOT NULL,
  `end_time` varchar(8) NOT NULL,
  `max_tokens` int NOT NULL,
  `current_token_number` int DEFAULT '0',
  `current_token` int DEFAULT '0',
  `last_recall_at` int DEFAULT '0',
  `last_token_called_at` timestamp NULL DEFAULT NULL,
  `avg_minutes_per_patient` int DEFAULT '15',
  `room_number` varchar(50) DEFAULT NULL,
  `floor` varchar(20) DEFAULT NULL,
  `building_location` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `next_available_date` varchar(10) DEFAULT NULL,
  `next_available_token` int DEFAULT NULL,
  `approval_status` varchar(20) DEFAULT 'approved',
  `approved_by` varchar(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `recall_check_interval` int DEFAULT '5' COMMENT 'Number of tokens to complete before checking for recalls',
  `recall_enabled` tinyint(1) DEFAULT '1' COMMENT 'Enable/disable recall functionality for this session'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `doctor_sessions`
--

INSERT INTO `doctor_sessions` (`id`, `doctor_id`, `hospital_id`, `day_of_week`, `start_time`, `end_time`, `max_tokens`, `current_token_number`, `current_token`, `last_recall_at`, `last_token_called_at`, `avg_minutes_per_patient`, `room_number`, `floor`, `building_location`, `is_active`, `next_available_date`, `next_available_token`, `approval_status`, `approved_by`, `approved_at`, `notes`, `created_at`, `updated_at`, `recall_check_interval`, `recall_enabled`) VALUES
('sess-001-1', 'doc-001', 'hosp-001', 'Monday', '09:00:00', '13:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-001-2', 'doc-001', 'hosp-001', 'Wednesday', '14:00:00', '18:00:00', 16, 0, 8, 5, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-10-08 11:39:06', 5, 1),
('sess-001-3', 'doc-001', 'hosp-001', 'Friday', '09:00:00', '13:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-001-4', 'doc-001', 'hosp-001', 'Saturday', '10:00:00', '14:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-002-1', 'doc-002', 'hosp-002', 'Tuesday', '10:00:00', '14:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-002-2', 'doc-002', 'hosp-002', 'Thursday', '15:00:00', '19:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-002-3', 'doc-002', 'hosp-002', 'Saturday', '09:00:00', '13:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-003-1', 'doc-003', 'hosp-001', 'Monday', '14:00:00', '18:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-003-2', 'doc-003', 'hosp-001', 'Wednesday', '09:00:00', '13:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-003-3', 'doc-003', 'hosp-001', 'Friday', '14:00:00', '18:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-004-1', 'doc-004', 'hosp-003', 'Tuesday', '09:00:00', '13:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-004-2', 'doc-004', 'hosp-003', 'Thursday', '14:00:00', '18:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-004-3', 'doc-004', 'hosp-003', 'Saturday', '10:00:00', '14:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-005-1', 'doc-005', 'hosp-002', 'Monday', '08:00:00', '12:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-005-2', 'doc-005', 'hosp-002', 'Wednesday', '14:00:00', '18:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-005-3', 'doc-005', 'hosp-002', 'Friday', '08:00:00', '12:00:00', 12, 0, 11, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-10-10 04:41:35', 5, 1),
('sess-005-4', 'doc-005', 'hosp-002', 'Saturday', '15:00:00', '18:00:00', 9, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-006-1', 'doc-006', 'hosp-001', 'Tuesday', '10:00:00', '14:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-006-2', 'doc-006', 'hosp-001', 'Thursday', '09:00:00', '13:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-006-3', 'doc-006', 'hosp-001', 'Saturday', '14:00:00', '18:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-007-1', 'doc-007', 'hosp-003', 'Monday', '09:00:00', '13:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-007-2', 'doc-007', 'hosp-003', 'Tuesday', '14:00:00', '18:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-007-3', 'doc-007', 'hosp-003', 'Wednesday', '09:00:00', '13:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-007-4', 'doc-007', 'hosp-003', 'Thursday', '14:00:00', '18:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-007-5', 'doc-007', 'hosp-003', 'Friday', '09:00:00', '13:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-007-6', 'doc-007', 'hosp-003', 'Saturday', '10:00:00', '14:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-008-1', 'doc-008', 'hosp-001', 'Monday', '10:00:00', '14:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-008-2', 'doc-008', 'hosp-001', 'Tuesday', '15:00:00', '19:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-008-3', 'doc-008', 'hosp-001', 'Thursday', '10:00:00', '14:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-008-4', 'doc-008', 'hosp-001', 'Friday', '15:00:00', '19:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-009-1', 'doc-009', 'hosp-003', 'Monday', '14:00:00', '18:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-009-2', 'doc-009', 'hosp-003', 'Wednesday', '10:00:00', '14:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-009-3', 'doc-009', 'hosp-003', 'Friday', '14:00:00', '18:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-009-4', 'doc-009', 'hosp-003', 'Saturday', '09:00:00', '13:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-010-1', 'doc-010', 'hosp-002', 'Tuesday', '09:00:00', '13:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-010-2', 'doc-010', 'hosp-002', 'Wednesday', '15:00:00', '19:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-010-3', 'doc-010', 'hosp-002', 'Friday', '09:00:00', '13:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-010-4', 'doc-010', 'hosp-002', 'Saturday', '14:00:00', '17:00:00', 12, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-011-1', 'doc-011', 'hosp-002', 'Monday', '10:00:00', '14:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-011-2', 'doc-011', 'hosp-002', 'Wednesday', '15:00:00', '19:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-011-3', 'doc-011', 'hosp-002', 'Friday', '10:00:00', '14:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-012-1', 'doc-012', 'hosp-002', 'Tuesday', '08:00:00', '12:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-012-2', 'doc-012', 'hosp-002', 'Thursday', '14:00:00', '18:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-012-3', 'doc-012', 'hosp-002', 'Saturday', '09:00:00', '13:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-013-1', 'doc-013', 'hosp-002', 'Monday', '06:00:00', '14:00:00', 24, 0, 0, 0, NULL, 10, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-013-2', 'doc-013', 'hosp-002', 'Wednesday', '14:00:00', '22:00:00', 24, 0, 0, 0, NULL, 10, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-013-3', 'doc-013', 'hosp-002', 'Friday', '22:00:00', '06:00:00', 24, 0, 0, 0, NULL, 10, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-013-4', 'doc-013', 'hosp-002', 'Sunday', '06:00:00', '14:00:00', 24, 0, 0, 0, NULL, 10, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-014-1', 'doc-014', 'hosp-002', 'Monday', '07:00:00', '11:00:00', 8, 0, 0, 0, NULL, 30, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-014-2', 'doc-014', 'hosp-002', 'Tuesday', '13:00:00', '17:00:00', 8, 0, 0, 0, NULL, 30, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-014-3', 'doc-014', 'hosp-002', 'Thursday', '07:00:00', '11:00:00', 8, 0, 0, 0, NULL, 30, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-014-4', 'doc-014', 'hosp-002', 'Friday', '13:00:00', '17:00:00', 8, 0, 0, 0, NULL, 30, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-015-1', 'doc-015', 'hosp-002', 'Monday', '09:00:00', '13:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-015-2', 'doc-015', 'hosp-002', 'Wednesday', '14:00:00', '18:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-015-3', 'doc-015', 'hosp-002', 'Friday', '09:00:00', '13:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-016-1', 'doc-016', 'hosp-003', 'Monday', '08:00:00', '12:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-016-2', 'doc-016', 'hosp-003', 'Tuesday', '13:00:00', '17:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-016-3', 'doc-016', 'hosp-003', 'Wednesday', '08:00:00', '12:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-016-4', 'doc-016', 'hosp-003', 'Thursday', '13:00:00', '17:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-016-5', 'doc-016', 'hosp-003', 'Friday', '08:00:00', '12:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-017-1', 'doc-017', 'hosp-003', 'Monday', '10:00:00', '14:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-017-2', 'doc-017', 'hosp-003', 'Tuesday', '15:00:00', '19:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-017-3', 'doc-017', 'hosp-003', 'Wednesday', '10:00:00', '14:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-017-4', 'doc-017', 'hosp-003', 'Thursday', '15:00:00', '19:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-017-5', 'doc-017', 'hosp-003', 'Saturday', '10:00:00', '14:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-018-1', 'doc-018', 'hosp-003', 'Tuesday', '09:00:00', '13:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-018-2', 'doc-018', 'hosp-003', 'Thursday', '14:00:00', '18:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-018-3', 'doc-018', 'hosp-003', 'Saturday', '15:00:00', '19:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-019-1', 'doc-019', 'hosp-002', 'Monday', '11:00:00', '15:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-019-2', 'doc-019', 'hosp-002', 'Tuesday', '16:00:00', '20:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-019-3', 'doc-019', 'hosp-002', 'Thursday', '11:00:00', '15:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-019-4', 'doc-019', 'hosp-002', 'Saturday', '08:00:00', '12:00:00', 20, 0, 0, 0, NULL, 12, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-020-1', 'doc-020', 'hosp-003', 'Monday', '15:00:00', '19:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-020-2', 'doc-020', 'hosp-003', 'Wednesday', '11:00:00', '15:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-020-3', 'doc-020', 'hosp-003', 'Friday', '15:00:00', '19:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-13 22:10:07', '2025-08-13 22:10:07', 5, 1),
('sess-021-1', 'doc-021', 'hosp-004', 'Monday', '08:00:00', '12:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-021-2', 'doc-021', 'hosp-004', 'Wednesday', '14:00:00', '18:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-021-3', 'doc-021', 'hosp-004', 'Friday', '08:00:00', '12:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-022-1', 'doc-022', 'hosp-005', 'Tuesday', '09:00:00', '13:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-022-2', 'doc-022', 'hosp-005', 'Thursday', '15:00:00', '19:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-022-3', 'doc-022', 'hosp-005', 'Saturday', '10:00:00', '14:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-023-1', 'doc-023', 'hosp-006', 'Monday', '10:00:00', '14:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-023-2', 'doc-023', 'hosp-006', 'Wednesday', '15:00:00', '19:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-023-3', 'doc-023', 'hosp-006', 'Friday', '10:00:00', '14:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-024-1', 'doc-024', 'hosp-007', 'Tuesday', '08:00:00', '12:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-024-2', 'doc-024', 'hosp-007', 'Thursday', '14:00:00', '18:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-024-3', 'doc-024', 'hosp-007', 'Saturday', '09:00:00', '13:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-025-1', 'doc-025', 'hosp-008', 'Monday', '07:00:00', '11:00:00', 8, 0, 0, 0, NULL, 30, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-025-2', 'doc-025', 'hosp-008', 'Wednesday', '13:00:00', '17:00:00', 8, 0, 0, 0, NULL, 30, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-025-3', 'doc-025', 'hosp-008', 'Friday', '07:00:00', '11:00:00', 8, 0, 0, 0, NULL, 30, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-026-1', 'doc-026', 'hosp-004', 'Tuesday', '10:00:00', '14:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-026-2', 'doc-026', 'hosp-004', 'Thursday', '15:00:00', '19:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-026-3', 'doc-026', 'hosp-004', 'Saturday', '08:00:00', '12:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-027-1', 'doc-027', 'hosp-005', 'Monday', '09:00:00', '13:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-027-2', 'doc-027', 'hosp-005', 'Wednesday', '14:00:00', '18:00:00', 16, 0, 1, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-10-08 09:00:56', 5, 1),
('sess-027-3', 'doc-027', 'hosp-005', 'Friday', '09:00:00', '13:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-028-1', 'doc-028', 'hosp-007', 'Monday', '08:00:00', '12:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-028-2', 'doc-028', 'hosp-007', 'Tuesday', '14:00:00', '18:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-028-3', 'doc-028', 'hosp-007', 'Thursday', '08:00:00', '12:00:00', 16, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-029-1', 'doc-029', 'hosp-006', 'Monday', '14:00:00', '18:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-029-2', 'doc-029', 'hosp-006', 'Wednesday', '09:00:00', '13:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-029-3', 'doc-029', 'hosp-006', 'Friday', '14:00:00', '18:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-030-1', 'doc-030', 'hosp-008', 'Tuesday', '10:00:00', '14:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-030-2', 'doc-030', 'hosp-008', 'Thursday', '15:00:00', '19:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-030-3', 'doc-030', 'hosp-008', 'Saturday', '09:00:00', '13:00:00', 12, 0, 0, 0, NULL, 20, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-08-16 06:30:35', '2025-08-16 06:30:35', 5, 1),
('sess-QQaPQrDqsqxX', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'Monday', '09:00:00', '13:00:00', 40, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:02', '2025-10-02 01:44:02', 5, 1),
('sess-OW5f8aRGw9oS', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'Wednesday', '09:00:00', '13:00:00', 40, 0, 9, 15, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:02', '2025-10-08 07:06:27', 5, 1),
('sess-H_gvP1FAGLhx', 'doc-oHogdcuTq28T', 'gmc-kottayam-OeSnZmuiLV', 'Friday', '14:00:00', '17:00:00', 30, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:03', '2025-10-02 01:44:03', 5, 1),
('sess-SFHfq_IHMOLZ', 'doc-41jKi0kKkm3L', 'gmc-kottayam-OeSnZmuiLV', 'Monday', '10:00:00', '18:00:00', 50, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:03', '2025-10-06 08:58:33', 5, 1),
('sess-v7yC54QmKlIx', 'doc-41jKi0kKkm3L', 'gmc-kottayam-OeSnZmuiLV', 'Tuesday', '10:00:00', '14:00:00', 50, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:03', '2025-10-02 01:44:03', 5, 1),
('sess-8rMMopMSofQw', 'doc-41jKi0kKkm3L', 'gmc-kottayam-OeSnZmuiLV', 'Thursday', '10:00:00', '14:00:00', 50, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:03', '2025-10-02 01:44:03', 5, 1),
('sess-usln3Mx037r4', 'doc-41jKi0kKkm3L', 'gmc-kottayam-OeSnZmuiLV', 'Saturday', '09:00:00', '12:00:00', 35, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:03', '2025-10-02 01:44:03', 5, 1),
('sess-6W7NyeibiorG', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'Tuesday', '09:00:00', '13:00:00', 45, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:03', '2025-10-02 01:44:03', 5, 1),
('sess-joXJf-92Lwju', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'Thursday', '09:00:00', '13:00:00', 45, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:03', '2025-10-02 01:44:03', 5, 1),
('sess-sSWSlQ6lyCMG', 'doc-lYmc71t79BFF', 'gmc-kottayam-OeSnZmuiLV', 'Friday', '09:00:00', '13:00:00', 45, 0, 21, 29, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:03', '2025-10-10 11:12:33', 5, 1),
('sess-y9okZ0ghgFIk', 'doc-2alPVsvQmPrr', 'gmc-kottayam-OeSnZmuiLV', 'Monday', '14:00:00', '17:00:00', 40, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:03', '2025-10-02 01:44:03', 5, 1),
('sess-OXYtyff5FtvJ', 'doc-2alPVsvQmPrr', 'gmc-kottayam-OeSnZmuiLV', 'Wednesday', '14:00:00', '17:00:00', 40, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:03', '2025-10-02 01:44:03', 5, 1),
('sess-8AAhAyDtppcJ', 'doc-2alPVsvQmPrr', 'gmc-kottayam-OeSnZmuiLV', 'Saturday', '09:00:00', '12:00:00', 35, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:03', '2025-10-02 01:44:03', 5, 1),
('sess-y9nzGYiT7Goh', 'doc-CoK__KzNkTPm', 'gmc-kottayam-OeSnZmuiLV', 'Tuesday', '10:00:00', '13:00:00', 35, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:03', '2025-10-02 01:44:03', 5, 1),
('sess-apvJKwaV2sGP', 'doc-CoK__KzNkTPm', 'gmc-kottayam-OeSnZmuiLV', 'Thursday', '14:00:00', '17:00:00', 35, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:03', '2025-10-02 01:44:03', 5, 1),
('sess--BzsDRbplQyC', 'doc-CoK__KzNkTPm', 'gmc-kottayam-OeSnZmuiLV', 'Friday', '10:00:00', '13:00:00', 35, 0, 0, 0, NULL, 15, NULL, NULL, NULL, 1, NULL, NULL, 'approved', NULL, NULL, NULL, '2025-10-02 01:44:03', '2025-10-02 01:44:03', 5, 1);

-- --------------------------------------------------------

--
-- Table structure for table `doctor_session_requests`
--

CREATE TABLE `doctor_session_requests` (
  `id` varchar(36) NOT NULL,
  `doctor_id` varchar(36) NOT NULL,
  `hospital_id` varchar(36) NOT NULL,
  `requested_by` varchar(20) NOT NULL,
  `requestor_id` varchar(36) DEFAULT NULL,
  `day_of_week` varchar(10) NOT NULL,
  `start_time` varchar(8) NOT NULL,
  `end_time` varchar(8) NOT NULL,
  `max_tokens` int NOT NULL,
  `avg_minutes_per_patient` int DEFAULT '15',
  `special_notes` text,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `response_message` text,
  `session_id` varchar(36) DEFAULT NULL,
  `requested_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `responded_at` timestamp NULL DEFAULT NULL,
  `responded_by` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emergency_contacts`
--

CREATE TABLE `emergency_contacts` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `relationship` varchar(50) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text,
  `is_primary` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hospitals`
--

CREATE TABLE `hospitals` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `zip_code` varchar(10) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `image` varchar(500) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT '0.00',
  `total_reviews` int DEFAULT '0',
  `total_doctors` int DEFAULT '0',
  `established` int NOT NULL,
  `website` varchar(255) DEFAULT NULL,
  `license_number` varchar(100) DEFAULT NULL,
  `accreditation` varchar(255) DEFAULT NULL,
  `bed_count` int DEFAULT NULL,
  `emergency_services` tinyint(1) DEFAULT '0',
  `parking_available` tinyint(1) DEFAULT '0',
  `operating_hours` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `hospitals`
--

INSERT INTO `hospitals` (`id`, `name`, `address`, `city`, `state`, `zip_code`, `phone`, `email`, `description`, `image`, `rating`, `total_reviews`, `total_doctors`, `established`, `website`, `license_number`, `accreditation`, `bed_count`, `emergency_services`, `parking_available`, `operating_hours`, `is_active`, `created_at`, `updated_at`) VALUES
('hosp-001', 'CityCare Medical Center', '123 Healthcare Ave, Medical District', 'Mumbai', 'Maharashtra', '400001', '+91-22-1234-5678', 'info@citycare.com', 'A premier multi-specialty hospital with state-of-the-art facilities and experienced medical professionals.', '🏥', 4.80, 1250, 4, 1985, 'https://citycare.com', NULL, NULL, NULL, 0, 0, NULL, 1, '2025-08-13 21:22:49', '2025-08-16 06:30:48'),
('hosp-002', 'MetroHealth Hospital', '456 Medical Plaza, Downtown', 'Delhi', 'Delhi', '110001', '+91-11-2345-6789', 'contact@metrohealth.com', 'Modern healthcare facility specializing in emergency care and advanced surgical procedures.', '🏨', 4.60, 980, 9, 1995, 'https://metrohealth.com', NULL, NULL, NULL, 0, 0, NULL, 1, '2025-08-13 21:22:49', '2025-08-16 06:30:48'),
('hosp-003', 'WellnessPoint Clinic', '789 Wellness Blvd, Suburbs', 'Bangalore', 'Karnataka', '560001', '+91-80-3456-7890', 'hello@wellnesspoint.com', 'Community-focused clinic providing comprehensive family healthcare services.', '🏩', 4.70, 650, 7, 2005, 'https://wellnesspoint.com', NULL, NULL, NULL, 0, 0, NULL, 1, '2025-08-13 21:22:49', '2025-08-16 06:30:48'),
('hosp-004', 'Apollo Hospitals', '21 Greams Lane, Off Greams Road', 'Chennai', 'Tamil Nadu', '600006', '+91-44-2829-3333', 'info@apollohospitals.com', 'Leading multi-specialty hospital chain with advanced medical technology and world-class healthcare services.', '🏥', 4.60, 2150, 2, 1983, 'https://apollohospitals.com', NULL, NULL, NULL, 0, 0, NULL, 1, '2025-08-16 06:29:52', '2025-08-16 06:30:48'),
('hosp-005', 'Fortis Healthcare', 'B-22, Sector 62', 'Noida', 'Uttar Pradesh', '201301', '+91-120-500-4444', 'contact@fortishealthcare.com', 'Premium healthcare provider with expertise in cardiac care, oncology, and transplant medicine.', '🏥', 4.50, 1890, 2, 1996, 'https://fortishealthcare.com', NULL, NULL, NULL, 0, 0, NULL, 1, '2025-08-16 06:29:52', '2025-08-16 06:30:48'),
('hosp-006', 'Max Super Speciality Hospital', 'FC-50, C & D Block, Shalimar Bagh', 'Delhi', 'Delhi', '110088', '+91-11-2648-5801', 'info@maxhealthcare.com', 'State-of-the-art super specialty hospital with advanced technology and experienced medical professionals.', '🏥', 4.70, 1650, 2, 2001, 'https://maxhealthcare.in', NULL, NULL, NULL, 0, 0, NULL, 1, '2025-08-16 06:29:52', '2025-08-16 06:30:48'),
('hosp-007', 'Manipal Hospitals', '98, Rustom Bagh, Airport Road', 'Bangalore', 'Karnataka', '560017', '+91-80-2502-4444', 'info@manipalhospitals.com', 'Comprehensive healthcare network providing tertiary care with focus on clinical excellence.', '🏥', 4.55, 1420, 2, 1991, 'https://manipalhospitals.com', NULL, NULL, NULL, 0, 0, NULL, 1, '2025-08-16 06:29:52', '2025-08-16 06:30:48'),
('hosp-008', 'AIIMS', 'Sri Aurobindo Marg, Ansari Nagar', 'Delhi', 'Delhi', '110029', '+91-11-2659-3333', 'info@aiims.edu', 'Premier medical institute and hospital providing advanced healthcare and medical education.', '🏥', 4.80, 2800, 2, 1956, 'https://aiims.edu', NULL, NULL, NULL, 0, 0, NULL, 1, '2025-08-16 06:29:52', '2025-08-16 06:30:48'),
('ymdc4i6iwldzcuzsqhx', 'City General hospital', '87 West White New Parkway\nPariatur At cupidat', 'Vel aut necessitatib', 'Dadra and Nagar Haveli', '89305', '+9115272175566', 'info@citygeneralhospital.com', 'Welcome to City General hospital. We provide quality healthcare services.', NULL, 0.00, 0, 0, 1985, NULL, 'HL_2024-193', NULL, NULL, 0, 0, NULL, 0, '2025-08-18 07:02:27', '2025-08-18 07:02:27'),
('x8m183xrdjgr4s798mx9k8', 'Sunrise Multispeciality Hospital', 'xyz. abc,', 'Bengaluru', 'Karnataka', '560045', '+91 98765 43210', 'info@sampleemail.in', 'Welcome to Sunrise Multispeciality Hospital. We provide quality healthcare services.', NULL, 0.00, 0, 0, 2005, NULL, 'IN-HL-2025-004321', NULL, NULL, 0, 0, NULL, 0, '2025-08-21 10:45:40', '2025-08-21 10:45:40'),
('gmc-kottayam-OeSnZmuiLV', 'Government Medical College, Kottayam', 'Arpookara, Gandhinagar P.O', 'Kottayam', 'Kerala', '686008', '0481-2597005', 'principal@gmckottayam.ac.in', 'Government Medical College, Kottayam is a premier medical institution in Kerala, India. Established in 1965, it is one of the oldest and most reputable government medical colleges in the state. The institution is affiliated with Kerala University of Health Sciences and offers undergraduate (MBBS) and postgraduate medical education. GMC Kottayam is also a Regional Centre in Medical Education Technologies, providing advanced medical training and research facilities. The hospital attached to the college serves as a major healthcare center for the region, offering comprehensive medical services across multiple specialties.', 'https://kottayammedicalcollege.org/wp-content/uploads/2023/06/slide-5.jpeg', 4.50, 0, 5, 1965, 'https://kottayammedicalcollege.org', NULL, NULL, NULL, 0, 0, NULL, 1, '2025-10-02 01:44:01', '2025-10-02 01:44:04'),
('2ba973fb-a661-11f0-abc5-52541aa39e4a', 'VPS Lakeshore Hospital', 'NH Bypass Road, Nettoor, Maradu', 'Kochi', 'Kerala', '682040', '+91 484 270 1000', 'info@lakeshorehospital.com', 'VPS Lakeshore Hospital is a multi-specialty quaternary care hospital in Kochi, Kerala. With state-of-the-art facilities and internationally trained doctors, we provide world-class healthcare services. Our hospital features advanced ICUs, modern operation theaters, 24/7 emergency services, and comprehensive medical care across multiple specialties. We are accredited by NABH and JCI, ensuring the highest standards of patient care and safety.', 'https://baberahma.com/wp-content/uploads/2022/07/VPS-Lakeshore-Hospital-Kochi-Kerala.jpg', 4.85, 2847, 17, 2007, 'https://www.lakeshorehospital.com', 'VPS-KL-2007-001', 'NABH, JCI Accredited', 350, 1, 1, '{\"friday\": {\"open\": \"00:00\", \"close\": \"23:59\", \"is24Hours\": true}, \"monday\": {\"open\": \"00:00\", \"close\": \"23:59\", \"is24Hours\": true}, \"sunday\": {\"open\": \"00:00\", \"close\": \"23:59\", \"is24Hours\": true}, \"tuesday\": {\"open\": \"00:00\", \"close\": \"23:59\", \"is24Hours\": true}, \"saturday\": {\"open\": \"00:00\", \"close\": \"23:59\", \"is24Hours\": true}, \"thursday\": {\"open\": \"00:00\", \"close\": \"23:59\", \"is24Hours\": true}, \"wednesday\": {\"open\": \"00:00\", \"close\": \"23:59\", \"is24Hours\": true}}', 1, '2025-10-11 05:14:32', '2025-10-11 05:14:32');

-- --------------------------------------------------------

--
-- Table structure for table `hospital_admins`
--

CREATE TABLE `hospital_admins` (
  `id` varchar(36) NOT NULL,
  `hospital_id` varchar(36) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'admin',
  `permissions` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `hospital_admins`
--

INSERT INTO `hospital_admins` (`id`, `hospital_id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`, `permissions`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
('gmc-admin-001', 'gmc-kottayam-OeSnZmuiLV', 'admin@gmckottayam.ac.in', '$2b$12$p0Fp0HUaLYAbsMuGfXQDxOJ0LyOvly9CN4.VEnSW2WZHdGjrLTsWS', 'GMC', 'Administrator', '0481-2597005', 'admin', '\"[\\\"read\\\",\\\"write\\\",\\\"delete\\\"]\"', 1, '2025-10-06 06:05:47', '2025-10-06 06:04:48', '2025-10-06 06:05:45'),
('rw3zegvvcn5ksv5tv7xs', 'ymdc4i6iwldzcuzsqhx', 'hsopalan@gmail.com', '$2b$12$p0Fp0HUaLYAbsMuGfXQDxOJ0LyOvly9CN4.VEnSW2WZHdGjrLTsWS', 'alan', 'rickman', '15272175566', 'admin', '\"[\\\"read\\\",\\\"write\\\",\\\"delete\\\"]\"', 1, '2025-10-06 05:58:51', '2025-08-18 07:02:27', '2025-10-06 05:58:49'),
('wtfow5c59uibl36d6x0oll', 'x8m183xrdjgr4s798mx9k8', 'jino@gmail.com', '$2b$12$oCTUidHRsGlLRF.kIHGeMu2wLK0w6SZtaJGS9EC5ZYv7rwi2QWxzi', 'JINO', 'JINO', '+919555421222', 'admin', '\"[\\\"read\\\",\\\"write\\\",\\\"delete\\\"]\"', 0, NULL, '2025-08-21 10:45:40', '2025-08-21 10:45:40');

-- --------------------------------------------------------

--
-- Table structure for table `hospital_callback_queue`
--

CREATE TABLE `hospital_callback_queue` (
  `id` varchar(36) NOT NULL,
  `appointment_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `doctor_id` varchar(36) NOT NULL,
  `hospital_id` varchar(36) NOT NULL,
  `missed_date` varchar(10) NOT NULL,
  `missed_token_number` int NOT NULL,
  `callback_status` varchar(20) DEFAULT 'pending',
  `callback_attempts` int DEFAULT '0',
  `last_callback_at` timestamp NULL DEFAULT NULL,
  `callback_notes` text,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hospital_doctor_associations`
--

CREATE TABLE `hospital_doctor_associations` (
  `id` varchar(36) NOT NULL,
  `hospital_id` varchar(36) NOT NULL,
  `doctor_id` varchar(36) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `commission_rate` decimal(5,2) DEFAULT NULL,
  `special_terms` text,
  `approved_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_by` varchar(36) NOT NULL,
  `deactivated_at` timestamp NULL DEFAULT NULL,
  `deactivated_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hospital_settings`
--

CREATE TABLE `hospital_settings` (
  `id` varchar(36) NOT NULL,
  `hospital_id` varchar(36) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `setting_type` varchar(20) DEFAULT 'string',
  `description` text,
  `updated_by` varchar(36) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hospital_specialties`
--

CREATE TABLE `hospital_specialties` (
  `hospital_id` varchar(36) NOT NULL,
  `specialty_id` varchar(36) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `hospital_specialties`
--

INSERT INTO `hospital_specialties` (`hospital_id`, `specialty_id`) VALUES
('gmc-kottayam-OeSnZmuiLV', 'general_medicine'),
('gmc-kottayam-OeSnZmuiLV', 'spec-community-medicine'),
('gmc-kottayam-OeSnZmuiLV', 'spec-obstetrics-gynecology'),
('gmc-kottayam-OeSnZmuiLV', 'spec-paediatrics'),
('gmc-kottayam-OeSnZmuiLV', 'spec-pharmacology'),
('gmc-kottayam-OeSnZmuiLV', 'spec-physiology'),
('hosp-001', 'cardiology'),
('hosp-001', 'general_medicine'),
('hosp-001', 'neurology'),
('hosp-001', 'orthopedics'),
('hosp-001', 'pediatrics'),
('hosp-002', 'dermatology'),
('hosp-002', 'emergency_medicine'),
('hosp-002', 'ent'),
('hosp-002', 'surgery'),
('hosp-002', 'urology'),
('hosp-003', 'family_medicine'),
('hosp-003', 'pediatrics'),
('hosp-003', 'preventive_care'),
('hosp-003', 'womens_health'),
('hosp-004', 'cardiology'),
('hosp-004', 'dermatology'),
('hosp-004', 'general_medicine'),
('hosp-004', 'neurology'),
('hosp-004', 'orthopedics'),
('hosp-004', 'pediatrics'),
('hosp-004', 'surgery'),
('hosp-005', 'cardiology'),
('hosp-005', 'dermatology'),
('hosp-005', 'general_medicine'),
('hosp-005', 'orthopedics'),
('hosp-005', 'surgery'),
('hosp-005', 'urology'),
('hosp-006', 'cardiology'),
('hosp-006', 'ent'),
('hosp-006', 'family_medicine'),
('hosp-006', 'neurology'),
('hosp-006', 'orthopedics'),
('hosp-006', 'pediatrics'),
('hosp-007', 'ent'),
('hosp-007', 'general_medicine'),
('hosp-007', 'neurology'),
('hosp-007', 'orthopedics'),
('hosp-007', 'pediatrics'),
('hosp-007', 'urology'),
('hosp-008', 'cardiology'),
('hosp-008', 'dermatology'),
('hosp-008', 'emergency_medicine'),
('hosp-008', 'ent'),
('hosp-008', 'family_medicine'),
('hosp-008', 'general_medicine'),
('hosp-008', 'neurology'),
('hosp-008', 'orthopedics'),
('hosp-008', 'pediatrics'),
('hosp-008', 'preventive_care'),
('hosp-008', 'surgery'),
('hosp-008', 'urology'),
('hosp-008', 'womens_health');

-- --------------------------------------------------------

--
-- Table structure for table `insurance`
--

CREATE TABLE `insurance` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `provider` varchar(255) NOT NULL,
  `policy_number` varchar(100) NOT NULL,
  `policy_holder_name` varchar(255) NOT NULL,
  `coverage_amount` decimal(10,2) DEFAULT NULL,
  `deductible` decimal(8,2) DEFAULT NULL,
  `expiry_date` varchar(10) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `documents` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medical_records`
--

CREATE TABLE `medical_records` (
  `id` varchar(36) NOT NULL,
  `appointment_id` varchar(36) DEFAULT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `doctor_id` varchar(36) DEFAULT NULL,
  `diagnosis` text,
  `symptoms` text,
  `treatment` text,
  `prescription` json DEFAULT NULL,
  `vitals` json DEFAULT NULL,
  `lab_reports` json DEFAULT NULL,
  `follow_up_date` varchar(10) DEFAULT NULL,
  `follow_up_instructions` text,
  `attachments` json DEFAULT NULL,
  `is_private` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `medical_records`
--

INSERT INTO `medical_records` (`id`, `appointment_id`, `user_id`, `doctor_id`, `diagnosis`, `symptoms`, `treatment`, `prescription`, `vitals`, `lab_reports`, `follow_up_date`, `follow_up_instructions`, `attachments`, `is_private`, `created_at`, `updated_at`) VALUES
('d43acWzIrGCNVFPsPiQs-', 'Lqr3r9-xNmahcHPngngYS', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-41jKi0kKkm3L', 'Issues', 'Hello', 'Second', '{\"text\": \"Hello World\"}', NULL, NULL, NULL, 'Second', NULL, 0, '2025-10-06 06:37:25', '2025-10-06 06:37:25'),
('VF1pgbW6uz4NdNgaOnVKC', 'appt-test-001', 'test-user-001', 'doc-oHogdcuTq28T', 'heefe', 'Headache and fever', 'ewefwfe', '{\"text\": \"fewefw\"}', NULL, NULL, NULL, 'ewefwfe', NULL, 0, '2025-10-08 06:00:27', '2025-10-08 06:00:27'),
('3XtPfLAsfIBX0bZWqBvRN', 'appt-test-005', 'test-user-005', 'doc-oHogdcuTq28T', 'hello', 'General checkup', 'hello\n', '{\"text\": \"hello\"}', NULL, NULL, NULL, 'hello\n', NULL, 0, '2025-10-08 06:24:10', '2025-10-08 06:24:10'),
('EdW6i7KNt6Txx8PBIHcos', 'appt-test-005', 'test-user-005', 'doc-oHogdcuTq28T', 'Consultation completed', 'General checkup', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:43:30', '2025-10-08 06:43:30'),
('1AYCG3uQT0zBHI1YkeZ1c', 'appt-test-001', 'test-user-001', 'doc-oHogdcuTq28T', 'Consultation completed', 'Headache and fever', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:44:11', '2025-10-08 06:44:11'),
('dxrPDvpTmK-iSWSIhTS4G', 'appt-test-001', 'test-user-001', 'doc-oHogdcuTq28T', 'Consultation completed', 'Headache and fever', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:44:42', '2025-10-08 06:44:42'),
('5cnHgmcHWVE4sxAucAizf', 'appt-test-001', 'test-user-001', 'doc-oHogdcuTq28T', 'Consultation completed', 'Headache and fever', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:45:37', '2025-10-08 06:45:37'),
('9BaJzgRuIrdiWITiIjiAf', 'appt-test-006', 'test-user-006', 'doc-oHogdcuTq28T', 'Consultation completed', 'Thyroid follow-up', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:45:53', '2025-10-08 06:45:53'),
('n5qK8eaO_mob258v9lbnD', 'appt-test-006', 'test-user-006', 'doc-oHogdcuTq28T', 'Consultation completed', 'Thyroid follow-up', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:46:00', '2025-10-08 06:46:00'),
('G1bFcxl8F0epTIrK-rDyf', 'appt-test-006', 'test-user-006', 'doc-oHogdcuTq28T', 'Consultation completed', 'Thyroid follow-up', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:46:21', '2025-10-08 06:46:21'),
('7Vxj2ROyQr2k52g49YzcK', 'appt-test-006', 'test-user-006', 'doc-oHogdcuTq28T', 'Consultation completed', 'Thyroid follow-up', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:50:16', '2025-10-08 06:50:16'),
('l7jZgXKnX1AZRtyFbRha1', 'appt-test-007', 'test-user-007', 'doc-oHogdcuTq28T', 'Consultation completed', 'Stomach pain', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:50:21', '2025-10-08 06:50:21'),
('JD8iPsZrnQowHHXaB0KNn', 'appt-test-008', 'test-user-008', 'doc-oHogdcuTq28T', 'Consultation completed', 'Severe migraine', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:50:32', '2025-10-08 06:50:32'),
('nqySoYnEiVKvmJd74v1cd', 'appt-test-008', 'test-user-008', 'doc-oHogdcuTq28T', 'Consultation completed', 'Severe migraine', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:51:03', '2025-10-08 06:51:03'),
('tXx5vUKzo271--sj3S1VR', 'appt-test-010', 'test-user-010', 'doc-oHogdcuTq28T', 'Consultation completed', 'Joint pain', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:51:06', '2025-10-08 06:51:06'),
('uwDG83D_AR1G0M_RiPYfb', 'appt-test-011', 'test-user-011', 'doc-oHogdcuTq28T', 'Consultation completed', 'Cholesterol review', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:51:10', '2025-10-08 06:51:10'),
('VRyj-h2B_68scn_FDk5qv', 'appt-test-012', 'test-user-012', 'doc-oHogdcuTq28T', 'Consultation completed', 'Health checkup', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:51:13', '2025-10-08 06:51:13'),
('rLPwZ1vv5q8JeuUlnkeWi', 'appt-test-013', 'test-user-013', 'doc-oHogdcuTq28T', 'Consultation completed', 'Skin rash', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:51:15', '2025-10-08 06:51:15'),
('o3YxMbz72z67T0o40C86d', 'appt-test-014', 'test-user-014', 'doc-oHogdcuTq28T', 'Consultation completed', 'PCOD consultation', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:51:18', '2025-10-08 06:51:18'),
('Dux5r66kwiQTCeBoooPk6', 'appt-test-015', 'test-user-015', 'doc-oHogdcuTq28T', 'Consultation completed', 'Lower back pain', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:51:22', '2025-10-08 06:51:22'),
('P2Y1EJGBrsytwvHjyg07G', 'appt-test-016', 'test-user-016', 'doc-oHogdcuTq28T', 'Consultation completed', 'General consultation', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 06:51:27', '2025-10-08 06:51:27'),
('jeM-vYIHc1UxgZGh13bM0', 'appt-test-017', 'test-user-017', 'doc-oHogdcuTq28T', 'Consultation completed', 'Acid reflux', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 07:00:34', '2025-10-08 07:00:34'),
('lOmCRqEU_Yx6Q0KnMqa7H', 'appt-test-018', 'test-user-018', 'doc-oHogdcuTq28T', 'Consultation completed', 'Low hemoglobin', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 07:00:39', '2025-10-08 07:00:39'),
('UtAMzyWm07SPPMdggEYJG', 'appt-test-019', 'test-user-019', 'doc-oHogdcuTq28T', 'Consultation completed', 'Allergy checkup', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 07:00:43', '2025-10-08 07:00:43'),
('pwJcL_eAnEleB0l_7PNOp', 'appt-test-020', 'test-user-020', 'doc-oHogdcuTq28T', 'Consultation completed', 'Routine wellness check', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 07:00:47', '2025-10-08 07:00:47'),
('bHLZGKL1Pu6tWj9P7SSMo', 'g_e6hBdiXXbbMl7G3U94D', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-oHogdcuTq28T', 'Consultation completed', NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 07:00:50', '2025-10-08 07:00:50'),
('2v4EO9YFAoEWgyzWiC0Il', 'g_e6hBdiXXbbMl7G3U94D', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-oHogdcuTq28T', 'Consultation completed', NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 07:00:54', '2025-10-08 07:00:54'),
('YtnyRim3igcO45U1ou4-f', 'g_e6hBdiXXbbMl7G3U94D', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-oHogdcuTq28T', 'Consultation completed', NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 07:05:55', '2025-10-08 07:05:55'),
('BpE3C1RmUATvDyvX9os2W', 'appt-test-002', 'test-user-002', 'doc-oHogdcuTq28T', 'Consultation completed', 'Breathing difficulty', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 07:06:15', '2025-10-08 07:06:15'),
('ktK_RBt7AnhwE9Zi-O5NV', 'appt-test-003', 'test-user-003', 'doc-oHogdcuTq28T', 'Consultation completed', 'Blood sugar check', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 07:06:21', '2025-10-08 07:06:21'),
('b3LrnckorNn39y_ObHbdX', 'appt-test-004', 'test-user-004', 'doc-oHogdcuTq28T', 'Consultation completed', 'High BP consultation', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 07:06:26', '2025-10-08 07:06:26'),
('soeXAt60n4ww_r_PtOGYj', 'appt-test-009', 'test-user-009', 'doc-oHogdcuTq28T', 'Consultation completed', 'Routine checkup', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 07:06:31', '2025-10-08 07:06:31'),
('IDi_u0cm_H0Xof7InzitA', 'appt-test-009', 'test-user-009', 'doc-oHogdcuTq28T', 'Consultation completed', 'Routine checkup', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 07:06:38', '2025-10-08 07:06:38'),
('x4PAnQ7rB8vWonQDtevE0', 'appt-tested-001', 'test-users--001', 'doc-001', 'Consultation completed', 'Headache and fever', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 11:34:43', '2025-10-08 11:34:43'),
('azCpyCnuOZbEzienw0Nl1', 'appt-tested-002', 'test-users--002', 'doc-001', 'Consultation completed', 'Breathing difficulty', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 11:35:24', '2025-10-08 11:35:24'),
('Fv2g_8XV6hwnT4U9VPz8o', 'appt-tested-004', 'test-users--004', 'doc-001', 'Consultation completed', 'High BP consultation', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 11:37:59', '2025-10-08 11:37:59'),
('I59bWVkDy35GY_iJmczuR', 'appt-tested-005', 'test-users--005', 'doc-001', 'Consultation completed', 'General checkup', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 11:38:08', '2025-10-08 11:38:08'),
('aVyDet-iOiMwpotHimAvN', 'appt-tested-006', 'test-users--006', 'doc-001', 'Consultation completed', 'Thyroid follow-up', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 11:38:19', '2025-10-08 11:38:19'),
('LeiPSEWhZg2oKH6zXOT3Z', 'appt-tested-003', 'test-users--003', 'doc-001', 'Consultation completed', 'Blood sugar check', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 11:38:54', '2025-10-08 11:38:54'),
('PjFBc6Zcuu57g2-p-BCoN', 'appt-tested-007', 'test-users--007', 'doc-001', 'Consultation completed', 'Stomach pain', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-08 11:39:05', '2025-10-08 11:39:05'),
('hgxe29pgf4BuWWaUkP6oV', 'g4rBGlWnpnD7MBGxRkIKq', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-005', 'Consultation completed', 'hey', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 04:44:02', '2025-10-10 04:44:02'),
('qGpMVxjPpjG-g1d9nzaN8', 'appt-tests3-001', 'test-user--001', 'doc-lYmc71t79BFF', 'Consultation completed', 'Headache and fever', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 04:56:44', '2025-10-10 04:56:44'),
('ZBtTxoyfB77mZBU2jEnhV', 'appt-tests3-002', 'test-user--002', 'doc-lYmc71t79BFF', 'Consultation completed', 'Breathing difficulty', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 04:56:51', '2025-10-10 04:56:51'),
('iYQYU1OH9Kkfu-eC4J4DF', 'appt-tests3-004', 'test-user--004', 'doc-lYmc71t79BFF', 'Consultation completed', 'High BP consultation', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 04:57:02', '2025-10-10 04:57:02'),
('Gi9D1i_79xB1rQ77fl9eS', 'appt-tests3-005', 'test-user--005', 'doc-lYmc71t79BFF', 'Consultation completed', 'General checkup', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 04:57:14', '2025-10-10 04:57:14'),
('91BkoSdrSMIDwJsM_fdJV', 'appt-tests3-006', 'test-user--006', 'doc-lYmc71t79BFF', 'Consultation completed', 'Thyroid follow-up', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 04:57:22', '2025-10-10 04:57:22'),
('M93PuwPJYRrOA_mY72r-v', 'appt-tests3-003', 'test-user--003', 'doc-lYmc71t79BFF', 'Consultation completed', 'Blood sugar check', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 05:35:42', '2025-10-10 05:35:42'),
('xFgnmIumU86kNnXvLBmja', 'appt-tests3-007', 'test-user--007', 'doc-lYmc71t79BFF', 'Consultation completed', 'Stomach pain', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 05:37:38', '2025-10-10 05:37:38'),
('VYFQqnvaJzDnLmdMX6IF3', 'appt-tests3-008', 'test-user--008', 'doc-lYmc71t79BFF', 'Consultation completed', 'Severe migraine', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 05:40:18', '2025-10-10 05:40:18'),
('-xbQ8iX15Cl7w3HFnEzgB', 'appt-tests3-009', 'test-user--009', 'doc-lYmc71t79BFF', 'Consultation completed', 'Routine checkup', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 05:40:30', '2025-10-10 05:40:30'),
('kt7yVZhG-2TJo9cAhqfQ1', 'appt-tests3-010', 'test-user--010', 'doc-lYmc71t79BFF', 'Consultation completed', 'Joint pain', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 05:40:35', '2025-10-10 05:40:35'),
('gZpPLLIrO7WzUmfrGAyWb', 'appt-tests4-001', 'test-user--001', 'doc-lYmc71t79BFF', 'Consultation completed', 'Headache and fever', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 05:40:45', '2025-10-10 05:40:45'),
('km3IfGDT0wmoG1dsZB5ZE', 'appt-tests4-003', 'test-user--003', 'doc-lYmc71t79BFF', 'Consultation completed', 'Blood sugar check', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 05:41:02', '2025-10-10 05:41:02'),
('l8l3BoNBC0dOvRn1CEGhj', 'appt-tests4-002', 'test-user--002', 'doc-lYmc71t79BFF', 'Consultation completed', 'Breathing difficulty', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 05:41:08', '2025-10-10 05:41:08'),
('hK_JYpzKgJFbnfE9Hx2vC', 'appt-tests4-004', 'test-user--004', 'doc-lYmc71t79BFF', 'Consultation completed', 'High BP consultation', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 05:41:12', '2025-10-10 05:41:12'),
('xctoWp_F3kLJ5QMlI1hl8', 'appt-tests4-005', 'test-user--005', 'doc-lYmc71t79BFF', 'Consultation completed', 'General checkup', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 05:41:16', '2025-10-10 05:41:16'),
('1V9ovft3K6GHkIOpk7-08', 'appt-tests4-006', 'test-user--006', 'doc-lYmc71t79BFF', 'Consultation completed', 'Thyroid follow-up', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 05:41:19', '2025-10-10 05:41:19'),
('IOgIMZd3DMso0SMfXqcur', 'appt-tests4-007', 'test-user--007', 'doc-lYmc71t79BFF', 'Consultation completed', 'Stomach pain', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 05:41:25', '2025-10-10 05:41:25'),
('wamtkp6l1kzwap1wVOH5I', 'appt-tests4-008', 'test-user--008', 'doc-lYmc71t79BFF', 'Consultation completed', 'Severe migraine', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 05:41:31', '2025-10-10 05:41:31'),
('foXx8fw2131M4fN8-sXHJ', 'appt-tests4-009', 'test-user--009', 'doc-lYmc71t79BFF', 'Consultation completed', 'Routine checkup', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 05:41:39', '2025-10-10 05:41:39'),
('XTcKUxmonPRuOtDzh4LC3', 'X5lzFpL5t4Rq1-rDZVY_T', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-lYmc71t79BFF', 'Consultation completed', NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 06:40:06', '2025-10-10 06:40:06'),
('tJGVBCNHYofMqaY5A1lNM', 'appt-tests5-003', 'test-user--003', 'doc-lYmc71t79BFF', 'Consultation completed', 'Blood sugar check', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 06:40:31', '2025-10-10 06:40:31'),
('mIiHn0kYu3FQklbEgrIlv', 'appt-tests5-004', 'test-user--004', 'doc-lYmc71t79BFF', 'Consultation completed', 'High BP consultation', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 06:40:43', '2025-10-10 06:40:43'),
('5Cm6euFVC1VpGqq2LrCNl', 'appt-tests5-005', 'test-user--005', 'doc-lYmc71t79BFF', 'Consultation completed', 'General checkup', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 06:40:49', '2025-10-10 06:40:49'),
('BPQkpaQ88y8e0yG17pAby', 'appt-tests5-006', 'test-user--006', 'doc-lYmc71t79BFF', 'Consultation completed', 'Thyroid follow-up', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 06:40:55', '2025-10-10 06:40:55'),
('aijzMsl2cau_lHzgXF0r1', 'appt-tests6-001', 'tests2-user--001', 'doc-lYmc71t79BFF', 'Consultation completed', 'Headache and fever', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 11:12:06', '2025-10-10 11:12:06'),
('VjJhTY4MRb4OCsUszjBaL', 'appt-tests6-002', 'tests2-user--002', 'doc-lYmc71t79BFF', 'Consultation completed', 'Breathing difficulty', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 11:12:14', '2025-10-10 11:12:14'),
('BaoEZzV43WF58rFh9057X', 'appt-tests6-003', 'tests2-user--003', 'doc-lYmc71t79BFF', 'Consultation completed', 'Blood sugar check', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 11:12:21', '2025-10-10 11:12:21'),
('IV4g1_L8HgYNCEUxAmQRw', 'appt-tests6-004', 'tests2-user--004', 'doc-lYmc71t79BFF', 'Consultation completed', 'High BP consultation', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 11:12:26', '2025-10-10 11:12:26'),
('yyY2K0hBe8FybqHddR5Fv', 'appt-tests6-005', 'tests2-user--005', 'doc-lYmc71t79BFF', 'Consultation completed', 'General checkup', NULL, NULL, NULL, NULL, NULL, '', NULL, 0, '2025-10-10 11:12:30', '2025-10-10 11:12:30');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `data` json DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `scheduled_for` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` varchar(36) NOT NULL,
  `appointment_id` varchar(36) DEFAULT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `doctor_id` varchar(36) DEFAULT NULL,
  `payment_method_id` varchar(36) DEFAULT NULL,
  `amount` decimal(8,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'INR',
  `status` varchar(20) NOT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `gateway_transaction_id` varchar(255) DEFAULT NULL,
  `gateway` varchar(50) DEFAULT NULL,
  `gateway_response` json DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `failed_at` timestamp NULL DEFAULT NULL,
  `failure_reason` text,
  `refunded_at` timestamp NULL DEFAULT NULL,
  `refund_amount` decimal(8,2) DEFAULT NULL,
  `refund_reason` text,
  `platform_fee` decimal(8,2) DEFAULT '0.00',
  `doctor_earnings` decimal(8,2) DEFAULT NULL,
  `hospital_earnings` decimal(8,2) DEFAULT NULL,
  `hospital_commission_rate` decimal(5,2) DEFAULT NULL,
  `tax_amount` decimal(8,2) DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `appointment_id`, `user_id`, `doctor_id`, `payment_method_id`, `amount`, `currency`, `status`, `transaction_id`, `gateway_transaction_id`, `gateway`, `gateway_response`, `paid_at`, `failed_at`, `failure_reason`, `refunded_at`, `refund_amount`, `refund_reason`, `platform_fee`, `doctor_earnings`, `hospital_earnings`, `hospital_commission_rate`, `tax_amount`, `created_at`, `updated_at`) VALUES
('22sLPZwmFpOAOzyQ4B2IV', 'R-OhnMeaxdQ1-J4DFn8cM', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-006', NULL, 900.00, 'INR', 'pending', 'TXN_R-OhnMeaxdQ1-J4DFn8cM_1755318640621', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-15 23:00:41', '2025-08-15 23:00:41'),
('OJhpNQB4kMyVm_HQB1gRF', 'kpFE34I8i-ZgroMeKWQ6q', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-006', NULL, 900.00, 'INR', 'pending', 'TXN_kpFE34I8i-ZgroMeKWQ6q_1755319169339', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-15 23:09:29', '2025-08-15 23:09:29'),
('G78UyRvqFVz7kkieu5aux', 'bwDw6To4TfPKp-kDMvoQX', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-009', NULL, 700.00, 'INR', 'pending', 'TXN_bwDw6To4TfPKp-kDMvoQX_1755322051852', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-15 23:57:32', '2025-08-15 23:57:32'),
('qV3_lYe3S6xuacO7CTVqX', 'bwDw6To4TfPKp-kDMvoQX', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-009', NULL, 700.00, 'INR', 'completed', 'order_R5tLKQh6d20FFQ', 'pay_R5tLgM53GhLEnw', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R5tLKQh6d20FFQ\\\",\\\"razorpay_payment_id\\\":\\\"pay_R5tLgM53GhLEnw\\\",\\\"razorpay_signature\\\":\\\"541cc768841ebd1368552a6430ca91947ec20764bfc8cbb461788314da37d79c\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R5tLgM53GhLEnw\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":70000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R5tLKQh6d20FFQ\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_R5tLgYRD67rQFV\\\",\\\"card\\\":{\\\"id\\\":\\\"card_R5tLgYRD67rQFV\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"bwDw6To4TfPKp-kDMvoQX\\\",\\\"doctorName\\\":\\\"Dr. Ravi Krishnan\\\",\\\"hospitalName\\\":\\\"WellnessPoint Clinic\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Ravi Krishnan\\\"},\\\"fee\\\":2100,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"394232\\\"},\\\"created_at\\\":1755322358}}\"', '2025-08-16 00:02:52', NULL, NULL, NULL, NULL, NULL, 35.00, 665.00, 10.50, NULL, 126.00, '2025-08-16 00:02:52', '2025-08-16 00:02:52'),
('vJ_I9404bBopeLRKxc4Ny', 'Z3HL5EG1d2sicJaXZck4T', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-009', NULL, 700.00, 'INR', 'pending', 'TXN_Z3HL5EG1d2sicJaXZck4T_1755322497770', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-16 00:04:58', '2025-08-16 00:04:58'),
('shmY6iJizyb8Uoa63xHgE', 'Z3HL5EG1d2sicJaXZck4T', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-009', NULL, 700.00, 'INR', 'completed', 'order_R5tORc3tsYbFIQ', 'pay_R5tOmTzOumpOoO', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R5tORc3tsYbFIQ\\\",\\\"razorpay_payment_id\\\":\\\"pay_R5tOmTzOumpOoO\\\",\\\"razorpay_signature\\\":\\\"f6daed4b3f60129e82a46fbdcc7816209f4486924b20608239765c048f808229\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R5tOmTzOumpOoO\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":70000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R5tORc3tsYbFIQ\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_R5tOmhOviyKfX4\\\",\\\"card\\\":{\\\"id\\\":\\\"card_R5tOmhOviyKfX4\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"Z3HL5EG1d2sicJaXZck4T\\\",\\\"doctorName\\\":\\\"Dr. Ravi Krishnan\\\",\\\"hospitalName\\\":\\\"WellnessPoint Clinic\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Ravi Krishnan\\\"},\\\"fee\\\":2100,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"286428\\\"},\\\"created_at\\\":1755322534}}\"', '2025-08-16 00:05:49', NULL, NULL, NULL, NULL, NULL, 35.00, 665.00, 10.50, NULL, 126.00, '2025-08-16 00:05:49', '2025-08-16 00:05:49'),
('rGbyZkCSqoVpifiXjCLTa', 'Z3HL5EG1d2sicJaXZck4T', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-009', NULL, 700.00, 'INR', 'completed', 'order_R5tSiL6UT49yQa', 'pay_R5tT1uXqE8F4wh', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R5tSiL6UT49yQa\\\",\\\"razorpay_payment_id\\\":\\\"pay_R5tT1uXqE8F4wh\\\",\\\"razorpay_signature\\\":\\\"ae761bceaf42fbd9ef6b00729073e4408af1da3a1b3efad5558596ac51c27522\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R5tT1uXqE8F4wh\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":70000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R5tSiL6UT49yQa\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_R5tT28wrSmJjyB\\\",\\\"card\\\":{\\\"id\\\":\\\"card_R5tT28wrSmJjyB\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"Z3HL5EG1d2sicJaXZck4T\\\",\\\"doctorName\\\":\\\"Dr. Ravi Krishnan\\\",\\\"hospitalName\\\":\\\"WellnessPoint Clinic\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Ravi Krishnan\\\"},\\\"fee\\\":2100,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"305680\\\"},\\\"created_at\\\":1755322775}}\"', '2025-08-16 00:09:49', NULL, NULL, NULL, NULL, NULL, 35.00, 665.00, 10.50, NULL, 126.00, '2025-08-16 00:09:49', '2025-08-16 00:09:49'),
('2HdGVcH-Q3zB3YInANGMd', 'zGjvTsY4jE7guUtxUMtwF', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-010', NULL, 600.00, 'INR', 'pending', 'TXN_zGjvTsY4jE7guUtxUMtwF_1755323104372', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-16 00:15:04', '2025-08-16 00:15:04'),
('MNvi1B2ELnMagGLKORugd', 'zGjvTsY4jE7guUtxUMtwF', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-010', NULL, 600.00, 'INR', 'completed', 'order_R5tZ5oYNlZMExW', 'pay_R5tZPyap5cCkME', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R5tZ5oYNlZMExW\\\",\\\"razorpay_payment_id\\\":\\\"pay_R5tZPyap5cCkME\\\",\\\"razorpay_signature\\\":\\\"84df1313f096042f5fe31312f0d07640d9b2b89fbf6845614cff7527774951c5\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R5tZPyap5cCkME\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":60000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R5tZ5oYNlZMExW\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_R5tZQBK5ybAhZG\\\",\\\"card\\\":{\\\"id\\\":\\\"card_R5tZQBK5ybAhZG\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"zGjvTsY4jE7guUtxUMtwF\\\",\\\"doctorName\\\":\\\"Dr. Anita Kapoor\\\",\\\"hospitalName\\\":\\\"MetroHealth Hospital\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Anita Kapoor\\\"},\\\"fee\\\":1800,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"107271\\\"},\\\"created_at\\\":1755323138}}\"', '2025-08-16 00:15:54', NULL, NULL, NULL, NULL, NULL, 30.00, 570.00, 9.00, NULL, 108.00, '2025-08-16 00:15:54', '2025-08-16 00:15:54'),
('_5lI8uw2s7H9OW_bC6Gy8', 'shUbb93tjELu6UJOhQOwg', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-012', NULL, 750.00, 'INR', 'pending', 'TXN_shUbb93tjELu6UJOhQOwg_1755324692452', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-16 00:41:32', '2025-08-16 00:41:32'),
('rn-0DGCVOJcLiSn9JZDDx', 'shUbb93tjELu6UJOhQOwg', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-012', NULL, 750.00, 'INR', 'completed', 'order_R5u0zbj7B54kAJ', 'pay_R5u1wlDPa7Fwsb', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R5u0zbj7B54kAJ\\\",\\\"razorpay_payment_id\\\":\\\"pay_R5u1wlDPa7Fwsb\\\",\\\"razorpay_signature\\\":\\\"6589a665f69947ab29496a9cdcef6a9fc03718135e720c6b595c1b09e1cd36d9\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R5u1wlDPa7Fwsb\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":75000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R5u0zbj7B54kAJ\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_R5u1wz9XhaHuEu\\\",\\\"card\\\":{\\\"id\\\":\\\"card_R5u1wz9XhaHuEu\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"shUbb93tjELu6UJOhQOwg\\\",\\\"doctorName\\\":\\\"Dr. Sanjay Yadav\\\",\\\"hospitalName\\\":\\\"MetroHealth Hospital\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Sanjay Yadav\\\"},\\\"fee\\\":2250,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"237440\\\"},\\\"created_at\\\":1755324759}}\"', '2025-08-16 00:42:53', NULL, NULL, NULL, NULL, NULL, 37.50, 712.50, 11.25, NULL, 135.00, '2025-08-16 00:42:53', '2025-08-16 00:42:53'),
('uKlvWjIAsGUxCeL5tG8Jx', 'Z-kSewA5_gadV9kkcy4c6', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-005', NULL, 950.00, 'INR', 'pending', 'TXN_Z-kSewA5_gadV9kkcy4c6_1755326773842', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-16 01:16:14', '2025-08-16 01:16:14'),
('F0PuxGvR20ssIx0CztXXE', 'Z-kSewA5_gadV9kkcy4c6', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-005', NULL, 950.00, 'INR', 'completed', 'order_R5ubjgZwqGY3Ac', 'pay_R5uc3px2kfkkei', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R5ubjgZwqGY3Ac\\\",\\\"razorpay_payment_id\\\":\\\"pay_R5uc3px2kfkkei\\\",\\\"razorpay_signature\\\":\\\"ca8085b9945009e1c040c544485b9f857150a36e366ef0e3874a64b1cbba2f35\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R5uc3px2kfkkei\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":95000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R5ubjgZwqGY3Ac\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_R5uc47U3b0aLWr\\\",\\\"card\\\":{\\\"id\\\":\\\"card_R5uc47U3b0aLWr\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"Z-kSewA5_gadV9kkcy4c6\\\",\\\"doctorName\\\":\\\"Dr. Vikram Singh\\\",\\\"hospitalName\\\":\\\"MetroHealth Hospital\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Vikram Singh\\\"},\\\"fee\\\":2850,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"819520\\\"},\\\"created_at\\\":1755326810}}\"', '2025-08-16 01:17:04', NULL, NULL, NULL, NULL, NULL, 47.50, 902.50, 14.25, NULL, 171.00, '2025-08-16 01:17:04', '2025-08-16 01:17:04'),
('xWSxmyDcS8Lxheo4aW-vc', 'uG7a2mlSUv0lKX72gt2Tb', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-026', NULL, 900.00, 'INR', 'pending', 'TXN_uG7a2mlSUv0lKX72gt2Tb_1755326886113', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-16 01:18:06', '2025-08-16 01:18:06'),
('YPM7Dfvxln7c3tZpFS7la', 'uG7a2mlSUv0lKX72gt2Tb', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-026', NULL, 900.00, 'INR', 'completed', 'order_R5udXhLaCJJxkL', 'pay_R5uduQNIg3gIy9', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R5udXhLaCJJxkL\\\",\\\"razorpay_payment_id\\\":\\\"pay_R5uduQNIg3gIy9\\\",\\\"razorpay_signature\\\":\\\"17afff3776fcaa703ccb609d120cb8931a72a5e4cdc80a096f390fd5f4fd049a\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R5uduQNIg3gIy9\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":90000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R5udXhLaCJJxkL\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_R5ududzWBwX1OZ\\\",\\\"card\\\":{\\\"id\\\":\\\"card_R5ududzWBwX1OZ\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"uG7a2mlSUv0lKX72gt2Tb\\\",\\\"doctorName\\\":\\\"Dr. Nisha Patel\\\",\\\"hospitalName\\\":\\\"Apollo Hospitals\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Nisha Patel\\\"},\\\"fee\\\":2700,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"547968\\\"},\\\"created_at\\\":1755326915}}\"', '2025-08-16 01:18:49', NULL, NULL, NULL, NULL, NULL, 45.00, 855.00, 13.50, NULL, 162.00, '2025-08-16 01:18:49', '2025-08-16 01:18:49'),
('8-weFQQtYL0W6KEWlHcbS', 'SFvZfHH4v1eaUnlR3987-', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-001', NULL, 800.00, 'INR', 'pending', 'TXN_SFvZfHH4v1eaUnlR3987-_1755327761467', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-16 01:32:41', '2025-08-16 01:32:41'),
('IW6gogbv0UcYO05VrrBwc', 'SFvZfHH4v1eaUnlR3987-', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-001', NULL, 800.00, 'INR', 'completed', 'order_R5utKAhFjgFV2P', 'pay_R5utgnPImFkxUq', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R5utKAhFjgFV2P\\\",\\\"razorpay_payment_id\\\":\\\"pay_R5utgnPImFkxUq\\\",\\\"razorpay_signature\\\":\\\"a07b227d40ebbcf9f6dca692f91d21a7fbbd5d134a0764c4cb8d0f147bb14292\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R5utgnPImFkxUq\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":80000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R5utKAhFjgFV2P\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_R5uthMA5DOL5Rf\\\",\\\"card\\\":{\\\"id\\\":\\\"card_R5uthMA5DOL5Rf\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"SFvZfHH4v1eaUnlR3987-\\\",\\\"doctorName\\\":\\\"Dr. Rajesh Kumar\\\",\\\"hospitalName\\\":\\\"CityCare Medical Center\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Rajesh Kumar\\\"},\\\"fee\\\":2400,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"707092\\\"},\\\"created_at\\\":1755327813}}\"', '2025-08-16 01:33:47', NULL, NULL, NULL, NULL, NULL, 40.00, 760.00, 12.00, NULL, 144.00, '2025-08-16 01:33:47', '2025-08-16 01:33:47'),
('j0ON7CGSGWLmVsVVou28v', 'cYkS-Wl-k-q9mNN2MLQ1_', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-005', NULL, 950.00, 'INR', 'pending', 'TXN_cYkS-Wl-k-q9mNN2MLQ1__1755348801651', NULL, 'razorpay', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-16 07:23:22', '2025-08-16 07:23:22'),
('atwMXvXp1nL3CkImp8LbU', 'bIRXW8s44GaXOCCrzgH-B', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-022', NULL, 1100.00, 'INR', 'pending', 'TXN_bIRXW8s44GaXOCCrzgH-B_1755352443112', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-16 08:24:03', '2025-08-16 08:24:03'),
('4O3lK4vgsFs1UFwC4slR6', 'LIv6w8ElORRxUykkIX9ji', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-005', NULL, 950.00, 'INR', 'pending', 'TXN_LIv6w8ElORRxUykkIX9ji_1755458732387', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-17 13:55:32', '2025-08-17 13:55:32'),
('i4hBQUxZXV6sNf042idzw', 'bleru3iaiBCPjxJQu3uKA', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-001', NULL, 800.00, 'INR', 'pending', 'TXN_bleru3iaiBCPjxJQu3uKA_1755459110883', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-17 14:01:51', '2025-08-17 14:01:51'),
('vLExnr8u1uYk16PwHjpVP', 'bleru3iaiBCPjxJQu3uKA', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-001', NULL, 800.00, 'INR', 'completed', 'order_R6WBPtbY9wOfmt', 'pay_R6WBdtLJ8CkPHf', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R6WBPtbY9wOfmt\\\",\\\"razorpay_payment_id\\\":\\\"pay_R6WBdtLJ8CkPHf\\\",\\\"razorpay_signature\\\":\\\"1395a5e9f31bbddde5623925097c324092e69472a7579e81d705b815f081b7d8\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R6WBdtLJ8CkPHf\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":80000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R6WBPtbY9wOfmt\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_R6WBe79Ni5xBGh\\\",\\\"card\\\":{\\\"id\\\":\\\"card_R6WBe79Ni5xBGh\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"bleru3iaiBCPjxJQu3uKA\\\",\\\"doctorName\\\":\\\"Dr. Rajesh Kumar\\\",\\\"hospitalName\\\":\\\"CityCare Medical Center\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Rajesh Kumar\\\"},\\\"fee\\\":2400,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"295709\\\"},\\\"created_at\\\":1755459131}}\"', '2025-08-17 14:02:26', NULL, NULL, NULL, NULL, NULL, 40.00, 760.00, 12.00, NULL, 144.00, '2025-08-17 14:02:26', '2025-08-17 14:02:26'),
('YIuPC4uLawmScrj1Gox_J', 'L_Zz2r3BM6_LAS4qQzkQN', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-001', NULL, 800.00, 'INR', 'pending', 'TXN_L_Zz2r3BM6_LAS4qQzkQN_1755567339262', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-18 20:05:39', '2025-08-18 20:05:39'),
('AYbTK8U9K1VSxMhI5axm4', 'L_Zz2r3BM6_LAS4qQzkQN', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-001', NULL, 800.00, 'INR', 'completed', 'order_R70urx0chixpzy', 'pay_R70vi3GtX4wS9b', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R70urx0chixpzy\\\",\\\"razorpay_payment_id\\\":\\\"pay_R70vi3GtX4wS9b\\\",\\\"razorpay_signature\\\":\\\"668797330c672468a1dc29476fbc37e642a686f453874ef2975113a4018a53b6\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R70vi3GtX4wS9b\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":80000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R70urx0chixpzy\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_R70viGuNAo4dGy\\\",\\\"card\\\":{\\\"id\\\":\\\"card_R70viGuNAo4dGy\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"L_Zz2r3BM6_LAS4qQzkQN\\\",\\\"doctorName\\\":\\\"Dr. Rajesh Kumar\\\",\\\"hospitalName\\\":\\\"CityCare Medical Center\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Rajesh Kumar\\\"},\\\"fee\\\":2400,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"263536\\\"},\\\"created_at\\\":1755567396}}\"', '2025-08-18 20:06:51', NULL, NULL, NULL, NULL, NULL, 40.00, 760.00, 12.00, NULL, 144.00, '2025-08-18 20:06:51', '2025-08-18 20:06:51'),
('sC8-NvE1RYtdu8PwgkDLJ', 'cWaZlImwneEl4MCatUoGZ', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-006', NULL, 900.00, 'INR', 'pending', 'TXN_cWaZlImwneEl4MCatUoGZ_1755569795824', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-19 02:16:36', '2025-08-19 02:16:36'),
('h78Ph1Z3fgU4sTcKlaFlR', 'cWaZlImwneEl4MCatUoGZ', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-006', NULL, 900.00, 'INR', 'completed', 'order_R71c9J4Zt6m4Uv', 'pay_R71d3Aijqi6jVU', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R71c9J4Zt6m4Uv\\\",\\\"razorpay_payment_id\\\":\\\"pay_R71d3Aijqi6jVU\\\",\\\"razorpay_signature\\\":\\\"b89ba96e6fa7908aea8209008bca4279e00ea038144f010cfb0a3489e1a6d023\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R71d3Aijqi6jVU\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":90000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R71c9J4Zt6m4Uv\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_R71d3OdjWBpXIS\\\",\\\"card\\\":{\\\"id\\\":\\\"card_R71d3OdjWBpXIS\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"cWaZlImwneEl4MCatUoGZ\\\",\\\"doctorName\\\":\\\"Dr. Kavita Joshi\\\",\\\"hospitalName\\\":\\\"CityCare Medical Center\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Kavita Joshi\\\"},\\\"fee\\\":2700,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"823156\\\"},\\\"created_at\\\":1755569858}}\"', '2025-08-19 02:17:54', NULL, NULL, NULL, NULL, NULL, 45.00, 855.00, 13.50, NULL, 162.00, '2025-08-19 02:17:54', '2025-08-19 02:17:54'),
('aNNNX4Tk4Y-yf17Stpdpq', 'FwVN0U13aRDWv6oNrHarh', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-006', NULL, 900.00, 'INR', 'pending', 'TXN_FwVN0U13aRDWv6oNrHarh_1755570076879', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-19 02:21:17', '2025-08-19 02:21:17'),
('RuJRx-gCIXSrGM8RWgFbk', 'FwVN0U13aRDWv6oNrHarh', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-006', NULL, 900.00, 'INR', 'completed', 'order_R71h0vprvj9Jyf', 'pay_R71hgHbGMiAe4p', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R71h0vprvj9Jyf\\\",\\\"razorpay_payment_id\\\":\\\"pay_R71hgHbGMiAe4p\\\",\\\"razorpay_signature\\\":\\\"89b550a56c6cd01d4ddc109df6aab0d3386b4c744385fd059c6eb0ebc02193c4\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R71hgHbGMiAe4p\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":90000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R71h0vprvj9Jyf\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_R71hgWBTKXJZvr\\\",\\\"card\\\":{\\\"id\\\":\\\"card_R71hgWBTKXJZvr\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"FwVN0U13aRDWv6oNrHarh\\\",\\\"doctorName\\\":\\\"Dr. Kavita Joshi\\\",\\\"hospitalName\\\":\\\"CityCare Medical Center\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Kavita Joshi\\\"},\\\"fee\\\":2700,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"439968\\\"},\\\"created_at\\\":1755570121}}\"', '2025-08-19 02:22:17', NULL, NULL, NULL, NULL, NULL, 45.00, 855.00, 13.50, NULL, 162.00, '2025-08-19 02:22:17', '2025-08-19 02:22:17'),
('_o3gV2lFJN-mkoSl_Sl0v', 'UwccFA60tP-Px4JD_3D5n', 'u7WpsoFG-dt8oASj2DO_V', 'doc-006', NULL, 900.00, 'INR', 'pending', 'TXN_UwccFA60tP-Px4JD_3D5n_1755582040534', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-19 05:40:41', '2025-08-19 05:40:41'),
('js-iFGD1ayvlqc7eyitIS', 'gVfIFc8FNgajmAWfD4Rg4', 'u7WpsoFG-dt8oASj2DO_V', 'doc-002', NULL, 750.00, 'INR', 'pending', 'TXN_gVfIFc8FNgajmAWfD4Rg4_1755774193114', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-21 11:03:13', '2025-08-21 11:03:13'),
('KEnZIPu4D5xJnGbYHItWD', 'gVfIFc8FNgajmAWfD4Rg4', 'u7WpsoFG-dt8oASj2DO_V', 'doc-002', NULL, 750.00, 'INR', 'completed', 'order_R7xeolSlIDrCsP', 'pay_R7xf4gt1IqYF3g', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R7xeolSlIDrCsP\\\",\\\"razorpay_payment_id\\\":\\\"pay_R7xf4gt1IqYF3g\\\",\\\"razorpay_signature\\\":\\\"d69175ea712507abde658e363d97f647c2143f08a0716b6feb632711b093b7f8\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R7xf4gt1IqYF3g\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":75000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R7xeolSlIDrCsP\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"upi\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":null,\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":\\\"jinojino122@gmailcom\\\",\\\"email\\\":\\\"jinojino122@gmail.com\\\",\\\"contact\\\":\\\"+919665542118\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"gVfIFc8FNgajmAWfD4Rg4\\\",\\\"doctorName\\\":\\\"Dr. Priya Sharma\\\",\\\"hospitalName\\\":\\\"MetroHealth Hospital\\\",\\\"patientEmail\\\":\\\"jinojino122@gmail.com\\\",\\\"patientPhone\\\":\\\"9665542118\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Priya Sharma\\\"},\\\"fee\\\":1770,\\\"tax\\\":270,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"rrn\\\":\\\"681336564232\\\",\\\"upi_transaction_id\\\":\\\"CCD5D11F1FE49AD396D5D98EEA543615\\\"},\\\"created_at\\\":1755774226,\\\"upi\\\":{\\\"vpa\\\":\\\"jinojino122@gmailcom\\\"}}}\"', '2025-08-21 11:04:00', NULL, NULL, NULL, NULL, NULL, 37.50, 712.50, 11.25, NULL, 135.00, '2025-08-21 11:04:00', '2025-08-21 11:04:00'),
('IrUdJELR3EHYQG7gctgP1', 'm3BGOUeP7ltVsnn_d8vPt', 'u7WpsoFG-dt8oASj2DO_V', 'doc-030', NULL, 750.00, 'INR', 'pending', 'TXN_m3BGOUeP7ltVsnn_d8vPt_1755774378351', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-21 11:06:18', '2025-08-21 11:06:18'),
('MdC2Tux42p2goQPmrPDQ2', 'C2feX5H4Vnnql5QR6sdZ_', 'u7WpsoFG-dt8oASj2DO_V', 'doc-028', NULL, 650.00, 'INR', 'pending', 'TXN_C2feX5H4Vnnql5QR6sdZ__1755774538560', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-21 11:08:59', '2025-08-21 11:08:59'),
('MO45K08JFlP8e3_VJA8Zm', 'C2feX5H4Vnnql5QR6sdZ_', 'u7WpsoFG-dt8oASj2DO_V', 'doc-028', NULL, 650.00, 'INR', 'completed', 'order_R7xklMN2o284Bv', 'pay_R7xkzcLUUKdDak', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R7xklMN2o284Bv\\\",\\\"razorpay_payment_id\\\":\\\"pay_R7xkzcLUUKdDak\\\",\\\"razorpay_signature\\\":\\\"8b1ed9d58b06d973d31bd087b16c6e5b8393ea895167928a4ade7d7974315ba5\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R7xkzcLUUKdDak\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":65000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R7xklMN2o284Bv\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"upi\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":null,\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":\\\"info@sampleemailin\\\",\\\"email\\\":\\\"jinojino122@gmail.com\\\",\\\"contact\\\":\\\"+919665542118\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"C2feX5H4Vnnql5QR6sdZ_\\\",\\\"doctorName\\\":\\\"Dr. Kavitha Reddy\\\",\\\"hospitalName\\\":\\\"Manipal Hospitals\\\",\\\"patientEmail\\\":\\\"jinojino122@gmail.com\\\",\\\"patientPhone\\\":\\\"9665542118\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Kavitha Reddy\\\"},\\\"fee\\\":1534,\\\"tax\\\":234,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"rrn\\\":\\\"164744503674\\\",\\\"upi_transaction_id\\\":\\\"05633647A7E3C2147CE6BE906D720CB9\\\"},\\\"created_at\\\":1755774562,\\\"upi\\\":{\\\"vpa\\\":\\\"info@sampleemailin\\\"}}}\"', '2025-08-21 11:09:36', NULL, NULL, NULL, NULL, NULL, 32.50, 617.50, 9.75, NULL, 117.00, '2025-08-21 11:09:36', '2025-08-21 11:09:36'),
('wSqx5i6hrATIfF_8PI1R3', '6XzvRW77qZClR-yAd02q4', 'u7WpsoFG-dt8oASj2DO_V', 'doc-008', NULL, 550.00, 'INR', 'pending', 'TXN_6XzvRW77qZClR-yAd02q4_1755774959572', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-21 11:16:00', '2025-08-21 11:16:00'),
('5idipVqEunygtz8VHYaeS', '6XzvRW77qZClR-yAd02q4', 'u7WpsoFG-dt8oASj2DO_V', 'doc-008', NULL, 550.00, 'INR', 'completed', 'order_R7xs83j0b39r0U', 'pay_R7xsGh0RRpFhNW', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R7xs83j0b39r0U\\\",\\\"razorpay_payment_id\\\":\\\"pay_R7xsGh0RRpFhNW\\\",\\\"razorpay_signature\\\":\\\"0df44c1d3959485c8b091c39746880c466c910684cadca482800653b8caebcea\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R7xsGh0RRpFhNW\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":55000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R7xs83j0b39r0U\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"upi\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":null,\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":\\\"info@sampleemailin\\\",\\\"email\\\":\\\"jinojino122@gmail.com\\\",\\\"contact\\\":\\\"+919665542118\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"6XzvRW77qZClR-yAd02q4\\\",\\\"doctorName\\\":\\\"Dr. Meera Agarwal\\\",\\\"hospitalName\\\":\\\"CityCare Medical Center\\\",\\\"patientEmail\\\":\\\"jinojino122@gmail.com\\\",\\\"patientPhone\\\":\\\"9665542118\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Meera Agarwal\\\"},\\\"fee\\\":1298,\\\"tax\\\":198,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"rrn\\\":\\\"347225029273\\\",\\\"upi_transaction_id\\\":\\\"672BB3FB5DEB93FAA20502F2503A5787\\\"},\\\"created_at\\\":1755774975,\\\"upi\\\":{\\\"vpa\\\":\\\"info@sampleemailin\\\"}}}\"', '2025-08-21 11:16:29', NULL, NULL, NULL, NULL, NULL, 27.50, 522.50, 8.25, NULL, 99.00, '2025-08-21 11:16:29', '2025-08-21 11:16:29'),
('iZ1PJZcTauPh3ob_3-ezY', 'LH1ZIVhs_9D_arxWITQmo', 'u7WpsoFG-dt8oASj2DO_V', 'doc-012', NULL, 750.00, 'INR', 'pending', 'TXN_LH1ZIVhs_9D_arxWITQmo_1755775090463', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-21 11:18:10', '2025-08-21 11:18:10'),
('71G9X-2BEmRtcz0QaBdu4', 'RWkKagtPA6Ulu_a8GdwF5', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-001', NULL, 800.00, 'INR', 'pending', 'TXN_RWkKagtPA6Ulu_a8GdwF5_1755833290475', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-08-22 03:28:10', '2025-08-22 03:28:10'),
('ADkQ_0FvznvbsSwZYUt-v', 'RWkKagtPA6Ulu_a8GdwF5', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-001', NULL, 800.00, 'INR', 'completed', 'order_R8ERAl8USfh6vC', 'pay_R8ESUAgD4bF9tV', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_R8ERAl8USfh6vC\\\",\\\"razorpay_payment_id\\\":\\\"pay_R8ESUAgD4bF9tV\\\",\\\"razorpay_signature\\\":\\\"2551eb263ec88a4c0f9cfb34c8e0737a91e086bdbcbe9a95536e26c8685136e0\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_R8ESUAgD4bF9tV\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":80000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_R8ERAl8USfh6vC\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_R8ESUO8PEAIaa0\\\",\\\"card\\\":{\\\"id\\\":\\\"card_R8ESUO8PEAIaa0\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"RWkKagtPA6Ulu_a8GdwF5\\\",\\\"doctorName\\\":\\\"Dr. Rajesh Kumar\\\",\\\"hospitalName\\\":\\\"CityCare Medical Center\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Rajesh Kumar\\\"},\\\"fee\\\":2400,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"125831\\\"},\\\"created_at\\\":1755833379}}\"', '2025-08-22 03:29:53', NULL, NULL, NULL, NULL, NULL, 40.00, 760.00, 12.00, NULL, 144.00, '2025-08-22 03:29:53', '2025-08-22 03:29:53'),
('igDwdY27F9qmRPHPxP7UU', 'gx_-u10HwpmwI03ik9QZk', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-003', NULL, 900.00, 'INR', 'pending', 'TXN_gx_-u10HwpmwI03ik9QZk_1759298406740', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-01 06:00:07', '2025-10-01 06:00:07'),
('ueD-nJxiXRS1R27KV_aM5', 'gx_-u10HwpmwI03ik9QZk', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-003', NULL, 900.00, 'INR', 'completed', 'order_RO6OSYuV4P4bam', 'pay_RO6P9anjvpMiXT', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_RO6OSYuV4P4bam\\\",\\\"razorpay_payment_id\\\":\\\"pay_RO6P9anjvpMiXT\\\",\\\"razorpay_signature\\\":\\\"8a84bdc7ae4d82e40997d1bd703d8373122a5bf9f4ac1af9e0d793aaf5cce90c\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_RO6P9anjvpMiXT\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":90000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_RO6OSYuV4P4bam\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_RO6P9moBulg0dL\\\",\\\"card\\\":{\\\"id\\\":\\\"card_RO6P9moBulg0dL\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"gx_-u10HwpmwI03ik9QZk\\\",\\\"doctorName\\\":\\\"Dr. Amit Patel\\\",\\\"hospitalName\\\":\\\"CityCare Medical Center\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Amit Patel\\\"},\\\"fee\\\":2700,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"721272\\\"},\\\"created_at\\\":1759298458}}\"', '2025-10-01 06:01:17', NULL, NULL, NULL, NULL, NULL, 45.00, 855.00, 13.50, NULL, 162.00, '2025-10-01 06:01:17', '2025-10-01 06:01:17'),
('tdGvVfyujRNHUiJo552fA', 'OE3ot4noVFdiV3Ft5aDHF', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-CoK__KzNkTPm', NULL, 600.00, 'INR', 'pending', 'TXN_OE3ot4noVFdiV3Ft5aDHF_1759471230144', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-03 06:00:30', '2025-10-03 06:00:30'),
('Lz3fiVB4a1A2u2JzB4Tw4', 'OE3ot4noVFdiV3Ft5aDHF', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-CoK__KzNkTPm', NULL, 600.00, 'INR', 'completed', 'order_ROtT43xPyKBPde', 'pay_ROtUp8mnl6JWbc', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_ROtT43xPyKBPde\\\",\\\"razorpay_payment_id\\\":\\\"pay_ROtUp8mnl6JWbc\\\",\\\"razorpay_signature\\\":\\\"5be7fcc570c2b5de0a0621a8b00e79372a4630c8305af2c1ba1b0da658b467e9\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_ROtUp8mnl6JWbc\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":60000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_ROtT43xPyKBPde\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_ROtUpKpjXE3wSv\\\",\\\"card\\\":{\\\"id\\\":\\\"card_ROtUpKpjXE3wSv\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"OE3ot4noVFdiV3Ft5aDHF\\\",\\\"doctorName\\\":\\\"Dr. Kala Kesavan\\\",\\\"hospitalName\\\":\\\"Government Medical College, Kottayam\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Kala Kesavan\\\"},\\\"fee\\\":1800,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"381431\\\"},\\\"created_at\\\":1759471339}}\"', '2025-10-03 06:02:37', NULL, NULL, NULL, NULL, NULL, 30.00, 570.00, 9.00, NULL, 108.00, '2025-10-03 06:02:37', '2025-10-03 06:02:37'),
('jAxihqXtng2JOMCSdRn2A', 'LeKuO1UocxKDvurEoevxM', 'bEE24k5iA7bBDIDHZ0ocQ', 'doc-oHogdcuTq28T', NULL, 500.00, 'INR', 'pending', 'TXN_LeKuO1UocxKDvurEoevxM_1759482263566', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-03 09:04:24', '2025-10-03 09:04:24'),
('ywRNNsNTo4ZBvS2_g8pFS', 'LeKuO1UocxKDvurEoevxM', 'bEE24k5iA7bBDIDHZ0ocQ', 'doc-oHogdcuTq28T', NULL, 500.00, 'INR', 'completed', 'order_ROwbzOLQ5K1BvZ', 'pay_ROwcmLntNLDDzi', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_ROwbzOLQ5K1BvZ\\\",\\\"razorpay_payment_id\\\":\\\"pay_ROwcmLntNLDDzi\\\",\\\"razorpay_signature\\\":\\\"e41067210b0121c62c623f352890d84a117a40b3cd981dedb7474cdfe0c8c2b2\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_ROwcmLntNLDDzi\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":50000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_ROwbzOLQ5K1BvZ\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_ROwcmWyqOYj8kr\\\",\\\"card\\\":{\\\"id\\\":\\\"card_ROwcmWyqOYj8kr\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alex@gmail.com\\\",\\\"contact\\\":\\\"+918080707085\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"LeKuO1UocxKDvurEoevxM\\\",\\\"doctorName\\\":\\\"Dr. Dhanya SP\\\",\\\"hospitalName\\\":\\\"Government Medical College, Kottayam\\\",\\\"patientEmail\\\":\\\"alex@gmail.com\\\",\\\"patientPhone\\\":\\\"5858989808\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Dhanya SP\\\"},\\\"fee\\\":1500,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"213140\\\"},\\\"created_at\\\":1759482356}}\"', '2025-10-03 09:06:12', NULL, NULL, NULL, NULL, NULL, 25.00, 475.00, 7.50, NULL, 90.00, '2025-10-03 09:06:12', '2025-10-03 09:06:12'),
('UHmZGL6c6DapWpFHbhSy6', '7GFjNRAvzBkovHt6hPsMo', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-oHogdcuTq28T', NULL, 500.00, 'INR', 'pending', 'TXN_7GFjNRAvzBkovHt6hPsMo_1759482442658', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-03 09:07:23', '2025-10-03 09:07:23'),
('5VPJ44HYbt4RdY3Qro6UR', '7GFjNRAvzBkovHt6hPsMo', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-oHogdcuTq28T', NULL, 500.00, 'INR', 'completed', 'order_ROwePczQSKlKTs', 'pay_ROwehBKtbu2YZ2', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_ROwePczQSKlKTs\\\",\\\"razorpay_payment_id\\\":\\\"pay_ROwehBKtbu2YZ2\\\",\\\"razorpay_signature\\\":\\\"dba78ec608983ce895ae37dcd9389f10d91261eccbfb1f8e19c4a87f443a7af5\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_ROwehBKtbu2YZ2\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":50000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_ROwePczQSKlKTs\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_ROwehNCHF2QVS5\\\",\\\"card\\\":{\\\"id\\\":\\\"card_ROwehNCHF2QVS5\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"7GFjNRAvzBkovHt6hPsMo\\\",\\\"doctorName\\\":\\\"Dr. Dhanya SP\\\",\\\"hospitalName\\\":\\\"Government Medical College, Kottayam\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Dhanya SP\\\"},\\\"fee\\\":1500,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"611335\\\"},\\\"created_at\\\":1759482465}}\"', '2025-10-03 09:08:06', NULL, NULL, NULL, NULL, NULL, 25.00, 475.00, 7.50, NULL, 90.00, '2025-10-03 09:08:06', '2025-10-03 09:08:06'),
('hwPxT5ILj5USepSG1dPvz', '-QuUWqtxo3beKtp6dSKTj', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-lYmc71t79BFF', NULL, 700.00, 'INR', 'pending', 'TXN_-QuUWqtxo3beKtp6dSKTj_1759485225456', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-03 09:53:45', '2025-10-03 09:53:45'),
('JTJSeH3v3Wj0ZJydH44dQ', 'uj94xqmigauoTgU_Lt4AP', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-006', NULL, 900.00, 'INR', 'pending', 'TXN_uj94xqmigauoTgU_Lt4AP_1759606599312', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-04 19:36:39', '2025-10-04 19:36:39');
INSERT INTO `payments` (`id`, `appointment_id`, `user_id`, `doctor_id`, `payment_method_id`, `amount`, `currency`, `status`, `transaction_id`, `gateway_transaction_id`, `gateway`, `gateway_response`, `paid_at`, `failed_at`, `failure_reason`, `refunded_at`, `refund_amount`, `refund_reason`, `platform_fee`, `doctor_earnings`, `hospital_earnings`, `hospital_commission_rate`, `tax_amount`, `created_at`, `updated_at`) VALUES
('CHrWwRGEgrzqSUqpoOpb7', 'uj94xqmigauoTgU_Lt4AP', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-006', NULL, 900.00, 'INR', 'completed', 'order_RPVuNBHeNvg7cn', 'pay_RPVv3JjxockvPb', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_RPVuNBHeNvg7cn\\\",\\\"razorpay_payment_id\\\":\\\"pay_RPVv3JjxockvPb\\\",\\\"razorpay_signature\\\":\\\"303ebf99ca6d57decfa5b0b062a856a9e469e89d6ad638dda89bbac71936b520\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_RPVv3JjxockvPb\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":90000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_RPVuNBHeNvg7cn\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_RPVv3VnIgYhx74\\\",\\\"card\\\":{\\\"id\\\":\\\"card_RPVv3VnIgYhx74\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"uj94xqmigauoTgU_Lt4AP\\\",\\\"doctorName\\\":\\\"Dr. Kavita Joshi\\\",\\\"hospitalName\\\":\\\"CityCare Medical Center\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Kavita Joshi\\\"},\\\"fee\\\":2700,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"274279\\\"},\\\"created_at\\\":1759606651}}\"', '2025-10-04 19:37:50', NULL, NULL, NULL, NULL, NULL, 45.00, 855.00, 13.50, NULL, 162.00, '2025-10-04 19:37:50', '2025-10-04 19:37:50'),
('tbjvko8zyzeQtPSj0GEJS', 'Lqr3r9-xNmahcHPngngYS', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-41jKi0kKkm3L', NULL, 600.00, 'INR', 'pending', 'TXN_Lqr3r9-xNmahcHPngngYS_1759731736367', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-06 06:22:16', '2025-10-06 06:22:16'),
('EGr_R7uuQyicsF_5qngPT', 'Lqr3r9-xNmahcHPngngYS', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-41jKi0kKkm3L', NULL, 600.00, 'INR', 'completed', 'order_RQ5Rifzlf31HfF', 'pay_RQ5SCFsmxG4RS7', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_RQ5Rifzlf31HfF\\\",\\\"razorpay_payment_id\\\":\\\"pay_RQ5SCFsmxG4RS7\\\",\\\"razorpay_signature\\\":\\\"172db0c91c2382e519957a420eb89c9978f5d56bc66c42869dab37fcf1c095e1\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_RQ5SCFsmxG4RS7\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":60000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_RQ5Rifzlf31HfF\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_RQ5SCRjB0DvJTq\\\",\\\"card\\\":{\\\"id\\\":\\\"card_RQ5SCRjB0DvJTq\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"Lqr3r9-xNmahcHPngngYS\\\",\\\"doctorName\\\":\\\"Dr. Jiji Mary Antony\\\",\\\"hospitalName\\\":\\\"Government Medical College, Kottayam\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Jiji Mary Antony\\\"},\\\"fee\\\":1800,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"356500\\\"},\\\"created_at\\\":1759731790}}\"', '2025-10-06 06:23:28', NULL, NULL, NULL, NULL, NULL, 30.00, 570.00, 9.00, NULL, 108.00, '2025-10-06 06:23:28', '2025-10-06 06:23:28'),
('bCohNcZvxUBwjD9XDOZg2', 'EFGs2xLbwxRAIbIUu86pX', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-41jKi0kKkm3L', NULL, 600.00, 'INR', 'pending', 'TXN_EFGs2xLbwxRAIbIUu86pX_1759731991486', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-06 06:26:31', '2025-10-06 06:26:31'),
('zl9KiHaj4_xGn1l07R4vO', 'oVTDAux1kldZaihBjPf03', '_rJ5SR9AwAH28uqiDasov', 'doc-oHogdcuTq28T', NULL, 500.00, 'INR', 'pending', 'TXN_oVTDAux1kldZaihBjPf03_1759741512858', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-06 09:05:13', '2025-10-06 09:05:13'),
('fnNGjCIyBfkcEo25ce113', 'oVTDAux1kldZaihBjPf03', '_rJ5SR9AwAH28uqiDasov', 'doc-oHogdcuTq28T', NULL, 500.00, 'INR', 'completed', 'order_RQ8DZiIvMa2dBX', 'pay_RQ8EB9usJ3TLkb', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_RQ8DZiIvMa2dBX\\\",\\\"razorpay_payment_id\\\":\\\"pay_RQ8EB9usJ3TLkb\\\",\\\"razorpay_signature\\\":\\\"87b926e1566cd97fdee6451dca5787e866aca20f4407c63db2d1c2c649e31601\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_RQ8EB9usJ3TLkb\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":50000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_RQ8DZiIvMa2dBX\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_RQ8EBLZmRCZuQ1\\\",\\\"card\\\":{\\\"id\\\":\\\"card_RQ8EBLZmRCZuQ1\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"orange@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"oVTDAux1kldZaihBjPf03\\\",\\\"doctorName\\\":\\\"Dr. Dhanya SP\\\",\\\"hospitalName\\\":\\\"Government Medical College, Kottayam\\\",\\\"patientEmail\\\":\\\"orange@gmail.com\\\",\\\"patientPhone\\\":\\\"1233211321\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Dhanya SP\\\"},\\\"fee\\\":1500,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"211954\\\"},\\\"created_at\\\":1759741558}}\"', '2025-10-06 09:06:21', NULL, NULL, NULL, NULL, NULL, 25.00, 475.00, 7.50, NULL, 90.00, '2025-10-06 09:06:21', '2025-10-06 09:06:21'),
('x7Wym8-DCGbtLDnY8Xx7Q', 'LjkzSVms--7MuoKG7KCJG', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-CoK__KzNkTPm', NULL, 600.00, 'INR', 'pending', 'TXN_LjkzSVms--7MuoKG7KCJG_1759819295050', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-07 06:41:35', '2025-10-07 06:41:35'),
('i5ln7cyfb7KJx0rc0t-3I', 'LjkzSVms--7MuoKG7KCJG', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-CoK__KzNkTPm', NULL, 600.00, 'INR', 'completed', 'order_RQUJyem8FJePrz', 'pay_RQUKLc3BrmPOM7', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_RQUJyem8FJePrz\\\",\\\"razorpay_payment_id\\\":\\\"pay_RQUKLc3BrmPOM7\\\",\\\"razorpay_signature\\\":\\\"49823817cff84ef5d2fde65f089901527b543f2995ee05efe7f91c9b2111c558\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_RQUKLc3BrmPOM7\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":60000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_RQUJyem8FJePrz\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_RQUKLnwfQ1NdXx\\\",\\\"card\\\":{\\\"id\\\":\\\"card_RQUKLnwfQ1NdXx\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"LjkzSVms--7MuoKG7KCJG\\\",\\\"doctorName\\\":\\\"Dr. Kala Kesavan\\\",\\\"hospitalName\\\":\\\"Government Medical College, Kottayam\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Kala Kesavan\\\"},\\\"fee\\\":1800,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"419888\\\"},\\\"created_at\\\":1759819384}}\"', '2025-10-07 06:43:21', NULL, NULL, NULL, NULL, NULL, 30.00, 570.00, 9.00, NULL, 108.00, '2025-10-07 06:43:21', '2025-10-07 06:43:21'),
('M0bp7S1CfRi9dGv-vcHeN', 'eeHVoYclSu6mWVVKOyAJj', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-oHogdcuTq28T', NULL, 500.00, 'INR', 'pending', 'TXN_eeHVoYclSu6mWVVKOyAJj_1759901271585', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-08 05:27:52', '2025-10-08 05:27:52'),
('HHWvRfI5LR6gk0ypt3W-N', 'eeHVoYclSu6mWVVKOyAJj', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-oHogdcuTq28T', NULL, 500.00, 'INR', 'completed', 'order_RQraPYkBncY7t8', 'pay_RQrajvMHYqqguC', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_RQraPYkBncY7t8\\\",\\\"razorpay_payment_id\\\":\\\"pay_RQrajvMHYqqguC\\\",\\\"razorpay_signature\\\":\\\"7cec9295129e904674cbaeca575f2bffdb83a372e030a7b547d1c4a2612f8608\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_RQrajvMHYqqguC\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":50000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_RQraPYkBncY7t8\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_RQrak60Fwl3FW5\\\",\\\"card\\\":{\\\"id\\\":\\\"card_RQrak60Fwl3FW5\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alan@gmail.com\\\",\\\"contact\\\":\\\"+919879898772\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"eeHVoYclSu6mWVVKOyAJj\\\",\\\"doctorName\\\":\\\"Dr. Dhanya SP\\\",\\\"hospitalName\\\":\\\"Government Medical College, Kottayam\\\",\\\"patientEmail\\\":\\\"alan@gmail.com\\\",\\\"patientPhone\\\":\\\"9879898772\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Dhanya SP\\\"},\\\"fee\\\":1500,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"277540\\\"},\\\"created_at\\\":1759901312}}\"', '2025-10-08 05:28:51', NULL, NULL, NULL, NULL, NULL, 25.00, 475.00, 7.50, NULL, 90.00, '2025-10-08 05:28:51', '2025-10-08 05:28:51'),
('xlrko-zJuIktCApczH5N0', 'g_e6hBdiXXbbMl7G3U94D', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-oHogdcuTq28T', NULL, 500.00, 'INR', 'pending', 'TXN_g_e6hBdiXXbbMl7G3U94D_1759903569791', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-08 06:06:10', '2025-10-08 06:06:10'),
('uuTpz1iDgBnURtfuj-GzY', 'g_e6hBdiXXbbMl7G3U94D', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-oHogdcuTq28T', NULL, 500.00, 'INR', 'completed', 'order_RQsEbeDHsGWYqq', 'pay_RQsF057FCgD8Z6', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_RQsEbeDHsGWYqq\\\",\\\"razorpay_payment_id\\\":\\\"pay_RQsF057FCgD8Z6\\\",\\\"razorpay_signature\\\":\\\"0fdc817e398759ddd040469c388638adc926794220f3a3960ab02360aeabfc73\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_RQsF057FCgD8Z6\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":50000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_RQsEbeDHsGWYqq\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_RQsF0LKaF61pfk\\\",\\\"card\\\":{\\\"id\\\":\\\"card_RQsF0LKaF61pfk\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alvin@gmail.com\\\",\\\"contact\\\":\\\"+15272175566\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"g_e6hBdiXXbbMl7G3U94D\\\",\\\"doctorName\\\":\\\"Dr. Dhanya SP\\\",\\\"hospitalName\\\":\\\"Government Medical College, Kottayam\\\",\\\"patientEmail\\\":\\\"alvin@gmail.com\\\",\\\"patientPhone\\\":\\\"15272175566\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Dhanya SP\\\"},\\\"fee\\\":1500,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"725273\\\"},\\\"created_at\\\":1759903599}}\"', '2025-10-08 06:06:55', NULL, NULL, NULL, NULL, NULL, 25.00, 475.00, 7.50, NULL, 90.00, '2025-10-08 06:06:55', '2025-10-08 06:06:55'),
('5_HbeG34hn50apnLjqQVN', '9Y6-bwu90-XQ15Ki5692Q', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-027', NULL, 700.00, 'INR', 'pending', 'TXN_9Y6-bwu90-XQ15Ki5692Q_1759912877149', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-08 08:41:17', '2025-10-08 08:41:17'),
('9MZYWkyMPlO58lXP_I7-d', '9Y6-bwu90-XQ15Ki5692Q', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-027', NULL, 700.00, 'INR', 'completed', 'order_RQusSBfziTZ9bd', 'pay_RQut1Jy5t9Htyp', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_RQusSBfziTZ9bd\\\",\\\"razorpay_payment_id\\\":\\\"pay_RQut1Jy5t9Htyp\\\",\\\"razorpay_signature\\\":\\\"99f033a329e23090e0d4cbfa08434409e50366b1488280c50adae90fce293d30\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_RQut1Jy5t9Htyp\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":70000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_RQusSBfziTZ9bd\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_RQut2BHl5qNAIE\\\",\\\"card\\\":{\\\"id\\\":\\\"card_RQut2BHl5qNAIE\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alvin@gmail.com\\\",\\\"contact\\\":\\\"+15272175566\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"9Y6-bwu90-XQ15Ki5692Q\\\",\\\"doctorName\\\":\\\"Dr. Sunil Verma\\\",\\\"hospitalName\\\":\\\"Fortis Healthcare\\\",\\\"patientEmail\\\":\\\"alvin@gmail.com\\\",\\\"patientPhone\\\":\\\"15272175566\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Sunil Verma\\\"},\\\"fee\\\":2100,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"151520\\\"},\\\"created_at\\\":1759912917}}\"', '2025-10-08 08:42:12', NULL, NULL, NULL, NULL, NULL, 35.00, 665.00, 10.50, NULL, 126.00, '2025-10-08 08:42:12', '2025-10-08 08:42:12'),
('hwHlT7suzCa8q3jqGOaDa', 'udtufmAlGEtWL37H3eFxQ', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-001', NULL, 800.00, 'INR', 'pending', 'TXN_udtufmAlGEtWL37H3eFxQ_1759922408304', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-08 11:20:08', '2025-10-08 11:20:08'),
('wzfU-FocNktXi3C58igqI', 'udtufmAlGEtWL37H3eFxQ', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-001', NULL, 800.00, 'INR', 'completed', 'order_RQxaJI9KDEA0WN', 'pay_RQxabuDx7Czxq7', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_RQxaJI9KDEA0WN\\\",\\\"razorpay_payment_id\\\":\\\"pay_RQxabuDx7Czxq7\\\",\\\"razorpay_signature\\\":\\\"8eadea7e162c46f888793234248fb93fa5543653e0ebfe62089796142c408b13\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_RQxabuDx7Czxq7\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":80000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_RQxaJI9KDEA0WN\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_RQxac88Usqpu1S\\\",\\\"card\\\":{\\\"id\\\":\\\"card_RQxac88Usqpu1S\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alvin@gmail.com\\\",\\\"contact\\\":\\\"+15272175566\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"udtufmAlGEtWL37H3eFxQ\\\",\\\"doctorName\\\":\\\"Dr. Rajesh Kumar\\\",\\\"hospitalName\\\":\\\"CityCare Medical Center\\\",\\\"patientEmail\\\":\\\"alvin@gmail.com\\\",\\\"patientPhone\\\":\\\"15272175566\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Rajesh Kumar\\\"},\\\"fee\\\":2400,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"764184\\\"},\\\"created_at\\\":1759922435}}\"', '2025-10-08 11:20:52', NULL, NULL, NULL, NULL, NULL, 40.00, 760.00, 12.00, NULL, 144.00, '2025-10-08 11:20:52', '2025-10-08 11:20:52'),
('zxIYqPErHY1st_QHWz4qy', 'g4rBGlWnpnD7MBGxRkIKq', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-005', NULL, 950.00, 'INR', 'pending', 'TXN_g4rBGlWnpnD7MBGxRkIKq_1760069689684', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-10 04:14:50', '2025-10-10 04:14:50'),
('a7BHDUr-2aygeCg2g8hT5', 'g4rBGlWnpnD7MBGxRkIKq', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-005', NULL, 950.00, 'INR', 'completed', 'order_RRdPYDe2BnPUks', 'pay_RRdPwfIeLksVQq', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_RRdPYDe2BnPUks\\\",\\\"razorpay_payment_id\\\":\\\"pay_RRdPwfIeLksVQq\\\",\\\"razorpay_signature\\\":\\\"e8f1a69b4be6f5e840e77c62aa5ef55f7494df051154b2db6fc0eff2a0195c76\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_RRdPwfIeLksVQq\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":95000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_RRdPYDe2BnPUks\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_RRdPwrziVNbfI8\\\",\\\"card\\\":{\\\"id\\\":\\\"card_RRdPwrziVNbfI8\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alvin@gmail.com\\\",\\\"contact\\\":\\\"+15272175566\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"g4rBGlWnpnD7MBGxRkIKq\\\",\\\"doctorName\\\":\\\"Dr. Vikram Singh\\\",\\\"hospitalName\\\":\\\"MetroHealth Hospital\\\",\\\"patientEmail\\\":\\\"alvin@gmail.com\\\",\\\"patientPhone\\\":\\\"15272175566\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Vikram Singh\\\"},\\\"fee\\\":2850,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"553270\\\"},\\\"created_at\\\":1760069737}}\"', '2025-10-10 04:15:54', NULL, NULL, NULL, NULL, NULL, 47.50, 902.50, 14.25, NULL, 171.00, '2025-10-10 04:15:54', '2025-10-10 04:15:54'),
('64DzJrXbMmD-6cu8CUdTt', 'X5lzFpL5t4Rq1-rDZVY_T', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-lYmc71t79BFF', NULL, 700.00, 'INR', 'pending', 'TXN_X5lzFpL5t4Rq1-rDZVY_T_1760071850853', NULL, 'payu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 0.00, '2025-10-10 04:50:51', '2025-10-10 04:50:51'),
('5aICuIEIsV5P05Uppn4r9', 'X5lzFpL5t4Rq1-rDZVY_T', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-lYmc71t79BFF', NULL, 700.00, 'INR', 'completed', 'order_RRe1IPAU4P0CJP', 'pay_RRe1WjSloHVebt', 'razorpay', '\"{\\\"razorpay_order_id\\\":\\\"order_RRe1IPAU4P0CJP\\\",\\\"razorpay_payment_id\\\":\\\"pay_RRe1WjSloHVebt\\\",\\\"razorpay_signature\\\":\\\"b8438c32b9fa5a996d3ba09d08c76eae2f0afb1fdfbd8df0929f82a31aa47a17\\\",\\\"paymentDetails\\\":{\\\"id\\\":\\\"pay_RRe1WjSloHVebt\\\",\\\"entity\\\":\\\"payment\\\",\\\"amount\\\":70000,\\\"currency\\\":\\\"INR\\\",\\\"status\\\":\\\"captured\\\",\\\"order_id\\\":\\\"order_RRe1IPAU4P0CJP\\\",\\\"invoice_id\\\":null,\\\"international\\\":false,\\\"method\\\":\\\"card\\\",\\\"amount_refunded\\\":0,\\\"refund_status\\\":null,\\\"captured\\\":true,\\\"description\\\":\\\"Medical Consultation Payment\\\",\\\"card_id\\\":\\\"card_RRe1XF3fsWJvwA\\\",\\\"card\\\":{\\\"id\\\":\\\"card_RRe1XF3fsWJvwA\\\",\\\"entity\\\":\\\"card\\\",\\\"name\\\":\\\"\\\",\\\"last4\\\":\\\"8228\\\",\\\"network\\\":\\\"MasterCard\\\",\\\"type\\\":\\\"credit\\\",\\\"issuer\\\":\\\"HDFC\\\",\\\"international\\\":false,\\\"emi\\\":true,\\\"sub_type\\\":\\\"business\\\",\\\"token_iin\\\":null},\\\"bank\\\":null,\\\"wallet\\\":null,\\\"vpa\\\":null,\\\"email\\\":\\\"alvin@gmail.com\\\",\\\"contact\\\":\\\"+15272175566\\\",\\\"notes\\\":{\\\"appointmentId\\\":\\\"X5lzFpL5t4Rq1-rDZVY_T\\\",\\\"doctorName\\\":\\\"Dr. Shaila S\\\",\\\"hospitalName\\\":\\\"Government Medical College, Kottayam\\\",\\\"patientEmail\\\":\\\"alvin@gmail.com\\\",\\\"patientPhone\\\":\\\"15272175566\\\",\\\"description\\\":\\\"Medical Consultation - Dr. Shaila S\\\"},\\\"fee\\\":2100,\\\"tax\\\":0,\\\"error_code\\\":null,\\\"error_description\\\":null,\\\"error_source\\\":null,\\\"error_step\\\":null,\\\"error_reason\\\":null,\\\"acquirer_data\\\":{\\\"auth_code\\\":\\\"291354\\\"},\\\"created_at\\\":1760071872}}\"', '2025-10-10 04:51:29', NULL, NULL, NULL, NULL, NULL, 35.00, 665.00, 10.50, NULL, 126.00, '2025-10-10 04:51:29', '2025-10-10 04:51:29');

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `type` varchar(20) NOT NULL,
  `provider` varchar(50) DEFAULT NULL,
  `last_four_digits` varchar(4) DEFAULT NULL,
  `expiry_date` varchar(5) DEFAULT NULL,
  `holder_name` varchar(255) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_receipts`
--

CREATE TABLE `payment_receipts` (
  `id` varchar(36) NOT NULL,
  `payment_id` varchar(36) DEFAULT NULL,
  `receipt_number` varchar(100) NOT NULL,
  `receipt_data` json NOT NULL,
  `receipt_url` varchar(500) DEFAULT NULL,
  `email_sent` tinyint(1) DEFAULT '0',
  `download_count` int DEFAULT '0',
  `last_downloaded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `queue_positions`
--

CREATE TABLE `queue_positions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `appointment_date` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_token` int DEFAULT '0',
  `total_wait_time_minutes` int DEFAULT '0',
  `completed_appointments_count` int DEFAULT '0',
  `average_wait_time_minutes` int DEFAULT '15',
  `last_updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `doctor_id` varchar(36) DEFAULT NULL,
  `hospital_id` varchar(36) DEFAULT NULL,
  `appointment_id` varchar(36) DEFAULT NULL,
  `rating` int NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `comment` text,
  `is_anonymous` tinyint(1) DEFAULT '0',
  `is_verified` tinyint(1) DEFAULT '0',
  `helpful_votes` int DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `user_id`, `doctor_id`, `hospital_id`, `appointment_id`, `rating`, `title`, `comment`, `is_anonymous`, `is_verified`, `helpful_votes`, `created_at`, `updated_at`) VALUES
('rev-001', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-001', 'hosp-001', NULL, 5, 'Excellent Cardiologist', 'Dr. Rajesh Kumar is very experienced and explains everything clearly. Highly recommend!', 0, 1, 12, '2025-08-16 06:31:08', '2025-08-16 06:31:08'),
('rev-002', 'Tw714rNTEZ-cIpZzwruOZ', 'doc-003', 'hosp-001', NULL, 5, 'Great Neurologist', 'Dr. Amit Patel diagnosed my condition accurately and the treatment is working well.', 0, 1, 8, '2025-08-16 06:31:08', '2025-08-16 06:31:08'),
('rev-003', 'WEl4bJ22AQQAWkB3NCmkB', 'doc-009', 'hosp-003', NULL, 5, 'Best Pediatrician', 'Dr. Ravi Krishnan is amazing with children. Very gentle and patient.', 0, 1, 15, '2025-08-16 06:31:08', '2025-08-16 06:31:08');

-- --------------------------------------------------------

--
-- Table structure for table `specialties`
--

CREATE TABLE `specialties` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `icon` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `specialties`
--

INSERT INTO `specialties` (`id`, `name`, `description`, `icon`, `created_at`) VALUES
('cardiology', 'Cardiology', 'Heart and cardiovascular system specialists', '🫀', '2025-08-13 21:22:49'),
('neurology', 'Neurology', 'Brain and nervous system specialists', '🧠', '2025-08-13 21:22:49'),
('orthopedics', 'Orthopedics', 'Bone, joint, and muscle specialists', '🦴', '2025-08-13 21:22:49'),
('general_medicine', 'General Medicine', 'Primary care and general health specialists', '🩺', '2025-08-13 21:22:49'),
('pediatrics', 'Pediatrics', 'Child and adolescent healthcare specialists', '👶', '2025-08-13 21:22:49'),
('dermatology', 'Dermatology', 'Skin, hair, and nail specialists', '👨‍⚕️', '2025-08-13 21:22:49'),
('ent', 'ENT', 'Ear, nose, and throat specialists', '👂', '2025-08-13 21:22:49'),
('emergency_medicine', 'Emergency Medicine', 'Emergency and critical care specialists', '🚑', '2025-08-13 21:22:49'),
('surgery', 'Surgery', 'Surgical procedure specialists', '🔪', '2025-08-13 21:22:49'),
('urology', 'Urology', 'Urinary system and male reproductive system specialists', '🧑‍⚕️', '2025-08-13 21:22:49'),
('family_medicine', 'Family Medicine', 'Comprehensive family healthcare specialists', '👨‍👩‍👧‍👦', '2025-08-13 21:22:49'),
('womens_health', 'Women\'s Health', 'Specialized care for women', '👩', '2025-08-13 21:22:49'),
('preventive_care', 'Preventive Care', 'Preventive medicine and health maintenance', '💊', '2025-08-13 21:22:49'),
('spec-pharmacology', 'Pharmacology', 'Study of drugs and their effects', 'Pill', '2025-10-02 01:44:02'),
('spec-paediatrics', 'Paediatrics', 'Medical care for infants, children, and adolescents', 'Baby', '2025-10-02 01:44:02'),
('spec-obstetrics-gynecology', 'Obstetrics & Gynaecology', 'Women\'s health, pregnancy, and childbirth', 'Heart', '2025-10-02 01:44:02'),
('spec-community-medicine', 'Community Medicine', 'Public health and preventive medicine', 'Users', '2025-10-02 01:44:02'),
('spec-physiology', 'Physiology', 'Study of body functions and systems', 'Activity', '2025-10-02 01:44:02'),
('1621f7b1-a661-11f0-abc5-52541aa39e4a', 'Anesthesiology & Critical Care', 'Specialized medical care focusing on anesthesia administration during surgical procedures and intensive care for critically ill patients.', '💉', '2025-10-11 05:13:56');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `key` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `description` text,
  `type` varchar(20) DEFAULT 'string',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `token_call_history`
--

CREATE TABLE `token_call_history` (
  `id` varchar(36) NOT NULL,
  `session_id` varchar(36) NOT NULL,
  `appointment_id` varchar(36) DEFAULT NULL,
  `appointment_date` varchar(10) NOT NULL,
  `token_number` int NOT NULL,
  `call_type` varchar(20) NOT NULL DEFAULT 'normal' COMMENT 'normal, recall, final_call',
  `is_recall` tinyint(1) DEFAULT '0',
  `recall_reason` varchar(50) DEFAULT NULL COMMENT 'no_show, interval_check, manual_recall',
  `called_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `called_by` varchar(36) DEFAULT NULL COMMENT 'Doctor/Admin ID who triggered the call',
  `patient_attended` tinyint(1) DEFAULT '0',
  `attended_at` timestamp NULL DEFAULT NULL,
  `skipped_reason` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Tracks all token calls including recalls for audit and analytics';

-- --------------------------------------------------------

--
-- Table structure for table `token_locks`
--

CREATE TABLE `token_locks` (
  `id` varchar(36) NOT NULL,
  `session_id` varchar(36) NOT NULL,
  `appointment_date` varchar(10) NOT NULL,
  `token_number` int NOT NULL,
  `locked_by_user_id` varchar(36) NOT NULL,
  `locked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `appointment_id` varchar(36) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `date_of_birth` varchar(10) NOT NULL,
  `gender` varchar(10) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `zip_code` varchar(10) NOT NULL,
  `blood_group` varchar(5) DEFAULT NULL,
  `allergies` text,
  `emergency_contact` varchar(100) DEFAULT NULL,
  `emergency_phone` varchar(20) DEFAULT NULL,
  `terms_accepted` tinyint(1) NOT NULL,
  `marketing_emails` tinyint(1) DEFAULT '0',
  `profile_image` varchar(500) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `medical_history` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `date_of_birth`, `gender`, `address`, `city`, `state`, `zip_code`, `blood_group`, `allergies`, `emergency_contact`, `emergency_phone`, `terms_accepted`, `marketing_emails`, `profile_image`, `is_verified`, `created_at`, `updated_at`, `medical_history`) VALUES
('_rJ5SR9AwAH28uqiDasov', 'orange@gmail.com', '$2b$12$2dtcbPpjPjsGL44WU4gXwOYExznI2e4TTOMUzQWh5Cx7mlThPe4V2', 'Iola', 'Avery', '1233211321', '1995-01-21', 'Male', 'Ea quia ipsum ipsum', 'Sit eius architecto', 'Meghalaya', '91926', 'A-', 'Nope', 'Totam officiis quia ', '+1 (674) 265-5134', 1, 1, NULL, 0, '2025-10-06 09:01:15', '2025-10-06 10:20:09', NULL),
('bEE24k5iA7bBDIDHZ0ocQ', 'alex@gmail.com', '$2b$12$ieXH7wsieC6MWicvetsCSejVwtNpHX2UXx3zmDolXByXQZfqc5o4O', 'alex', 'Francis', '5858989808', '2003-10-03', 'Male', 'Test', 'Mumbai', 'Kerala', '633003', 'O+', 'No', 'Alan', '9598909098', 1, 0, NULL, 0, '2025-10-03 09:03:21', '2025-10-03 09:03:21', NULL),
('HTIas7qtKmctUBMyYaazU', '18.felicia@gmail.com', '$2b$12$kj05OXwvSPkOyjQ/X4tOoOTAaSGPmiQ7OdMe55CCWN4f07F6QFf.C', 'Felicia', 'Thomas', '9886019202', '1987-10-03', 'Female', 'A1-801, Sandeep Vihar AWHO', 'Bangalore', 'Karnataka', '560067', NULL, NULL, 'Felicia Thomas', NULL, 1, 0, NULL, 0, '2025-10-03 05:48:08', '2025-10-03 05:48:08', NULL),
('KrfbyvUXgiHqZb7oG2c3y', 'test@example.com', '$2b$12$ateVTj0QAWO7GA8T6i/Wke8e0qunQ1ntlhsU8EsJ92DyPJyaloMl.', 'Test', 'User', '1234567890', '1990-01-01', 'other', '123 Test St', 'Mumbai', 'Maharashtra', '400001', NULL, NULL, NULL, NULL, 1, 0, NULL, 0, '2025-08-14 02:17:57', '2025-08-13 20:48:04', ''),
('test-user--001', 'patient001@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Rahul', 'Sharma', '9876543210', '1990-05-15', 'male', 'MG Road', 'Kottayam', 'Kerala', '686001', 'A+', 'None', 'Mrs. Sharma', '9876543211', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Healthy'),
('test-user--002', 'patient002@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Priya', 'Nair', '9876543220', '1985-08-22', 'female', 'KK Road', 'Kottayam', 'Kerala', '686002', 'B+', 'Pollen', 'Mr. Nair', '9876543221', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Asthma'),
('test-user--003', 'patient003@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Amit', 'Kumar', '9876543230', '1992-03-10', 'male', 'MC Road', 'Kottayam', 'Kerala', '686003', 'O+', 'None', 'Mrs. Kumar', '9876543231', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Diabetes'),
('test-user--004', 'patient004@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Sneha', 'Menon', '9876543240', '1988-11-05', 'female', 'Gandhi Nagar', 'Kottayam', 'Kerala', '686004', 'AB+', 'Penicillin', 'Mr. Menon', '9876543241', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Hypertension'),
('test-user--005', 'patient005@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Vijay', 'Krishnan', '9876543250', '1995-07-18', 'male', 'Collectorate Road', 'Kottayam', 'Kerala', '686005', 'A-', 'None', 'Mrs. Krishnan', '9876543251', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Healthy'),
('test-user--006', 'patient006@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Anjali', 'Pillai', '9876543260', '1991-12-30', 'female', 'TB Road', 'Kottayam', 'Kerala', '686006', 'B-', 'None', 'Mr. Pillai', '9876543261', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Thyroid'),
('test-user--007', 'patient007@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Arjun', 'Das', '9876543270', '1987-04-25', 'male', 'SH Road', 'Kottayam', 'Kerala', '686007', 'O-', 'Sulfa drugs', 'Mrs. Das', '9876543271', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Healthy'),
('test-user--008', 'patient008@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Divya', 'Iyer', '9876543280', '1993-09-14', 'female', 'Baker Junction', 'Kottayam', 'Kerala', '686008', 'AB-', 'None', 'Mr. Iyer', '9876543281', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Migraine'),
('test-user--009', 'patient009@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Kiran', 'Reddy', '9876543290', '1989-06-08', 'male', 'CMS College Road', 'Kottayam', 'Kerala', '686009', 'A+', 'None', 'Mrs. Reddy', '9876543291', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-10 07:01:32', 'Healthy'),
('test-user--010', 'patient010@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Lakshmi', 'Varma', '9876543300', '1994-02-20', 'female', 'Nagampadam', 'Kottayam', 'Kerala', '686010', 'B+', 'Aspirin', 'Mr. Varma', '9876543301', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Arthritis'),
('test-user--011', 'patient011@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Manoj', 'Thomas', '9876543310', '1986-10-12', 'male', 'Ettumanoor Road', 'Kottayam', 'Kerala', '686011', 'O+', 'None', 'Mrs. Thomas', '9876543311', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Cholesterol'),
('test-user--012', 'patient012@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Meera', 'Mohan', '9876543320', '1990-01-28', 'female', 'Puthuppally', 'Kottayam', 'Kerala', '686012', 'AB+', 'None', 'Mr. Mohan', '9876543321', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Healthy'),
('test-user--013', 'patient013@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Nikhil', 'Raj', '9876543330', '1992-05-16', 'male', 'Thiruvanchoor', 'Kottayam', 'Kerala', '686013', 'A-', 'Latex', 'Mrs. Raj', '9876543331', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Healthy'),
('test-user--014', 'patient014@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Pooja', 'Shetty', '9876543340', '1988-08-03', 'female', 'Kumarakom', 'Kottayam', 'Kerala', '686014', 'B-', 'None', 'Mr. Shetty', '9876543341', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'PCOD'),
('test-user--015', 'patient015@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Rajesh', 'Nambiar', '9876543350', '1991-11-19', 'male', 'Vaikom Road', 'Kottayam', 'Kerala', '686015', 'O-', 'None', 'Mrs. Nambiar', '9876543351', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Back Pain'),
('test-user--016', 'patient016@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Riya', 'George', '9876543360', '1993-04-07', 'female', 'Pala Road', 'Kottayam', 'Kerala', '686016', 'AB-', 'Iodine', 'Mr. George', '9876543361', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Healthy'),
('test-user--017', 'patient017@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Sandeep', 'Panicker', '9876543370', '1987-07-21', 'male', 'Changanassery Road', 'Kottayam', 'Kerala', '686017', 'A+', 'None', 'Mrs. Panicker', '9876543371', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Gastritis'),
('test-user--018', 'patient018@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Sowmya', 'Suresh', '9876543380', '1989-12-09', 'female', 'Rubber Board', 'Kottayam', 'Kerala', '686018', 'B+', 'None', 'Mr. Suresh', '9876543381', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Anemia'),
('test-user--019', 'patient019@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Vivek', 'Ramesh', '9876543390', '1990-03-26', 'male', 'Medical College', 'Kottayam', 'Kerala', '686019', 'O+', 'Nuts', 'Mrs. Ramesh', '9876543391', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Healthy'),
('test-user--020', 'patient020@tests.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Zara', 'Khan', '9876543400', '1992-09-11', 'female', 'Arpookara', 'Kottayam', 'Kerala', '686020', 'AB+', 'None', 'Mr. Khan', '9876543401', 1, 0, NULL, 1, '2025-10-08 08:57:23', '2025-10-08 08:57:23', 'Healthy'),
('test-user-001', 'patient001@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Rahul', 'Sharma', '9876543210', '1990-05-15', 'male', 'MG Road', 'Kottayam', 'Kerala', '686001', 'A+', 'None', 'Mrs. Sharma', '9876543211', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Healthy'),
('test-user-002', 'patient002@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Priya', 'Nair', '9876543220', '1985-08-22', 'female', 'KK Road', 'Kottayam', 'Kerala', '686002', 'B+', 'Pollen', 'Mr. Nair', '9876543221', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Asthma'),
('test-user-003', 'patient003@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Amit', 'Kumar', '9876543230', '1992-03-10', 'male', 'MC Road', 'Kottayam', 'Kerala', '686003', 'O+', 'None', 'Mrs. Kumar', '9876543231', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Diabetes'),
('test-user-004', 'patient004@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Sneha', 'Menon', '9876543240', '1988-11-05', 'female', 'Gandhi Nagar', 'Kottayam', 'Kerala', '686004', 'AB+', 'Penicillin', 'Mr. Menon', '9876543241', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Hypertension'),
('test-user-005', 'patient005@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Vijay', 'Krishnan', '9876543250', '1995-07-18', 'male', 'Collectorate Road', 'Kottayam', 'Kerala', '686005', 'A-', 'None', 'Mrs. Krishnan', '9876543251', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Healthy'),
('test-user-006', 'patient006@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Anjali', 'Pillai', '9876543260', '1991-12-30', 'female', 'TB Road', 'Kottayam', 'Kerala', '686006', 'B-', 'None', 'Mr. Pillai', '9876543261', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Thyroid'),
('test-user-007', 'patient007@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Arjun', 'Das', '9876543270', '1987-04-25', 'male', 'SH Road', 'Kottayam', 'Kerala', '686007', 'O-', 'Sulfa drugs', 'Mrs. Das', '9876543271', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Healthy'),
('test-user-008', 'patient008@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Divya', 'Iyer', '9876543280', '1993-09-14', 'female', 'Baker Junction', 'Kottayam', 'Kerala', '686008', 'AB-', 'None', 'Mr. Iyer', '9876543281', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Migraine'),
('test-user-009', 'patient009@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Kiran', 'Reddy', '9876543290', '1989-06-08', 'male', 'CMS College Road', 'Kottayam', 'Kerala', '686009', 'A+', 'None', 'Mrs. Reddy', '9876543291', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Healthy'),
('test-user-010', 'patient010@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Lakshmi', 'Varma', '9876543300', '1994-02-20', 'female', 'Nagampadam', 'Kottayam', 'Kerala', '686010', 'B+', 'Aspirin', 'Mr. Varma', '9876543301', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Arthritis'),
('test-user-011', 'patient011@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Manoj', 'Thomas', '9876543310', '1986-10-12', 'male', 'Ettumanoor Road', 'Kottayam', 'Kerala', '686011', 'O+', 'None', 'Mrs. Thomas', '9876543311', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Cholesterol'),
('test-user-012', 'patient012@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Meera', 'Mohan', '9876543320', '1990-01-28', 'female', 'Puthuppally', 'Kottayam', 'Kerala', '686012', 'AB+', 'None', 'Mr. Mohan', '9876543321', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Healthy'),
('test-user-013', 'patient013@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Nikhil', 'Raj', '9876543330', '1992-05-16', 'male', 'Thiruvanchoor', 'Kottayam', 'Kerala', '686013', 'A-', 'Latex', 'Mrs. Raj', '9876543331', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Healthy'),
('test-user-014', 'patient014@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Pooja', 'Shetty', '9876543340', '1988-08-03', 'female', 'Kumarakom', 'Kottayam', 'Kerala', '686014', 'B-', 'None', 'Mr. Shetty', '9876543341', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'PCOD'),
('test-user-015', 'patient015@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Rajesh', 'Nambiar', '9876543350', '1991-11-19', 'male', 'Vaikom Road', 'Kottayam', 'Kerala', '686015', 'O-', 'None', 'Mrs. Nambiar', '9876543351', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Back Pain'),
('test-user-016', 'patient016@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Riya', 'George', '9876543360', '1993-04-07', 'female', 'Pala Road', 'Kottayam', 'Kerala', '686016', 'AB-', 'Iodine', 'Mr. George', '9876543361', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Healthy'),
('test-user-017', 'patient017@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Sandeep', 'Panicker', '9876543370', '1987-07-21', 'male', 'Changanassery Road', 'Kottayam', 'Kerala', '686017', 'A+', 'None', 'Mrs. Panicker', '9876543371', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Gastritis'),
('test-user-018', 'patient018@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Sowmya', 'Suresh', '9876543380', '1989-12-09', 'female', 'Rubber Board', 'Kottayam', 'Kerala', '686018', 'B+', 'None', 'Mr. Suresh', '9876543381', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Anemia'),
('test-user-019', 'patient019@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Vivek', 'Ramesh', '9876543390', '1990-03-26', 'male', 'Medical College', 'Kottayam', 'Kerala', '686019', 'O+', 'Nuts', 'Mrs. Ramesh', '9876543391', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Healthy'),
('test-user-020', 'patient020@test.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Zara', 'Khan', '9876543400', '1992-09-11', 'female', 'Arpookara', 'Kottayam', 'Kerala', '686020', 'AB+', 'None', 'Mr. Khan', '9876543401', 1, 0, NULL, 1, '2025-10-08 05:41:40', '2025-10-08 05:41:40', 'Healthy'),
('test-users--001', 'patient001', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Rahul', 'Sharma', '9876543210', '1990-05-15', 'male', 'MG Road', 'Kottayam', 'Kerala', '686001', 'A+', 'None', 'Mrs. Sharma', '9876543211', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Healthy'),
('test-users--002', 'patient002@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Priya', 'Nair', '9876543220', '1985-08-22', 'female', 'KK Road', 'Kottayam', 'Kerala', '686002', 'B+', 'Pollen', 'Mr. Nair', '9876543221', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Asthma'),
('test-users--003', 'patient003@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Amit', 'Kumar', '9876543230', '1992-03-10', 'male', 'MC Road', 'Kottayam', 'Kerala', '686003', 'O+', 'None', 'Mrs. Kumar', '9876543231', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Diabetes'),
('test-users--004', 'patient004@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Sneha', 'Menon', '9876543240', '1988-11-05', 'female', 'Gandhi Nagar', 'Kottayam', 'Kerala', '686004', 'AB+', 'Penicillin', 'Mr. Menon', '9876543241', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Hypertension'),
('test-users--005', 'patient005@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Vijay', 'Krishnan', '9876543250', '1995-07-18', 'male', 'Collectorate Road', 'Kottayam', 'Kerala', '686005', 'A-', 'None', 'Mrs. Krishnan', '9876543251', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Healthy'),
('test-users--006', 'patient006@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Anjali', 'Pillai', '9876543260', '1991-12-30', 'female', 'TB Road', 'Kottayam', 'Kerala', '686006', 'B-', 'None', 'Mr. Pillai', '9876543261', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Thyroid'),
('test-users--007', 'patient007@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Arjun', 'Das', '9876543270', '1987-04-25', 'male', 'SH Road', 'Kottayam', 'Kerala', '686007', 'O-', 'Sulfa drugs', 'Mrs. Das', '9876543271', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Healthy'),
('test-users--008', 'patient008@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Divya', 'Iyer', '9876543280', '1993-09-14', 'female', 'Baker Junction', 'Kottayam', 'Kerala', '686008', 'AB-', 'None', 'Mr. Iyer', '9876543281', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Migraine'),
('test-users--009', 'patient009@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Kiran', 'Reddy', '9876543290', '1989-06-08', 'male', 'CMS College Road', 'Kottayam', 'Kerala', '686009', 'A+', 'None', 'Mrs. Reddy', '9876543291', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Healthy'),
('test-users--010', 'patient010@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Lakshmi', 'Varma', '9876543300', '1994-02-20', 'female', 'Nagampadam', 'Kottayam', 'Kerala', '686010', 'B+', 'Aspirin', 'Mr. Varma', '9876543301', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Arthritis'),
('test-users--011', 'patient011@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Manoj', 'Thomas', '9876543310', '1986-10-12', 'male', 'Ettumanoor Road', 'Kottayam', 'Kerala', '686011', 'O+', 'None', 'Mrs. Thomas', '9876543311', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Cholesterol'),
('test-users--012', 'patient012@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Meera', 'Mohan', '9876543320', '1990-01-28', 'female', 'Puthuppally', 'Kottayam', 'Kerala', '686012', 'AB+', 'None', 'Mr. Mohan', '9876543321', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Healthy'),
('test-users--013', 'patient013@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Nikhil', 'Raj', '9876543330', '1992-05-16', 'male', 'Thiruvanchoor', 'Kottayam', 'Kerala', '686013', 'A-', 'Latex', 'Mrs. Raj', '9876543331', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Healthy'),
('test-users--014', 'patient014@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Pooja', 'Shetty', '9876543340', '1988-08-03', 'female', 'Kumarakom', 'Kottayam', 'Kerala', '686014', 'B-', 'None', 'Mr. Shetty', '9876543341', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'PCOD'),
('test-users--015', 'patient015@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Rajesh', 'Nambiar', '9876543350', '1991-11-19', 'male', 'Vaikom Road', 'Kottayam', 'Kerala', '686015', 'O-', 'None', 'Mrs. Nambiar', '9876543351', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Back Pain'),
('test-users--016', 'patient016@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Riya', 'George', '9876543360', '1993-04-07', 'female', 'Pala Road', 'Kottayam', 'Kerala', '686016', 'AB-', 'Iodine', 'Mr. George', '9876543361', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Healthy'),
('test-users--017', 'patient017@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Sandeep', 'Panicker', '9876543370', '1987-07-21', 'male', 'Changanassery Road', 'Kottayam', 'Kerala', '686017', 'A+', 'None', 'Mrs. Panicker', '9876543371', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Gastritis'),
('test-users--018', 'patient018@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Sowmya', 'Suresh', '9876543380', '1989-12-09', 'female', 'Rubber Board', 'Kottayam', 'Kerala', '686018', 'B+', 'None', 'Mr. Suresh', '9876543381', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Anemia'),
('test-users--019', 'patient019@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Vivek', 'Ramesh', '9876543390', '1990-03-26', 'male', 'Medical College', 'Kottayam', 'Kerala', '686019', 'O+', 'Nuts', 'Mrs. Ramesh', '9876543391', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Healthy'),
('test-users--020', 'patient020@tested.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Zara', 'Khan', '9876543400', '1992-09-11', 'female', 'Arpookara', 'Kottayam', 'Kerala', '686020', 'AB+', 'None', 'Mr. Khan', '9876543401', 1, 0, NULL, 1, '2025-10-08 11:31:02', '2025-10-08 11:31:02', 'Healthy'),
('tests2-user--001', 'patient001@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Rahul', 'Sharma', '9876543210', '1990-05-15', 'male', 'MG Road', 'Kottayam', 'Kerala', '686001', 'A+', 'None', 'Mrs. Sharma', '9876543211', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 07:00:18', 'Healthy'),
('tests2-user--002', 'patient002@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Priya', 'Nair', '9876543220', '1985-08-22', 'female', 'KK Road', 'Kottayam', 'Kerala', '686002', 'B+', 'Pollen', 'Mr. Nair', '9876543221', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Asthma'),
('tests2-user--003', 'patient003@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Amit', 'Kumar', '9876543230', '1992-03-10', 'male', 'MC Road', 'Kottayam', 'Kerala', '686003', 'O+', 'None', 'Mrs. Kumar', '9876543231', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Diabetes'),
('tests2-user--004', 'patient004@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Sneha', 'Menon', '9876543240', '1988-11-05', 'female', 'Gandhi Nagar', 'Kottayam', 'Kerala', '686004', 'AB+', 'Penicillin', 'Mr. Menon', '9876543241', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Hypertension'),
('tests2-user--005', 'patient005@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Vijay', 'Krishnan', '9876543250', '1995-07-18', 'male', 'Collectorate Road', 'Kottayam', 'Kerala', '686005', 'A-', 'None', 'Mrs. Krishnan', '9876543251', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Healthy'),
('tests2-user--006', 'patient006@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Anjali', 'Pillai', '9876543260', '1991-12-30', 'female', 'TB Road', 'Kottayam', 'Kerala', '686006', 'B-', 'None', 'Mr. Pillai', '9876543261', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Thyroid'),
('tests2-user--007', 'patient007@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Arjun', 'Das', '9876543270', '1987-04-25', 'male', 'SH Road', 'Kottayam', 'Kerala', '686007', 'O-', 'Sulfa drugs', 'Mrs. Das', '9876543271', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Healthy'),
('tests2-user--008', 'patient008@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Divya', 'Iyer', '9876543280', '1993-09-14', 'female', 'Baker Junction', 'Kottayam', 'Kerala', '686008', 'AB-', 'None', 'Mr. Iyer', '9876543281', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Migraine'),
('tests2-user--009', 'patient009@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Kiran', 'Reddy', '9876543290', '1989-06-08', 'male', 'CMS College Road', 'Kottayam', 'Kerala', '686009', 'A+', 'None', 'Mrs. Reddy', '9876543291', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Healthy'),
('tests2-user--010', 'patient010@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Lakshmi', 'Varma', '9876543300', '1994-02-20', 'female', 'Nagampadam', 'Kottayam', 'Kerala', '686010', 'B+', 'Aspirin', 'Mr. Varma', '9876543301', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Arthritis'),
('tests2-user--011', 'patient011@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Manoj', 'Thomas', '9876543310', '1986-10-12', 'male', 'Ettumanoor Road', 'Kottayam', 'Kerala', '686011', 'O+', 'None', 'Mrs. Thomas', '9876543311', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Cholesterol'),
('tests2-user--012', 'patient012@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Meera', 'Mohan', '9876543320', '1990-01-28', 'female', 'Puthuppally', 'Kottayam', 'Kerala', '686012', 'AB+', 'None', 'Mr. Mohan', '9876543321', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Healthy'),
('tests2-user--013', 'patient013@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Nikhil', 'Raj', '9876543330', '1992-05-16', 'male', 'Thiruvanchoor', 'Kottayam', 'Kerala', '686013', 'A-', 'Latex', 'Mrs. Raj', '9876543331', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Healthy'),
('tests2-user--014', 'patient014@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Pooja', 'Shetty', '9876543340', '1988-08-03', 'female', 'Kumarakom', 'Kottayam', 'Kerala', '686014', 'B-', 'None', 'Mr. Shetty', '9876543341', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'PCOD'),
('tests2-user--015', 'patient015@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Rajesh', 'Nambiar', '9876543350', '1991-11-19', 'male', 'Vaikom Road', 'Kottayam', 'Kerala', '686015', 'O-', 'None', 'Mrs. Nambiar', '9876543351', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Back Pain'),
('tests2-user--016', 'patient016@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Riya', 'George', '9876543360', '1993-04-07', 'female', 'Pala Road', 'Kottayam', 'Kerala', '686016', 'AB-', 'Iodine', 'Mr. George', '9876543361', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Healthy'),
('tests2-user--017', 'patient017@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Sandeep', 'Panicker', '9876543370', '1987-07-21', 'male', 'Changanassery Road', 'Kottayam', 'Kerala', '686017', 'A+', 'None', 'Mrs. Panicker', '9876543371', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Gastritis'),
('tests2-user--018', 'patient018@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Sowmya', 'Suresh', '9876543380', '1989-12-09', 'female', 'Rubber Board', 'Kottayam', 'Kerala', '686018', 'B+', 'None', 'Mr. Suresh', '9876543381', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Anemia'),
('tests2-user--019', 'patient019@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Vivek', 'Ramesh', '9876543390', '1990-03-26', 'male', 'Medical College', 'Kottayam', 'Kerala', '686019', 'O+', 'Nuts', 'Mrs. Ramesh', '9876543391', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Healthy'),
('tests2-user--020', 'patient020@testts.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Zara', 'Khan', '9876543400', '1992-09-11', 'female', 'Arpookara', 'Kottayam', 'Kerala', '686020', 'AB+', 'None', 'Mr. Khan', '9876543401', 1, 0, NULL, 1, '2025-10-10 06:55:26', '2025-10-10 06:55:26', 'Healthy'),
('Tw714rNTEZ-cIpZzwruOZ', 'alvin@gmail.com', '$2b$12$pU2uVl3KrVNLt2IP1lQqQeVL2HpanrjC6mivTqk51ftyLaPRbbdwW', 'Et', 'pariatur', '15272175566', '2025-08-15', 'Male', 'Quod voluptas quia a', 'Consequat Optio qu', 'Gujarat', '43120', 'B+', 'No', 'Et nostrud pariatur', '15272175566', 1, 1, NULL, 0, '2025-08-15 09:04:47', '2025-10-08 09:50:54', ''),
('u7WpsoFG-dt8oASj2DO_V', 'jinojino122@gmail.com', '$2b$12$fi.e5wtlXMXTR7xo9t8ra.740XocKxOwQdepy7xu.ja8XZCT8Sn.6', 'Jino', 'Jino', '9665542118', '2001-03-19', 'Male', 'abc,', 'xyc', 'Tamil Nadu', '666525', 'O-', 'none', 'Jino', '8855545466', 1, 1, NULL, 0, '2025-08-19 05:01:18', '2025-08-19 05:01:18', NULL),
('WEl4bJ22AQQAWkB3NCmkB', 'alan@gmail.com', '$2b$12$PvZDZ8adriyh4txwPaaYnOMlnmHK1uqu.wR7A4.dyUmSTemnKAAKm', 'Alan', 'Rickman', '9879898772', '2004-06-09', 'Male', '87 West White New Parkway', 'Vel aut necessitatib', 'Kerala', '89305', 'AB-', 'No', 'Alan Rickman', '1234321223', 1, 1, NULL, 0, '2025-08-13 21:37:34', '2025-10-10 11:29:09', ''),
('WNuhhE4sRVqBQ2XcFNSBE', 'kevin@gmail.com', '$2b$12$6b5mc6Ro5P.m2nOq4TDoUO3a/E8UeJgKLq.qOk0JgtaQoD1nnjnEe', 'Kevin', 'Levin', '8900988901', '2000-05-19', 'Male', 'Quod voluptas quia a', 'Consequat Optio qu', 'Gujarat', '43120', 'B-', 'No', 'Et nostrud pariatur', '15272175566', 1, 1, NULL, 0, '2025-08-19 05:00:14', '2025-08-19 05:00:14', NULL);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_token_recall_status`
-- (See below for the actual view)
--
CREATE TABLE `v_token_recall_status` (
`appointment_id` varchar(36)
,`token_number` int
,`appointment_date` varchar(10)
,`session_id` varchar(36)
,`appointment_status` enum('pending','confirmed','completed','cancelled','no_show','rescheduled')
,`token_status` varchar(20)
,`is_recalled` tinyint(1)
,`recall_count` int
,`last_recalled_at` timestamp
,`attended_after_recall` tinyint(1)
,`current_token_number` int
,`recall_check_interval` int
,`recall_enabled` tinyint(1)
,`patient_name` varchar(201)
,`patient_phone` varchar(20)
,`doctor_name` varchar(255)
,`hospital_name` varchar(255)
,`is_eligible_for_recall` int
,`total_calls` bigint
,`last_called_at` timestamp
);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_appointments_user` (`user_id`),
  ADD KEY `idx_appointments_doctor` (`doctor_id`),
  ADD KEY `idx_appointments_date` (`appointment_date`),
  ADD KEY `idx_appointments_status` (`status`),
  ADD KEY `appointments_hospital_id_hospitals_id_fk` (`hospital_id`),
  ADD KEY `appointments_session_id_doctor_sessions_id_fk` (`session_id`),
  ADD KEY `idx_token_status` (`token_status`),
  ADD KEY `idx_appointment_date_session` (`appointment_date`,`session_id`),
  ADD KEY `idx_token_lock_expires` (`token_lock_expires_at`),
  ADD KEY `idx_appointments_recall` (`session_id`,`appointment_date`,`token_status`,`is_recalled`),
  ADD KEY `idx_appointments_token_status` (`session_id`,`appointment_date`,`token_number`,`token_status`);

--
-- Indexes for table `appointment_history`
--
ALTER TABLE `appointment_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_appointment_id` (`appointment_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_action_type` (`action_type`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_audit_user` (`user_type`,`user_id`),
  ADD KEY `idx_audit_created` (`created_at`);

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `license_number` (`license_number`),
  ADD KEY `idx_doctors_email` (`email`),
  ADD KEY `idx_doctors_specialty` (`specialty_id`),
  ADD KEY `idx_doctors_status` (`status`);

--
-- Indexes for table `doctor_admins`
--
ALTER TABLE `doctor_admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `doctor_id` (`doctor_id`),
  ADD KEY `idx_doctor_admins_doctor` (`doctor_id`),
  ADD KEY `idx_doctor_admins_email` (`email`);

--
-- Indexes for table `doctor_hospital_requests`
--
ALTER TABLE `doctor_hospital_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_pending_request` (`doctor_id`,`hospital_id`,`status`),
  ADD KEY `idx_requests_doctor` (`doctor_id`),
  ADD KEY `idx_requests_hospital` (`hospital_id`),
  ADD KEY `idx_requests_status` (`status`);

--
-- Indexes for table `doctor_sessions`
--
ALTER TABLE `doctor_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_doctor_sessions_doctor` (`doctor_id`),
  ADD KEY `idx_doctor_sessions_hospital` (`hospital_id`);

--
-- Indexes for table `doctor_session_requests`
--
ALTER TABLE `doctor_session_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_requests_doctor` (`doctor_id`),
  ADD KEY `idx_session_requests_hospital` (`hospital_id`),
  ADD KEY `idx_session_requests_status` (`status`);

--
-- Indexes for table `emergency_contacts`
--
ALTER TABLE `emergency_contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `emergency_contacts_user_id_users_id_fk` (`user_id`);

--
-- Indexes for table `hospitals`
--
ALTER TABLE `hospitals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_license_number` (`license_number`);

--
-- Indexes for table `hospital_admins`
--
ALTER TABLE `hospital_admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_hospital_admins_hospital` (`hospital_id`),
  ADD KEY `idx_hospital_admins_email` (`email`);

--
-- Indexes for table `hospital_callback_queue`
--
ALTER TABLE `hospital_callback_queue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_callback_status` (`callback_status`),
  ADD KEY `idx_hospital_id` (`hospital_id`),
  ADD KEY `idx_missed_date` (`missed_date`),
  ADD KEY `appointment_id` (`appointment_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `hospital_doctor_associations`
--
ALTER TABLE `hospital_doctor_associations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_hospital_doctor` (`hospital_id`,`doctor_id`),
  ADD KEY `idx_associations_hospital` (`hospital_id`),
  ADD KEY `idx_associations_doctor` (`doctor_id`),
  ADD KEY `idx_associations_status` (`status`);

--
-- Indexes for table `hospital_settings`
--
ALTER TABLE `hospital_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_hospital_setting` (`hospital_id`,`setting_key`),
  ADD KEY `idx_hospital_settings_hospital` (`hospital_id`);

--
-- Indexes for table `hospital_specialties`
--
ALTER TABLE `hospital_specialties`
  ADD PRIMARY KEY (`hospital_id`,`specialty_id`),
  ADD KEY `hospital_specialties_specialty_id_specialties_id_fk` (`specialty_id`);

--
-- Indexes for table `insurance`
--
ALTER TABLE `insurance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `insurance_user_id_users_id_fk` (`user_id`);

--
-- Indexes for table `medical_records`
--
ALTER TABLE `medical_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_medical_records_user` (`user_id`),
  ADD KEY `medical_records_appointment_id_appointments_id_fk` (`appointment_id`),
  ADD KEY `medical_records_doctor_id_doctors_id_fk` (`doctor_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user` (`user_id`),
  ADD KEY `idx_notifications_read` (`is_read`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_id` (`transaction_id`),
  ADD KEY `idx_payments_appointment` (`appointment_id`),
  ADD KEY `idx_payments_user` (`user_id`),
  ADD KEY `idx_payments_status` (`status`),
  ADD KEY `payments_doctor_id_doctors_id_fk` (`doctor_id`),
  ADD KEY `payments_payment_method_id_payment_methods_id_fk` (`payment_method_id`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_methods_user_id_users_id_fk` (`user_id`);

--
-- Indexes for table `payment_receipts`
--
ALTER TABLE `payment_receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipt_number` (`receipt_number`),
  ADD KEY `payment_receipts_payment_id_payments_id_fk` (`payment_id`);

--
-- Indexes for table `queue_positions`
--
ALTER TABLE `queue_positions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_session_date` (`session_id`,`appointment_date`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reviews_doctor` (`doctor_id`),
  ADD KEY `idx_reviews_hospital` (`hospital_id`),
  ADD KEY `reviews_user_id_users_id_fk` (`user_id`),
  ADD KEY `reviews_appointment_id_appointments_id_fk` (`appointment_id`);

--
-- Indexes for table `specialties`
--
ALTER TABLE `specialties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `token_call_history`
--
ALTER TABLE `token_call_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_date` (`session_id`,`appointment_date`),
  ADD KEY `idx_token_number` (`token_number`),
  ADD KEY `idx_is_recall` (`is_recall`),
  ADD KEY `idx_called_at` (`called_at`),
  ADD KEY `fk_token_call_appointment` (`appointment_id`);

--
-- Indexes for table `token_locks`
--
ALTER TABLE `token_locks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_token_lock` (`session_id`,`appointment_date`,`token_number`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `idx_locked_by` (`locked_by_user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `appointment_id` (`appointment_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`);

-- --------------------------------------------------------

--
-- Structure for view `v_token_recall_status`
--
DROP TABLE IF EXISTS `v_token_recall_status`;

CREATE ALGORITHM=UNDEFINED DEFINER=`devuser`@`localhost` SQL SECURITY DEFINER VIEW `v_token_recall_status`  AS SELECT `a`.`id` AS `appointment_id`, `a`.`token_number` AS `token_number`, `a`.`appointment_date` AS `appointment_date`, `a`.`session_id` AS `session_id`, `a`.`status` AS `appointment_status`, `a`.`token_status` AS `token_status`, `a`.`is_recalled` AS `is_recalled`, `a`.`recall_count` AS `recall_count`, `a`.`last_recalled_at` AS `last_recalled_at`, `a`.`attended_after_recall` AS `attended_after_recall`, `ds`.`current_token_number` AS `current_token_number`, `ds`.`recall_check_interval` AS `recall_check_interval`, `ds`.`recall_enabled` AS `recall_enabled`, concat(`u`.`first_name`,' ',`u`.`last_name`) AS `patient_name`, `u`.`phone` AS `patient_phone`, `d`.`name` AS `doctor_name`, `h`.`name` AS `hospital_name`, (case when ((`a`.`token_status` = 'pending') and (`a`.`token_number` < `ds`.`current_token_number`) and (`ds`.`recall_enabled` = 1) and ((`ds`.`current_token_number` % `ds`.`recall_check_interval`) = 0)) then 1 else 0 end) AS `is_eligible_for_recall`, (select count(0) from `token_call_history` where (`token_call_history`.`appointment_id` = `a`.`id`)) AS `total_calls`, (select max(`token_call_history`.`called_at`) from `token_call_history` where (`token_call_history`.`appointment_id` = `a`.`id`)) AS `last_called_at` FROM ((((`appointments` `a` left join `users` `u` on((`a`.`user_id` = `u`.`id`))) left join `doctors` `d` on((`a`.`doctor_id` = `d`.`id`))) left join `hospitals` `h` on((`a`.`hospital_id` = `h`.`id`))) left join `doctor_sessions` `ds` on((`a`.`session_id` = `ds`.`id`))) WHERE (`a`.`appointment_date` >= (curdate() - interval 7 day)) ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointment_history`
--
ALTER TABLE `appointment_history`
  ADD CONSTRAINT `appointment_history_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointment_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `doctor_admins`
--
ALTER TABLE `doctor_admins`
  ADD CONSTRAINT `doctor_admins_doctor_id_doctors_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `hospital_callback_queue`
--
ALTER TABLE `hospital_callback_queue`
  ADD CONSTRAINT `hospital_callback_queue_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hospital_callback_queue_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hospital_callback_queue_ibfk_3` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hospital_callback_queue_ibfk_4` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `queue_positions`
--
ALTER TABLE `queue_positions`
  ADD CONSTRAINT `queue_positions_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `doctor_sessions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `token_call_history`
--
ALTER TABLE `token_call_history`
  ADD CONSTRAINT `fk_token_call_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_token_call_session` FOREIGN KEY (`session_id`) REFERENCES `doctor_sessions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `token_locks`
--
ALTER TABLE `token_locks`
  ADD CONSTRAINT `token_locks_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `doctor_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `token_locks_ibfk_2` FOREIGN KEY (`locked_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `token_locks_ibfk_3` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
