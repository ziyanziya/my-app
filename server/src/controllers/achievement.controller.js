const asyncHandler = require('../middlewares/asyncHandler');
const repo = require('../repositories/achievement.repo');
const service = require('../services/achievement.service');

exports.create = asyncHandler(async (req, res) => {
  const data = await repo.createAchievement(req.body);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await repo.updateAchievement(id, req.body);
  res.json({ success: true, data });
});

exports.list = asyncHandler(async (req, res) => {
  const { q, active } = req.query;
  const data = await repo.listAchievements({ q, active: active === undefined ? undefined : (active === '1' || active === 'true') });
  res.json({ success: true, data });
});

exports.getById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await repo.findById(id);
  if (!data) return res.status(404).json({ success: false });
  res.json({ success: true, data });
});

exports.listUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId || (req.user && req.user.sub);
  const data = await repo.listUserAchievements(userId);
  res.json({ success: true, data });
});

exports.tryUnlock = asyncHandler(async (req, res) => {
  const userId = req.params.userId || (req.user && req.user.sub);
  const unlocked = await service.tryUnlockAchievementsForUser(userId);
  res.json({ success: true, unlocked });
});
