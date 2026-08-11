-- 016_theory_sections.sql
CREATE TABLE IF NOT EXISTS `theory_sections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `worship_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `order_index` INT UNSIGNED NOT NULL DEFAULT 0,
  `reward_points` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_theory_sections_worship_id` (`worship_id`),
  CONSTRAINT `fk_theory_sections_worships` FOREIGN KEY (`worship_id`) REFERENCES `worships`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
