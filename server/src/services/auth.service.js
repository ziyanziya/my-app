const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const userRepo = require('../repositories/user.repo');
const tokenRepo = require('../repositories/refreshToken.repo');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signAccess, signRefresh, verify } = require('../utils/jwt');
const mailer = require('../utils/mailer');

const ms = require('ms');

async function register({ name, email, password, phone, timezone = 'UTC', locale = 'ar' }) {
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const uuid = uuidv4();
  const password_hash = await hashPassword(password);
  const user = await userRepo.createUser({ uuid, name, email, phone, password_hash, timezone, locale });

  // create verification token
  const verificationToken = uuidv4();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
  await userRepo.setVerificationToken(user.id, verificationToken, expiresAt);

  // send verification email (best-effort)
  try {
    const verifyUrl = `https://your.domain/api/v1/auth/verify?token=${verificationToken}`;
    await mailer.sendMail(email, 'تأكيد البريد الإلكتروني', `<p>اضغط هنا للتأكيد: <a href="${verifyUrl}">${verifyUrl}</a></p>`);
  } catch (e) {
    console.warn('Failed to send verification email', e.message);
  }

  // Registration must provide usable credentials too: protected client routes
  // such as the profile cannot authenticate with a placeholder token.
  const accessToken = signAccess({ sub: user.id, role: user.role });
  const refreshToken = signRefresh({ sub: user.id, role: user.role });
  const refreshExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await tokenRepo.createToken({ userId: user.id, token: refreshToken, expiresAt: refreshExpiresAt });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
}

async function login({ identifier, password }) {
  const user = await userRepo.findByEmail(identifier);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 400;
    throw err;
  }

  const match = await comparePassword(password, user.password_hash);
  if (!match) {
    const err = new Error('Invalid credentials');
    err.status = 400;
    throw err;
  }

  const accessToken = signAccess({ sub: user.id, role: user.role });
  const refreshToken = signRefresh({ sub: user.id, role: user.role });
  const refreshExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30d
  await tokenRepo.createToken({ userId: user.id, token: refreshToken, expiresAt: refreshExpiresAt });

  return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken };
}

async function logout({ refreshToken }) {
  await tokenRepo.revokeToken(refreshToken);
  return { success: true };
}

async function refresh({ refreshToken }) {
  let payload;
  try {
    payload = verify(refreshToken);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.status = 401;
    throw err;
  }

  const savedToken = await tokenRepo.findToken(refreshToken);
  if (!savedToken || savedToken.revoked || new Date(savedToken.expires_at) <= new Date()) {
    const err = new Error('Invalid or expired refresh token');
    err.status = 401;
    throw err;
  }

  return { accessToken: signAccess({ sub: payload.sub, role: payload.role }) };
}

async function verifyEmail({ token }) {
  const user = await userRepo.verifyEmailByToken(token);
  if (!user) {
    const err = new Error('Invalid verification token');
    err.status = 400;
    throw err;
  }
  // check expiry
  if (user.verification_expires_at && new Date(user.verification_expires_at) < new Date()) {
    const err = new Error('Verification token expired');
    err.status = 400;
    throw err;
  }

  await userRepo.markEmailVerified(user.id);
  return { success: true };
}

async function forgotPassword({ email }) {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    // don't reveal existence
    return { success: true };
  }
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await userRepo.setResetTokenByEmail(email, token, expiresAt);

  try {
    const resetUrl = `https://your.domain/reset-password?token=${token}`;
    await mailer.sendMail(email, 'إعادة تعيين كلمة المرور', `<p>اضغط لإعادة التعيين: <a href="${resetUrl}">${resetUrl}</a></p>`);
  } catch (e) {
    console.warn('Failed to send reset email', e.message);
  }

  return { success: true };
}

async function resetPassword({ token, newPassword }) {
  const user = await userRepo.findByResetToken(token);
  if (!user) {
    const err = new Error('Invalid reset token');
    err.status = 400;
    throw err;
  }
  if (user.reset_expires_at && new Date(user.reset_expires_at) < new Date()) {
    const err = new Error('Reset token expired');
    err.status = 400;
    throw err;
  }
  const password_hash = await hashPassword(newPassword);
  await userRepo.updatePassword(user.id, password_hash);
  return { success: true };
}

module.exports = { register, login, logout, refresh, verifyEmail, forgotPassword, resetPassword };
