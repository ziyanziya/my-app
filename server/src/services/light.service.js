const lightRepo = require('../repositories/light.repo');
const db = require('../config/db');

const DEFAULT_DAILY_LIGHT_GOAL = 100;

const validScopes = [
  'prayer',
  'wheel',
  'activity',
  'achievement',
  'event',
  'theory',
  'practical',
  'daily_checkin',
  'all_worships',
  'manual',
  'system',
];

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

async function deleteRule(id) {
  return lightRepo.deleteLightRule(id);
}

async function getUserStats(userId) {
  const [stats, dailyGoal] = await Promise.all([
    lightRepo.getUserLightStats(userId),
    getDailyLightGoal(),
  ]);
  const daily_awarded = await lightRepo.getTotalDailyAwarded(userId);
  if (stats) {
    stats.daily_awarded = daily_awarded;
    stats.daily_goal = dailyGoal;
    return stats;
  }
  return {
    user_id: userId,
    current_balance: 0,
    total_awarded: 0,
    daily_awarded: daily_awarded,
    daily_goal: dailyGoal,
    total_spent: 0,
    total_revoked: 0,
    award_count: 0,
    spend_count: 0,
    current_streak_days: 0,
    longest_streak_days: 0,
    last_awarded_at: null,
    last_spent_at: null,
  };
}

function normalizeDailyLightGoal(value) {
  let storedValue = value;
  try {
    if (typeof value === 'string') storedValue = JSON.parse(value);
  } catch {
    return DEFAULT_DAILY_LIGHT_GOAL;
  }
  const parsed = Number(storedValue);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_DAILY_LIGHT_GOAL;
}

async function getDailyLightGoal() {
  const [rows] = await db.query(
    "SELECT value FROM settings WHERE user_id IS NULL AND scope = 'global' AND setting_key = 'daily_light_goal' ORDER BY updated_at DESC, id DESC LIMIT 1",
  );
  return rows[0] ? normalizeDailyLightGoal(rows[0].value) : DEFAULT_DAILY_LIGHT_GOAL;
}

async function findRuleBySource(sourceScope, sourceKey) {
  return lightRepo.findLightRuleBySource(sourceScope, sourceKey);
}

async function findRuleBySlug(slug) {
  return lightRepo.findLightRuleBySlug(slug);
}

async function getUserTransactions(userId, { limit = 50, offset = 0 } = {}) {
  return lightRepo.getUserTransactions({ userId, limit, offset });
}

