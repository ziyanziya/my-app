-- The two repeated wheel segments share the same scientific content.
-- Archive their duplicate catalogue records while retaining the first record
-- for each label as the single content-management entry.
UPDATE `worships`
SET `is_active` = 0, `status` = 'archived', `updated_at` = NOW(3)
WHERE `wheel_key` IN ('after_dhuhr_dhikr', 'daily_supplication');
