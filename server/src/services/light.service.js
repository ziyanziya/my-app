const lightRepo = require('../repositories/light.repo');
const db = require('../config/db');

const validScopes = ['prayer', 'wheel', 'activity', 'achievement', 'event', 'manual', 'system'];

function normalizeNumber(value) {
  return Number(Number(value || 0).toFixed(2));
}

async function ensureUserLightStats(userId) {
  let stats = await lightRepo.getUserLightStats(userId);
  if (!stats) {
    stats = await lightRepo.createUserLightStats(userId);
  }
  return stats;
}

async function calculateAmountFromRule(rule) {
  const base = normalizeNumber(rule.base_amount);
  const multiplier = Number(rule.multiplier || 1);
  let amount = normalizeNumber(base * multiplier);
  if (rule.max_amount !== null && rule.max_amount !== undefined) {
    amount = Math.min(amount, normalizeNumber(rule.max_amount));
  }
  return amount;
}

async function listRules({ active } = {}) {
  return lightRepo.listLightRules({ active });
}

async function getRule(id) {
  return lightRepo.findLightRuleById(id);
}

async function createRule(payload) {
  if (payload.source_scope && !validScopes.includes(payload.source_scope)) {
    const err = new Error('Invalid source_scope');
    err.status = 400;
    throw err;
  }
  return lightRepo.createLightRule(payload);
}

async function updateRule(id, payload) {
  if (payload.source_scope && !validScopes.includes(payload.source_scope)) {
    const err = new Error('Invalid source_scope');
    err.status = 400;
    throw err;
  }
  return lightRepo.updateLightRule(id, payload);
}

async function getUserStats(userId) {
  const stats = await lightRepo.getUserLightStats(userId);
  return stats || { user_id: userId, current_balance: 0, total_awarded: 0, total_spent: 0, total_revoked: 0, award_count: 0, spend_count: 0, current_streak_days: 0, longest_streak_days: 0, last_awarded_at: null, last_spent_at: null };
}

async function findRuleBySource(sourceScope, sourceKey) {
  return lightRepo.findLightRuleBySource(sourceScope, sourceKey);
}

async function getUserTransactions(userId, { limit = 1000, offset = 0 } = {}) {
  return lightRepo.getUserTransactions({ userId, limit, offset });
}

async function spendLightForUser(userId, options = {}) {
  const {
    amount,
    sourceScope: sourceScopeFromCamel,
    source_scope: sourceScopeFromSnake,
    sourceKey: sourceKeyFromCamel,
    source_key: sourceKeyFromSnake,
    externalReference: externalReferenceFromCamel,
    external_reference: externalReferenceFromSnake,
    idempotencyKey: idempotencyKeyFromCamel,
    idempotency_key: idempotencyKeyFromSnake,
    metadata,
    performedBy,
    performedByType = 'admin',
    reason,
    conn: externalConn,
  } = options;

  const sourceScope = sourceScopeFromCamel || sourceScopeFromSnake || 'manual';
  const sourceKey = sourceKeyFromCamel || sourceKeyFromSnake || null;
  const externalReference = externalReferenceFromCamel || externalReferenceFromSnake;
  const idempotencyKey = idempotencyKeyFromCamel || idempotencyKeyFromSnake;

  if (!amount || Number(amount) <= 0) {
    const err = new Error('Amount must be greater than zero');
    err.status = 400;
    throw err;
  }

  if (!validScopes.includes(sourceScope)) {
    const err = new Error('Invalid source_scope');
    err.status = 400;
    throw err;
  }

  if (idempotencyKey) {
    const existing = await lightRepo.findTransactionByIdempotency(userId, idempotencyKey);
    if (existing) return existing;
  }

  if (externalReference) {
    const existing = await lightRepo.findTransactionByReference(userId, externalReference);
    if (existing) return existing;
  }

  const ownsConnection = !externalConn;
  const conn = externalConn || await db.getConnection();
  const manageTransaction = ownsConnection;

  try {
    if (manageTransaction) {
      await conn.beginTransaction();
    }

    let stats = await lightRepo.getUserLightStats(userId);
    if (!stats) {
      stats = await lightRepo.createUserLightStats(userId);
    }

    const numericAmount = normalizeNumber(amount);
    const currentBalance = normalizeNumber(stats.current_balance || 0);
    if (currentBalance < numericAmount) {
      const err = new Error('Insufficient light balance');
      err.status = 409;
      throw err;
    }

    const balanceAfter = normalizeNumber(currentBalance - numericAmount);
    const transaction = await lightRepo.createLightTransaction(conn, {
      user_id: userId,
      rule_id: null,
      transaction_type: 'spend',
      source_scope: sourceScope,
      source_key: sourceKey,
      external_reference: externalReference || null,
      idempotency_key: idempotencyKey || null,
      amount: numericAmount,
      balance_after: balanceAfter,
      status: 'completed',
      metadata,
    });

    await lightRepo.updateUserLightStatsSpend(conn, userId, numericAmount);
    await lightRepo.logLightAudit(conn, {
      user_id: userId,
      transaction_id: transaction.id,
      worship_type: sourceScope,
      worship_key: sourceKey,
      amount: numericAmount,
      action: 'spend',
      reason: reason || 'Light spend',
      details: metadata || null,
      performed_by: performedBy || userId,
      performed_by_type: performedByType,
    });

    if (manageTransaction) {
      await conn.commit();
    }
    return transaction;
  } catch (error) {
    if (manageTransaction) {
      await conn.rollback();
    }
    throw error;
  } finally {
    if (ownsConnection && conn) conn.release();
  }
}

