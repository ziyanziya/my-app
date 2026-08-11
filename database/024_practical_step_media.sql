CREATE TABLE IF NOT EXISTS `practical_step_media` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `practical_step_id` BIGINT UNSIGNED NOT NULL,
  `media_type` ENUM('upload', 'external_link') NOT NULL,
  `url` VARCHAR(2048) NOT NULL,
  `original_name` VARCHAR(255) DEFAULT NULL,
  `mime_type` VARCHAR(100) DEFAULT NULL,
  `file_size` BIGINT UNSIGNED DEFAULT NULL,
  `title` VARCHAR(255) DEFAULT NULL,
  `order_index` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_practical_step_media_step_id` (`practical_step_id`),
  CONSTRAINT `fk_practical_step_media_step`
    FOREIGN KEY (`practical_step_id`) REFERENCES `practical_steps`(`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
