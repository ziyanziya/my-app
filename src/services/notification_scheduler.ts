import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type NotificationType = 'adhan' | 'worship_reminder' | 'system';

export class NotificationScheduler {
  private static PREFIX = 'notif_id_';

  /** Local notification scheduling is not implemented by expo-notifications on web. */
  private static get isSupported() {
    return Platform.OS !== 'web';
  }

  /**
   * Schedule a notification for an exact Date
   */
  static async scheduleExact(
    type: NotificationType,
    id: string,
    title: string,
    body: string,
    date: Date,
    data?: any
  ): Promise<string | null> {
    if (!this.isSupported) return null;

    try {
      if (date.getTime() <= Date.now()) return null;
      await this.cancel(type, id);

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type, id, ...data },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        },
      });

      await this.saveIdentifier(type, id, identifier);
      return identifier;
    } catch (error) {
      console.warn(`[NotificationScheduler] Failed to schedule exact notification ${type}:${id}`, error);
      return null;
    }
  }

  /**
   * Schedule a daily repeating notification at specific hours and minutes
   */
  static async scheduleDaily(
    type: NotificationType,
    id: string,
    title: string,
    body: string,
    hour: number,
    minute: number,
    data?: any
  ): Promise<string | null> {
    if (!this.isSupported) return null;

    try {
      await this.cancel(type, id);
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type, id, ...data },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });

      await this.saveIdentifier(type, id, identifier);
      return identifier;
    } catch (error) {
      console.warn(`[NotificationScheduler] Failed to schedule daily notification ${type}:${id}`, error);
      return null;
    }
  }

  /**
   * Cancel a specific notification
   */
  static async cancel(type: NotificationType, id: string) {
    const key = `${this.PREFIX}${type}_${id}`;
    const identifier = await AsyncStorage.getItem(key);
    if (identifier) {
      if (this.isSupported) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      }
      await AsyncStorage.removeItem(key);
    }
  }

  /**
   * Cancel all notifications of a specific type
   */
  static async cancelAllOfType(type: NotificationType) {
    const allKeys = await AsyncStorage.getAllKeys();
    const typeKeys = allKeys.filter(k => k.startsWith(`${this.PREFIX}${type}_`));
    
    for (const key of typeKeys) {
      const identifier = await AsyncStorage.getItem(key);
      if (identifier && this.isSupported) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      }
    }
    
    if (typeKeys.length > 0) {
      await AsyncStorage.multiRemove(typeKeys);
    }
  }

  static async cancelAll() {
    if (this.isSupported) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    const allKeys = await AsyncStorage.getAllKeys();
    const notifKeys = allKeys.filter(k => k.startsWith(this.PREFIX));
    if (notifKeys.length > 0) {
      await AsyncStorage.multiRemove(notifKeys);
    }
  }

  private static async saveIdentifier(type: NotificationType, id: string, identifier: string) {
    const key = `${this.PREFIX}${type}_${id}`;
    await AsyncStorage.setItem(key, identifier);
  }
}
