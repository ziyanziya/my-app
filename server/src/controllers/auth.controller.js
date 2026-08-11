const authService = require('../services/auth.service');
const asyncHandler = require('../middlewares/asyncHandler');

exports.register = asyncHandler(async (req, res) => {
  const payload = req.body;
  const result = await authService.register(payload);
  res.status(201).json({ success: true, data: { user: result.user } });
});

exports.login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const result = await authService.login({ identifier, password });
  res.json({ success: true, data: result });
});

exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout({ refreshToken });
  res.json({ success: true });
});

exports.refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body);
  res.json({ success: true, data: result });
});

exports.verify = asyncHandler(async (req, res) => {
  const { token } = req.query;
  await authService.verifyEmail({ token });
  res.json({ success: true });
});

exports.forgot = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword({ email });
  res.json({ success: true });
});

exports.reset = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword({ token, newPassword });
  res.json({ success: true });
});
