import { Audio } from 'expo-av';
import { PrayerService } from './prayer.service';
import { scheduleLocalNotification } from './notifications.service';
import { getAuthApiBaseUrl } from './auth-api';

let sound: Audio.Sound | null = null;
let timers: Array<ReturnType<typeof setTimeout>> = [];

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type AdhanPreferences = { enabled: boolean; selections: Partial<Record<PrayerKey, string>> };

async function fetchServerAdhanUrl(prayerKey?: 'fajr' | 'default') {
  try {
    const base = getAuthApiBaseUrl();
    const settingsResp = await fetch(`${base}/adhan/settings`);
    const settingsBody = await settingsResp.json().catch(() => null);
    const settings = settingsBody?.data || { fajrFile: null, fajrEnabled: false };
    const filesResp = await fetch(`${base}/adhan`);
    const filesBody = await filesResp.json().catch(() => null);
    const files = filesBody?.data || [];
    if (prayerKey === 'fajr' && settings.fajrEnabled && settings.fajrFile) {
      const found = files.find((f: any) => f.name === settings.fajrFile);
      if (found) return found.url;
    }
    if (files.length > 0) return files[0].url;
    return undefined;
  } catch (e) {
    return undefined;
  }
}

export async function loadAdhanSoundAsync(uri?: any) {
  try {
    if (sound) {
      try { await sound.unloadAsync(); } catch {}
      sound = null;
    }

    const s = new Audio.Sound();
    if (uri) {
      await s.loadAsync({ uri });
    } else {
      // try server-provided adhan
      const serverUrl = await fetchServerAdhanUrl();
      if (serverUrl) {
        await s.loadAsync({ uri: serverUrl });
      } else {
        // Audio is optional until an administrator uploads an adhan file.
        // Do not use a static `require` here: Metro resolves it at bundle time,
        // so a missing optional asset prevents the entire app from loading.
        console.warn('No adhan audio file is available yet.');
        return;
      }
    }

    // Use appropriate audio mode for playback
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
    sound = s;
  } catch (e) {
    console.warn('loadAdhanSoundAsync error', e);
  }
}

export async function playAdhan() {
  try {
    if (!sound) await loadAdhanSoundAsync();
    if (!sound) return;
    await sound.replayAsync();
  } catch (e) {
    console.warn('playAdhan error', e);
  }
}

export async function stopAdhan() {
  try {
    if (sound) await sound.stopAsync();
  } catch (e) {
    console.warn('stopAdhan error', e);
  }
}

export function stopAdhanScheduler() {
  try {
    timers.forEach((t) => clearTimeout(t));
  } finally {
    timers = [];
  }
}

import { NotificationScheduler } from './notification_scheduler';

export function startAdhanScheduler(preferencesOrOnPlay?: AdhanPreferences | (() => void), optionalOnPlay?: () => void) {
  stopAdhanScheduler();
  const preferences = typeof preferencesOrOnPlay === 'function' || !preferencesOrOnPlay
    ? { enabled: true, selections: {} }
    : preferencesOrOnPlay;
  const onPlay = typeof preferencesOrOnPlay === 'function' ? preferencesOrOnPlay : optionalOnPlay;
  
  if (!preferences.enabled) {
    NotificationScheduler.cancelAllOfType('adhan');
    return;
  }

  (async () => {
    try {
      const times = await PrayerService.getTodayPrayerTimes();
      const prayers: Array<{ name: PrayerKey; time: Date }> = [
        { name: 'fajr', time: times.fajr },
        { name: 'dhuhr', time: times.dhuhr },
        { name: 'asr', time: times.asr },
        { name: 'maghrib', time: times.maghrib },
        { name: 'isha', time: times.isha },
      ];
      const now = Date.now();
      const names: Record<string, string> = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };

      prayers.forEach(async (p) => {
        let ts = p.time.getTime();
        let isNextDay = false;
        if (ts <= now) {
          ts += 24 * 60 * 60 * 1000; // schedule for next day if passed
          isNextDay = true;
        }
        
        const dateString = new Date(ts).toISOString().split('T')[0]; // e.g. 2026-08-19
        const scheduleId = `${p.name}:${dateString}`;
        
        // 1. Schedule local push notification (works in background/killed)
        await NotificationScheduler.scheduleExact(
          'adhan',
          scheduleId,
          `حان الآن موعد أذان ${names[p.name]}`,
          'حي على الصلاة، حي على الفلاح',
          new Date(ts)
        );

        // 2. Schedule JS timeout for foreground audio playback
        const delay = ts - now;
        const timer = setTimeout(async () => {
          try {
            const selectedUrl = preferences.selections[p.name]
              || await fetchServerAdhanUrl(p.name === 'fajr' ? 'fajr' : 'default');
            await loadAdhanSoundAsync(selectedUrl);
            await playAdhan();
            if (onPlay) onPlay();
          } catch (e) {
            console.warn('scheduled adhan play error', e);
          }
        }, delay);
        
        timers.push(timer);
      });
    } catch (e) {
      console.warn('startAdhanScheduler error', e);
    }
  })();
}

export default {
  loadAdhanSoundAsync,
  playAdhan,
  stopAdhan,
  startAdhanScheduler,
  stopAdhanScheduler,
};
