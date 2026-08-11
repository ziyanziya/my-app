-- 011_light_achievement_conditions.sql
-- Support for achievements driven by the Light reward system.

CREATE DATABASE IF NOT EXISTS `elsirat_db` CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
USE `elsirat_db`;

CREATE TABLE IF NOT EXISTS `light_achievement_conditions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `achievement_id` BIGINT UNSIGNED NOT NULL,
  `condition_type` ENUM('first_occurrence','cumulative_light','consecutive_days','event_count','completion_count','manual') NOT NULL,
  `source_scope` ENUM('prayer','wheel','activity','achievement','event','light','system') DEFAULT NULL,
  `source_key` VARCHAR(100) DEFAULT NULL,
  `target_value` DECIMAL(12,2) DEFAULT NULL,
  `threshold` INT UNSIGNED DEFAULT NULL,
  `window_days` INT UNSIGNED DEFAULT NULL,
  `repeatable` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `config` JSON DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_light_achievement_conditions_uniq` (`achievement_id`,`condition_type`,`source_scope`,`source_key`),
  KEY `idx_light_achievement_conditions_achievement` (`achievement_id`),
  KEY `idx_light_achievement_conditions_type` (`condition_type`),
  KEY `idx_light_achievement_conditions_active` (`is_active`),
  CONSTRAINT `fk_light_achievement_conditions_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
