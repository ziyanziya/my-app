-- 018_user_theory_progress.sql
CREATE TABLE IF NOT EXISTS `user_theory_progress` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `worship_id` BIGINT UNSIGNED NOT NULL,
  `section_id` BIGINT UNSIGNED NOT NULL,
  `completed` TINYINT(1) NOT NULL DEFAULT 0,
  `completed_at` DATETIME(3) DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_user_theory_progress` (`user_id`,`worship_id`),
  INDEX `idx_user_theory_progress_section_id` (`section_id`),
  CONSTRAINT `fk_utp_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_utp_worship` FOREIGN KEY (`worship_id`) REFERENCES `worships`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_utp_section` FOREIGN KEY (`section_id`) REFERENCES `theory_sections`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
