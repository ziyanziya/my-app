USE `elsirat_db`;

ALTER TABLE `users` 
  ADD COLUMN `avatar_url` VARCHAR(512) DEFAULT NULL;
