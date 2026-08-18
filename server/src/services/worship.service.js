const worshipRepo = require('../repositories/worship.repo');
const lightService = require('./light.service');
const achievementService = require('./achievement.service');

async function listWorships({ userId = null, includeInactive = false } = {}) {
  const worships = await worshipRepo.listAll({ includeInactive });
  if (!userId) return worships;
  const prog = await worshipRepo.getProgressForUser(userId);
  return worships.map(w => ({ ...w, completed: Boolean(prog[w.id] && prog[w.id].completed) }));
}

async function getWorship(id) {
  return worshipRepo.findById(id);
}

async function createWorship(payload) {
  return worshipRepo.createWorship(payload);
}

async function updateWorship(id, payload) {
  return worshipRepo.updateWorship(id, payload);
}

async function deleteWorship(id) {
  return worshipRepo.deleteWorship(id);
}

async function completeWorship(userId, id) {
  const conn = await worshipRepo.getConnection();
  let worship = null;
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query('SELECT * FROM user_worship_progress WHERE user_id = ? AND worship_id = ? LIMIT 1', [userId, id]);
    if (existing.length === 0) {
      await conn.query('INSERT INTO user_worship_progress (user_id, worship_id, completed, completed_at, created_at) VALUES (?,?,?,NOW(3),NOW(3))', [userId, id, 1]);
    } else {
      await conn.query('UPDATE user_worship_progress SET completed = 1, completed_at = NOW(3) WHERE user_id = ? AND worship_id = ?', [userId, id]);
    }

    const [wRows] = await conn.query('SELECT * FROM worships WHERE id = ? LIMIT 1', [id]);
    worship = wRows[0];
    const points = (worship && worship.points) ? worship.points : 0;
    if (points > 0) {
      await conn.query('UPDATE users SET total_points = total_points + ? WHERE id = ?', [points, userId]);
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  // Award light for worship completion
  if (worship) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const rule = (await lightService.findRuleBySource('prayer', String(worship.id)))
      || (await lightService.findRuleBySource('prayer', worship.name || ''))
      || (await lightService.findRuleBySource('prayer', null));

    await lightService.awardLightForUser(userId, {
      ruleId: rule ? rule.id : null,
      amount: rule ? null : (worship.points || 15),
      sourceScope: 'prayer',
      sourceKey: String(worship.id),
      externalReference: `worship_complete:${worship.id}:${todayStr}`,
      idempotencyKey: `worship_complete:${userId}:${worship.id}:${todayStr}`,
      performedBy: userId,
      performedByType: 'user',
      reason: `إتمام عبادة: ${worship.name}`,
      metadata: { worshipId: worship.id, worshipName: worship.name, date: todayStr },
    });

    // Check if user completed all daily worships today and award bonus
    try {
      await lightService.checkAndAwardAllWorshipsBonus(userId, todayStr);
    } catch (e) {
      console.error('Error checking all worships bonus:', e);
    }

    // Try unlock milestone achievements
    try {
      await achievementService.tryUnlockAchievementsForUser(userId);
    } catch (e) {
      console.error('Error checking achievements on worship complete:', e);
    }
  }

  return { success: true, message: 'Worship completed successfully' };
}

module.exports = { listWorships, getWorship, createWorship, updateWorship, deleteWorship, completeWorship };
