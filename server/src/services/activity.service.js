const activityRepo = require('../repositories/activity.repo');
const defaultWheel = require('../config/default-wheel');

async function createActivity(payload, actorId = null) {
  payload.created_by = actorId;
  return activityRepo.createActivity(payload);
}

async function updateActivity(id, payload) {
  return activityRepo.updateActivity(id, payload);
}

async function deleteActivity(id) {
  return activityRepo.softDeleteActivity(id);
}

async function getActivityById(id) {
  return activityRepo.findById(id);
}

async function listActivities(params) {
  return activityRepo.searchActivities(params);
}

async function updatePositions(updates) {
  return activityRepo.updatePositions(updates);
}

async function importDefaultsIfMissing() {
  // iterate defaults and create if missing
  let nextPosition = await activityRepo.getNextPosition();
  for (const seg of defaultWheel) {
    const existing = await activityRepo.findByTitle(seg.title);
    if (!existing) {
      const slug = String(seg.title).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\s-]+/g, '').replace(/\s+/g, '-');
      await activityRepo.createActivity({
        slug,
        title: seg.title,
        default_time: seg.default_time,
        position: nextPosition++,
        is_active: 1,
      });
    }
  }
  return true;
}

module.exports = { createActivity, updateActivity, deleteActivity, getActivityById, listActivities, updatePositions, importDefaultsIfMissing };
