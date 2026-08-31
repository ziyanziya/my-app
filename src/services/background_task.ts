import { Platform } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import AdhanService from './adhan.service';

export function registerBackgroundTasks() {
  // Setup Notifee background event listener
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;

    // Handle exact trigger for adhan
    if (type === EventType.DELIVERED && notification?.data?.type === 'adhan') {
      if (Platform.OS === 'android') {
        const prayerKey = notification.data.prayerKey as string;
        if (prayerKey) {
          try {
            await AdhanService.playAdhanForPrayer(prayerKey as any);
          } catch (e) {
            console.warn('Failed to play adhan in background', e);
          }
        }
      }
    }

    // Stop adhan if action pressed
    if (type === EventType.ACTION_PRESS && pressAction?.id === 'stop_adhan') {
      await AdhanService.stopAdhan();
      if (notification?.id) {
        await notifee.cancelNotification(notification.id);
      }
    }
  });
}
