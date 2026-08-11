const db = require('../config/db');

async function createActivity(payload) {
  const {
    slug,
    category_id = null,
    title,
    icon = null,
    default_time = null,
    start_window = null,
    end_window = null,
    recurrence = null,
    points = 10,
    points_cap = null,
    is_active = 1,
    position = null,
    created_by = null,
  } = payload;

  const [result] = await db.query(
    `INSERT INTO activities (slug,category_id,title,icon,default_time,start_window,end_window,recurrence,points,points_cap,is_active,position,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(3),NOW(3))`,
    [slug, category_id, title, icon, default_time, start_window, end_window, recurrence ? JSON.stringify(recurrence) : null, points, points_cap, is_active ? 1 : 0, position, created_by]
  );
  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM activities WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function findByTitle(title) {
  const [rows] = await db.query('SELECT * FROM activities WHERE title = ? LIMIT 1', [title]);
  return rows[0];
}

async function getNextPosition() {
  const [rows] = await db.query('SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM activities WHERE deleted_at IS NULL');
  return Number(rows[0].next_position);
}

async function updateActivity(id, payload) {
  const fields = [];
  const values = [];
  const allowed = ['slug','category_id','title','icon','default_time','start_window','end_window','recurrence','points','points_cap','is_active'];
  
  // allow updating position (wheel order)
  // position can be null or integer
  if (payload.position !== undefined && !allowed.includes('position')) {
    allowed.push('position');
  }
  for (const key of allowed) {
    if (payload[key] !== undefined) {
      if (key === 'recurrence') {
        fields.push(`${key} = ?`);
        values.push(payload[key] ? JSON.stringify(payload[key]) : null);
      } else if (key === 'is_active') {
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
  const sql = `UPDATE activities SET ${fields.join(', ')}, updated_at = NOW(3) WHERE id = ?`;
  await db.query(sql, values);
  return findById(id);
}

async function updatePositions(updates = []) {
  if (!Array.isArray(updates) || updates.length === 0) return true;
  for (const u of updates) {
    const id = Number(u.id);
    const pos = u.position == null ? null : Number(u.position);
    if (!id) continue;
    await db.query('UPDATE activities SET position = ?, updated_at = NOW(3) WHERE id = ?', [pos, id]);
  }
  return true;
}

async function softDeleteActivity(id) {
  await db.query('UPDATE activities SET deleted_at = NOW(3), is_active = 0 WHERE id = ?', [id]);
  return true;
}

async function searchActivities({ q, category_id, is_active, min_points, max_points, sortBy = 'created_at', sortDir = 'DESC', limit = 20, offset = 0 }) {
  const where = ['deleted_at IS NULL'];
  const params = [];
  if (q) { where.push('(title LIKE ? OR slug LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (category_id !== undefined && category_id !== null) { where.push('category_id = ?'); params.push(category_id); }
  if (is_active !== undefined && is_active !== null) { where.push('is_active = ?'); params.push(is_active ? 1 : 0); }
  if (min_points !== undefined && min_points !== null) { where.push('points >= ?'); params.push(min_points); }
  if (max_points !== undefined && max_points !== null) { where.push('points <= ?'); params.push(max_points); }

  const allowedSort = ['created_at','points','title','id','position'];
  if (!allowedSort.includes(sortBy)) sortBy = 'created_at';
  sortDir = (String(sortDir).toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

  // `id` provides a stable tie-breaker for legacy rows with no position and
  // for any equal positions, so paging cannot shuffle wheel segments.
  const sql = `SELECT * FROM activities WHERE ${where.join(' AND ')} ORDER BY ${sortBy} ${sortDir}, id ${sortDir} LIMIT ? OFFSET ?`;
  params.push(Number(limit) || 20, Number(offset) || 0);
  try {
    const [rows] = await db.query(sql, params);
    return rows;
  } catch (err) {
    // If caller requested ordering by `position` but the column doesn't exist
    // (migration not applied), fallback to ordering by created_at to avoid 500.
    const msg = err && err.sqlMessage ? String(err.sqlMessage) : '';
    if (msg.includes("Unknown column 'position'") || msg.includes('Unknown column \"position\"')) {
      const fallbackSql = `SELECT * FROM activities WHERE ${where.join(' AND ')} ORDER BY created_at ${sortDir}, id ${sortDir} LIMIT ? OFFSET ?`;
      const [rows] = await db.query(fallbackSql, params);
      return rows;
    }
    throw err;
  }
}

module.exports = { createActivity, findById, findByTitle, getNextPosition, updateActivity, softDeleteActivity, searchActivities, updatePositions };
