-- 012_levels_light_fields.sql
-- Extend the existing levels table to support the Light-based leveling system.

CREATE DATABASE IF NOT EXISTS `elsirat_db` CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
USE `elsirat_db`;

ALTER TABLE `levels`
  ADD COLUMN `icon` VARCHAR(255) DEFAULT NULL AFTER `badge_icon`,
  ADD COLUMN `color` VARCHAR(50) DEFAULT NULL AFTER `icon`,
  ADD COLUMN `min_light` BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER `min_points`,
  ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `rank`;
