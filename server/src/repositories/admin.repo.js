const db = require('../config/db');

const safeLimit = (value, fallback = 20, max = 100) => Math.min(Math.max(Number(value) || fallback, 1), max);
const safeOffset = (value) => Math.max(Number(value) || 0, 0);

async function getDashboard() {
  const [[users], [active], [completed], [light], [recentUsers], [topUsers]] = await Promise.all([
    db.query('SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL'),
    db.query('SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL AND last_active_at >= CURDATE()'),
    db.query('SELECT COUNT(*) AS total FROM user_progress WHERE status = "completed"'),
    db.query('SELECT COALESCE(SUM(total_awarded), 0) AS total FROM user_light_stats'),
    db.query('SELECT id, name, email, created_at, is_active FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 6'),
    db.query('SELECT u.id, u.name, COALESCE(s.current_balance, 0) AS light FROM users u LEFT JOIN user_light_stats s ON s.user_id = u.id WHERE u.deleted_at IS NULL ORDER BY light DESC LIMIT 5'),
  ]);
  return { metrics: { totalUsers: users[0].total, activeToday: active[0].total, completedWorships: completed[0].total, totalLight: light[0].total }, recentUsers, topUsers };
}

async function listUsers({ search, status, limit, offset }) {
  const where = ['u.deleted_at IS NULL']; const values = [];
  if (search) { where.push('(u.name LIKE ? OR u.email LIKE ?)'); values.push(`%${search}%`, `%${search}%`); }
  if (status === 'active' || status === 'suspended') { where.push('u.is_active = ?'); values.push(status === 'active' ? 1 : 0); }
  const condition = where.join(' AND '); const pageLimit = safeLimit(limit); const pageOffset = safeOffset(offset);
  const [[count], [rows]] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total FROM users u WHERE ${condition}`, values),
    db.query(`SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.last_active_at, u.avatar_url, COALESCE(s.current_balance, 0) AS light, COALESCE(p.completed_count, 0) AS worship_count
      FROM users u LEFT JOIN user_light_stats s ON s.user_id = u.id
      LEFT JOIN (SELECT user_id, COUNT(*) AS completed_count FROM user_progress WHERE status = 'completed' GROUP BY user_id) p ON p.user_id = u.id
      WHERE ${condition} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`, [...values, pageLimit, pageOffset]),
  ]);
  return { items: rows, total: count[0].total, limit: pageLimit, offset: pageOffset };
}

async function findUser(id) { const [rows] = await db.query('SELECT id, name, email, role, is_active FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1', [id]); return rows[0] || null; }
async function updateUser(id, fields) {
  const allowed = ['name', 'role', 'is_active']; const assignments = []; const values = [];
  for (const key of allowed) if (fields[key] !== undefined) { assignments.push(`${key} = ?`); values.push(fields[key]); }
  if (!assignments.length) return findUser(id);
  values.push(id); await db.query(`UPDATE users SET ${assignments.join(', ')}, updated_at = NOW(3) WHERE id = ?`, values); return findUser(id);
}
async function audit({ adminId, action, entityType, entityId, before, after, ip }) {
  await db.query('INSERT INTO admin_audit_logs (admin_id, action, entity_type, entity_id, before_data, after_data, ip_address) VALUES (?,?,?,?,?,?,?)', [adminId, action, entityType, entityId, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, ip || null]);
}

module.exports = { getDashboard, listUsers, findUser, updateUser, audit };
