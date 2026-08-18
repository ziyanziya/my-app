const practicalStepRepo = require('../repositories/practicalStep.repo');
const lightService = require('./light.service');
const achievementService = require('./achievement.service');

async function createStep(payload) {
  return practicalStepRepo.createStep(payload);
}

async function updateStep(id, payload) {
  return practicalStepRepo.updateStep(id, payload);
}

async function deleteStep(id) {
  return practicalStepRepo.deleteStep(id);
}

async function reorderSteps(steps = []) {
  return practicalStepRepo.reorderSteps(steps);
}

async function getStepById(id) {
  return practicalStepRepo.findById(id);
}

async function getStepsByWorshipId(worshipId) {
  return practicalStepRepo.findByWorshipId(worshipId);
}

async function completePracticalStep(userId, stepId) {
  const step = await practicalStepRepo.findById(stepId);
  if (!step) {
    const err = new Error('الخطوة التطبيقية غير موجودة');
    err.status = 404;
    throw err;
  }

  const progress = await practicalStepRepo.saveUserPracticalProgress(userId, {
    worship_id: step.worship_id,
    step_id: stepId,
    completed: 1,
  });

  const rule = (await lightService.findRuleBySource('practical', String(stepId)))
    || (await lightService.findRuleBySource('practical', null));

  const amount = rule ? null : (Number(step.reward_points) || 25);

  let transaction = null;
  try {
    transaction = await lightService.awardLightForUser(userId, {
      ruleId: rule ? rule.id : null,
      amount,
      sourceScope: 'practical',
      sourceKey: String(stepId),
      idempotencyKey: `practical_complete:${userId}:${stepId}`,
      externalReference: `practical_step:${stepId}`,
      performedBy: userId,
      performedByType: 'user',
      reason: `إتمام خطوة تطبيقية: ${step.title}`,
      metadata: { stepId, worshipId: step.worship_id, title: step.title },
    });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY' || (e.message && e.message.includes('idempotency'))) {
      console.log('Practical step already completed and rewarded.');
    } else {
      throw e;
    }
  }

  try {
    await achievementService.tryUnlockAchievementsForUser(userId);
  } catch (e) {
    console.error('Error unlocking achievements on practical step complete:', e);
  }

  return { progress, transaction, awardedPoints: transaction ? transaction.amount : 0 };
}

async function getUserPracticalProgress(userId, worshipId) {
  return practicalStepRepo.getUserPracticalProgress(userId, worshipId);
}

module.exports = {
  createStep,
  updateStep,
  deleteStep,
  reorderSteps,
  getStepById,
  getStepsByWorshipId,
  completePracticalStep,
  getUserPracticalProgress,
};
