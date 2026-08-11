-- The scientific-content catalogue must contain exactly the items displayed
-- by the prayer wheel: 19 configurable events plus the five obligatory prayers.
-- `wheel_key` is the stable relation between a wheel segment and its content.
ALTER TABLE `worships`
  ADD COLUMN `wheel_key` VARCHAR(100) DEFAULT NULL AFTER `title`,
  ADD UNIQUE KEY `ux_worships_wheel_key` (`wheel_key`);

-- Keep the existing ids so any theory sections and practical steps already
-- attached to a worship remain attached after this catalogue is corrected.
UPDATE `worships`
SET
  `name` = CASE `id`
    WHEN 1 THEN 'أذكار المساء'
    WHEN 2 THEN 'صلاة المغرب'
    WHEN 3 THEN 'سنة المغرب'
    WHEN 4 THEN 'صلاة العشاء'
    WHEN 5 THEN 'سورة الملك'
    WHEN 6 THEN 'سنة العشاء'
    WHEN 7 THEN 'قيام الليل'
    WHEN 8 THEN 'الشفع والوتر'
    WHEN 9 THEN 'أذكار النوم'
    WHEN 10 THEN 'صلاة التهجد'
    WHEN 11 THEN 'الدعاء'
    WHEN 12 THEN 'صلاة الفجر'
    WHEN 13 THEN 'قراءة القرآن'
    WHEN 14 THEN 'سنة العمرة'
    WHEN 15 THEN 'أذكار الصباح'
    WHEN 16 THEN 'صلاة الضحى'
    WHEN 17 THEN 'الذكر'
    WHEN 18 THEN 'صلاة الزوال'
    WHEN 19 THEN 'صلاة الظهر'
    WHEN 20 THEN 'سنة صلاة الظهر'
    WHEN 21 THEN 'الذكر'
    WHEN 22 THEN 'الورد اليومي'
    WHEN 23 THEN 'الدعاء'
    WHEN 24 THEN 'صلاة العصر'
  END,
  `title` = CASE `id`
    WHEN 1 THEN 'أذكار المساء'
    WHEN 2 THEN 'صلاة المغرب'
    WHEN 3 THEN 'سنة المغرب'
    WHEN 4 THEN 'صلاة العشاء'
    WHEN 5 THEN 'سورة الملك'
    WHEN 6 THEN 'سنة العشاء'
    WHEN 7 THEN 'قيام الليل'
    WHEN 8 THEN 'الشفع والوتر'
    WHEN 9 THEN 'أذكار النوم'
    WHEN 10 THEN 'صلاة التهجد'
    WHEN 11 THEN 'الدعاء'
    WHEN 12 THEN 'صلاة الفجر'
    WHEN 13 THEN 'قراءة القرآن'
    WHEN 14 THEN 'سنة العمرة'
    WHEN 15 THEN 'أذكار الصباح'
    WHEN 16 THEN 'صلاة الضحى'
    WHEN 17 THEN 'الذكر'
    WHEN 18 THEN 'صلاة الزوال'
    WHEN 19 THEN 'صلاة الظهر'
    WHEN 20 THEN 'سنة صلاة الظهر'
    WHEN 21 THEN 'الذكر'
    WHEN 22 THEN 'الورد اليومي'
    WHEN 23 THEN 'الدعاء'
    WHEN 24 THEN 'صلاة العصر'
  END,
  `wheel_key` = CASE `id`
    WHEN 1 THEN 'maghrib_adhkar'
    WHEN 2 THEN 'maghribPrayer'
    WHEN 3 THEN 'maghrib_sunnah'
    WHEN 4 THEN 'ishaPrayer'
    WHEN 5 THEN 'surah_malik'
    WHEN 6 THEN 'isha_sunnah'
    WHEN 7 THEN 'qiyam_layl'
    WHEN 8 THEN 'shaf_witr'
    WHEN 9 THEN 'sleep_remembrance'
    WHEN 10 THEN 'tahajjud_prayer'
    WHEN 11 THEN 'morning_supplication'
    WHEN 12 THEN 'fajrPrayer'
    WHEN 13 THEN 'morning_quran'
    WHEN 14 THEN 'sunnah_umrah'
    WHEN 15 THEN 'morning_adhkar'
    WHEN 16 THEN 'duha_prayer'
    WHEN 17 THEN 'morning_dhikr_after_duha'
    WHEN 18 THEN 'sunnah_zawal'
    WHEN 19 THEN 'dhuhrPrayer'
    WHEN 20 THEN 'dhuhr_sunnah'
    WHEN 21 THEN 'after_dhuhr_dhikr'
    WHEN 22 THEN 'quran_daily'
    WHEN 23 THEN 'daily_supplication'
    WHEN 24 THEN 'asrPrayer'
  END,
  `order` = `id`,
  `is_active` = 1,
  `status` = 'published',
  `updated_at` = NOW(3)
WHERE `id` BETWEEN 1 AND 24;

-- Any legacy worship outside the wheel catalogue must not appear in content management.
UPDATE `worships`
SET `is_active` = 0, `status` = 'archived', `wheel_key` = NULL, `updated_at` = NOW(3)
WHERE `id` NOT BETWEEN 1 AND 24;
