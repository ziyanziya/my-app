const asyncHandler = require('../middlewares/asyncHandler');
const userService = require('../services/user.service');

exports.profile = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.sub;
  const data = await userService.getProfile(userId);
  res.json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.sub;
  const payload = req.body;
  const data = await userService.updateProfile(userId, payload);
  res.json({ success: true, data });
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.sub;
  const file = req.file;
  const data = await userService.uploadAvatar(userId, file);
  res.json({ success: true, data });
});

exports.stats = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.sub;
  const data = await userService.getStats(userId);
  res.json({ success: true, data });
});

exports.getSettings = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.sub;
  const data = await userService.getSettings(userId);
  res.json({ success: true, data });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.sub;
  const settings = req.body;
  const data = await userService.updateSettings(userId, settings);
  res.json({ success: true, data });
});

exports.getTheoryProgress = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.sub;
  const worshipId = parseInt(req.params.worshipId, 10);
  const data = await userService.getTheoryProgress(userId, worshipId);
  res.json({ success: true, data });
});

exports.saveTheoryProgress = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.sub;
  const data = await userService.saveTheoryProgress(userId, req.body);
  res.status(201).json({ success: true, data });
});

exports.updateTheoryProgress = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.sub;
  const id = req.params.id;
  const data = await userService.updateTheoryProgress(userId, id, req.body);
  if (!data) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data });
});

exports.getLastTheoryProgress = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.sub;
  const data = await userService.getLastTheoryProgress(userId);
  res.json({ success: true, data });
});
