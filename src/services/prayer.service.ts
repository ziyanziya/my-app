import { CalculationMethod, Coordinates, HighLatitudeRule, PrayerTimes } from 'adhan';

const PRAYER_STORAGE_KEY = 'prayerTimesData';

export type PrayerTimesResult = {
  fajr: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  sunrise: Date;
};

type StoredPrayerTimesData = {
  dateKey: string;
  latitude: number;
  longitude: number;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  sunrise: string;
};

export class PrayerService {
  static createDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static async getDeviceCoordinates(): Promise<{ latitude: number; longitude: number }> {
    const defaultCoordinates = { latitude: 24.7136, longitude: 46.6753 };

    const getBrowserLocation = (): Promise<{ latitude: number; longitude: number }> => {
      return new Promise((resolve, reject) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          reject(new Error('Browser geolocation unavailable'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 },
        );
      });
    };

    const getIpLocation = async (): Promise<{ latitude: number; longitude: number }> => {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) {
        throw new Error('IP location lookup failed');
      }
      const data = await response.json();
      if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
        throw new Error('IP location lookup returned invalid coordinates');
      }
      return { latitude: data.latitude, longitude: data.longitude };
    };

    try {
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === Location.PermissionStatus.GRANTED) {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        if (location && location.coords) {
          return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
        }
      }
    } catch {
      // Continue to web/browser fallback if expo-location is unavailable or fails.
    }

    try {
      return await getBrowserLocation();
    } catch {
      // Continue to IP-based fallback.
    }

    try {
      return await getIpLocation();
    } catch {
      return defaultCoordinates;
    }
  }

  static getPrayerTimes(date: Date, latitude: number, longitude: number): PrayerTimesResult {
    const coordinates = new Coordinates(latitude, longitude);
    const params = CalculationMethod.MuslimWorldLeague();
    params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;

    const prayerTimes = new PrayerTimes(coordinates, date, params);

    return {
      fajr: prayerTimes.fajr,
      dhuhr: prayerTimes.dhuhr,
      asr: prayerTimes.asr,
      maghrib: prayerTimes.maghrib,
      isha: prayerTimes.isha,
      sunrise: prayerTimes.sunrise,
    };
  }

  static async loadStoredPrayerTimes(): Promise<StoredPrayerTimesData | null> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const raw = await AsyncStorage.getItem(PRAYER_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as StoredPrayerTimesData;
    } catch {
      return null;
    }
  }

  static async savePrayerTimes(data: StoredPrayerTimesData): Promise<void> {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem(PRAYER_STORAGE_KEY, JSON.stringify(data));
  }

  static parseStoredTimes(data: StoredPrayerTimesData): PrayerTimesResult {
    return {
      fajr: new Date(data.fajr),
      dhuhr: new Date(data.dhuhr),
      asr: new Date(data.asr),
      maghrib: new Date(data.maghrib),
      isha: new Date(data.isha),
      sunrise: new Date(data.sunrise),
    };
  }

  static async getTodayPrayerTimes(): Promise<PrayerTimesResult> {
    const today = new Date();
    const todayKey = this.createDateKey(today);
    
    try {
      const stored = await this.loadStoredPrayerTimes();

      if (stored && stored.dateKey === todayKey) {
        return this.parseStoredTimes(stored);
      }

      let coordinates: { latitude: number; longitude: number };
      try {
        coordinates = stored
          ? { latitude: stored.latitude, longitude: stored.longitude }
          : await this.getDeviceCoordinates();
      } catch {
        // Fallback to default coordinates (e.g., Saudi Arabia)
        coordinates = { latitude: 24.7136, longitude: 46.6753 };
      }

      const prayerTimes = this.getPrayerTimes(today, coordinates.latitude, coordinates.longitude);

      try {
        await this.savePrayerTimes({
          dateKey: todayKey,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          fajr: prayerTimes.fajr.toISOString(),
          dhuhr: prayerTimes.dhuhr.toISOString(),
          asr: prayerTimes.asr.toISOString(),
          maghrib: prayerTimes.maghrib.toISOString(),
          isha: prayerTimes.isha.toISOString(),
          sunrise: prayerTimes.sunrise.toISOString(),
        });
      } catch {
        // AsyncStorage may not work on web, but that's okay
      }

      return prayerTimes;
    } catch (error) {
      console.error('Error getting prayer times:', error);
      const fallbackCoordinates = { latitude: 24.7136, longitude: 46.6753 };
      return this.getPrayerTimes(today, fallbackCoordinates.latitude, fallbackCoordinates.longitude);
    }
  }
}
