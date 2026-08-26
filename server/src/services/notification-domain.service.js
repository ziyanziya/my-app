const db = require('../config/db');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_PAGE = 500;

function asJson(value) { return value == null || typeof value === 'object' ? value : JSON.parse(value); }
function assertAudience(audienceType, audience) {
  if (!['all_users', 'specific_users'].includes(audienceType)) {
    const error = new Error('Unsupported notification audience'); error.status = 422; throw error;
  }
  if (audienceType === 'specific_users' && (!Array.isArray(audience?.userIds) || !audience.userIds.length)) {
    const error = new Error('specific_users requires audience.userIds'); error.status = 422; throw error;
  }
}

async function createCampaign(input, actorId) {
  const audienceType = input.audience_type || 'all_users';
  const audience = input.audience || null;
  assertAudience(audienceType, audience);
  const startAt = input.start_at ? new Date(input.start_at) : new Date();
  if (Number.isNaN(startAt.valueOf())) { const error = new Error('Invalid start_at'); error.status = 422; throw error; }
  const status = input.status === 'draft' ? 'draft' : input.status === 'paused' ? 'paused' : startAt > new Date() ? 'scheduled' : 'active';
  const recurrence = input.recurrence || null;
  if (recurrence && !['daily', 'weekly', 'monthly'].includes(recurrence.frequency)) {
    const error = new Error('Unsupported recurrence frequency'); error.status = 422; throw error;
  }
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(`INSERT INTO notification_campaigns
      (type,title,body,data,audience_type,audience,priority,status,schedule_timezone,start_at,end_at,recurrence,next_run_at,created_by,idempotency_key)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
      input.type || 'announcement', input.title, input.body, JSON.stringify(input.data || {}), audienceType, JSON.stringify(audience),
      input.priority || 'normal', status, input.schedule_timezone || 'UTC', startAt, input.end_at || null,
      recurrence ? JSON.stringify(recurrence) : null, status === 'draft' || status === 'paused' ? null : startAt, actorId,
      input.idempotency_key || null,
    ]);
    await connection.query('INSERT INTO notification_audit_logs (actor_id, action, campaign_id, metadata) VALUES (?, ?, ?, ?)', [actorId, 'create', result.insertId, JSON.stringify({ status })]);
    await connection.commit();
    return getCampaign(result.insertId);
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

async function getCampaign(id) { const [rows] = await db.query('SELECT * FROM notification_campaigns WHERE id = ? LIMIT 1', [id]); return rows[0] || null; }
async function listCampaigns({ limit = 50, offset = 0, status } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const where = status ? 'WHERE status = ?' : ''; const params = status ? [status, safeLimit, Number(offset) || 0] : [safeLimit, Number(offset) || 0];
  const [items] = await db.query(`SELECT * FROM notification_campaigns ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, params);
  const [counts] = await db.query(`SELECT COUNT(*) total FROM notification_campaigns ${where}`, status ? [status] : []);
  return { items, total: counts[0].total };
}
async function transitionCampaign(id, status, actorId) {
  if (!['active', 'paused', 'cancelled'].includes(status)) { const e = new Error('Invalid status transition'); e.status = 422; throw e; }
  const [result] = await db.query('UPDATE notification_campaigns SET status = ?, next_run_at = CASE WHEN ? = \'active\' THEN COALESCE(next_run_at, NOW(3)) ELSE next_run_at END WHERE id = ? AND status NOT IN (\'cancelled\',\'completed\')', [status, status, id]);
  if (!result.affectedRows) return null;
  await db.query('INSERT INTO notification_audit_logs (actor_id, action, campaign_id) VALUES (?, ?, ?)', [actorId, status, id]);
  return getCampaign(id);
}

