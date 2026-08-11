const db = require('../config/db');

async function createSection(payload) {
  const {
    worship_id,
    title,
    content,
    order_index = 0,
    reward_points = 0,
    status = 'draft',
  } = payload;

  const [result] = await db.query(
    'INSERT INTO theory_sections (worship_id, title, content, order_index, reward_points, status, created_at, updated_at) VALUES (?,?,?,?,?,NOW(3),NOW(3))',
    [worship_id, title, content, order_index, reward_points, status],
  );
  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM theory_sections WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function findByWorshipId(worshipId) {
  const [rows] = await db.query('SELECT * FROM theory_sections WHERE worship_id = ? ORDER BY order_index ASC, id ASC', [worshipId]);
  return rows;
}

async function updateSection(id, payload) {
  const fields = [];
  const values = [];
  const allowed = ['worship_id', 'title', 'content', 'order_index', 'reward_points', 'status'];
  for (const key of allowed) {
    if (payload[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(payload[key]);
    }
  }
  if (fields.length === 0) return findById(id);
  values.push(id);
  const sql = `UPDATE theory_sections SET ${fields.join(', ')}, updated_at = NOW(3) WHERE id = ?`;
  await db.query(sql, values);
  return findById(id);
}

async function deleteSection(id) {
  await db.query('DELETE FROM theory_sections WHERE id = ?', [id]);
  return true;
}

async function reorderSections(sections = []) {
  for (const section of sections) {
    const id = Number(section.id);
    const orderIndex = Number(section.order_index);
    if (!id) continue;
    await db.query('UPDATE theory_sections SET order_index = ?, updated_at = NOW(3) WHERE id = ?', [orderIndex, id]);
  }
  return true;
}

module.exports = { createSection, findById, findByWorshipId, updateSection, deleteSection, reorderSections };
