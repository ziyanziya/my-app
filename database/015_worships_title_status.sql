-- 015_worships_title_status.sql
ALTER TABLE `worships`
  ADD COLUMN `title` VARCHAR(191) NOT NULL DEFAULT '' AFTER `name`,
  ADD COLUMN `status` ENUM('draft','published','archived') NOT NULL DEFAULT 'published' AFTER `icon`;

UPDATE `worships`
SET `title` = `name`
WHERE `title` = '';
