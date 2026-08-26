const userRepo = require('../repositories/user.repo');
const lightService = require('./light.service');
const achievementService = require('./achievement.service');
const db = require('../config/db');

async function getProfile(userId) {
  return userRepo.findById(userId);
}

async function updateProfile(userId, payload) {
  return userRepo.updateProfile(userId, payload);
}

async function uploadAvatar(userId, file) {
  if (!file) throw new Error('No file provided');
  const avatarUrl = `/uploads/avatars/${file.filename}`;
  return userRepo.updateAvatar(userId, avatarUrl);
}

async function getStats(userId) {
  const stats = await userRepo.getStats(userId);
  const lightStats = await lightService.getUserStats(userId);
  return { ...stats, light: lightStats };
}

async function getSettings(userId) {
  return userRepo.getSettings(userId);
}

async function updateSettings(userId, settings) {
  const keys = Object.keys(settings || {});
  let result = {};
  for (const k of keys) {
    result = await userRepo.upsertSetting(userId, k, settings[k]);
  }
  return result;
}

async function getTheoryProgress(userId, worshipId) {
  return userRepo.findTheoryProgress(userId, worshipId);
}

async function saveTheoryProgress(userId, payload) {
  const [sectionRows] = await db.query(
    'SELECT id, worship_id FROM theory_sections WHERE id = ? AND worship_id = ? LIMIT 1',
    [payload.section_id, payload.worship_id],
  );
  if (!sectionRows[0]) {
    const err = new Error('Theory section does not belong to this worship');
    err.status = 400;
    throw err;
  }
  const data = await userRepo.saveTheoryProgress(userId, payload);
  let awardedPoints = 0;

  // If completed, award light for theory section
  if (payload.completed && payload.section_id) {
    try {
      const [rows] = await db.query('SELECT * FROM theory_sections WHERE id = ? LIMIT 1', [payload.section_id]);
      const section = rows[0];
      const sectionTitle = section ? section.title : 'قسم نظري';
      const points = section && section.reward_points ? Number(section.reward_points) : 15;

      const rule = (await lightService.findRuleBySource('theory', String(payload.section_id)))
        || (await lightService.findRuleBySource('theory', null));

      const transaction = await lightService.awardLightForUser(userId, {
        ruleId: rule ? rule.id : null,
        amount: rule ? null : points,
        sourceScope: 'theory',
        sourceKey: String(payload.section_id),
        idempotencyKey: `theory_complete:${userId}:${payload.section_id}`,
        externalReference: `theory_complete:${payload.section_id}`,
        performedBy: userId,
        performedByType: 'user',
        reason: `إتمام قراءة قسم نظري: ${sectionTitle}`,
        metadata: { sectionId: payload.section_id, worshipId: payload.worship_id, sectionTitle },
      });
      awardedPoints = transaction.amount;

      await achievementService.tryUnlockAchievementsForUser(userId);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY' || (e.message && e.message.includes('idempotency'))) {
        // Idempotency: already awarded
        console.log('Theory progress already awarded for this user/section.');
      } else {
        console.error('Error awarding light for theory progress:', e);
      }
    }
  }

  return { progress: data, awardedPoints };
}

async function updateTheoryProgress(userId, id, payload) {
  return userRepo.updateTheoryProgress(id, userId, payload);
}

async function getLastTheoryProgress(userId) {
  return userRepo.getLastTheoryProgress(userId);
}

async function savePushToken(userId, device) {
  return require('./notification-domain.service').registerDevice(userId, device);
}

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getStats,
  getSettings,
  updateSettings,
  getTheoryProgress,
  saveTheoryProgress,
  updateTheoryProgress,
  getLastTheoryProgress,
  savePushToken,
};
