const db = require('../config/db');

async function createContent({ activity_id, locale = 'ar', title = null, body = null, is_default = 0, version = 1 }) {
  const [res] = await db.query(
    'INSERT INTO activity_contents (activity_id,locale,title,body,is_default,version,created_at,updated_at) VALUES (?,?,?,?,?,?,NOW(3),NOW(3))',
    [activity_id, locale, title, body, is_default ? 1 : 0, version]
  );
  const [rows] = await db.query('SELECT * FROM activity_contents WHERE id = ? LIMIT 1', [res.insertId]);
  return rows[0];
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM activity_contents WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function updateContent(id, { locale, title, body, is_default, version }) {
  const fields = [];
  const vals = [];
  if (locale !== undefined) { fields.push('locale = ?'); vals.push(locale); }
  if (title !== undefined) { fields.push('title = ?'); vals.push(title); }
  if (body !== undefined) { fields.push('body = ?'); vals.push(body); }
  if (is_default !== undefined) { fields.push('is_default = ?'); vals.push(is_default ? 1 : 0); }
  if (version !== undefined) { fields.push('version = ?'); vals.push(version); }
  if (fields.length === 0) return findById(id);
  vals.push(id);
  const sql = `UPDATE activity_contents SET ${fields.join(', ')}, updated_at = NOW(3) WHERE id = ?`;
  await db.query(sql, vals);
  return findById(id);
}

async function deleteContent(id) {
  await db.query('DELETE FROM activity_contents WHERE id = ?', [id]);
  return true;
}

async function listByActivity(activity_id, { locale, q, is_default, version }) {
  const where = ['activity_id = ?'];
  const params = [activity_id];
  if (locale) { where.push('locale = ?'); params.push(locale); }
  if (is_default !== undefined) { where.push('is_default = ?'); params.push(is_default ? 1 : 0); }
  if (version !== undefined) { where.push('version = ?'); params.push(version); }
  if (q) { where.push('(title LIKE ? OR body LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const sql = `SELECT * FROM activity_contents WHERE ${where.join(' AND ')} ORDER BY is_default DESC, version DESC, created_at DESC`;
  const [rows] = await db.query(sql, params);
  return rows;
}

module.exports = { createContent, findById, updateContent, deleteContent, listByActivity };
