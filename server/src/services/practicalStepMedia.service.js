const fs = require('fs');
const path = require('path');
const stepRepo = require('../repositories/practicalStep.repo');
const mediaRepo = require('../repositories/practicalStepMedia.repo');

const localUploadPrefix = '/uploads/practical_step_media/';

async function listByStepId(stepId) {
  return mediaRepo.listByStepIds([Number(stepId)]);
}

async function createExternalLink(stepId, payload) {
  const step = await stepRepo.findById(stepId);
  if (!step) return null;
  const url = String(payload.url || '').trim();
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol');
  } catch {
    const error = new Error('رابط الفيديو غير صالح.');
    error.status = 400;
    throw error;
  }
  const existing = await listByStepId(stepId);
  return mediaRepo.createMedia({
    practical_step_id: Number(stepId), media_type: 'external_link', url,
    title: payload.title || null, order_index: existing.length + 1,
  });
}

async function createUpload(stepId, file, title) {
  const step = await stepRepo.findById(stepId);
  if (!step) return null;
  if (!file) {
    const error = new Error('اختر ملف فيديو لرفعه.');
    error.status = 400;
    throw error;
  }
  const existing = await listByStepId(stepId);
  return mediaRepo.createMedia({
    practical_step_id: Number(stepId), media_type: 'upload',
    url: `${localUploadPrefix}${path.basename(file.filename)}`,
    original_name: file.originalname, mime_type: file.mimetype, file_size: file.size,
    title: title || null, order_index: existing.length + 1,
  });
}

async function deleteMedia(id) {
  const media = await mediaRepo.findById(id);
  if (!media) return false;
  await mediaRepo.remove(id);
  if (media.media_type === 'upload' && media.url.startsWith(localUploadPrefix)) {
    const absolutePath = path.resolve(__dirname, '..', '..', media.url.replace(/^\//, ''));
    if (absolutePath.startsWith(path.resolve(__dirname, '..', '..', 'uploads', 'practical_step_media'))) {
      fs.unlink(absolutePath, () => {});
    }
  }
  return true;
}

module.exports = { listByStepId, createExternalLink, createUpload, deleteMedia };
