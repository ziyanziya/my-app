-- Ensure theory progress is stored once for every user and section.
USE `elsirat_db`;
SET @drop_legacy_key = IF(EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_theory_progress' AND INDEX_NAME = 'ux_user_theory_progress'), 'ALTER TABLE `user_theory_progress` DROP INDEX `ux_user_theory_progress`', 'SELECT 1');
PREPARE statement_from_drop_legacy_key FROM @drop_legacy_key; EXECUTE statement_from_drop_legacy_key; DEALLOCATE PREPARE statement_from_drop_legacy_key;
SET @add_section_key = IF(EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_theory_progress' AND INDEX_NAME = 'ux_user_theory_progress_user_section'), 'SELECT 1', 'ALTER TABLE `user_theory_progress` ADD UNIQUE KEY `ux_user_theory_progress_user_section` (`user_id`, `section_id`)');
PREPARE statement_from_add_section_key FROM @add_section_key; EXECUTE statement_from_add_section_key; DEALLOCATE PREPARE statement_from_add_section_key;
SET @add_user_worship_key = IF(EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_theory_progress' AND INDEX_NAME = 'idx_user_theory_progress_user_worship'), 'SELECT 1', 'ALTER TABLE `user_theory_progress` ADD KEY `idx_user_theory_progress_user_worship` (`user_id`, `worship_id`)');
PREPARE statement_from_add_user_worship_key FROM @add_user_worship_key; EXECUTE statement_from_add_user_worship_key; DEALLOCATE PREPARE statement_from_add_user_worship_key;
