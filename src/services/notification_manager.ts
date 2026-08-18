import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthApiBaseUrl } from './auth-api';
import { registerForPushNotificationsAsync } from './notifications.service';
import { NotificationScheduler } from './notification_scheduler';

export type NotificationPreferences = {
  global_enabled: boolean;
  adhan_enabled: boolean;
  worship_enabled: boolean;
  new_sections_enabled: boolean;
};

const DEFAULT_PREFS: NotificationPreferences = {
  global_enabled: true,
  adhan_enabled: true,
  worship_enabled: true,
  new_sections_enabled: true,
};

export class NotificationManager {
  private static PREFS_KEY = 'notification_preferences_v1';

  /**
   * Loads the notification preferences from local storage and server
   */
  static async loadPreferences(): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(this.PREFS_KEY);
      if (stored) {
        return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
      }
      return DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  }

  /**
   * Save preferences locally and sync relevant ones to server
   */
  static async savePreferences(prefs: NotificationPreferences) {
    try {
      await AsyncStorage.setItem(this.PREFS_KEY, JSON.stringify(prefs));

      // Sync push notifications setting with server
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const baseUrl = await getAuthApiBaseUrl();
        await fetch(`${baseUrl}/users/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            push_notify_new_sections: prefs.global_enabled && prefs.new_sections_enabled ? 'true' : 'false',
          }),
        });
      }

      // Re-evaluate scheduled local notifications based on new prefs
      this.reEvaluateLocalSchedules(prefs);
    } catch (error) {
      console.warn('[NotificationManager] Failed to save preferences', error);
    }
  }

  /**
   * Synchronize the device with Expo push tokens and local alarms
   * Call this on app startup
   */
  static async syncOnStartup() {
    const prefs = await this.loadPreferences();
    if (!prefs.global_enabled) {
      await NotificationScheduler.cancelAll();
      return;
    }

    // Try to register for push notifications (this also sends token to backend)
    await registerForPushNotificationsAsync();
    
    // Evaluate Adhan and Worship local notifications
    await this.reEvaluateLocalSchedules(prefs);
  }

  private static async reEvaluateLocalSchedules(prefs: NotificationPreferences) {
    if (!prefs.global_enabled) {
      await NotificationScheduler.cancelAll();
      return;
    }

    if (!prefs.adhan_enabled) {
      await NotificationScheduler.cancelAllOfType('adhan');
    }

    if (!prefs.worship_enabled) {
      await NotificationScheduler.cancelAllOfType('worship_reminder');
    } else {
      // Re-schedule generic worship reminders
      // For instance, a generic daily morning and evening reminder
      await NotificationScheduler.scheduleDaily(
        'worship_reminder',
        'morning_azkar',
        'أذكار الصباح',
        'حان وقت أذكار الصباح، ابدأ يومك بذكر الله.',
        6, 0 // 6:00 AM
      );
      
      await NotificationScheduler.scheduleDaily(
        'worship_reminder',
        'evening_azkar',
        'أذكار المساء',
        'حان وقت أذكار المساء، اختم يومك بذكر الله.',
        17, 30 // 5:30 PM
      );
    }
  }
}
