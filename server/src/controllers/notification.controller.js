const asyncHandler = require('../middlewares/asyncHandler');
const notifService = require('../services/notification.service');
const repo = require('../repositories/notification.repo');

exports.create = asyncHandler(async (req, res) => {
  const payload = req.body;
  // delivery target
  const target = {};
  if (payload.send_to_token) target.token = payload.send_to_token;
  if (payload.send_to_topic) target.topic = payload.send_to_topic;
  if (payload.send_to_user_id) payload.user_id = payload.send_to_user_id;
  payload.delivery_metadata = target;
  const rec = await repo.createNotification(payload);
  if (!payload.schedule_at) {
    // immediate
    await notifService.sendNow(rec.id, Object.assign({}, rec, { delivery_metadata: target }));
  }
  res.status(201).json({ success: true, data: rec });
});

exports.list = asyncHandler(async (req, res) => {
  const data = await repo.listNotifications({ userId: req.query.userId, status: req.query.status });
  res.json({ success: true, data });
});

exports.sendNow = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const resp = await notifService.sendNow(Number(id));
  res.json({ success: true, resp });
});

exports.delete = asyncHandler(async (req, res) => {
  const id = req.params.id;
  await repo.deleteNotification(id);
  res.json({ success: true });
});
