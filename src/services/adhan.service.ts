import { Audio } from 'expo-av';
import { PrayerService } from './prayer.service';
import { getAuthApiBaseUrl } from './auth-api';
import notifee, { TimestampTrigger, TriggerType, AndroidImportance, AndroidCategory } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

let sound: Audio.Sound | null = null;
let currentPreferences: AdhanPreferences = { enabled: false, selections: {} };

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
      const serverUrl = await fetchServerAdhanUrl();
      if (serverUrl) {
        await s.loadAsync({ uri: serverUrl });
      } else {
        console.warn('No adhan audio file is available yet.');
        return;
      }
    }

    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
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

export async function playAdhanForPrayer(prayerKey: PrayerKey) {
  try {
    const selectedUrl = currentPreferences.selections[prayerKey]
      || await fetchServerAdhanUrl(prayerKey === 'fajr' ? 'fajr' : 'default');

    await loadAdhanSoundAsync(selectedUrl);
    await playAdhan();
  } catch (e) {
    console.warn('playAdhanForPrayer error', e);
  }
}

export async function stopAdhanScheduler() {
  try {
    await notifee.cancelAllNotifications();
  } catch (e) {
    console.warn('stopAdhanScheduler error', e);
  }
}

export async function startAdhanScheduler(preferencesOrOnPlay?: AdhanPreferences | (() => void), optionalOnPlay?: () => void) {
  await stopAdhanScheduler();
  const preferences = typeof preferencesOrOnPlay === 'function' || !preferencesOrOnPlay
    ? { enabled: true, selections: {} }
    : preferencesOrOnPlay;
  
  currentPreferences = preferences;
  
  if (!preferences.enabled) {
    return;
  }

  try {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'adhan',
        name: 'أذان الصلاة',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });
    }

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

    for (const p of prayers) {
      let ts = p.time.getTime();
      if (ts <= now) {
        ts += 24 * 60 * 60 * 1000;
      }
      
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: ts,
        alarmManager: {
          allowWhileIdle: true,
        },
      };

      await notifee.createTriggerNotification(
        {
          id: `adhan_${p.name}`,
          title: `حان الآن موعد أذان ${names[p.name]}`,
          body: 'حي على الصلاة، حي على الفلاح',
          data: { type: 'adhan', prayerKey: p.name },
          android: {
            channelId: 'adhan',
            category: AndroidCategory.ALARM,
            fullScreenAction: {
              id: 'default',
            },
            pressAction: {
              id: 'default',
            },
            actions: [
              { title: 'إيقاف الأذان', pressAction: { id: 'stop_adhan' } }
            ]
          },
          ios: {
            categoryId: 'adhan',
            sound: 'default',
          }
        },
        trigger
      );
    }
  } catch (e) {
    console.warn('startAdhanScheduler error', e);
  }
}

export default {
  loadAdhanSoundAsync,
  playAdhan,
  stopAdhan,
  startAdhanScheduler,
  stopAdhanScheduler,
  playAdhanForPrayer,
};
