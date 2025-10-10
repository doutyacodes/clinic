-- Migration: Add currentToken and lastRecallAt fields to doctor_sessions table
-- Date: 2025-10-10
-- Description: Adds fields to support proper recall tracking without incrementing current token

ALTER TABLE `doctor_sessions`
ADD COLUMN `current_token` INT DEFAULT 0 AFTER `current_token_number`,
ADD COLUMN `last_recall_at` INT DEFAULT 0 AFTER `current_token`;

-- Update existing rows to copy currentTokenNumber to currentToken
UPDATE `doctor_sessions`
SET `current_token` = `current_token_number`
WHERE `current_token` = 0;
