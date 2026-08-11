const asyncHandler = require('../middlewares/asyncHandler');
const worshipService = require('../services/worship.service');

exports.list = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.sub;
  const includeInactive = req.query.all === '1' || req.query.all === 'true';
  const data = await worshipService.listWorships({ userId, includeInactive });
  res.json({ success: true, data });
});

exports.getById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await worshipService.getWorship(id);
  if (!data) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const data = await worshipService.createWorship(req.body);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await worshipService.updateWorship(id, req.body);
  if (!data) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data });
});

exports.remove = asyncHandler(async (req, res) => {
  const id = req.params.id;
  await worshipService.deleteWorship(id);
  res.json({ success: true });
});

exports.complete = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.sub;
  const id = req.params.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  await worshipService.completeWorship(userId, id);
  try {
    const io = req.app.get('io');
    if (io) io.emit('worship:completed', { worshipId: Number(id), userId });
  } catch (e) {
    // ignore
  }
  res.json({ success: true });
});
