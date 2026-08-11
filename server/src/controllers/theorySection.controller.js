const asyncHandler = require('../middlewares/asyncHandler');
const theorySectionService = require('../services/theorySection.service');

exports.create = asyncHandler(async (req, res) => {
  const data = await theorySectionService.createSection(req.body);
  res.status(201).json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await theorySectionService.updateSection(id, req.body);
  if (!data) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data });
});

exports.remove = asyncHandler(async (req, res) => {
  const id = req.params.id;
  await theorySectionService.deleteSection(id);
  res.json({ success: true });
});

exports.reorder = asyncHandler(async (req, res) => {
  await theorySectionService.reorderSections(req.body);
  res.json({ success: true });
});

exports.getById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await theorySectionService.getSectionById(id);
  if (!data) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data });
});

exports.listByWorship = asyncHandler(async (req, res) => {
  const worshipId = req.params.worshipId;
  const data = await theorySectionService.getSectionsByWorshipId(worshipId);
  res.json({ success: true, data });
});
