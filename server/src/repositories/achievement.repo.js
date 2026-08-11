const db = require('../config/db');

async function createAchievement(payload) {
  const { slug, title, description=null, criteria=null, points_reward=0, badge_icon=null, is_active=1 } = payload;
  const [res] = await db.query('INSERT INTO achievements (slug,title,description,criteria,points_reward,badge_icon,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,NOW(3),NOW(3))', [slug,title,description, JSON.stringify(criteria), points_reward, badge_icon, is_active?1:0]);
  const [rows] = await db.query('SELECT * FROM achievements WHERE id = ? LIMIT 1', [res.insertId]);
  return rows[0];
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM achievements WHERE id = ? LIMIT 1', [id]);
  if (!rows[0]) return null;
  const a = rows[0];
  try { a.criteria = JSON.parse(a.criteria); } catch (e) { /* leave raw */ }
  return a;
}

async function updateAchievement(id, payload) {
  const fields = [];
  const vals = [];
  if (payload.title !== undefined) { fields.push('title = ?'); vals.push(payload.title); }
  if (payload.description !== undefined) { fields.push('description = ?'); vals.push(payload.description); }
  if (payload.criteria !== undefined) { fields.push('criteria = ?'); vals.push(JSON.stringify(payload.criteria)); }
  if (payload.points_reward !== undefined) { fields.push('points_reward = ?'); vals.push(payload.points_reward); }
  if (payload.badge_icon !== undefined) { fields.push('badge_icon = ?'); vals.push(payload.badge_icon); }
  if (payload.is_active !== undefined) { fields.push('is_active = ?'); vals.push(payload.is_active ? 1 : 0); }
  if (fields.length===0) return findById(id);
  vals.push(id);
  const sql = `UPDATE achievements SET ${fields.join(', ')}, updated_at = NOW(3) WHERE id = ?`;
  await db.query(sql, vals);
  return findById(id);
}

async function listAchievements({ q, active } = {}) {
  const where = [];
  const params = [];
  if (q) { where.push('(title LIKE ? OR slug LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (active!==undefined) { where.push('is_active = ?'); params.push(active?1:0); }
  const sql = `SELECT * FROM achievements ${where.length? 'WHERE '+where.join(' AND '):''} ORDER BY id DESC`;
  const [rows] = await db.query(sql, params);
  rows.forEach(r => { try { r.criteria = JSON.parse(r.criteria); } catch (e) {} });
  return rows;
}

// user_achievements operations
async function unlockAchievementForUser(userId, achievementId, metadata=null) {
  const [res] = await db.query('INSERT INTO user_achievements (user_id,achievement_id,unlocked_at,metadata) VALUES (?,?,NOW(3),?)', [userId, achievementId, metadata?JSON.stringify(metadata):null]);
  const [rows] = await db.query('SELECT * FROM user_achievements WHERE id = ? LIMIT 1', [res.insertId]);
  return rows[0];
}

async function hasUserUnlocked(userId, achievementId) {
  const [rows] = await db.query('SELECT 1 FROM user_achievements WHERE user_id = ? AND achievement_id = ? LIMIT 1', [userId, achievementId]);
  return !!rows[0];
}

async function listUserAchievements(userId) {
  const [rows] = await db.query('SELECT ua.*, a.title, a.badge_icon, a.points_reward FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id WHERE ua.user_id = ? ORDER BY ua.unlocked_at DESC', [userId]);
  return rows;
}

module.exports = { createAchievement, findById, updateAchievement, listAchievements, unlockAchievementForUser, hasUserUnlocked, listUserAchievements };
