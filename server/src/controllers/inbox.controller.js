const asyncHandler = require('../middlewares/asyncHandler');
const repo = require('../repositories/inbox.repo');

exports.list = asyncHandler(async (req, res) => {
  const data = await repo.getUserInbox(req.user.sub, req.query.limit, req.query.offset);
  res.json({ success: true, data });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const updated = await repo.markAsRead(req.user.sub, Number(req.params.id));
  if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true });
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await repo.markAllAsRead(req.user.sub);
  res.json({ success: true });
});
