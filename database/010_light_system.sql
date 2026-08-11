-- 010_light_system.sql
-- Tables for the new "Light" reward system.

CREATE DATABASE IF NOT EXISTS `elsirat_db` CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
USE `elsirat_db`;

-- Rules that define how light is granted, capped, and conditioned.
CREATE TABLE IF NOT EXISTS `light_rules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(100) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `source_scope` ENUM('prayer','wheel','activity','achievement','event','manual','system') NOT NULL DEFAULT 'system',
  `source_key` VARCHAR(100) DEFAULT NULL,
  `base_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `multiplier` DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
  `max_amount` DECIMAL(10,2) DEFAULT NULL,
  `daily_limit` INT UNSIGNED DEFAULT NULL,
  `cooldown_minutes` INT UNSIGNED DEFAULT NULL,
  `repeatable` TINYINT(1) NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `config` JSON DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_light_rules_slug` (`slug`),
  KEY `idx_light_rules_source` (`source_scope`,`source_key`),
  KEY `idx_light_rules_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ledger of light award, spending, and adjustment transactions.
CREATE TABLE IF NOT EXISTS `light_transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `rule_id` BIGINT UNSIGNED DEFAULT NULL,
  `transaction_type` ENUM('award','spend','revoke','adjustment') NOT NULL,
  `source_scope` ENUM('prayer','wheel','activity','achievement','event','manual','system') NOT NULL DEFAULT 'manual',
  `source_key` VARCHAR(100) DEFAULT NULL,
  `external_reference` VARCHAR(191) DEFAULT NULL,
  `idempotency_key` VARCHAR(100) DEFAULT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `balance_after` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pending','completed','failed') NOT NULL DEFAULT 'completed',
  `metadata` JSON DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_light_transactions_user_idempotency` (`user_id`,`idempotency_key`),
  UNIQUE KEY `ux_light_transactions_user_reference` (`user_id`,`external_reference`),
  KEY `idx_light_transactions_user` (`user_id`),
  KEY `idx_light_transactions_rule` (`rule_id`),
  KEY `idx_light_transactions_type` (`transaction_type`),
  KEY `idx_light_transactions_created` (`created_at`),
  CONSTRAINT `fk_light_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_light_transactions_rule` FOREIGN KEY (`rule_id`) REFERENCES `light_rules`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit log for every light operation and worship completion event.
CREATE TABLE IF NOT EXISTS `light_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `transaction_id` BIGINT UNSIGNED DEFAULT NULL,
  `worship_type` ENUM('prayer','wheel','activity','achievement','event','manual','system') NOT NULL,
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
  KEY `idx_light_audit_logs_user` (`user_id`),
  KEY `idx_light_audit_logs_transaction` (`transaction_id`),
  KEY `idx_light_audit_logs_worship` (`worship_type`,`worship_key`),
  KEY `idx_light_audit_logs_performed_at` (`performed_at`),
  CONSTRAINT `fk_light_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_light_audit_logs_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `light_transactions`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_light_audit_logs_performed_by` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Per-user summary cache for quick balance and usage statistics.
CREATE TABLE IF NOT EXISTS `user_light_stats` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `current_balance` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `total_awarded` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total_spent` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total_revoked` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `award_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `spend_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `current_streak_days` INT UNSIGNED NOT NULL DEFAULT 0,
  `longest_streak_days` INT UNSIGNED NOT NULL DEFAULT 0,
  `last_awarded_at` DATETIME(3) DEFAULT NULL,
  `last_spent_at` DATETIME(3) DEFAULT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_light_stats_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
