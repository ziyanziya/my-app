-- 025_complete_light_system_features.sql
-- Expand scopes, add practical progress table, seed default rules and light achievements.

CREATE DATABASE IF NOT EXISTS `elsirat_db` CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
USE `elsirat_db`;

-- 1. Ensure light_audit_logs exists and expand ENUMs in light tables
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
  KEY `idx_light_audit_logs_user` (`user_id`),
  KEY `idx_light_audit_logs_transaction` (`transaction_id`),
  KEY `idx_light_audit_logs_worship` (`worship_type`,`worship_key`),
  KEY `idx_light_audit_logs_performed_at` (`performed_at`),
  CONSTRAINT `fk_light_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_light_audit_logs_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `light_transactions`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_light_audit_logs_performed_by` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `light_rules`
  MODIFY COLUMN `source_scope` ENUM('prayer','wheel','activity','achievement','event','theory','practical','daily_checkin','all_worships','manual','system') NOT NULL DEFAULT 'system';

ALTER TABLE `light_transactions`
  MODIFY COLUMN `source_scope` ENUM('prayer','wheel','activity','achievement','event','theory','practical','daily_checkin','all_worships','manual','system') NOT NULL DEFAULT 'manual';

ALTER TABLE `light_audit_logs`
  MODIFY COLUMN `worship_type` ENUM('prayer','wheel','activity','achievement','event','theory','practical','daily_checkin','all_worships','manual','system') NOT NULL;

ALTER TABLE `light_achievement_conditions`
  MODIFY COLUMN `source_scope` ENUM('prayer','wheel','activity','achievement','event','theory','practical','daily_checkin','all_worships','light','system') DEFAULT NULL;

-- 2. Create user_practical_progress table
CREATE TABLE IF NOT EXISTS `user_practical_progress` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `worship_id` BIGINT UNSIGNED NOT NULL,
  `step_id` BIGINT UNSIGNED NOT NULL,
  `completed` TINYINT(1) NOT NULL DEFAULT 1,
  `completed_at` DATETIME(3) DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_user_practical_progress` (`user_id`, `step_id`),
  KEY `idx_user_practical_worship` (`user_id`, `worship_id`),
  CONSTRAINT `fk_user_practical_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_user_practical_worship` FOREIGN KEY (`worship_id`) REFERENCES `worships`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_user_practical_step` FOREIGN KEY (`step_id`) REFERENCES `practical_steps`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Seed Default Light Rules
INSERT INTO `light_rules` (`slug`, `name`, `description`, `source_scope`, `source_key`, `base_amount`, `multiplier`, `max_amount`, `daily_limit`, `cooldown_minutes`, `repeatable`, `is_active`)
VALUES
('daily_checkin', 'النشاط اليومي', 'نور يُمنح عند فتح التطبيق والتفاعل اليومي', 'daily_checkin', 'daily_checkin', 10.00, 1.0000, 10.00, 10, NULL, 0, 1),
('all_worships_daily', 'إتمام جميع عبادات اليوم', 'مكافأة كبرى تُمنح عند إتمام كافة عبادات اليوم المحددة', 'all_worships', 'all_worships_daily', 50.00, 1.0000, 50.00, 50, NULL, 0, 1),
('theory_section_completion', 'قراءة قسم نظري', 'نور يُمنح عند إتمام قراءة قسم تعليمي نظري', 'theory', 'generic_theory', 15.00, 1.0000, 15.00, NULL, NULL, 1, 1),
('practical_step_completion', 'إتمام خطوة تطبيقية', 'نور يُمنح عند تنفيذ خطوة عملية تطبيقية', 'practical', 'generic_practical', 25.00, 1.0000, 25.00, NULL, NULL, 1, 1),
('worship_fajr', 'صلاة الفجر', 'مكافأة أداء صلاة الفجر', 'prayer', 'fajr', 20.00, 1.0000, 20.00, 20, NULL, 0, 1),
('worship_dhuhr', 'صلاة الظهر', 'مكافأة أداء صلاة الظهر', 'prayer', 'dhuhr', 15.00, 1.0000, 15.00, 15, NULL, 0, 1),
('worship_asr', 'صلاة العصر', 'مكافأة أداء صلاة العصر', 'prayer', 'asr', 15.00, 1.0000, 15.00, 15, NULL, 0, 1),
('worship_maghrib', 'صلاة المغرب', 'مكافأة أداء صلاة المغرب', 'prayer', 'maghrib', 15.00, 1.0000, 15.00, 15, NULL, 0, 1),
('worship_isha', 'صلاة العشاء', 'مكافأة أداء صلاة العشاء', 'prayer', 'isha', 15.00, 1.0000, 15.00, 15, NULL, 0, 1),
('worship_tahajjud', 'قيام الليل (التهجد)', 'مكافأة قيام الليل والتهجد', 'prayer', 'tahajjud', 30.00, 1.0000, 30.00, 30, NULL, 0, 1),
('worship_duha', 'صلاة الضحى', 'مكافأة صلاة الأوابين (الضحى)', 'prayer', 'duha', 15.00, 1.0000, 15.00, 15, NULL, 0, 1),
('worship_morning_adhkar', 'أذكار الصباح', 'مكافأة قراءة أذكار الصباح', 'prayer', 'morning_adhkar', 10.00, 1.0000, 10.00, 10, NULL, 0, 1),
('worship_evening_adhkar', 'أذكار المساء', 'مكافأة قراءة أذكار المساء', 'prayer', 'evening_adhkar', 10.00, 1.0000, 10.00, 10, NULL, 0, 1)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `base_amount` = VALUES(`base_amount`),
  `is_active` = VALUES(`is_active`);

-- 4. Seed Light Achievements
INSERT INTO `achievements` (`id`, `slug`, `title`, `description`, `criteria`, `points_reward`, `is_active`)
VALUES
(101, 'light_100', 'شعاع النور الأول', 'الوصول إلى رصيد 100 نور مبارك', '{"type":"cumulative_light","target":100}', 20, 1),
(102, 'light_500', 'قبس الهدى', 'الوصول إلى رصيد 500 نور مبارك', '{"type":"cumulative_light","target":500}', 50, 1),
(103, 'light_1000', 'منارة الإيمان', 'الوصول إلى رصيد 1,000 نور مبارك', '{"type":"cumulative_light","target":1000}', 100, 1),
(104, 'light_5000', 'نور على نور', 'الوصول إلى رصيد 5,000 نور مبارك', '{"type":"cumulative_light","target":5000}', 250, 1),
(105, 'light_10000', 'تاج الاستقامة', 'الوصول إلى رصيد 10,000 نور مبارك', '{"type":"cumulative_light","target":10000}', 500, 1)
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `description` = VALUES(`description`),
  `criteria` = VALUES(`criteria`);

-- 5. Seed Light Achievement Conditions
INSERT INTO `light_achievement_conditions` (`achievement_id`, `condition_type`, `source_scope`, `source_key`, `target_value`, `threshold`, `repeatable`, `is_active`)
VALUES
(101, 'cumulative_light', 'light', 'total_awarded', 100.00, 100, 0, 1),
(102, 'cumulative_light', 'light', 'total_awarded', 500.00, 500, 0, 1),
(103, 'cumulative_light', 'light', 'total_awarded', 1000.00, 1000, 0, 1),
(104, 'cumulative_light', 'light', 'total_awarded', 5000.00, 5000, 0, 1),
(105, 'cumulative_light', 'light', 'total_awarded', 10000.00, 10000, 0, 1)
ON DUPLICATE KEY UPDATE
  `target_value` = VALUES(`target_value`),
  `is_active` = VALUES(`is_active`);
