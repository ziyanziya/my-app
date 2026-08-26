const db = require('../config/db');

async function findByEmail(email) {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0];
}

async function findById(id) {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function createUser({ uuid, name, email, phone, password_hash, timezone, locale, role = 'user' }) {
  const [result] = await db.query(
    `INSERT INTO users (uuid,name,email,phone,password_hash,timezone,locale,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,NOW(3),NOW(3))`,
    [uuid, name, email, phone, password_hash, timezone, locale, role]
  );
  return findById(result.insertId);
}

async function setVerificationToken(userId, token, expiresAt) {
  await db.query('UPDATE users SET verification_token = ?, verification_expires_at = ? WHERE id = ?', [token, expiresAt, userId]);
}

async function verifyEmailByToken(token) {
  const [rows] = await db.query('SELECT * FROM users WHERE verification_token = ? LIMIT 1', [token]);
  if (!rows[0]) return null;
  return rows[0];
}

async function markEmailVerified(userId) {
  await db.query('UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires_at = NULL WHERE id = ?', [userId]);
}

async function setResetTokenByEmail(email, token, expiresAt) {
  await db.query('UPDATE users SET reset_token = ?, reset_expires_at = ? WHERE email = ?', [token, expiresAt, email]);
}

async function findByResetToken(token) {
  const [rows] = await db.query('SELECT * FROM users WHERE reset_token = ? LIMIT 1', [token]);
  return rows[0];
}

async function updatePassword(userId, password_hash) {
  await db.query('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires_at = NULL, updated_at = NOW(3) WHERE id = ?', [password_hash, userId]);
}

async function updateUser(userId, { name, phone, timezone, locale }) {
  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
  if (timezone !== undefined) { fields.push('timezone = ?'); values.push(timezone); }
  if (locale !== undefined) { fields.push('locale = ?'); values.push(locale); }
  if (fields.length === 0) return findById(userId);
  values.push(userId);
  const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW(3) WHERE id = ?`;
  await db.query(sql, values);
  return findById(userId);
}

async function setAvatarUrl(userId, url) {
  await db.query('UPDATE users SET avatar_url = ?, updated_at = NOW(3) WHERE id = ?', [url, userId]);
  return findById(userId);
}

async function getStats(userId) {
  // basic stats: total_points and completed count
  const [userRows] = await db.query('SELECT total_points, level_id FROM users WHERE id = ? LIMIT 1', [userId]);
  const user = userRows[0];
  const [[{ completedCount }]] = await Promise.all([
    db.query('SELECT COUNT(*) AS completedCount FROM user_progress WHERE user_id = ? AND status = "completed"', [userId])
  ]).then((res) => res.map(r => r[0]));

  const [levelRows] = await db.query('SELECT id, name, min_points FROM levels WHERE id = ? LIMIT 1', [user.level_id]);
  const level = levelRows[0] || null;

  return {
    totalPoints: user ? user.total_points : 0,
    completedCount: completedCount || 0,
    currentLevel: level || null,
  };
}

async function getSettings(userId) {
  const [rows] = await db.query('SELECT setting_key, value FROM settings WHERE user_id = ? OR (user_id IS NULL AND scope = "global")', [userId]);
  const out = {};
  rows.forEach(r => { try { out[r.setting_key] = JSON.parse(r.value); } catch (e) { out[r.setting_key] = r.value; } });
  return out;
}

async function upsertSetting(userId, key, value) {
  const v = JSON.stringify(value);
  await db.query('INSERT INTO settings (user_id, scope, setting_key, value, updated_at) VALUES (?,?,?,?,NOW(3)) ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW(3)', [userId, 'user', key, v]);
  return getSettings(userId);
}

async function findTheoryProgress(userId, worshipId) {
  const [rows] = await db.query(
    'SELECT * FROM user_theory_progress WHERE user_id = ? AND worship_id = ? ORDER BY section_id ASC',
    [userId, worshipId],
  );
  return rows;
}

async function findTheoryProgressById(id, userId) {
  const params = [id];
  let sql = 'SELECT * FROM user_theory_progress WHERE id = ?';
  if (userId) {
    sql += ' AND user_id = ?';
    params.push(userId);
  }
  sql += ' LIMIT 1';
  const [rows] = await db.query(sql, params);
  return rows[0];
}

async function saveTheoryProgress(userId, { worship_id, section_id, completed = 1, completed_at = null }) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query('SELECT * FROM user_theory_progress WHERE user_id = ? AND section_id = ? LIMIT 1', [userId, section_id]);
    if (existing.length === 0) {
      const [result] = await conn.query(
        'INSERT INTO user_theory_progress (user_id, worship_id, section_id, completed, completed_at, created_at, updated_at) VALUES (?,?,?,?,IF(?, COALESCE(?, NOW(3)), NULL),NOW(3),NOW(3))',
        [userId, worship_id, section_id, completed ? 1 : 0, completed ? 1 : 0, completed_at],
      );
      const [rows] = await conn.query('SELECT * FROM user_theory_progress WHERE id = ? AND user_id = ? LIMIT 1', [result.insertId, userId]);
      const data = rows[0];
      await conn.commit();
      return data;
    }
    await conn.query(
      'UPDATE user_theory_progress SET worship_id = ?, completed = ?, completed_at = IF(?, COALESCE(?, NOW(3)), NULL), updated_at = NOW(3) WHERE id = ?',
      [worship_id, completed ? 1 : 0, completed ? 1 : 0, completed_at, existing[0].id],
    );
    const [rows] = await conn.query('SELECT * FROM user_theory_progress WHERE id = ? AND user_id = ? LIMIT 1', [existing[0].id, userId]);
    const data = rows[0];
    await conn.commit();
    return data;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function updateTheoryProgress(id, userId, payload) {
  const fields = [];
  const values = [];
  const allowed = ['worship_id', 'section_id', 'completed', 'completed_at'];
  for (const key of allowed) {
    if (payload[key] !== undefined) {
      if (key === 'completed') {
        fields.push(`${key} = ?`);
        values.push(payload[key] ? 1 : 0);
      } else {
        fields.push(`${key} = ?`);
        values.push(payload[key]);
      }
    }
  }
  if (fields.length === 0) return findTheoryProgressById(id, userId);
  values.push(id, userId);
  const sql = `UPDATE user_theory_progress SET ${fields.join(', ')}, updated_at = NOW(3) WHERE id = ? AND user_id = ?`;
  const [result] = await db.query(sql, values);
  if (result.affectedRows === 0) return null;
  return findTheoryProgressById(id, userId);
}

async function getLastTheoryProgress(userId) {
  const [rows] = await db.query(
    'SELECT * FROM user_theory_progress WHERE user_id = ? ORDER BY completed_at DESC, updated_at DESC, id DESC LIMIT 1',
    [userId],
  );
  return rows[0];
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  setVerificationToken,
  verifyEmailByToken,
  markEmailVerified,
  setResetTokenByEmail,
  findByResetToken,
  updatePassword,
  updateUser,
  setAvatarUrl,
  getStats,
  getSettings,
  upsertSetting,
  findTheoryProgress,
  findTheoryProgressById,
  saveTheoryProgress,
  updateTheoryProgress,
  getLastTheoryProgress,
};
