const asyncHandler = require('../middlewares/asyncHandler');
const practicalStepService = require('../services/practicalStep.service');
const practicalStepMediaService = require('../services/practicalStepMedia.service');
const notifications = require('../services/notification-domain.service');

exports.create = asyncHandler(async (req, res) => {
  const data = await practicalStepService.createStep(req.body);
  await notifications.createSystemBroadcast({ type: 'new_section', title: 'خطوة تطبيقية جديدة', body: 'تمت إضافة خطوة عملية جديدة.', data: { sourceId: data.id, deepLink: `/practical-road?stepId=${data.id}` } });
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await practicalStepService.updateStep(id, req.body);
  if (!data) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data });
});

exports.remove = asyncHandler(async (req, res) => {
  const id = req.params.id;
  await practicalStepService.deleteStep(id);
  res.json({ success: true });
});

exports.reorder = asyncHandler(async (req, res) => {
  await practicalStepService.reorderSteps(req.body);
  res.json({ success: true });
});

exports.getById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await practicalStepService.getStepById(id);
  if (!data) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data });
});

exports.listByWorship = asyncHandler(async (req, res) => {
  const worshipId = req.params.worshipId;
  const data = await practicalStepService.getStepsByWorshipId(worshipId);
  res.json({ success: true, data });
});

exports.completeStep = asyncHandler(async (req, res) => {
  const userId = Number(req.user && req.user.sub);
  const stepId = Number(req.params.id);
  const data = await practicalStepService.completePracticalStep(userId, stepId);
  res.json({ success: true, data });
});

exports.getUserProgress = asyncHandler(async (req, res) => {
  const userId = Number(req.user && req.user.sub);
  const worshipId = Number(req.params.worshipId);
  const data = await practicalStepService.getUserPracticalProgress(userId, worshipId);
  res.json({ success: true, data });
});

exports.listMedia = asyncHandler(async (req, res) => {
  const data = await practicalStepMediaService.listByStepId(req.params.id);
  res.json({ success: true, data });
});

exports.addMediaLink = asyncHandler(async (req, res) => {
  const data = await practicalStepMediaService.createExternalLink(req.params.id, req.body);
  if (!data) return res.status(404).json({ success: false, message: 'الخطوة التطبيقية غير موجودة.' });
  res.status(201).json({ success: true, data });
});

exports.uploadMedia = asyncHandler(async (req, res) => {
  const data = await practicalStepMediaService.createUpload(req.params.id, req.file, req.body.title);
  if (!data) return res.status(404).json({ success: false, message: 'الخطوة التطبيقية غير موجودة.' });
  res.status(201).json({ success: true, data });
});

exports.removeMedia = asyncHandler(async (req, res) => {
  const deleted = await practicalStepMediaService.deleteMedia(req.params.mediaId);
  if (!deleted) return res.status(404).json({ success: false, message: 'الفيديو غير موجود.' });
  res.json({ success: true });
});
