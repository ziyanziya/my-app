import { Slot, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nManager, ImageBackground, Platform, View } from 'react-native';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppBottomNavigation } from '../components/app-bottom-navigation';
import AdhanService from '../services/adhan.service';
import { requestAppPermissions } from '../services/permissions.service';
import { NotificationManager } from '../services/notification_manager';
import * as Notifications from 'expo-notifications';
import { registerBackgroundTasks } from '../services/background_task';

// ─── Force LTR layout globally ───────────────────────────────────────────────
// The browser always renders LTR (left → right). On Arabic-locale devices,
// React Native automatically enables RTL which mirrors the entire layout.
// We override that here so phone and browser behave identically.
if (I18nManager.isRTL) {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
}
// ─────────────────────────────────────────────────────────────────────────────

const APP_BACKGROUND = require('../../assets/images/auth/islamic-auth-background.png');

// Register background tasks for Notifee and TrackPlayer (Must be outside React components)
registerBackgroundTasks();

export default function TabLayout() {
  useEffect(() => {
    requestAppPermissions().then(() => {
      NotificationManager.syncOnStartup();
      AsyncStorage.getItem('adhan_prefs').then((saved) => {
        const prefs = saved ? JSON.parse(saved) : { enabled: false, selections: {} };
        if (prefs.enabled) AdhanService.startAdhanScheduler(prefs);
      }).catch(() => {});
    });
  }, []);

  useEffect(() => {
    // Remove legacy completion cache that was not scoped to a user account.
    AsyncStorage.getAllKeys().then((keys) => {
      const legacyKeys = keys.filter((key) => key.startsWith('theory-completed-sections:'));
      return legacyKeys.length ? AsyncStorage.multiRemove(legacyKeys) : undefined;
    }).catch(() => {});
  }, []);

  useEffect(() => {
    // Expo notification response APIs are native-only. Calling them on web
    // throws before the app can render.
    if (Platform.OS === 'web') return;

    const open = (notification: Notifications.Notification) => {
      const data = notification.request.content.data as { deepLink?: unknown };
      if (typeof data.deepLink === 'string' && data.deepLink.startsWith('/')) router.push(data.deepLink as never);
    };
    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) open(last.notification);
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => open(response.notification));
    return () => subscription.remove();
  }, []);

  return <SafeAreaProvider><ImageBackground source={APP_BACKGROUND} resizeMode="cover" style={{ flex: 1 }}><View style={{ flex: 1 }}><Slot /></View><AppBottomNavigation /></ImageBackground></SafeAreaProvider>;
}
