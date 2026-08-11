const db = require('../config/db');

async function listAll() {
  const [rows] = await db.query('SELECT * FROM prayer_wheel_events ORDER BY sort_order ASC, id ASC');
  return rows;
}

async function updateEvent(id, payload) {
  const allowed = ['label', 'anchor_type', 'anchor_key', 'offset_minutes', 'duration_minutes', 'is_active'];
  const fields = [];
  const values = [];
  for (const key of allowed) {
    if (payload[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(key === 'is_active' ? (payload[key] ? 1 : 0) : payload[key]);
    }
  }
  if (fields.length) {
    values.push(id);
    await db.query(`UPDATE prayer_wheel_events SET ${fields.join(', ')}, updated_at = NOW(3) WHERE id = ?`, values);
  }
  const [rows] = await db.query('SELECT * FROM prayer_wheel_events WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function reorder(updates) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    for (const { id, sort_order } of updates) {
      await connection.query('UPDATE prayer_wheel_events SET sort_order = ?, updated_at = NOW(3) WHERE id = ?', [Number(sort_order), Number(id)]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { listAll, updateEvent, reorder };
