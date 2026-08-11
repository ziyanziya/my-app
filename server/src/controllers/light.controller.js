const lightService = require('../services/light.service');

function resolveRequestedUserId(req) {
  const currentUserId = Number(req.user && req.user.sub);
  const requestedUserId = req.params.userId ? Number(req.params.userId) : currentUserId;
  if (!requestedUserId) {
    const err = new Error('User id is required');
    err.status = 400;
    throw err;
  }
  if (req.user.role !== 'admin' && requestedUserId !== currentUserId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  return requestedUserId;
}

exports.listRules = async (req, res) => {
  const active = req.query.active === undefined ? undefined : (req.query.active === '1' || req.query.active === 'true');
  const data = await lightService.listRules({ active });
  res.json({ success: true, data });
};

exports.getRule = async (req, res) => {
  const id = Number(req.params.id);
  const data = await lightService.getRule(id);
  if (!data) return res.status(404).json({ success: false, message: 'Rule not found' });
  res.json({ success: true, data });
};

exports.createRule = async (req, res) => {
  const data = await lightService.createRule(req.body);
  res.status(201).json({ success: true, data });
};

exports.updateRule = async (req, res) => {
  const id = Number(req.params.id);
  const data = await lightService.updateRule(id, req.body);
  res.json({ success: true, data });
};

exports.getUserStats = async (req, res) => {
  const userId = resolveRequestedUserId(req);
  const data = await lightService.getUserStats(userId);
  res.json({ success: true, data });
};

exports.getUserTransactions = async (req, res) => {
  const userId = resolveRequestedUserId(req);
  const limit = req.query.limit ? Number(req.query.limit) : 1000;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  const data = await lightService.getUserTransactions(userId, { limit, offset });
  res.json({ success: true, data });
};

exports.awardUserLight = async (req, res) => {
  const userId = Number(req.params.userId);
  const payload = req.body;
  const data = await lightService.awardLightForUser(userId, payload);
  res.status(201).json({ success: true, data });
};

exports.spendUserLight = async (req, res) => {
  const userId = Number(req.params.userId);
  const payload = req.body;
  const data = await lightService.spendLightForUser(userId, payload);
  res.status(201).json({ success: true, data });
};
