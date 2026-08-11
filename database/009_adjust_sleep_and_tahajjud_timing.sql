UPDATE `prayer_wheel_events`
SET `duration_minutes` = 10,
    `notes` = 'تأتي بعد الشفع والوتر.'
WHERE `slug` = 'sleep_remembrance';

UPDATE `prayer_wheel_events`
SET `offset_minutes` = 10,
    `duration_minutes` = 45,
    `notes` = 'تبدأ مباشرة بعد أذكار النوم وتبقى في الثلث الأخير من الليل.'
WHERE `slug` = 'tahajjud_prayer';
