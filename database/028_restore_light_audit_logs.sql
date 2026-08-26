-- Repair restored databases whose migration history exists but audit table does not.
USE `elsirat_db`;
CREATE TABLE IF NOT EXISTS `light_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `transaction_id` BIGINT UNSIGNED DEFAULT NULL,
  `worship_type` ENUM('prayer','wheel','activity','achievement','event','theory','practical','daily_checkin','all_worships','manual','system') NOT NULL,
  `worship_key` VARCHAR(100) DEFAULT NULL,
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `action` ENUM('award','spend','revoke','adjustment','audit') NOT NULL,
  `reason` VARCHAR(255) DEFAULT NULL,
  `details` JSON DEFAULT NULL,
  `performed_by` BIGINT UNSIGNED DEFAULT NULL,
  `performed_by_type` ENUM('user','admin','system') NOT NULL DEFAULT 'system',
  `performed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_light_audit_logs_user` (`user_id`), KEY `idx_light_audit_logs_transaction` (`transaction_id`),
  KEY `idx_light_audit_logs_worship` (`worship_type`,`worship_key`), KEY `idx_light_audit_logs_performed_at` (`performed_at`),
  CONSTRAINT `fk_light_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_light_audit_logs_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `light_transactions`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_light_audit_logs_performed_by` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `light_audit_logs` MODIFY COLUMN `worship_type` ENUM('prayer','wheel','activity','achievement','event','theory','practical','daily_checkin','all_worships','manual','system') NOT NULL;
