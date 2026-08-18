const db = require('../config/db');

async function listLightRules({ active } = {}) {
  const where = [];
  const params = [];
  if (active !== undefined) {
    where.push('is_active = ?');
    params.push(active ? 1 : 0);
  }
  const sql = `SELECT * FROM light_rules ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id ASC`;
  const [rows] = await db.query(sql, params);
  return rows;
}

async function findLightRuleById(id) {
  const [rows] = await db.query('SELECT * FROM light_rules WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function findLightRuleBySlug(slug) {
  const [rows] = await db.query('SELECT * FROM light_rules WHERE slug = ? AND is_active = 1 LIMIT 1', [slug]);
  return rows[0];
}

async function findLightRuleBySource(sourceScope, sourceKey) {
  if (sourceKey) {
    const [rows] = await db.query(
      'SELECT * FROM light_rules WHERE source_scope = ? AND (source_key = ? OR slug = ?) AND is_active = 1 LIMIT 1',
      [sourceScope, sourceKey, sourceKey],
    );
    if (rows[0]) return rows[0];
  }
  // fallback to generic scope rule where source_key is null or empty
  const [generic] = await db.query(
    'SELECT * FROM light_rules WHERE source_scope = ? AND (source_key IS NULL OR source_key = "" OR source_key = "generic") AND is_active = 1 ORDER BY id ASC LIMIT 1',
    [sourceScope],
  );
  return generic[0] || null;
}

async function createLightRule(payload) {
  const {
    slug,
    name,
    description,
    source_scope,
    source_key,
    base_amount,
    multiplier,
    max_amount,
    daily_limit,
    cooldown_minutes,
    repeatable,
    is_active,
    config,
  } = payload;

  const [result] = await db.query(
    `INSERT INTO light_rules (slug,name,description,source_scope,source_key,base_amount,multiplier,max_amount,daily_limit,cooldown_minutes,repeatable,is_active,config,created_at,updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [slug, name, description, source_scope, source_key || null, base_amount, multiplier || 1, max_amount, daily_limit, cooldown_minutes, repeatable ? 1 : 0, is_active !== undefined ? (is_active ? 1 : 0) : 1, config ? JSON.stringify(config) : null],
  );

  return findLightRuleById(result.insertId);
}

async function updateLightRule(id, payload) {
  const fields = [];
  const values = [];

  const mapping = {
    slug: 'slug = ?',
    name: 'name = ?',
    description: 'description = ?',
    source_scope: 'source_scope = ?',
    source_key: 'source_key = ?',
    base_amount: 'base_amount = ?',
    multiplier: 'multiplier = ?',
    max_amount: 'max_amount = ?',
    daily_limit: 'daily_limit = ?',
    cooldown_minutes: 'cooldown_minutes = ?',
    repeatable: 'repeatable = ?',
    is_active: 'is_active = ?',
    config: 'config = ?',
  };

  Object.keys(mapping).forEach((key) => {
    if (payload[key] !== undefined) {
      fields.push(mapping[key]);
      if (key === 'config') {
        values.push(payload.config ? JSON.stringify(payload.config) : null);
      } else if (key === 'repeatable' || key === 'is_active') {
        values.push(payload[key] ? 1 : 0);
      } else {
        values.push(payload[key]);
      }
    }
  });

  if (fields.length === 0) return findLightRuleById(id);

  values.push(id);
  const sql = `UPDATE light_rules SET ${fields.join(', ')}, updated_at = NOW(3) WHERE id = ?`;
  await db.query(sql, values);
  return findLightRuleById(id);
}

async function deleteLightRule(id) {
  const [result] = await db.query('DELETE FROM light_rules WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function findTransactionByIdempotency(userId, idempotencyKey) {
  if (!idempotencyKey) return null;
  const [rows] = await db.query('SELECT * FROM light_transactions WHERE user_id = ? AND idempotency_key = ? LIMIT 1', [userId, idempotencyKey]);
  return rows[0];
}

async function findTransactionByReference(userId, externalReference) {
  if (!externalReference) return null;
  const [rows] = await db.query('SELECT * FROM light_transactions WHERE user_id = ? AND external_reference = ? LIMIT 1', [userId, externalReference]);
  return rows[0];
}

async function getUserLightStats(userId) {
  const [rows] = await db.query('SELECT * FROM user_light_stats WHERE user_id = ? LIMIT 1', [userId]);
  return rows[0] || null;
}

async function createUserLightStats(userId) {
  await db.query('INSERT INTO user_light_stats (user_id,current_balance,total_awarded,total_spent,total_revoked,award_count,spend_count,current_streak_days,longest_streak_days,updated_at) VALUES (?,0,0,0,0,0,0,0,0,NOW(3))', [userId]);
  return getUserLightStats(userId);
}

async function createLightTransaction(conn, payload) {
  const {
    user_id,
    rule_id,
    transaction_type,
    source_scope,
    source_key,
    external_reference,
    idempotency_key,
    amount,
    balance_after,
    status,
    metadata,
  } = payload;

  const [result] = await conn.query(
    `INSERT INTO light_transactions (user_id,rule_id,transaction_type,source_scope,source_key,external_reference,idempotency_key,amount,balance_after,status,metadata,created_at,updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [user_id, rule_id, transaction_type, source_scope, source_key, external_reference, idempotency_key, amount, balance_after, status, metadata ? JSON.stringify(metadata) : null],
  );
  const [rows] = await conn.query('SELECT * FROM light_transactions WHERE id = ? LIMIT 1', [result.insertId]);
  return rows[0];
}

async function updateUserLightStats(conn, userId, amount) {
  await conn.query(
    `UPDATE user_light_stats
     SET current_balance = current_balance + ?,
         total_awarded = total_awarded + ?,
         award_count = award_count + 1,
         last_awarded_at = NOW(3),
         updated_at = NOW(3)
     WHERE user_id = ?`,
    [amount, amount, userId],
  );
}

async function updateUserStreak(conn, userId, currentStreak, longestStreak) {
  await conn.query(
    `UPDATE user_light_stats
     SET current_streak_days = ?,
         longest_streak_days = ?,
         updated_at = NOW(3)
     WHERE user_id = ?`,
    [currentStreak, longestStreak, userId],
  );
}

async function updateUserLightStatsSpend(conn, userId, amount) {
  await conn.query(
    `UPDATE user_light_stats
     SET current_balance = current_balance - ?,
         total_spent = total_spent + ?,
         spend_count = spend_count + 1,
         last_spent_at = NOW(3),
         updated_at = NOW(3)
     WHERE user_id = ?`,
    [amount, amount, userId],
  );
}

async function logLightAudit(conn, payload) {
  const {
    user_id,
    transaction_id,
    worship_type,
    worship_key,
    amount,
    action,
    reason,
    details,
    performed_by,
    performed_by_type,
  } = payload;

  const [result] = await conn.query(
    `INSERT INTO light_audit_logs (user_id,transaction_id,worship_type,worship_key,amount,action,reason,details,performed_by,performed_by_type,performed_at,created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [user_id, transaction_id, worship_type, worship_key, amount, action, reason, details ? JSON.stringify(details) : null, performed_by, performed_by_type],
  );
  const [rows] = await conn.query('SELECT * FROM light_audit_logs WHERE id = ? LIMIT 1', [result.insertId]);
  return rows[0];
}

async function getUserTransactions({ userId, limit = 50, offset = 0 }) {
  const [rows] = await db.query(
    'SELECT * FROM light_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [userId, Number(limit), Number(offset)],
  );
  return rows;
}

async function listAllTransactions({ limit = 50, offset = 0, type, search } = {}) {
  const where = [];
  const params = [];

  if (type) {
    where.push('t.transaction_type = ?');
    params.push(type);
  }

  if (search) {
    where.push('(u.name LIKE ? OR u.email LIKE ? OR t.source_scope LIKE ? OR t.source_key LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) AS total FROM light_transactions t LEFT JOIN users u ON u.id = t.user_id ${whereClause}`;
  const [countRows] = await db.query(countSql, params);
  const total = Number(countRows[0].total || 0);

  const querySql = `
    SELECT t.*, u.name AS user_name, u.email AS user_email, r.name AS rule_name
    FROM light_transactions t
    LEFT JOIN users u ON u.id = t.user_id
    LEFT JOIN light_rules r ON r.id = t.rule_id
    ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.query(querySql, [...params, Number(limit), Number(offset)]);

  return { total, rows };
}

async function findTransactionById(id) {
  const [rows] = await db.query('SELECT * FROM light_transactions WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function getDailyAwardedAmount(userId, ruleId) {
  const [rows] = await db.query(
    'SELECT COALESCE(SUM(amount),0) AS total FROM light_transactions WHERE user_id = ? AND rule_id = ? AND transaction_type = ? AND DATE(created_at) = CURRENT_DATE()',
    [userId, ruleId, 'award'],
  );
  return Number(rows[0].total || 0);
}

async function getTotalDailyAwarded(userId) {
  const [rows] = await db.query(
    'SELECT COALESCE(SUM(amount),0) AS total FROM light_transactions WHERE user_id = ? AND transaction_type = ? AND DATE(created_at) = CURRENT_DATE()',
    [userId, 'award'],
  );
  return Number(rows[0].total || 0);
}

module.exports = {
  getTotalDailyAwarded,
  listLightRules,
  findLightRuleById,
  findLightRuleBySlug,
  findLightRuleBySource,
  createLightRule,
  updateLightRule,
  deleteLightRule,
  findTransactionByIdempotency,
  findTransactionByReference,
  getUserLightStats,
  createUserLightStats,
  createLightTransaction,
  updateUserLightStats,
  updateUserStreak,
  updateUserLightStatsSpend,
  logLightAudit,
  getUserTransactions,
  listAllTransactions,
  findTransactionById,
  getDailyAwardedAmount,
};
