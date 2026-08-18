const db = require('../config/db');

async function getUserInbox(userId, limit = 50, offset = 0) {
  const [rows] = await db.query(
    'SELECT id, title, body, data, read_at, created_at FROM notification_recipients WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [userId, Number(limit), Number(offset)]
  );
  
  const [countRows] = await db.query(
    'SELECT COUNT(*) as unreadCount FROM notification_recipients WHERE user_id = ? AND read_at IS NULL',
    [userId]
  );
  
  return { items: rows, unreadCount: countRows[0].unreadCount };
}

async function markAsRead(userId, notifId) {
  const [result] = await db.query(
    'UPDATE notification_recipients SET read_at = COALESCE(read_at, NOW(3)) WHERE user_id = ? AND id = ?',
    [userId, notifId]
  );
  return result.affectedRows > 0;
}

async function markAllAsRead(userId) {
  await db.query(
    'UPDATE notification_recipients SET read_at = NOW(3) WHERE user_id = ? AND read_at IS NULL',
    [userId]
  );
  return true;
}

module.exports = { getUserInbox, markAsRead, markAllAsRead };
