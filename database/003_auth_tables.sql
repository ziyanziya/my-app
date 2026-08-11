USE `elsirat_db`;

-- Add auth fields to users
ALTER TABLE `users`
  ADD COLUMN `role` ENUM('user','admin') NOT NULL DEFAULT 'user',
  ADD COLUMN `email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `verification_token` VARCHAR(128) DEFAULT NULL,
  ADD COLUMN `verification_expires_at` DATETIME(3) DEFAULT NULL,
  ADD COLUMN `reset_token` VARCHAR(128) DEFAULT NULL,
  ADD COLUMN `reset_expires_at` DATETIME(3) DEFAULT NULL;

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `revoked` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_refresh_tokens_token` (`token`),
  KEY `idx_refresh_tokens_user` (`user_id`),
  CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
