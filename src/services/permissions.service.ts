import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PERMISSIONS_ASKED_KEY = 'permissions_asked';

export async function requestAppPermissions(): Promise<boolean> {
  const alreadyAsked = await AsyncStorage.getItem(PERMISSIONS_ASKED_KEY);
  if (alreadyAsked) return true;

  return new Promise((resolve) => {
    Alert.alert(
      'صلاحيات التطبيق (الأذان)',
      'لضمان عمل الأذان في وقته بدقة، يحتاج التطبيق إلى إرسال الإشعارات والعمل في الخلفية. هل توافق على منح هذه الصلاحيات؟',
      [
        {
          text: 'ليس الآن',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'موافق',
          onPress: async () => {
            await AsyncStorage.setItem(PERMISSIONS_ASKED_KEY, 'true');
            await requestNotificationPermissions();
            await requestBatteryOptimizationIgnore();
            resolve(true);
          },
        },
      ]
    );
  });
}

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('تنبيه', 'لم يتم تفعيل الإشعارات، قد لا تتمكن من سماع الأذان في وقته.');
  }
}

export async function requestBatteryOptimizationIgnore() {
  if (Platform.OS !== 'android') return;
  
  // In a real production app, we would use expo-battery to check if optimization is enabled.
  // For now, we will simply open the Intent for battery optimization if the user agrees.
  Alert.alert(
    'تحسين البطارية',
    'الرجاء السماح للتطبيق بالعمل في الخلفية (أو إلغاء قيد البطارية) لضمان عدم تأخر الأذان.',
    [
      { text: 'تخطي', style: 'cancel' },
      {
        text: 'الإعدادات',
        onPress: () => {
          try {
            IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
          } catch (e) {
            console.warn('Could not launch intent', e);
          }
        },
      },
    ]
  );
}
