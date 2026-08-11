const db = require('../config/db');

async function createToken({ userId, token, expiresAt }) {
  const [result] = await db.query('INSERT INTO refresh_tokens (user_id, token, expires_at, revoked, created_at) VALUES (?,?,?,0,NOW(3))', [userId, token, expiresAt]);
  return result.insertId;
}

async function revokeToken(token) {
  await db.query('UPDATE refresh_tokens SET revoked = 1 WHERE token = ?', [token]);
}

async function findToken(token) {
  const [rows] = await db.query('SELECT * FROM refresh_tokens WHERE token = ? LIMIT 1', [token]);
  return rows[0];
}

module.exports = { createToken, revokeToken, findToken };
