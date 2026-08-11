-- 023_remove_theory_section_reading_time.sql
-- أزل مدة القراءة بعد إلغاء عداد الأقسام العلمية من التطبيق ولوحة الإدارة.
ALTER TABLE `theory_sections`
  DROP COLUMN IF EXISTS `reading_time_seconds`;
