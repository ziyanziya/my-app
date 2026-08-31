const asyncHandler = require('../middlewares/asyncHandler');
const repo = require('../repositories/prayerWheelEvent.repo');

exports.list = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await repo.listAll() });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await repo.updateEvent(req.params.id, req.body);
  if (!data) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data });
});

exports.reorder = asyncHandler(async (req, res) => {
  await repo.reorder(req.body);
  res.json({ success: true });
});

exports.getSettings = asyncHandler(async (req, res) => {
  const data = await repo.getSettings();
  res.json({ success: true, data });
});

exports.saveSettings = asyncHandler(async (req, res) => {
  const data = await repo.saveSettings(req.body);
  res.json({ success: true, data });
});
