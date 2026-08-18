const achievementRepo = require('../repositories/achievement.repo');
const userRepo = require('../repositories/user.repo');
const db = require('../config/db');

async function evaluateCriteria(userId, criteria, achievementId = null) {
  if (!criteria && !achievementId) return false;

  // 1. Check light_achievement_conditions if achievementId is present
  if (achievementId) {
    const [conditions] = await db.query(
      'SELECT * FROM light_achievement_conditions WHERE achievement_id = ? AND is_active = 1',
      [achievementId],
    );

    if (conditions.length > 0) {
      for (const cond of conditions) {
        if (cond.condition_type === 'cumulative_light') {
          const [statsRows] = await db.query(
            'SELECT COALESCE(total_awarded, 0) AS total, COALESCE(current_balance, 0) AS balance FROM user_light_stats WHERE user_id = ?',
            [userId],
          );
          const totalLight = statsRows[0] ? Number(statsRows[0].total) : 0;
          if (totalLight >= Number(cond.target_value || cond.threshold || 0)) {
            return true;
          }
        } else if (cond.condition_type === 'consecutive_days') {
          const [statsRows] = await db.query(
            'SELECT COALESCE(current_streak_days, 0) AS streak, COALESCE(longest_streak_days, 0) AS longest FROM user_light_stats WHERE user_id = ?',
            [userId],
          );
          const streak = statsRows[0] ? Math.max(Number(statsRows[0].streak), Number(statsRows[0].longest)) : 0;
          if (streak >= Number(cond.threshold || cond.target_value || 0)) {
            return true;
          }
        }
      }
    }
  }

  // 2. Evaluate JSON criteria object
  if (!criteria) return false;
  const c = typeof criteria === 'string' ? JSON.parse(criteria) : criteria;

  if (c.type === 'cumulative_light') {
    const [statsRows] = await db.query(
      'SELECT COALESCE(total_awarded, 0) AS total FROM user_light_stats WHERE user_id = ?',
      [userId],
    );
    const totalLight = statsRows[0] ? Number(statsRows[0].total) : 0;
    return totalLight >= (c.target || c.points || 0);
  }

  if (c.type === 'streak') {
    const [statsRows] = await db.query(
      'SELECT COALESCE(current_streak_days, 0) AS streak, COALESCE(longest_streak_days, 0) AS longest FROM user_light_stats WHERE user_id = ?',
      [userId],
    );
    const streak = statsRows[0] ? Math.max(Number(statsRows[0].streak), Number(statsRows[0].longest)) : 0;
    return streak >= (c.days || 1);
  }

  if (c.type === 'completed_activities') {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS c FROM user_progress WHERE user_id = ? AND status = "completed"',
      [userId],
    );
    return rows[0].c >= (c.count || 1);
  }

  if (c.type === 'total_points') {
    const user = await userRepo.findById(userId);
    return user && user.total_points >= (c.points || 0);
  }

  if (c.type === 'milestone') {
    if (c.activity_id) {
      const [rows] = await db.query(
        'SELECT COUNT(*) AS c FROM user_progress WHERE user_id = ? AND activity_id = ? AND status = "completed"',
        [userId, c.activity_id],
      );
      return rows[0].c >= (c.count || 1);
    }
  }

  return false;
}

async function awardAchievementToUser(userId, achievementId, metadata) {
  const already = await achievementRepo.hasUserUnlocked(userId, achievementId);
  if (already) return null;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [ins] = await conn.query(
      'INSERT INTO user_achievements (user_id,achievement_id,unlocked_at,metadata) VALUES (?,?,NOW(3),?)',
      [userId, achievementId, metadata ? JSON.stringify(metadata) : null],
    );

    const [achRows] = await conn.query('SELECT * FROM achievements WHERE id = ? LIMIT 1', [achievementId]);
    const achievement = achRows[0];
    const reward = (achievement && achievement.points_reward) ? achievement.points_reward : 0;

    if (reward > 0) {
      await conn.query('UPDATE users SET total_points = total_points + ?, updated_at = NOW(3) WHERE id = ?', [reward, userId]);
    }

    await conn.commit();
    const [rows] = await conn.query('SELECT * FROM user_achievements WHERE id = ? LIMIT 1', [ins.insertId]);
    return rows[0];
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function tryUnlockAchievementsForUser(userId) {
  const achievements = await achievementRepo.listAchievements({ active: true });
  const unlocked = [];
  for (const a of achievements) {
    const ok = await evaluateCriteria(userId, a.criteria, a.id);
    if (ok) {
      const res = await awardAchievementToUser(userId, a.id, { auto: true });
      if (res) unlocked.push({ achievement: a, record: res });
    }
  }
  return unlocked;
}

module.exports = { evaluateCriteria, awardAchievementToUser, tryUnlockAchievementsForUser };
