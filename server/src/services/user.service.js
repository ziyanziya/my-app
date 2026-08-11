const userRepo = require('../repositories/user.repo');
const path = require('path');
const fs = require('fs');

async function getProfile(userId) {
  const user = await userRepo.findById(userId);
  if (!user) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    timezone: user.timezone,
    locale: user.locale,
    avatarUrl: user.avatar_url || null,
    totalPoints: user.total_points || 0,
    role: user.role || 'user',
  };
}

async function updateProfile(userId, payload) {
  const updated = await userRepo.updateUser(userId, payload);
  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
    timezone: updated.timezone,
    locale: updated.locale,
    avatarUrl: updated.avatar_url || null,
  };
}

async function uploadAvatar(userId, file) {
  if (!file) {
    const err = new Error('No file uploaded'); err.status = 400; throw err;
  }
  // move / ensure stored path is accessible. multer already saved the file.
  const avatarUrl = `/uploads/avatars/${path.basename(file.path)}`;
  const user = await userRepo.setAvatarUrl(userId, avatarUrl);
  return { avatarUrl: avatarUrl };
}

async function getStats(userId) {
  return userRepo.getStats(userId);
}

async function getSettings(userId) {
  return userRepo.getSettings(userId);
}

async function updateSettings(userId, settings) {
  // settings is object of key->value
  const keys = Object.keys(settings || {});
  let result = {};
  for (const k of keys) {
    result = await userRepo.upsertSetting(userId, k, settings[k]);
  }
  return result;
}

async function getTheoryProgress(userId, worshipId) {
  return userRepo.findTheoryProgress(userId, worshipId);
}

async function saveTheoryProgress(userId, payload) {
  return userRepo.saveTheoryProgress(userId, payload);
}

async function updateTheoryProgress(userId, id, payload) {
  return userRepo.updateTheoryProgress(id, userId, payload);
}

async function getLastTheoryProgress(userId) {
  return userRepo.getLastTheoryProgress(userId);
}

module.exports = { getProfile, updateProfile, uploadAvatar, getStats, getSettings, updateSettings, getTheoryProgress, saveTheoryProgress, updateTheoryProgress, getLastTheoryProgress };
