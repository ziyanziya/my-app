INSERT IGNORE INTO light_rules (slug, name, source_scope, base_amount, repeatable, is_active) VALUES
('daily_checkin', 'تسجيل الدخول اليومي', 'system', 10.00, 1, 1),
('streak_7_days', 'مكافأة 7 أيام', 'system', 50.00, 1, 1),
('streak_30_days', 'مكافأة 30 يوم', 'system', 250.00, 1, 1),
('theory', 'إكمال قسم نظري', 'activity', 15.00, 0, 1),
('practical', 'إكمال خطوة عملية', 'activity', 25.00, 0, 1),
('all_worships_daily', 'إكمال جميع العبادات', 'system', 30.00, 1, 1);