async function awardLightForUser(userId, options = {}) {
  const {
    ruleId: ruleIdFromCamel,
    rule_id: ruleIdFromSnake,
    sourceScope: sourceScopeFromCamel,
    source_scope: sourceScopeFromSnake,
    sourceKey: sourceKeyFromCamel,
    source_key: sourceKeyFromSnake,
    externalReference: externalReferenceFromCamel,
    external_reference: externalReferenceFromSnake,
    idempotencyKey: idempotencyKeyFromCamel,
    idempotency_key: idempotencyKeyFromSnake,
    metadata,
    performedBy,
    performedByType = 'system',
    reason,
    amount: requestedAmount,
    conn: externalConn,
  } = options;

  const ruleId = ruleIdFromCamel || ruleIdFromSnake;
  const sourceScope = sourceScopeFromCamel || sourceScopeFromSnake;
  const sourceKey = sourceKeyFromCamel || sourceKeyFromSnake;
  const externalReference = externalReferenceFromCamel || externalReferenceFromSnake;
  const idempotencyKey = idempotencyKeyFromCamel || idempotencyKeyFromSnake;

  if (!ruleId && !requestedAmount) {
    const err = new Error('Either ruleId or amount must be provided');
    err.status = 400;
    throw err;
  }

  if (!ruleId && requestedAmount && !sourceScope) {
    const err = new Error('source_scope is required when awarding by amount directly');
    err.status = 400;
    throw err;
  }

  if (idempotencyKey) {
    const existing = await lightRepo.findTransactionByIdempotency(userId, idempotencyKey);
    if (existing) return existing;
  }

  if (externalReference) {
    const existing = await lightRepo.findTransactionByReference(userId, externalReference);
    if (existing) return existing;
  }

  let rule = null;
  if (ruleId) {
    rule = await lightRepo.findLightRuleById(ruleId);
    if (!rule || !rule.is_active) {
      const err = new Error('Light rule not found or inactive');
      err.status = 404;
      throw err;
    }
  }

  if (!rule && sourceScope && !validScopes.includes(sourceScope)) {
    const err = new Error('Invalid source_scope');
    err.status = 400;
    throw err;
  }

  const ownsConnection = !externalConn;
  const conn = externalConn || await db.getConnection();
  const manageTransaction = ownsConnection;

  try {
    if (manageTransaction) {
      await conn.beginTransaction();
    }

    let stats = await lightRepo.getUserLightStats(userId);
    if (!stats) {
      stats = await lightRepo.createUserLightStats(userId);
    }

    let amount = 0;
    let ruleSourceScope = sourceScope || 'manual';
    let ruleSourceKey = sourceKey || null;

    if (rule) {
      ruleSourceScope = rule.source_scope;
      ruleSourceKey = rule.source_key;
      amount = await calculateAmountFromRule(rule);
      if (amount <= 0) {
        const err = new Error('Configured light rule produces zero award amount');
        err.status = 400;
        throw err;
      }
      if (rule.daily_limit) {
        const dailyTotal = await lightRepo.getDailyAwardedAmount(userId, rule.id);
        if (dailyTotal + amount > Number(rule.daily_limit)) {
          const err = new Error('Daily limit reached for this reward rule');
          err.status = 429;
          throw err;
        }
      }
      if (!rule.repeatable) {
        const already = await lightRepo.hasRecentDuplicateAward(userId, ruleSourceScope, ruleSourceKey);
        if (already) {
          const err = new Error('This reward has already been granted today');
          err.status = 409;
          throw err;
        }
      }
    } else {
      amount = normalizeNumber(requestedAmount);
      if (amount <= 0) {
        const err = new Error('Amount must be greater than zero');
        err.status = 400;
        throw err;
      }
    }

    const balanceAfter = normalizeNumber((stats.current_balance || 0) + amount);
    const transaction = await lightRepo.createLightTransaction(conn, {
      user_id: userId,
      rule_id: rule ? rule.id : null,
      transaction_type: 'award',
      source_scope: ruleSourceScope,
      source_key: ruleSourceKey,
      external_reference: externalReference || null,
      idempotency_key: idempotencyKey || null,
      amount,
      balance_after: balanceAfter,
      status: 'completed',
      metadata,
    });

    await lightRepo.updateUserLightStats(conn, userId, amount);
    await lightRepo.logLightAudit(conn, {
      user_id: userId,
      transaction_id: transaction.id,
      worship_type: ruleSourceScope,
      worship_key: ruleSourceKey,
      amount,
      action: 'award',
      reason: reason || 'Light award',
      details: metadata || null,
      performed_by: performedBy || userId,
      performed_by_type: performedByType,
    });

    if (manageTransaction) {
      await conn.commit();
    }
    return transaction;
  } catch (error) {
    if (manageTransaction) {
      await conn.rollback();
    }
    throw error;
  } finally {
    if (ownsConnection && conn) conn.release();
  }
}

module.exports = {
  listRules,
  getRule,
  createRule,
  updateRule,
  getUserStats,
  getUserTransactions,
  awardLightForUser,
  spendLightForUser,
  findRuleBySource,
  ensureUserLightStats,
};