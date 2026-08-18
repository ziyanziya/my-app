const asyncHandler = require('../middlewares/asyncHandler');
const notifications = require('../services/notification-domain.service');

exports.create = asyncHandler(async (req, res) => {
  const rec = await notifications.createCampaign(req.body, req.user.sub);
  res.status(201).json({ success: true, data: rec });
});

exports.list = asyncHandler(async (req, res) => {
  const data = await notifications.listCampaigns(req.query);
  res.json({ success: true, data });
});

exports.get = asyncHandler(async (req, res) => {
  const data = await notifications.getCampaign(Number(req.params.id));
  if (!data) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data });
});

exports.update = asyncHandler(async (req, res) => {
  const data = await notifications.transitionCampaign(Number(req.params.id), req.body.status, req.user.sub);
  if (!data) return res.status(404).json({ success: false, message: 'Not found or terminal notification' });
  res.json({ success: true, data });
});

exports.delete = asyncHandler(async (req, res) => {
  const data = await notifications.transitionCampaign(Number(req.params.id), 'cancelled', req.user.sub);
  if (!data) return res.status(404).json({ success: false, message: 'Not found or terminal notification' });
  res.json({ success: true, data });
});
