const db = require('../config/db');

async function listByStepIds(stepIds) {
  if (!stepIds.length) return [];
  const [rows] = await db.query(
    `SELECT * FROM practical_step_media
     WHERE practical_step_id IN (${stepIds.map(() => '?').join(', ')})
     ORDER BY practical_step_id ASC, order_index ASC, id ASC`,
    stepIds,
  );
  return rows;
}

async function createMedia(payload) {
  const { practical_step_id, media_type, url, original_name = null, mime_type = null, file_size = null, title = null, order_index = 0 } = payload;
  const [result] = await db.query(
    `INSERT INTO practical_step_media
      (practical_step_id, media_type, url, original_name, mime_type, file_size, title, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [practical_step_id, media_type, url, original_name, mime_type, file_size, title, order_index],
  );
  const [rows] = await db.query('SELECT * FROM practical_step_media WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM practical_step_media WHERE id = ?', [id]);
  return rows[0] || null;
}

async function remove(id) {
  await db.query('DELETE FROM practical_step_media WHERE id = ?', [id]);
}

module.exports = { listByStepIds, createMedia, findById, remove };
