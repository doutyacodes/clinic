ALTER TABLE `doctors` MODIFY COLUMN `email` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `doctors` MODIFY COLUMN `license_number` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `payment_receipts` MODIFY COLUMN `receipt_number` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `transaction_id` varchar(50);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(191) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `date_of_birth` varchar(10);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `gender` varchar(10);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `address` text;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `city` varchar(100);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `state` varchar(100);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `zip_code` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `medical_history` text;