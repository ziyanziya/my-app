-- Add persistent position column for activities (used by prayer wheel ordering)
ALTER TABLE activities
  ADD COLUMN `position` INT NULL DEFAULT NULL AFTER `is_active`;

-- Initialize existing rows with their id as position (so a deterministic order)
UPDATE activities SET `position` = id WHERE `position` IS NULL;
