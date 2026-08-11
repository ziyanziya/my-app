-- Configurable non-obligatory segments for the daily prayer wheel.
-- The five obligatory prayers are calculated on-device from the user's location
-- and are therefore intentionally not stored in this table.
CREATE TABLE IF NOT EXISTS `prayer_wheel_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(100) NOT NULL,
  `label` VARCHAR(191) NOT NULL,
  `anchor_type` ENUM('prayer','event') NOT NULL,
  `anchor_key` VARCHAR(100) NOT NULL,
  `offset_minutes` SMALLINT NOT NULL DEFAULT 0,
  `duration_minutes` SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  `sort_order` SMALLINT UNSIGNED NOT NULL,
  `reverse_text_direction` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_prayer_wheel_events_slug` (`slug`),
  KEY `idx_prayer_wheel_events_active_order` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `prayer_wheel_events`
  (`slug`, `label`, `anchor_type`, `anchor_key`, `offset_minutes`, `duration_minutes`, `sort_order`, `reverse_text_direction`, `is_active`, `notes`)
VALUES
  ('maghrib_adhkar', 'أذكار المساء', 'prayer', 'maghrib', -30, 20, 10, 1, 1, 'تبدأ قبل المغرب بنصف ساعة.'),
  ('maghrib_sunnah', 'سنة المغرب', 'prayer', 'maghrib', 15, 10, 30, 1, 1, 'بعد صلاة المغرب.'),
  ('surah_malik', 'سورة الملك', 'prayer', 'isha', 15, 15, 45, 1, 1, 'تأتي بعد صلاة العشاء.'),
  ('isha_sunnah', 'سنة العشاء', 'prayer', 'isha', 30, 10, 50, 1, 1, 'بعد صلاة العشاء وقراءة سورة الملك.'),
  ('qiyam_layl', 'قيام الليل', 'prayer', 'isha_fajr_midpoint', 0, 45, 60, 0, 1, 'يبدأ من منتصف الفترة بين العشاء والفجر.'),
  ('shaf_witr', 'الشفع والوتر', 'prayer', 'fajr', -180, 15, 70, 0, 1, 'قبل الفجر بثلاث ساعات.'),
  ('sleep_remembrance', 'أذكار النوم', 'event', 'shaf_witr', 15, 10, 80, 0, 1, 'تأتي بعد الشفع والوتر.'),
  ('tahajjud_prayer', 'صلاة التهجد', 'event', 'sleep_remembrance', 10, 45, 90, 0, 1, 'تبدأ بعد أذكار النوم وتبقى في الثلث الأخير من الليل.'),
  ('morning_supplication', 'الدعاء', 'event', 'tahajjud_prayer', 45, 15, 100, 0, 1, 'دعاء ما قبل الفجر.'),
  ('morning_quran', 'قراءة القرآن', 'prayer', 'fajr', 15, 20, 120, 1, 1, 'بعد الفجر بربع ساعة.'),
  ('sunnah_umrah', 'سنة العمرة', 'event', 'morning_quran', 20, 15, 130, 1, 1, 'تبدأ بعد قراءة القرآن.'),
  ('morning_adhkar', 'أذكار الصباح', 'event', 'sunnah_umrah', 15, 15, 140, 1, 1, 'تأتي بعد سنة العمرة.'),
  ('duha_prayer', 'صلاة الضحى', 'prayer', 'sunrise', 20, 10, 150, 1, 1, 'بعد الشروق بعشرين دقيقة.'),
  ('morning_dhikr_after_duha', 'الذكر', 'event', 'duha_prayer', 10, 15, 160, 1, 1, 'بعد صلاة الضحى.'),
  ('sunnah_zawal', 'صلاة الزوال', 'prayer', 'dhuhr', -20, 15, 170, 1, 1, 'قبل الظهر بعشرين دقيقة.'),
  ('dhuhr_sunnah', 'سنة صلاة الظهر', 'prayer', 'dhuhr', 10, 15, 190, 0, 1, 'بعد صلاة الظهر.'),
  ('after_dhuhr_dhikr', 'الذكر', 'prayer', 'dhuhr', 30, 15, 200, 1, 1, 'بعد سنة صلاة الظهر.'),
  ('quran_daily', 'الورد اليومي', 'prayer', 'dhuhr', 45, 20, 210, 0, 1, 'بعد الظهر.'),
  ('daily_supplication', 'الدعاء', 'event', 'quran_daily', 15, 15, 220, 0, 1, 'بعد الورد اليومي.')
ON DUPLICATE KEY UPDATE
  `label` = VALUES(`label`),
  `anchor_type` = VALUES(`anchor_type`),
  `anchor_key` = VALUES(`anchor_key`),
  `offset_minutes` = VALUES(`offset_minutes`),
  `duration_minutes` = VALUES(`duration_minutes`),
  `sort_order` = VALUES(`sort_order`),
  `reverse_text_direction` = VALUES(`reverse_text_direction`),
  `is_active` = VALUES(`is_active`),
  `notes` = VALUES(`notes`);
