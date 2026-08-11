// Time Circle Engine
// Exports computeTimeCircle(activities, options)
// activities: [{ id, title, scheduled_at (ISO)?, default_time (HH:MM:SS)?, durationMinutes?, completed? }]
// options: { now: Date|string, fajr: 'HH:MM:SS' | Date, startOfDay: Date, timezone (ignored) }

function parseTimeToDate(baseDate, timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(p => parseInt(p, 10));
  if (parts.length < 2) return null;
  const d = new Date(baseDate);
  d.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
  return d;
}

function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d;
  return null;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function computeTimeCircle(activities = [], options = {}) {
  const now = options.now ? toDate(options.now) : new Date();

  // determine startOfDay: preference order: options.startOfDay, options.fajr (time today), fallback to midnight
  let startOfDay = options.startOfDay ? toDate(options.startOfDay) : null;
  if (!startOfDay && options.fajr) {
    // fajr can be Date or time string
    if (typeof options.fajr === 'string') {
      const today = new Date(now);
      today.setHours(0,0,0,0);
      startOfDay = parseTimeToDate(today, options.fajr);
      // if fajr time is after now+12h (rare), assume previous day
      if (startOfDay > new Date(now.getTime() + 12*3600*1000)) {
        startOfDay = new Date(startOfDay.getTime() - 24*3600*1000);
      }
    } else {
      startOfDay = toDate(options.fajr);
    }
  }
  if (!startOfDay) {
    startOfDay = new Date(now);
    startOfDay.setHours(0,0,0,0);
  }

  const dayMs = 24 * 3600 * 1000;
  const dayEnd = new Date(startOfDay.getTime() + dayMs);

  // map activities to scheduled times within [startOfDay, dayEnd)
  const mapped = activities.map(act => {
    let scheduled = null;
    if (act.scheduled_at) scheduled = toDate(act.scheduled_at);
    if (!scheduled && act.default_time) scheduled = parseTimeToDate(startOfDay, act.default_time);
    // if scheduled is before startOfDay and there's a default_time, roll to next day
    if (scheduled && scheduled < startOfDay) scheduled = new Date(scheduled.getTime() + dayMs);
    const durationMs = (act.durationMinutes ? Number(act.durationMinutes) : 30) * 60 * 1000;
    return Object.assign({}, act, { scheduled, durationMs, completed: !!act.completed });
  }).filter(a => a.scheduled && a.scheduled < dayEnd && a.scheduled >= startOfDay);

  // sort ascending by scheduled
  mapped.sort((a,b) => a.scheduled - b.scheduled);

  // compute end times: default end = scheduled + duration; but end = min(next.scheduled, scheduled+duration)
  for (let i=0;i<mapped.length;i++) {
    const cur = mapped[i];
    const next = mapped[i+1];
    const defaultEnd = new Date(cur.scheduled.getTime() + cur.durationMs);
    if (next) {
      cur.end = new Date(Math.min(defaultEnd.getTime(), next.scheduled.getTime()));
    } else {
      cur.end = defaultEnd;
    }
  }

  // find current and next
  let current = null;
  let next = null;
  for (let i=0;i<mapped.length;i++) {
    const a = mapped[i];
    if (!a.completed && a.scheduled <= now && now < a.end) { current = a; next = mapped[i+1] || null; break; }
    if (!a.completed && a.scheduled > now) { next = a; break; }
  }
  // if no current found but previous item is not completed and its end passed, consider current null

  // percent complete = completedCount / totalCount
  const totalCount = mapped.length;
  const completedCount = mapped.filter(a => a.completed).length;
  const percentComplete = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 10000) / 100;

  // circle segments
  const segments = mapped.map(a => {
    const startOffset = clamp(a.scheduled.getTime() - startOfDay.getTime(), 0, dayMs);
    const endOffset = clamp(a.end.getTime() - startOfDay.getTime(), 0, dayMs);
    const startAngle = (startOffset / dayMs) * 360;
    const endAngle = (endOffset / dayMs) * 360;
    return {
      id: a.id,
      title: a.title,
      scheduled: a.scheduled.toISOString(),
      end: a.end.toISOString(),
      completed: !!a.completed,
      startAngle, endAngle,
      durationMinutes: Math.round((a.end.getTime() - a.scheduled.getTime())/60000)
    };
  });

  return {
    startOfDay: startOfDay.toISOString(),
    dayEnd: dayEnd.toISOString(),
    now: now.toISOString(),
    totalCount,
    completedCount,
    percentComplete,
    current: current ? { id: current.id, title: current.title, scheduled: current.scheduled.toISOString(), end: current.end.toISOString(), completed: current.completed } : null,
    next: next ? { id: next.id, title: next.title, scheduled: next.scheduled.toISOString(), completed: next.completed } : null,
    segments
  };
}

module.exports = { computeTimeCircle };
