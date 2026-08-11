const db = require('../config/db');

async function createNotification(payload) {
  const { user_id = null, activity_id = null, title, body, channel = 'fcm', target = null, schedule_at = null, metadata = null, status = 'scheduled' } = payload;
  const [res] = await db.query('INSERT INTO notifications (user_id,activity_id,title,body,channel,delivery_metadata,scheduled_at,status,created_at) VALUES (?,?,?,?,?,?,?,?,NOW(3))', [user_id, activity_id, title, body, channel, target ? JSON.stringify(target) : null, schedule_at, status]);
  const [rows] = await db.query('SELECT * FROM notifications WHERE id = ? LIMIT 1', [res.insertId]);
  return rows[0];
}

async function getNotification(id) {
  const [rows] = await db.query('SELECT * FROM notifications WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function listNotifications({ userId, status, limit = 50, offset = 0 } = {}) {
  const where = [];
  const params = [];
  if (userId) { where.push('user_id = ?'); params.push(userId); }
  if (status) { where.push('status = ?'); params.push(status); }
  const sql = `SELECT * FROM notifications ${where.length? 'WHERE '+where.join(' AND ') : ''} ORDER BY id DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));
  const [rows] = await db.query(sql, params);
  return rows;
}

async function deleteNotification(id) {
  await db.query('DELETE FROM notifications WHERE id = ?', [id]);
  return true;
}

async function markSent(id, providerResponse = null) {
  await db.query('UPDATE notifications SET status = ?, sent_at = NOW(3), delivery_metadata = ? WHERE id = ?', ['sent', JSON.stringify(providerResponse), id]);
}

module.exports = { createNotification, getNotification, listNotifications, deleteNotification, markSent };
