const achievementRepo = require('../repositories/achievement.repo');
const userRepo = require('../repositories/user.repo');
const db = require('../config/db');

// Evaluate criteria. For flexibility, criteria is an object like { type: 'completed_activities', count: 10 }
// Supported criteria types: completed_activities, total_points, consecutive_days, custom (function not supported here)
async function evaluateCriteria(userId, criteria) {
  if (!criteria) return false;
  if (criteria.type === 'completed_activities') {
    const [rows] = await db.query('SELECT COUNT(*) AS c FROM user_progress WHERE user_id = ? AND status = "completed"', [userId]);
    return rows[0].c >= (criteria.count || 1);
  }
  if (criteria.type === 'total_points') {
    const user = await userRepo.findById(userId);
    return (user && user.total_points >= (criteria.points || 0));
  }
  if (criteria.type === 'milestone') {
    // milestone by activity completions in a category or similar. Simplified: check user_progress count for activity_id if provided
    if (criteria.activity_id) {
      const [rows] = await db.query('SELECT COUNT(*) AS c FROM user_progress WHERE user_id = ? AND activity_id = ? AND status = "completed"', [userId, criteria.activity_id]);
      return rows[0].c >= (criteria.count || 1);
    }
  }
  // fallback false
  return false;
}

async function awardAchievementToUser(userId, achievementId, metadata) {
  const already = await achievementRepo.hasUserUnlocked(userId, achievementId);
  if (already) return null;
  // start transaction: insert user_achievements and add points to user
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [ins] = await conn.query('INSERT INTO user_achievements (user_id,achievement_id,unlocked_at,metadata) VALUES (?,?,NOW(3),?)', [userId, achievementId, metadata?JSON.stringify(metadata):null]);
    const [achRows] = await conn.query('SELECT points_reward FROM achievements WHERE id = ? LIMIT 1', [achievementId]);
    const reward = (achRows[0] && achRows[0].points_reward) ? achRows[0].points_reward : 0;
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
  // list active achievements
  const achievements = await achievementRepo.listAchievements({ active: true });
  const unlocked = [];
  for (const a of achievements) {
    const ok = await evaluateCriteria(userId, a.criteria);
    if (ok) {
      const res = await awardAchievementToUser(userId, a.id, { auto: true });
      if (res) unlocked.push({ achievement: a, record: res });
    }
  }
  return unlocked;
}

module.exports = { evaluateCriteria, awardAchievementToUser, tryUnlockAchievementsForUser };
