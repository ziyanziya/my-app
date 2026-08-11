-- 017_practical_steps.sql
CREATE TABLE IF NOT EXISTS `practical_steps` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `worship_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `required_days` INT UNSIGNED NOT NULL DEFAULT 0,
  `reward_points` INT UNSIGNED NOT NULL DEFAULT 0,
  `order_index` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_practical_steps_worship_id` (`worship_id`),
  CONSTRAINT `fk_practical_steps_worships` FOREIGN KEY (`worship_id`) REFERENCES `worships`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
