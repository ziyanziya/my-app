const db = require('../config/db');
const mediaRepo = require('./practicalStepMedia.repo');

async function attachMedia(steps) {
  if (!steps.length) return steps;
  const media = await mediaRepo.listByStepIds(steps.map((step) => step.id));
  const mediaByStep = new Map();
  media.forEach((item) => {
    const items = mediaByStep.get(item.practical_step_id) || [];
    items.push(item);
    mediaByStep.set(item.practical_step_id, items);
  });
  return steps.map((step) => ({ ...step, media: mediaByStep.get(step.id) || [] }));
}

async function createStep(payload) {
  const {
    worship_id,
    title,
    description = null,
    required_days = 0,
    reward_points = 0,
    order_index = 0,
  } = payload;

  const [result] = await db.query(
    'INSERT INTO practical_steps (worship_id, title, description, required_days, reward_points, order_index, created_at, updated_at) VALUES (?,?,?,?,?,?,NOW(3),NOW(3))',
    [worship_id, title, description, required_days, reward_points, order_index],
  );
  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM practical_steps WHERE id = ? LIMIT 1', [id]);
  return (await attachMedia(rows))[0];
}

async function findByWorshipId(worshipId) {
  const [rows] = await db.query('SELECT * FROM practical_steps WHERE worship_id = ? ORDER BY order_index ASC, id ASC', [worshipId]);
  return attachMedia(rows);
}

async function updateStep(id, payload) {
  const fields = [];
  const values = [];
  const allowed = ['worship_id', 'title', 'description', 'required_days', 'reward_points', 'order_index'];
  for (const key of allowed) {
    if (payload[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(payload[key]);
    }
  }
  if (fields.length === 0) return findById(id);
  values.push(id);
  const sql = `UPDATE practical_steps SET ${fields.join(', ')}, updated_at = NOW(3) WHERE id = ?`;
  await db.query(sql, values);
  return findById(id);
}

async function deleteStep(id) {
  await db.query('DELETE FROM practical_steps WHERE id = ?', [id]);
  return true;
}

async function reorderSteps(steps = []) {
  for (const step of steps) {
    const id = Number(step.id);
    const orderIndex = Number(step.order_index);
    if (!id) continue;
    await db.query('UPDATE practical_steps SET order_index = ?, updated_at = NOW(3) WHERE id = ?', [orderIndex, id]);
  }
  return true;
}

async function saveUserPracticalProgress(userId, { worship_id, step_id, completed = 1 }) {
  const [existing] = await db.query(
    'SELECT * FROM user_practical_progress WHERE user_id = ? AND step_id = ? LIMIT 1',
    [userId, step_id],
  );

  if (existing.length === 0) {
    const [result] = await db.query(
      'INSERT INTO user_practical_progress (user_id, worship_id, step_id, completed, completed_at, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(3), NOW(3), NOW(3))',
      [userId, worship_id, step_id, completed ? 1 : 0],
    );
    const [rows] = await db.query('SELECT * FROM user_practical_progress WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  await db.query(
    'UPDATE user_practical_progress SET completed = ?, completed_at = NOW(3), updated_at = NOW(3) WHERE id = ?',
    [completed ? 1 : 0, existing[0].id],
  );
  const [rows] = await db.query('SELECT * FROM user_practical_progress WHERE id = ?', [existing[0].id]);
  return rows[0];
}

async function getUserPracticalProgress(userId, worshipId) {
  const [rows] = await db.query(
    'SELECT * FROM user_practical_progress WHERE user_id = ? AND worship_id = ?',
    [userId, worshipId],
  );
  return rows;
}

module.exports = {
  createStep,
  findById,
  findByWorshipId,
  updateStep,
  deleteStep,
  reorderSteps,
  saveUserPracticalProgress,
  getUserPracticalProgress,
};