async function claimDueOccurrences() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    // Do not use `FOR UPDATE SKIP LOCKED`: MariaDB before 10.6 cannot parse it.
    // This is deliberately a non-locking read.  A campaign is claimed below with
    // a compare-and-set update, so two workers that read the same row cannot both
    // advance it or create an occurrence for it.
    const [campaigns] = await connection.query(`SELECT * FROM notification_campaigns WHERE status = 'active' AND next_run_at <= NOW(3) ORDER BY next_run_at LIMIT 20`);
    const occurrences = [];
    for (const campaign of campaigns) {
      const dueAt = new Date(campaign.next_run_at); const key = dueAt.toISOString();
      const recurrence = campaign.recurrence ? asJson(campaign.recurrence) : null;
      let update;
      if (!recurrence) {
        [update] = await connection.query("UPDATE notification_campaigns SET status='completed', next_run_at=NULL WHERE id=? AND status='active' AND next_run_at=?", [campaign.id, campaign.next_run_at]);
      } else {
        const unit = recurrence.frequency === 'weekly' ? 'WEEK' : recurrence.frequency === 'monthly' ? 'MONTH' : 'DAY';
        [update] = await connection.query(`UPDATE notification_campaigns SET next_run_at = DATE_ADD(next_run_at, INTERVAL 1 ${unit}) WHERE id = ? AND status='active' AND next_run_at=?`, [campaign.id, campaign.next_run_at]);
      }
      // `affectedRows` is the optimistic-lock result.  The winner holds the
      // campaign row lock until commit; only it may materialize this occurrence.
      if (!update.affectedRows) continue;
      const [insert] = await connection.query('INSERT INTO notification_occurrences (campaign_id, occurrence_key, due_at, status, locked_until, attempts) VALUES (?, ?, ?, \'processing\', DATE_ADD(NOW(3), INTERVAL 2 MINUTE), 1)', [campaign.id, key, dueAt]);
      occurrences.push({ id: insert.insertId, ...campaign, due_at: dueAt });
    }
    await connection.commit(); return occurrences;
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}
async function materializeRecipients(occurrence) {
  const audience = occurrence.audience ? asJson(occurrence.audience) : null;
  let offset = 0;
  while (true) {
    const sql = occurrence.audience_type === 'specific_users'
      ? 'SELECT id FROM users WHERE is_active=1 AND id IN (?) LIMIT ? OFFSET ?'
      : 'SELECT id FROM users WHERE is_active=1 ORDER BY id LIMIT ? OFFSET ?';
    const params = occurrence.audience_type === 'specific_users' ? [audience.userIds, MAX_PAGE, offset] : [MAX_PAGE, offset];
    const [users] = await db.query(sql, params); if (!users.length) break;
    const values = users.map((u) => [occurrence.id, u.id, occurrence.title, occurrence.body, occurrence.data || '{}']);
    await db.query(`INSERT IGNORE INTO notification_recipients (occurrence_id,user_id,title,body,data) VALUES ${values.map(() => '(?,?,?,?,?)').join(',')}`, values.flat());
    if (users.length < MAX_PAGE) break; offset += users.length;
  }
  await db.query("UPDATE notification_occurrences SET status='completed', completed_at=NOW(3), locked_until=NULL WHERE id=?", [occurrence.id]);
}
async function queueDeliveries() {
  await db.query(`INSERT IGNORE INTO push_deliveries (recipient_id, device_id)
    SELECT r.id,d.id FROM notification_recipients r JOIN user_push_devices d ON d.user_id=r.user_id AND d.is_active=1
    LEFT JOIN push_deliveries p ON p.recipient_id=r.id AND p.device_id=d.id WHERE p.id IS NULL`);
}
async function deliverPushes() {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    // Same compatible optimistic-claim pattern as campaigns.  Every selected
    // delivery is conditionally leased, then only successfully leased rows are sent.
    const [candidates] = await connection.query(`SELECT p.id,d.token,r.title,r.body,r.data,r.id recipient_id FROM push_deliveries p JOIN user_push_devices d ON d.id=p.device_id JOIN notification_recipients r ON r.id=p.recipient_id WHERE p.status='queued' AND p.next_attempt_at<=NOW(3) AND (p.locked_until IS NULL OR p.locked_until<NOW(3)) LIMIT 100`);
    const rows = [];
    for (const candidate of candidates) {
      const [claim] = await connection.query(`UPDATE push_deliveries
        SET locked_until=DATE_ADD(NOW(3),INTERVAL 2 MINUTE), attempts=attempts+1
        WHERE id=? AND status='queued' AND next_attempt_at<=NOW(3)
          AND (locked_until IS NULL OR locked_until<NOW(3))`, [candidate.id]);
      if (claim.affectedRows) rows.push(candidate);
    }
    if (!rows.length) { await connection.commit(); return 0; }
    await connection.commit();
    const response = await fetch(EXPO_PUSH_URL, { method: 'POST', headers: { Accept: 'application/json', 'Accept-Encoding': 'gzip, deflate', 'Content-Type': 'application/json' }, body: JSON.stringify(rows.map(r => ({ to:r.token, title:r.title, body:r.body, sound:'default', data:{ ...(asJson(r.data) || {}), recipientId:String(r.recipient_id) } }))) });
    if (!response.ok) throw new Error(`Expo push rejected batch: ${response.status}`);
    const body = await response.json(); const tickets = body.data || [];
    await Promise.all(rows.map((row, i) => db.query("UPDATE push_deliveries SET status='submitted', ticket_id=?, submitted_at=NOW(3), locked_until=NULL WHERE id=?", [tickets[i]?.id || null, row.id])));
    return rows.length;
  } catch (error) { await connection.rollback().catch(() => {}); throw error; } finally { connection.release(); }
}
async function runOnce() { const occurrences = await claimDueOccurrences(); for (const occurrence of occurrences) await materializeRecipients(occurrence); await queueDeliveries(); return deliverPushes(); }
async function registerDevice(userId, input) {
  if (!/^ExponentPushToken\[.+\]$/.test(input.token || '')) { const e = new Error('Invalid Expo push token'); e.status=422; throw e; }
  await db.query(`INSERT INTO user_push_devices (user_id,token,platform,installation_id,app_version,is_active,last_seen_at) VALUES (?,?,?,?,?,1,NOW(3)) ON DUPLICATE KEY UPDATE user_id=VALUES(user_id),platform=VALUES(platform),installation_id=VALUES(installation_id),app_version=VALUES(app_version),is_active=1,invalidated_at=NULL,last_seen_at=NOW(3)`, [userId,input.token,input.platform || 'unknown',input.installation_id || null,input.app_version || null]);
}
async function createSystemBroadcast({ type, title, body, data }) {
  return createCampaign({ type, title, body, data, audience_type: 'all_users', status: 'active', idempotency_key: `${type}:${data?.sourceId || Date.now()}` }, null);
}
module.exports = { createCampaign, getCampaign, listCampaigns, transitionCampaign, runOnce, registerDevice, createSystemBroadcast };
