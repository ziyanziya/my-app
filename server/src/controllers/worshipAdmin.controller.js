const asyncHandler = require('../middlewares/asyncHandler');
const worshipService = require('../services/worship.service');

exports.create = asyncHandler(async (req, res) => {
  const payload = req.body;
  const data = await worshipService.createWorship(payload);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const payload = req.body;
  const data = await worshipService.updateWorship(id, payload);
  if (!data) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data });
});

exports.remove = asyncHandler(async (req, res) => {
  const id = req.params.id;
  await worshipService.deleteWorship(id);
  res.json({ success: true });
});

exports.getById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await worshipService.getWorship(id);
  if (!data) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data });
});
