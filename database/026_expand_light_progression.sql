-- Expand the editable Light progression to five levels and ten Light achievements.
USE `elsirat_db`;

INSERT INTO `levels` (`id`, `slug`, `name`, `min_points`, `badge_icon`, `description`, `rank`, `icon`, `color`, `min_light`, `is_active`)
VALUES
  (1, 'beginner', 'مبتدئ', 0, NULL, 'بداية رحلة النور.', 1, 'auto_awesome', '#8B5E3C', 0, 1),
  (2, 'committed', 'ملتزم', 100, NULL, 'مواظب على خطواته اليومية.', 2, 'verified', '#4C8B6B', 250, 1),
  (3, 'devout', 'تقي', 500, NULL, 'يثبت على العبادة والتعلّم.', 3, 'wb_sunny', '#C6953E', 1000, 1),
  (4, 'steadfast', 'ثابت', 1500, NULL, 'سلوك مستمر وأثر واضح.', 4, 'military_tech', '#8E5CA7', 3000, 1),
  (5, 'radiant', 'مضيء', 4000, NULL, 'منارة للثبات والخير.', 5, 'emoji_events', '#D4A574', 7500, 1)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`), `min_points` = VALUES(`min_points`), `description` = VALUES(`description`),
  `rank` = VALUES(`rank`), `icon` = VALUES(`icon`), `color` = VALUES(`color`),
  `min_light` = VALUES(`min_light`), `is_active` = VALUES(`is_active`);

INSERT INTO `achievements` (`id`, `slug`, `title`, `description`, `criteria`, `points_reward`, `is_active`)
VALUES
  (106, 'light_25000', 'نور البصيرة', 'الوصول إلى 25,000 نور متراكم.', '{"type":"cumulative_light","target":25000}', 1000, 1),
  (107, 'light_50000', 'منارة السالك', 'الوصول إلى 50,000 نور متراكم.', '{"type":"cumulative_light","target":50000}', 2000, 1),
  (108, 'light_100000', 'ضياء الطريق', 'الوصول إلى 100,000 نور متراكم.', '{"type":"cumulative_light","target":100000}', 4000, 1),
  (109, 'light_250000', 'نور اليقين', 'الوصول إلى 250,000 نور متراكم.', '{"type":"cumulative_light","target":250000}', 7500, 1),
  (110, 'light_500000', 'سراج الهدى', 'الوصول إلى 500,000 نور متراكم.', '{"type":"cumulative_light","target":500000}', 15000, 1)
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`), `description` = VALUES(`description`), `criteria` = VALUES(`criteria`),
  `points_reward` = VALUES(`points_reward`), `is_active` = VALUES(`is_active`);

INSERT INTO `light_achievement_conditions` (`achievement_id`, `condition_type`, `source_scope`, `source_key`, `target_value`, `threshold`, `repeatable`, `is_active`)
VALUES
  (106, 'cumulative_light', 'light', 'total_awarded', 25000.00, 25000, 0, 1),
  (107, 'cumulative_light', 'light', 'total_awarded', 50000.00, 50000, 0, 1),
  (108, 'cumulative_light', 'light', 'total_awarded', 100000.00, 100000, 0, 1),
  (109, 'cumulative_light', 'light', 'total_awarded', 250000.00, 250000, 0, 1),
  (110, 'cumulative_light', 'light', 'total_awarded', 500000.00, 500000, 0, 1)
ON DUPLICATE KEY UPDATE
  `source_scope` = VALUES(`source_scope`), `source_key` = VALUES(`source_key`),
  `target_value` = VALUES(`target_value`), `threshold` = VALUES(`threshold`), `is_active` = VALUES(`is_active`);
