const db = require('../config/db');

async function getSettings(req, res, next) {
  try {
    // 1. Get streak rules
    const [streakRules] = await db.query(
      "SELECT id, slug, name, base_amount FROM light_rules WHERE slug = 'daily_checkin' OR slug LIKE 'streak_%' ORDER BY base_amount ASC"
    );

    // 2. Build worshipTree (only for worships that are active)
    const [worshipsData] = await db.query("SELECT id, name, icon FROM worships WHERE is_active = 1 ORDER BY `order` ASC, id ASC");
    const [theorySections] = await db.query("SELECT id, worship_id, title, reward_points FROM theory_sections WHERE status != 'archived' ORDER BY order_index ASC");
    const [practicalSteps] = await db.query("SELECT id, worship_id, title, reward_points FROM practical_steps ORDER BY order_index ASC");

    const worshipTree = worshipsData.map(w => {
      return {
        id: w.id,
        name: w.name,
        icon: w.icon,
        theory_sections: theorySections.filter(ts => ts.worship_id === w.id),
        practical_steps: practicalSteps.filter(ps => ps.worship_id === w.id)
      };
    });

    res.json({
      success: true,
      data: {
        streaks: streakRules,
        worshipTree: worshipTree
      }
    });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { streaks, worshipTree } = req.body;

    // 1. Update streak rules
    if (streaks && Array.isArray(streaks)) {
      for (const rule of streaks) {
        if (rule.id) {
          await conn.query("UPDATE light_rules SET base_amount = ? WHERE id = ?", [rule.base_amount, rule.id]);
        } else {
          // insert new streak rule
          await conn.query(`
            INSERT INTO light_rules (slug, name, source_scope, base_amount, repeatable, is_active)
            VALUES (?, ?, 'daily_checkin', ?, 1, 1)
          `, [rule.slug, rule.name, rule.base_amount]);
        }
      }
    }

    // 2. Update worshipTree (only theory sections and practical steps)
    if (worshipTree && Array.isArray(worshipTree)) {
      for (const worship of worshipTree) {
        // update theory sections
        if (worship.theory_sections && Array.isArray(worship.theory_sections)) {
          for (const ts of worship.theory_sections) {
            await conn.query("UPDATE theory_sections SET reward_points = ? WHERE id = ?", [ts.reward_points, ts.id]);
          }
        }

        // update practical steps
        if (worship.practical_steps && Array.isArray(worship.practical_steps)) {
          for (const ps of worship.practical_steps) {
            await conn.query("UPDATE practical_steps SET reward_points = ? WHERE id = ?", [ps.reward_points, ps.id]);
          }
        }
      }
    }

    await conn.commit();
    res.json({ success: true, message: "تم حفظ الإعدادات بنجاح" });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

module.exports = {
  getSettings,
  updateSettings
};
