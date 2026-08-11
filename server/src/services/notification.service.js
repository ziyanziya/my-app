const fcmUtil = require('../utils/fcm');
const repo = require('../repositories/notification.repo');
const userRepo = require('../repositories/user.repo');

const admin = fcmUtil.getAdmin();

async function sendToToken(token, payload) {
  if (!admin) return { ok: false, reason: 'FCM not configured' };
  try {
    const msg = { token, notification: { title: payload.title, body: payload.body }, data: payload.data || {} };
    const res = await admin.messaging().send(msg);
    return { ok: true, id: res };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function sendToTopic(topic, payload) {
  if (!admin) return { ok: false, reason: 'FCM not configured' };
  try {
    const msg = { topic, notification: { title: payload.title, body: payload.body }, data: payload.data || {} };
    const res = await admin.messaging().send(msg);
    return { ok: true, id: res };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function createAndSchedule(notificationPayload) {
  // store in DB
  const rec = await repo.createNotification(notificationPayload);
  // if immediate, attempt send now
  if (!notificationPayload.schedule_at) {
    await sendNow(rec.id, notificationPayload);
  }
  return rec;
}

async function sendNow(id, payloadOverride) {
  const rec = payloadOverride ? payloadOverride : await repo.getNotification(id);
  if (!rec) throw new Error('Notification not found');
  // determine target
  let providerResp = null;
  if (rec.delivery_metadata) {
    try { rec.delivery_metadata = JSON.parse(rec.delivery_metadata); } catch (e) {}
  }
  const target = payloadOverride && payloadOverride.delivery_metadata ? payloadOverride.delivery_metadata : rec.delivery_metadata;
  if (target && target.token) providerResp = await sendToToken(target.token, { title: rec.title, body: rec.body });
  else if (target && target.topic) providerResp = await sendToTopic(target.topic, { title: rec.title, body: rec.body });
  else if (rec.user_id) {
    const user = await userRepo.findById(rec.user_id);
    if (user && user.fcm_token) providerResp = await sendToToken(user.fcm_token, { title: rec.title, body: rec.body });
  }
  await repo.markSent(id, providerResp);
  return providerResp;
}

// Triggers helpers: before/start/after
function computeScheduleForActivity(activity, when='start', offsetMinutes=0, startOfDay=null) {
  // activity should include scheduled_at or default_time; expected Date or time string
  let scheduled = activity.scheduled_at ? new Date(activity.scheduled_at) : null;
  if (!scheduled && activity.default_time && startOfDay) {
    const [h,m,s] = (activity.default_time||'00:00:00').split(':');
    scheduled = new Date(startOfDay);
    scheduled.setHours(Number(h||0),Number(m||0),Number(s||0),0);
  }
  if (!scheduled) return null;
  let target = new Date(scheduled);
  if (when === 'before') target = new Date(scheduled.getTime() - (offsetMinutes||0)*60000);
  if (when === 'after') target = new Date(scheduled.getTime() + (offsetMinutes||0)*60000);
  return target;
}

module.exports = { sendToToken, sendToTopic, createAndSchedule, sendNow, computeScheduleForActivity };
