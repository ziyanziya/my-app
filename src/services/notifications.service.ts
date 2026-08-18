import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  
  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }
  
  if (!granted) {
    console.warn('Failed to get push token for push notification!');
    return;
  }
  
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) throw new Error('Missing EAS project ID for Expo push notifications');
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await syncPushTokenWithServer(token);
  } catch (e) {
    console.warn('Could not get Expo Push Token', e);
  }
  return token;
}

import { getAuthApiBaseUrl } from './auth-api';

async function syncPushTokenWithServer(token: string) {
  try {
    const tokenStr = await AsyncStorage.getItem('authToken');
    if (!tokenStr) return;
    
    const baseUrl = await getAuthApiBaseUrl();
    const url = `${baseUrl}/users/push-token`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStr}`,
      },
      body: JSON.stringify({ token, platform: Platform.OS }),
    });
  } catch (error) {
    console.warn('Error syncing push token:', error);
  }
}

export async function scheduleLocalNotification(title: string, body: string, date: Date) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  } catch (error) {
    console.warn('Error scheduling local notification:', error);
  }
}
