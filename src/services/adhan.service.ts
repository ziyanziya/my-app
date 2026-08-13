import { Audio } from 'expo-av';
import { PrayerService } from './prayer.service';
import { getAuthApiBaseUrl } from './auth-api';

let sound: Audio.Sound | null = null;
let timers: Array<ReturnType<typeof setTimeout>> = [];

async function fetchServerAdhanUrl(prayerKey?: 'fajr' | 'default') {
  try {
    const base = getAuthApiBaseUrl();
    const settingsResp = await fetch(`${base}/admin/adhan/settings`);
    const settingsBody = await settingsResp.json().catch(() => null);
    const settings = settingsBody?.data || { fajrFile: null, fajrEnabled: false };
    const filesResp = await fetch(`${base}/admin/adhan`);
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
        // Placeholder: add a licensed adhan file at src/assets/adhan_placeholder.mp3
        await s.loadAsync(require('../assets/adhan_placeholder.mp3'));
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

export function stopAdhanScheduler() {
  try {
    timers.forEach((t) => clearTimeout(t));
  } finally {
    timers = [];
  }
}

export function startAdhanScheduler(onPlay?: () => void) {
  stopAdhanScheduler();

  (async () => {
    try {
      const times = await PrayerService.getTodayPrayerTimes();
      const prayers = [
        { name: 'fajr', time: times.fajr },
        { name: 'dhuhr', time: times.dhuhr },
        { name: 'asr', time: times.asr },
        { name: 'maghrib', time: times.maghrib },
        { name: 'isha', time: times.isha },
      ];
      const now = Date.now();

      prayers.forEach((p) => {
        let ts = p.time.getTime();
        if (ts <= now) ts += 24 * 60 * 60 * 1000; // schedule for next day if passed
        const delay = ts - now;
        const timer = setTimeout(async () => {
          try {
            // load prayer-specific sound if available (fajr special)
            try { await loadAdhanSoundAsync(p.name === 'fajr' ? undefined : undefined); } catch {}
            // if fajr, attempt to load fajr-specific url
            if (p.name === 'fajr') {
              const fajrUrl = await fetchServerAdhanUrl('fajr');
              if (fajrUrl) await loadAdhanSoundAsync(fajrUrl);
            }
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
  startAdhanScheduler,
  stopAdhanScheduler,
};
