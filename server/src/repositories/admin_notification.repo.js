const db = require('../config/db');

async function createNotification(payload, createdBy) {
  const { title, body, audience_type, audience, type, priority, data, status, schedule_timezone, start_at, end_at, recurrence, idempotency_key } = payload;
  
  const [res] = await db.query(`
    INSERT INTO notification_campaigns 
    (type, title, body, data, audience_type, audience, priority, status, schedule_timezone, start_at, end_at, recurrence, next_run_at, created_by, idempotency_key, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))
  `, [
    type || 'announcement', 
    title, 
    body, 
    data ? JSON.stringify(data) : null,
    audience_type || 'all_users', 
    audience ? JSON.stringify(audience) : null,
    priority || 'normal',
    status || 'draft',
    schedule_timezone || 'UTC',
    start_at || null, 
    end_at || null, 
    recurrence ? JSON.stringify(recurrence) : null,
    // Calculate initial next_run_at for worker if scheduled/active
    (status === 'active' || status === 'scheduled') ? (start_at || new Date()) : null,
    createdBy,
    idempotency_key || null
  ]);
  return getNotification(res.insertId);
}

async function getNotification(id) {
  const [rows] = await db.query('SELECT * FROM notification_campaigns WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function listNotifications({ status, limit = 50, offset = 0 } = {}) {
  const where = [];
  const params = [];
  if (status) { where.push('status = ?'); params.push(status); }
  const sql = `SELECT * FROM notification_campaigns ${where.length? 'WHERE '+where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));
  const [rows] = await db.query(sql, params);
  
  const countSql = `SELECT COUNT(*) as total FROM notification_campaigns ${where.length? 'WHERE '+where.join(' AND ') : ''}`;
  const countParams = status ? [status] : [];
  const [countRows] = await db.query(countSql, countParams);
  
  return { items: rows, total: countRows[0].total };
}

async function updateNotification(id, payload) {
  const updates = [];
  const params = [];
  
  for (const [key, val] of Object.entries(payload)) {
    if (['type', 'title', 'body', 'audience_type', 'priority', 'status', 'schedule_timezone', 'start_at', 'end_at', 'idempotency_key'].includes(key)) {
      updates.push(`${key} = ?`);
      params.push(val);
    } else if (['data', 'audience', 'recurrence'].includes(key)) {
      updates.push(`${key} = ?`);
      params.push(val ? JSON.stringify(val) : null);
    }
  }
  
  // If status is changed to active, we might need to reset next_run_at
  if (payload.status === 'active' || payload.status === 'scheduled') {
     updates.push('next_run_at = ?');
     params.push(payload.start_at || new Date());
  } else if (payload.status === 'paused' || payload.status === 'cancelled') {
     updates.push('next_run_at = NULL');
  }

  if (updates.length === 0) return getNotification(id);
  
  params.push(id);
  await db.query(`UPDATE notification_campaigns SET ${updates.join(', ')} WHERE id = ?`, params);
  return getNotification(id);
}

async function deleteNotification(id) {
  await db.query('DELETE FROM notification_campaigns WHERE id = ?', [id]);
  return true;
}

module.exports = { createNotification, getNotification, listNotifications, updateNotification, deleteNotification };