async function listAllTransactions(options = {}) {
  return lightRepo.listAllTransactions(options);
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
    ruleSlug,
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
  let sourceScope = sourceScopeFromCamel || sourceScopeFromSnake;
  let sourceKey = sourceKeyFromCamel || sourceKeyFromSnake;
  const externalReference = externalReferenceFromCamel || externalReferenceFromSnake;
  const idempotencyKey = idempotencyKeyFromCamel || idempotencyKeyFromSnake;

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
  } else if (ruleSlug) {
    rule = await lightRepo.findLightRuleBySlug(ruleSlug);
  } else if (sourceScope) {
    rule = await lightRepo.findLightRuleBySource(sourceScope, sourceKey);
  }

  if (!rule && !requestedAmount) {
    const err = new Error('No active light rule found and no amount provided');
    err.status = 400;
    throw err;
  }

  if (sourceScope && !validScopes.includes(sourceScope)) {
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

    let stats = await ensureUserLightStats(userId);

    if (idempotencyKey) {
      const already = await lightRepo.findTransactionByIdempotency(userId, idempotencyKey);
      if (already) {
        if (manageTransaction) await conn.rollback();
        return already;
      }
    }

    let amount = 0;
    let ruleSourceScope = sourceScope || (rule ? rule.source_scope : 'manual');
    let ruleSourceKey = sourceKey || (rule ? rule.source_key : null);

    if (rule) {
      ruleSourceScope = rule.source_scope;
      ruleSourceKey = rule.source_key || ruleSourceKey;
      amount = await calculateAmountFromRule(rule);
      if (requestedAmount && Number(requestedAmount) > 0) {
        amount = normalizeNumber(requestedAmount);
      }
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
      reason: reason || (rule ? rule.name : 'Light award'),
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

async function performDailyCheckin(userId) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const idempotencyKey = `daily_checkin:${userId}:${todayStr}`;

  const existing = await lightRepo.findTransactionByIdempotency(userId, idempotencyKey);
  let stats = await ensureUserLightStats(userId);

  if (existing) {
    return {
      alreadyCheckedIn: true,
      message: 'تم تسجيل النشاط اليومي مسبقاً لهذا اليوم',
      stats,
      transaction: existing,
    };
  }

  // Calculate streak
  let currentStreak = Number(stats.current_streak_days || 0);
  let longestStreak = Number(stats.longest_streak_days || 0);

  if (stats.last_awarded_at) {
    const lastDate = new Date(stats.last_awarded_at);
    const nowDate = new Date();
    const diffDays = Math.floor((nowDate - lastDate) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const conn = await db.getConnection();
  let transaction;
  let bonusAmount = 0;

  try {
    await conn.beginTransaction();

    transaction = await awardLightForUser(userId, {
      ruleSlug: 'daily_checkin',
      sourceScope: 'daily_checkin',
      sourceKey: 'daily_checkin',
      idempotencyKey,
      externalReference: `daily_checkin:${todayStr}`,
      performedBy: userId,
      performedByType: 'user',
      reason: `تسجيل النشاط اليومي (يوم ${currentStreak})`,
      metadata: { date: todayStr, streak: currentStreak },
      conn,
    });

    await lightRepo.updateUserStreak(conn, userId, currentStreak, longestStreak);

    // Check for streak milestone bonuses
    const milestoneDays = [7, 30, 45, 90, 180, 365];
    if (milestoneDays.includes(currentStreak)) {
      try {
        const bonusTx = await awardLightForUser(userId, {
          ruleSlug: `streak_${currentStreak}_days`,
          sourceScope: 'daily_checkin',
          sourceKey: `streak_${currentStreak}`,
          idempotencyKey: `streak_bonus:${userId}:${currentStreak}:${todayStr}`,
          externalReference: `streak_bonus:${currentStreak}`,
          performedBy: userId,
          performedByType: 'user',
          reason: `مكافأة المواظبة لـ ${currentStreak} يوماً`,
          conn,
        });
        bonusAmount = bonusTx.amount;
      } catch (err) {
        // Silently ignore if bonus rule is not defined
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const updatedStats = await lightRepo.getUserLightStats(userId);

  // Check milestone achievements
  try {
    const achievementService = require('./achievement.service');
    await achievementService.tryUnlockAchievementsForUser(userId);
  } catch (e) {
    console.error('Error unlocking achievements on checkin:', e);
  }

  let message = `بارك الله فيك! تم منحك ${transaction.amount} نور لتسجيل حضورك اليومي.`;
  if (bonusAmount > 0) {
    message += ` وحصلت على ${bonusAmount} نور إضافي لمواظبتك لـ ${currentStreak} يوماً!`;
  }

  return {
    alreadyCheckedIn: false,
    message,
    streak: currentStreak,
    transaction,
    bonusAmount,
    stats: updatedStats,
  };
}

async function checkAndAwardAllWorshipsBonus(userId, dateStr = null) {
  const todayStr = dateStr || new Date().toISOString().slice(0, 10);
  const idempotencyKey = `all_worships_daily:${userId}:${todayStr}`;

  const existing = await lightRepo.findTransactionByIdempotency(userId, idempotencyKey);
  if (existing) return existing;

  // Check if user completed all active worships
  const [totalWorshipsRows] = await db.query('SELECT COUNT(*) AS total FROM worships WHERE is_active = 1');
  const totalWorships = Number(totalWorshipsRows[0].total || 0);
  if (totalWorships === 0) return null;

  const [completedRows] = await db.query(
    'SELECT COUNT(DISTINCT worship_id) AS completed FROM user_worship_progress WHERE user_id = ? AND completed = 1 AND DATE(completed_at) = ?',
    [userId, todayStr],
  );
  const completed = Number(completedRows[0].completed || 0);

  if (completed >= totalWorships) {
    const transaction = await awardLightForUser(userId, {
      ruleSlug: 'all_worships_daily',
      sourceScope: 'all_worships',
      sourceKey: 'all_worships_daily',
      idempotencyKey,
      externalReference: `all_worships_daily:${todayStr}`,
      performedBy: userId,
      performedByType: 'system',
      reason: 'مكافأة كبرى: إتمام جميع عبادات اليوم كاملاً',
      metadata: { date: todayStr, totalCompleted: completed },
    });

    try {
      const achievementService = require('./achievement.service');
      await achievementService.tryUnlockAchievementsForUser(userId);
    } catch (e) {
      console.error('Error unlocking achievements on all worships bonus:', e);
    }

    return transaction;
  }

  return null;
}

module.exports = {
  listRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  getUserStats,
  getDailyLightGoal,
  getUserTransactions,
  listAllTransactions,
  awardLightForUser,
  spendLightForUser,
  findRuleBySource,
  findRuleBySlug,
  ensureUserLightStats,
  performDailyCheckin,
  checkAndAwardAllWorshipsBonus,
};
