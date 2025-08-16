CREATE TABLE `appointments` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`doctor_id` varchar(36),
	`hospital_id` varchar(36),
	`session_id` varchar(36),
	`appointment_date` varchar(10) NOT NULL,
	`token_number` int NOT NULL,
	`estimated_time` varchar(8),
	`actual_start_time` varchar(8),
	`actual_end_time` varchar(8),
	`status` varchar(20) NOT NULL,
	`booking_type` varchar(20) NOT NULL,
	`patient_complaints` text,
	`doctor_notes` text,
	`prescription` text,
	`consultation_fee` decimal(8,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doctor_sessions` (
	`id` varchar(36) NOT NULL,
	`doctor_id` varchar(36),
	`hospital_id` varchar(36),
	`day_of_week` varchar(10) NOT NULL,
	`start_time` varchar(8) NOT NULL,
	`end_time` varchar(8) NOT NULL,
	`max_tokens` int NOT NULL,
	`avg_minutes_per_patient` int DEFAULT 15,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `doctor_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doctors` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`specialty_id` varchar(36),
	`qualification` varchar(500) NOT NULL,
	`experience` int NOT NULL,
	`bio` text NOT NULL,
	`image` varchar(500),
	`rating` decimal(3,2) DEFAULT '0.00',
	`total_reviews` int DEFAULT 0,
	`consultation_fee` decimal(8,2) NOT NULL,
	`is_available` boolean DEFAULT true,
	`license_number` varchar(100) NOT NULL,
	`date_of_birth` varchar(10),
	`address` text,
	`city` varchar(100),
	`state` varchar(100),
	`zip_code` varchar(10),
	`bank_account` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `doctors_id` PRIMARY KEY(`id`),
	CONSTRAINT `doctors_email_unique` UNIQUE(`email`),
	CONSTRAINT `doctors_license_number_unique` UNIQUE(`license_number`)
);
--> statement-breakpoint
CREATE TABLE `emergency_contacts` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`name` varchar(255) NOT NULL,
	`relationship` varchar(50) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(255),
	`address` text,
	`is_primary` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emergency_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hospital_specialties` (
	`hospital_id` varchar(36) NOT NULL,
	`specialty_id` varchar(36) NOT NULL,
	CONSTRAINT `hospital_specialties_hospital_id_specialty_id_pk` PRIMARY KEY(`hospital_id`,`specialty_id`)
);
--> statement-breakpoint
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
	`image` varchar(500),
	`rating` decimal(3,2) DEFAULT '0.00',
	`total_reviews` int DEFAULT 0,
	`total_doctors` int DEFAULT 0,
	`established` int NOT NULL,
	`website` varchar(255),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hospitals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insurance` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`provider` varchar(255) NOT NULL,
	`policy_number` varchar(100) NOT NULL,
	`policy_holder_name` varchar(255) NOT NULL,
	`coverage_amount` decimal(10,2),
	`deductible` decimal(8,2),
	`expiry_date` varchar(10),
	`is_active` boolean DEFAULT true,
	`documents` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insurance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medical_records` (
	`id` varchar(36) NOT NULL,
	`appointment_id` varchar(36),
	`user_id` varchar(36),
	`doctor_id` varchar(36),
	`diagnosis` text,
	`symptoms` text,
	`treatment` text,
	`prescription` json,
	`vitals` json,
	`lab_reports` json,
	`follow_up_date` varchar(10),
	`follow_up_instructions` text,
	`attachments` json,
	`is_private` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medical_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`data` json,
	`is_read` boolean DEFAULT false,
	`read_at` timestamp,
	`scheduled_for` timestamp,
	`sent_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`type` varchar(20) NOT NULL,
	`provider` varchar(50),
	`last_four_digits` varchar(4),
	`expiry_date` varchar(5),
	`holder_name` varchar(255),
	`is_default` boolean DEFAULT false,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_methods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_receipts` (
	`id` varchar(36) NOT NULL,
	`payment_id` varchar(36),
	`receipt_number` varchar(100) NOT NULL,
	`receipt_data` json NOT NULL,
	`receipt_url` varchar(500),
	`email_sent` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_receipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_receipts_receipt_number_unique` UNIQUE(`receipt_number`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(36) NOT NULL,
	`appointment_id` varchar(36),
	`user_id` varchar(36),
	`doctor_id` varchar(36),
	`payment_method_id` varchar(36),
	`amount` decimal(8,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'INR',
	`status` varchar(20) NOT NULL,
	`transaction_id` varchar(100),
	`gateway_transaction_id` varchar(255),
	`gateway` varchar(50),
	`gateway_response` json,
	`paid_at` timestamp,
	`failed_at` timestamp,
	`failure_reason` text,
	`refunded_at` timestamp,
	`refund_amount` decimal(8,2),
	`refund_reason` text,
	`platform_fee` decimal(8,2) DEFAULT '0.00',
	`doctor_earnings` decimal(8,2),
	`hospital_earnings` decimal(8,2),
	`tax_amount` decimal(8,2) DEFAULT '0.00',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_transaction_id_unique` UNIQUE(`transaction_id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`doctor_id` varchar(36),
	`hospital_id` varchar(36),
	`appointment_id` varchar(36),
	`rating` int NOT NULL,
	`title` varchar(255),
	`comment` text,
	`is_anonymous` boolean DEFAULT false,
	`is_verified` boolean DEFAULT false,
	`helpful_votes` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `specialties` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `specialties_id` PRIMARY KEY(`id`),
	CONSTRAINT `specialties_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`type` varchar(20) DEFAULT 'string',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
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
	`blood_group` varchar(5),
	`allergies` text,
	`emergency_contact` varchar(100),
	`emergency_phone` varchar(20),
	`terms_accepted` boolean NOT NULL,
	`marketing_emails` boolean DEFAULT false,
	`profile_image` varchar(500),
	`is_verified` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_doctor_id_doctors_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_hospital_id_hospitals_id_fk` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_session_id_doctor_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `doctor_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `doctor_sessions` ADD CONSTRAINT `doctor_sessions_doctor_id_doctors_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `doctor_sessions` ADD CONSTRAINT `doctor_sessions_hospital_id_hospitals_id_fk` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `doctors` ADD CONSTRAINT `doctors_specialty_id_specialties_id_fk` FOREIGN KEY (`specialty_id`) REFERENCES `specialties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `emergency_contacts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hospital_specialties` ADD CONSTRAINT `hospital_specialties_hospital_id_hospitals_id_fk` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hospital_specialties` ADD CONSTRAINT `hospital_specialties_specialty_id_specialties_id_fk` FOREIGN KEY (`specialty_id`) REFERENCES `specialties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `insurance` ADD CONSTRAINT `insurance_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_appointment_id_appointments_id_fk` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_doctor_id_doctors_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_methods` ADD CONSTRAINT `payment_methods_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_receipts` ADD CONSTRAINT `payment_receipts_payment_id_payments_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_appointment_id_appointments_id_fk` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_doctor_id_doctors_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_payment_method_id_payment_methods_id_fk` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_doctor_id_doctors_id_fk` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_hospital_id_hospitals_id_fk` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_appointment_id_appointments_id_fk` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE no action ON UPDATE no action;