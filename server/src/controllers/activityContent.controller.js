const asyncHandler = require('../middlewares/asyncHandler');
const service = require('../services/activityContent.service');

exports.create = asyncHandler(async (req, res) => {
  const activityId = req.params.activityId;
  const payload = req.body;
  const data = await service.createContent(activityId, payload);
  res.status(201).json({ success: true, data });
});

exports.upload = asyncHandler(async (req, res) => {
  const activityId = req.params.activityId;
  const file = req.file;
  const { locale, title, is_default, version } = req.body;
  const data = await service.uploadAndCreate(activityId, file, { locale, title, is_default: is_default === '1' || is_default === 'true' || is_default === true, version: version ? Number(version) : 1 });
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await service.updateContent(id, req.body);
  res.json({ success: true, data });
});

exports.remove = asyncHandler(async (req, res) => {
  const id = req.params.id;
  await service.deleteContent(id);
  res.json({ success: true });
});

exports.getById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await service.getById(id);
  if (!data) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data });
});

exports.listByActivity = asyncHandler(async (req, res) => {
  const activityId = req.params.activityId;
  const { locale, q, is_default, version } = req.query;
  const data = await service.listByActivity(activityId, { locale, q, is_default, version });
  res.json({ success: true, data });
});
