const db = require('../config/db');

async function listAll({ includeInactive = false } = {}) {
  const where = includeInactive ? '' : 'WHERE is_active = 1';
  const sql = `SELECT * FROM worships ${where} ORDER BY \`order\` ASC, id ASC`;
  const [rows] = await db.query(sql);
  return rows;
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM worships WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function createWorship(payload) {
  const {
    title,
    icon = null,
    description = null,
    status = 'published',
    time = null,
    points = 0,
    order = 0,
    is_active = 1,
  } = payload;
  const [result] = await db.query(
    'INSERT INTO worships (name, title, icon, description, status, time, points, `order`, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,NOW(3),NOW(3))',
    [title, title, icon, description, status, time, points, order, is_active ? 1 : 0],
  );
  return findById(result.insertId);
}

async function updateWorship(id, payload) {
  const fields = [];
  const values = [];
  const allowed = ['title', 'icon', 'description', 'status', 'time', 'points', 'order', 'is_active'];
  for (const key of allowed) {
    if (payload[key] !== undefined) {
      if (key === 'is_active') {
        fields.push(`${key} = ?`);
        values.push(payload[key] ? 1 : 0);
      } else {
        fields.push(`${key} = ?`);
        values.push(payload[key]);
      }
    }
  }
  if (fields.length === 0) return findById(id);
  values.push(id);
  const sql = `UPDATE worships SET ${fields.join(', ')}, updated_at = NOW(3) WHERE id = ?`;
  await db.query(sql, values);
  return findById(id);
}

async function deleteWorship(id) {
  await db.query('UPDATE worships SET is_active = 0, status = ?, updated_at = NOW(3) WHERE id = ?', ['archived', id]);
  return true;
}

async function getProgressForUser(userId) {
  const [rows] = await db.query('SELECT worship_id, completed, completed_at FROM user_worship_progress WHERE user_id = ?', [userId]);
  const map = {};
  rows.forEach(r => { map[r.worship_id] = r; });
  return map;
}

async function markComplete(userId, worshipId) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query('SELECT * FROM user_worship_progress WHERE user_id = ? AND worship_id = ? LIMIT 1', [userId, worshipId]);
    if (existing.length === 0) {
      await conn.query('INSERT INTO user_worship_progress (user_id, worship_id, completed, completed_at, created_at) VALUES (?,?,?,?,NOW(3))', [userId, worshipId, 1, new Date()]);
    } else {
      await conn.query('UPDATE user_worship_progress SET completed = 1, completed_at = NOW(3) WHERE user_id = ? AND worship_id = ?', [userId, worshipId]);
    }
    const [w] = await conn.query('SELECT points FROM worships WHERE id = ? LIMIT 1', [worshipId]);
    const points = (w[0] && w[0].points) ? w[0].points : 0;
    if (points > 0) {
      await conn.query('UPDATE users SET total_points = total_points + ? WHERE id = ?', [points, userId]);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

function getConnection() {
  return db.getConnection();
}

module.exports = { listAll, findById, createWorship, updateWorship, deleteWorship, getProgressForUser, markComplete, getConnection };
