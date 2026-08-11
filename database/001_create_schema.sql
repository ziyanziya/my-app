-- 001_create_schema.sql
-- Schema for SIRAT application

CREATE DATABASE IF NOT EXISTS `elsirat_db` CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
USE `elsirat_db`;

-- levels
CREATE TABLE `levels` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(64) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `min_points` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `badge_icon` VARCHAR(255) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `rank` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_levels_slug` (`slug`),
  UNIQUE KEY `ux_levels_min_points` (`min_points`),
  KEY `idx_levels_rank` (`rank`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- users
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `name` VARCHAR(150) DEFAULT NULL,
  `timezone` VARCHAR(64) NOT NULL DEFAULT 'UTC',
  `locale` VARCHAR(10) NOT NULL DEFAULT 'ar',
  `level_id` SMALLINT UNSIGNED DEFAULT NULL,
  `total_points` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `last_active_at` DATETIME(3) DEFAULT NULL,
  `deleted_at` DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_users_uuid` (`uuid`),
  UNIQUE KEY `ux_users_email` (`email`),
  UNIQUE KEY `ux_users_phone` (`phone`),
  KEY `idx_users_level` (`level_id`),
  KEY `idx_users_last_active` (`last_active_at`),
  CONSTRAINT `fk_users_level` FOREIGN KEY (`level_id`) REFERENCES `levels`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- activity_categories
CREATE TABLE `activity_categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(100) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `sort_order` SMALLINT UNSIGNED DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_activity_categories_slug` (`slug`),
  KEY `idx_activity_categories_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- activities
CREATE TABLE `activities` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(150) NOT NULL,
  `category_id` INT UNSIGNED DEFAULT NULL,
  `title` VARCHAR(200) NOT NULL,
  `icon` VARCHAR(200) DEFAULT NULL,
  `default_time` TIME DEFAULT NULL,
  `start_window` TIME DEFAULT NULL,
  `end_window` TIME DEFAULT NULL,
  `recurrence` JSON DEFAULT NULL,
  `points` INT UNSIGNED NOT NULL DEFAULT 10,
  `points_cap` INT UNSIGNED DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_activities_slug` (`slug`),
  KEY `idx_activities_category` (`category_id`),
  KEY `idx_activities_active` (`is_active`),
  CONSTRAINT `fk_activities_category` FOREIGN KEY (`category_id`) REFERENCES `activity_categories`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- activity_contents
CREATE TABLE `activity_contents` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `activity_id` BIGINT UNSIGNED NOT NULL,
  `locale` VARCHAR(10) NOT NULL DEFAULT 'ar',
  `title` VARCHAR(255) DEFAULT NULL,
  `body` TEXT DEFAULT NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `version` INT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_activity_contents_activity_locale_version` (`activity_id`,`locale`,`version`),
  KEY `idx_activity_contents_activity` (`activity_id`),
  CONSTRAINT `fk_activity_contents_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- achievements
CREATE TABLE `achievements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(150) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `criteria` JSON DEFAULT NULL,
  `points_reward` INT UNSIGNED DEFAULT 0,
  `badge_icon` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_achievements_slug` (`slug`),
  KEY `idx_achievements_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_achievements
CREATE TABLE `user_achievements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `achievement_id` BIGINT UNSIGNED NOT NULL,
  `unlocked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `metadata` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_user_achievements_user_achievement` (`user_id`,`achievement_id`),
  KEY `idx_user_achievements_unlocked` (`unlocked_at`),
  KEY `idx_user_achievements_user` (`user_id`),
  CONSTRAINT `fk_user_achievements_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_user_achievements_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_progress
CREATE TABLE `user_progress` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `activity_id` BIGINT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `scheduled_at` DATETIME(3) DEFAULT NULL,
  `completed_at` DATETIME(3) DEFAULT NULL,
  `status` ENUM('pending','completed','skipped','missed') NOT NULL DEFAULT 'pending',
  `points_awarded` INT UNSIGNED DEFAULT 0,
  `streak_delta` INT DEFAULT 0,
  `source` ENUM('user','system','sync') NOT NULL DEFAULT 'user',
  `metadata` JSON DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_user_progress_user_activity_date` (`user_id`,`activity_id`,`date`),
  KEY `idx_user_progress_user_date` (`user_id`,`date`),
  KEY `idx_user_progress_activity_date` (`activity_id`,`date`),
  KEY `idx_user_progress_status` (`status`),
  CONSTRAINT `fk_user_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_user_progress_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- notifications
CREATE TABLE `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `activity_id` BIGINT UNSIGNED DEFAULT NULL,
  `title` VARCHAR(255) DEFAULT NULL,
  `body` TEXT DEFAULT NULL,
  `channel` ENUM('push','email','sms') NOT NULL DEFAULT 'push',
  `scheduled_at` DATETIME(3) NOT NULL,
  `sent_at` DATETIME(3) DEFAULT NULL,
  `status` ENUM('scheduled','sent','failed','cancelled') NOT NULL DEFAULT 'scheduled',
  `delivery_metadata` JSON DEFAULT NULL,
  `retry_count` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_status` (`user_id`,`status`),
  KEY `idx_notifications_scheduled` (`scheduled_at`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_activity` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- settings
CREATE TABLE `settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `scope` ENUM('user','global','admin') NOT NULL DEFAULT 'user',
  `setting_key` VARCHAR(191) NOT NULL,
  `value` JSON DEFAULT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_settings_user_key` (`user_id`,`setting_key`),
  KEY `idx_settings_scope` (`scope`),
  CONSTRAINT `fk_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- End of schema
