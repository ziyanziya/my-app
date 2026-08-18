import { prayerWheelConfig, type PrayerWheelEventConfig } from '../config/prayer-wheel.config';
import type { PrayerTimesResult } from './prayer.service';
import { getAuthApiBaseUrl } from './auth-api';

export type DailyWheelItem = {
  id: string;
  label: string;
  sourceKey: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  reverseTextDirection?: boolean;
  worshipId?: number;
};

const MINUTES_IN_MS = 60 * 1000;
const HOURS_IN_MS = 60 * MINUTES_IN_MS;

const offsetTime = (baseTime: Date, minutes: number): Date => {
  return new Date(baseTime.getTime() + minutes * MINUTES_IN_MS);
};

const timeAfterMidnightIfNeeded = (reference: Date, candidate: Date): Date => {
  if (candidate.getTime() <= reference.getTime()) {
    return new Date(candidate.getTime() + 24 * HOURS_IN_MS);
  }
  return candidate;
};

const calculateMidpoint = (start: Date, end: Date): Date => {
  const adjustedEnd = timeAfterMidnightIfNeeded(start, end);
  return new Date(start.getTime() + (adjustedEnd.getTime() - start.getTime()) / 2);
};

const buildLookup = (prayerTimes: PrayerTimesResult): Record<string, Date> => {
  return {
    fajr: prayerTimes.fajr,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
    sunrise: prayerTimes.sunrise,
    ishaFajrMidpoint: calculateMidpoint(prayerTimes.isha, prayerTimes.fajr),
  };
};

const resolveEventTime = (
  key: string,
  config: PrayerWheelEventConfig[],
  baseTimes: Record<string, Date>,
  cache: Record<string, Date>,
  stack: string[] = []
): Date => {
  if (cache[key]) {
    return cache[key];
  }

  if (baseTimes[key]) {
    cache[key] = baseTimes[key];
    return cache[key];
  }

  const eventConfig = config.find((event) => event.id === key);
  if (!eventConfig) {
    throw new Error(`Unsupported wheel source key: ${key}`);
  }

  if (stack.includes(key)) {
    throw new Error(`Circular dependency detected when resolving wheel key: ${key}`);
  }

  const sourceTime = resolveEventTime(eventConfig.sourceKey, config, baseTimes, cache, [...stack, key]);
  const resolved = offsetTime(sourceTime, eventConfig.offsetMinutes);
  cache[key] = resolved;
  return resolved;
};

type PrayerWheelEventRow = {
  slug: string;
  label: string;
  anchor_type: 'prayer' | 'event';
  anchor_key: string;
  offset_minutes: number;
  duration_minutes: number | null;
  reverse_text_direction: number | boolean;
  sort_order: number;
  is_active: number;
};

type WorshipRow = {
  id: number;
  wheel_key: string | null;
};

const normalizeAnchorKey = (anchorKey: string, anchorType: 'prayer' | 'event'): string => {
  const baseTimeAliases: Record<string, string> = {
    isha_fajr_midpoint: 'ishaFajrMidpoint',
  };

  if (anchorType === 'prayer' && baseTimeAliases[anchorKey]) {
    return baseTimeAliases[anchorKey];
  }

  return anchorKey;
};

const buildWorshipLookup = (worships: WorshipRow[]) => {
  const map = new Map<string, number>();
  worships.forEach((w) => {
    if (w.wheel_key) map.set(w.wheel_key, w.id);
  });
  return map;
};

// These wheel segments intentionally reuse the content of their earlier peer.
const sharedContentKeys: Record<string, string> = {
  after_dhuhr_dhikr: 'morning_dhikr_after_duha',
  daily_supplication: 'morning_supplication',
};

const getWorshipIdForWheelKey = (lookup: Map<string, number>, wheelKey: string) =>
  lookup.get(sharedContentKeys[wheelKey] ?? wheelKey);

// These labels sit on the lower half of the wheel and need the opposite
// orientation to remain readable along their slices.
const reverseTextDirectionKeys = new Set([
  'qiyam_layl',
  'qiyamLayl',
]);

export async function loadPrayerWheelEventsConfig(): Promise<PrayerWheelEventConfig[]> {
  const prayerEventIds: Record<string, number> = {
    maghribPrayer: 20,
    ishaPrayer: 40,
    fajrPrayer: 110,
    dhuhrPrayer: 180,
    asrPrayer: 230,
  };

  const staticPrayerEvents = prayerWheelConfig.events.filter((event) => Object.prototype.hasOwnProperty.call(prayerEventIds, event.id));

  // ── Timeout guard: abort if server doesn't respond within 5 seconds ──
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const baseUrl = getAuthApiBaseUrl();
    const fetchOpts: RequestInit = { signal: controller.signal };

    const [response, worshipsResponse] = await Promise.all([
      fetch(`${baseUrl}/prayer-wheel-events`, fetchOpts),
      fetch(`${baseUrl}/worships?all=1`, fetchOpts),
    ]).finally(() => clearTimeout(timeoutId));

    if (!response.ok) throw new Error('Failed to load prayer wheel events');
    const payload = await response.json();
    const rows = Array.isArray(payload?.data) ? payload.data as PrayerWheelEventRow[] : [];

    const worshipsPayload = worshipsResponse.ok ? await worshipsResponse.json() : null;
    const worshipRows = Array.isArray(worshipsPayload?.data) ? worshipsPayload.data as WorshipRow[] : [];
    const worshipLookup = buildWorshipLookup(worshipRows);

    const dbEvents = rows
      .filter((row) => row.is_active === 1)
      .map((row) => ({
        id: row.slug,
        label: row.label,
        sourceKey: normalizeAnchorKey(row.anchor_key, row.anchor_type),
        offsetMinutes: Number(row.offset_minutes ?? 0),
        durationMinutes: Number(row.duration_minutes ?? prayerWheelConfig.defaultDurationMinutes),
        reverseTextDirection: reverseTextDirectionKeys.has(row.slug) || Boolean(row.reverse_text_direction),
        sortOrder: Number(row.sort_order ?? 0),
        worshipId: getWorshipIdForWheelKey(worshipLookup, row.slug),
      }));

    const merged = [
      ...dbEvents.map((event) => ({ event, sortOrder: event.sortOrder })),
      ...staticPrayerEvents.map((event) => ({
        event: {
          ...event,
          worshipId: getWorshipIdForWheelKey(worshipLookup, event.id),
        },
        sortOrder: prayerEventIds[event.id],
      })),
    ].sort((a, b) => a.sortOrder - b.sortOrder);

    return merged.map((item) => item.event);
  } catch (_err) {
    // Server unreachable or timed-out — silently fall back to static config
    clearTimeout(timeoutId);
    return prayerWheelConfig.events;
  }
}


export function generateDailyWheel(
  prayerTimes: PrayerTimesResult,
  config = prayerWheelConfig,
): DailyWheelItem[] {
  const baseTimes = buildLookup(prayerTimes);
  const cache: Record<string, Date> = {};

  const items = config.events.map((eventConfig) => {
    const eventStart = resolveEventTime(eventConfig.id, config.events, baseTimes, cache);
    const endTime = offsetTime(eventStart, eventConfig.durationMinutes);

    return {
      id: eventConfig.id,
      label: eventConfig.label,
      sourceKey: eventConfig.sourceKey,
      startTime: eventStart,
      endTime,
      durationMinutes: eventConfig.durationMinutes,
      reverseTextDirection: eventConfig.reverseTextDirection,
      worshipId: eventConfig.worshipId,
    };
  });

  return items;
}

