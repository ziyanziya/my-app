const repo = require('../repositories/activityContent.repo');
const path = require('path');

async function createContent(activityId, payload) {
  payload.activity_id = Number(activityId);
  return repo.createContent(payload);
}

async function uploadAndCreate(activityId, file, { locale = 'ar', title = null, is_default = false, version = 1 }) {
  if (!file) throw new Error('No file uploaded');
  const url = `/uploads/activity_contents/${path.basename(file.path)}`;
  const body = JSON.stringify({ type: file.mimetype, url, originalName: file.originalname, size: file.size });
  return repo.createContent({ activity_id: Number(activityId), locale, title: title || file.originalname, body, is_default: is_default ? 1 : 0, version });
}

async function updateContent(id, payload) {
  return repo.updateContent(id, payload);
}

async function deleteContent(id) {
  return repo.deleteContent(id);
}

async function getById(id) {
  return repo.findById(id);
}

async function listByActivity(activityId, params) {
  return repo.listByActivity(Number(activityId), params || {});
}

module.exports = { createContent, uploadAndCreate, updateContent, deleteContent, getById, listByActivity };
