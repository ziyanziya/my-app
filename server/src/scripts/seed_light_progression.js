const path = require('path');
const fs = require('fs');

async function seedProgression() {
  const db = require('../config/db');
  console.log('Starting seed progression...');
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    console.log('Seeding levels...');
    await conn.query(`
      INSERT INTO \`levels\` (\`id\`, \`slug\`, \`name\`, \`min_points\`, \`badge_icon\`, \`description\`, \`rank\`, \`icon\`, \`color\`, \`min_light\`, \`is_active\`)
      VALUES
        (1, 'beginner', 'مبتدئ', 0, NULL, 'بداية رحلة النور.', 1, 'auto_awesome', '#8B5E3C', 0, 1),
        (2, 'committed', 'ملتزم', 100, NULL, 'مواظب على خطواته اليومية.', 2, 'verified', '#4C8B6B', 250, 1),
        (3, 'devout', 'تقي', 500, NULL, 'يثبت على العبادة والتعلّم.', 3, 'wb_sunny', '#C6953E', 1000, 1),
        (4, 'steadfast', 'ثابت', 1500, NULL, 'سلوك مستمر وأثر واضح.', 4, 'military_tech', '#8E5CA7', 3000, 1),
        (5, 'radiant', 'مضيء', 4000, NULL, 'منارة للثبات والخير.', 5, 'emoji_events', '#D4A574', 7500, 1)
      ON DUPLICATE KEY UPDATE
        \`name\` = VALUES(\`name\`), \`min_points\` = VALUES(\`min_points\`), \`description\` = VALUES(\`description\`),
        \`rank\` = VALUES(\`rank\`), \`icon\` = VALUES(\`icon\`), \`color\` = VALUES(\`color\`),
        \`min_light\` = VALUES(\`min_light\`), \`is_active\` = VALUES(\`is_active\`)
    `);

    console.log('Seeding achievements 101-105...');
    await conn.query(`
      INSERT INTO \`achievements\` (\`id\`, \`slug\`, \`title\`, \`description\`, \`criteria\`, \`points_reward\`, \`is_active\`)
      VALUES
      (101, 'light_100', 'شعاع النور الأول', 'الوصول إلى رصيد 100 نور مبارك', '{"type":"cumulative_light","target":100}', 20, 1),
      (102, 'light_500', 'قبس الهدى', 'الوصول إلى رصيد 500 نور مبارك', '{"type":"cumulative_light","target":500}', 50, 1),
      (103, 'light_1000', 'منارة الإيمان', 'الوصول إلى رصيد 1,000 نور مبارك', '{"type":"cumulative_light","target":1000}', 100, 1),
      (104, 'light_5000', 'نور على نور', 'الوصول إلى رصيد 5,000 نور مبارك', '{"type":"cumulative_light","target":5000}', 250, 1),
      (105, 'light_10000', 'تاج الاستقامة', 'الوصول إلى رصيد 10,000 نور مبارك', '{"type":"cumulative_light","target":10000}', 500, 1)
      ON DUPLICATE KEY UPDATE
        \`title\` = VALUES(\`title\`),
        \`description\` = VALUES(\`description\`),
        \`criteria\` = VALUES(\`criteria\`)
    `);

    console.log('Seeding achievement conditions 101-105...');
    await conn.query(`
      INSERT INTO \`light_achievement_conditions\` (\`achievement_id\`, \`condition_type\`, \`source_scope\`, \`source_key\`, \`target_value\`, \`threshold\`, \`repeatable\`, \`is_active\`)
      VALUES
      (101, 'cumulative_light', 'light', 'total_awarded', 100.00, 100, 0, 1),
      (102, 'cumulative_light', 'light', 'total_awarded', 500.00, 500, 0, 1),
      (103, 'cumulative_light', 'light', 'total_awarded', 1000.00, 1000, 0, 1),
      (104, 'cumulative_light', 'light', 'total_awarded', 5000.00, 5000, 0, 1),
      (105, 'cumulative_light', 'light', 'total_awarded', 10000.00, 10000, 0, 1)
      ON DUPLICATE KEY UPDATE
        \`target_value\` = VALUES(\`target_value\`),
        \`is_active\` = VALUES(\`is_active\`)
    `);

    console.log('Seeding achievements 106-110...');
    await conn.query(`
      INSERT INTO \`achievements\` (\`id\`, \`slug\`, \`title\`, \`description\`, \`criteria\`, \`points_reward\`, \`is_active\`)
      VALUES
        (106, 'light_25000', 'نور البصيرة', 'الوصول إلى 25,000 نور متراكم.', '{"type":"cumulative_light","target":25000}', 1000, 1),
        (107, 'light_50000', 'منارة السالك', 'الوصول إلى 50,000 نور متراكم.', '{"type":"cumulative_light","target":50000}', 2000, 1),
        (108, 'light_100000', 'ضياء الطريق', 'الوصول إلى 100,000 نور متراكم.', '{"type":"cumulative_light","target":100000}', 4000, 1),
        (109, 'light_250000', 'نور اليقين', 'الوصول إلى 250,000 نور متراكم.', '{"type":"cumulative_light","target":250000}', 7500, 1),
        (110, 'light_500000', 'سراج الهدى', 'الوصول إلى 500,000 نور متراكم.', '{"type":"cumulative_light","target":500000}', 15000, 1)
      ON DUPLICATE KEY UPDATE
        \`title\` = VALUES(\`title\`), \`description\` = VALUES(\`description\`), \`criteria\` = VALUES(\`criteria\`),
        \`points_reward\` = VALUES(\`points_reward\`), \`is_active\` = VALUES(\`is_active\`)
    `);

    console.log('Seeding achievement conditions 106-110...');
    await conn.query(`
      INSERT INTO \`light_achievement_conditions\` (\`achievement_id\`, \`condition_type\`, \`source_scope\`, \`source_key\`, \`target_value\`, \`threshold\`, \`repeatable\`, \`is_active\`)
      VALUES
        (106, 'cumulative_light', 'light', 'total_awarded', 25000.00, 25000, 0, 1),
        (107, 'cumulative_light', 'light', 'total_awarded', 50000.00, 50000, 0, 1),
        (108, 'cumulative_light', 'light', 'total_awarded', 100000.00, 100000, 0, 1),
        (109, 'cumulative_light', 'light', 'total_awarded', 250000.00, 250000, 0, 1),
        (110, 'cumulative_light', 'light', 'total_awarded', 500000.00, 500000, 0, 1)
      ON DUPLICATE KEY UPDATE
        \`source_scope\` = VALUES(\`source_scope\`), \`source_key\` = VALUES(\`source_key\`),
        \`target_value\` = VALUES(\`target_value\`), \`threshold\` = VALUES(\`threshold\`), \`is_active\` = VALUES(\`is_active\`)
    `);

    await conn.commit();
    console.log('Done seeding levels and achievements.');
  } catch (err) {
    await conn.rollback();
    console.error('Error seeding data:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedProgression();
