const asyncHandler = require('../middlewares/asyncHandler');
const activityService = require('../services/activity.service');

exports.create = asyncHandler(async (req, res) => {
  const actorId = req.user && req.user.sub;
  const payload = req.body;
  const data = await activityService.createActivity(payload, actorId);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const payload = req.body;
  const data = await activityService.updateActivity(id, payload);
  res.json({ success: true, data });
});

exports.remove = asyncHandler(async (req, res) => {
  const id = req.params.id;
  await activityService.deleteActivity(id);
  res.json({ success: true });
});

exports.getById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await activityService.getActivityById(id);
  if (!data) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data });
});

exports.list = asyncHandler(async (req, res) => {
  const { page = 1, perPage = 20, sortBy, sortDir, category, active, q, minPoints, maxPoints } = req.query;
  const limit = Math.min(100, Number(perPage) || 20);
  const offset = (Number(page) - 1) * limit;
  const params = {
    q,
    category_id: category ? Number(category) : undefined,
    is_active: active === undefined ? undefined : (active === '1' || active === 'true' ? 1 : 0),
    min_points: minPoints !== undefined ? Number(minPoints) : undefined,
    max_points: maxPoints !== undefined ? Number(maxPoints) : undefined,
    sortBy,
    sortDir,
    limit,
    offset,
  };
  const data = await activityService.listActivities(params);
  res.json({ success: true, data, meta: { page: Number(page), perPage: limit } });
});

exports.reorder = asyncHandler(async (req, res) => {
  // expect body: [{ id: number, position: number }, ...]
  const updates = req.body;
  await activityService.updatePositions(updates);
  res.json({ success: true });
});

exports.importDefaults = asyncHandler(async (req, res) => {
  await activityService.importDefaultsIfMissing();
  res.json({ success: true });
});
