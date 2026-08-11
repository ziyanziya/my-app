const asyncHandler = require('../middlewares/asyncHandler');
const repo = require('../repositories/admin.repo');

exports.dashboard = asyncHandler(async (_req, res) => res.json({ success: true, data: await repo.getDashboard() }));
exports.listUsers = asyncHandler(async (req, res) => res.json({ success: true, data: await repo.listUsers(req.query) }));
exports.updateUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id); const before = await repo.findUser(id);
  if (!before) { const error = new Error('المستخدم غير موجود.'); error.status = 404; throw error; }
  if (id === Number(req.user.sub) && req.body.is_active === false) { const error = new Error('لا يمكنك تعطيل حسابك الإداري.'); error.status = 400; throw error; }
  if (req.body.role !== undefined && !['user', 'admin'].includes(req.body.role)) { const error = new Error('الدور غير صالح.'); error.status = 400; throw error; }
  const after = await repo.updateUser(id, req.body);
  await repo.audit({ adminId: req.user.sub, action: 'user.update', entityType: 'user', entityId: id, before, after, ip: req.ip });
  res.json({ success: true, data: after });
});
