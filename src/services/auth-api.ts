import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 5002;

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

const getExpoDevelopmentHost = (): string | null => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  return hostUri.split(':')[0] || null;
};

export const getAuthApiBaseUrl = (): string => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl) {
    return stripTrailingSlash(configuredUrl);
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    return `${protocol}//${hostname}:${API_PORT}/api/v1`;
  }

  const expoDevelopmentHost = getExpoDevelopmentHost();
  if (expoDevelopmentHost) {
    return `http://${expoDevelopmentHost}:${API_PORT}/api/v1`;
  }

  // 10.0.2.2 is the Android emulator's alias for the development machine.
  // A physical device must use Expo's LAN host above instead.
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}/api/v1`;
  }

  return `http://localhost:${API_PORT}/api/v1`;
};

/**
 * fetch مع timeout تلقائي — يُلغي الطلب إذا لم يستجب الخادم خلال المدة المحددة.
 * يمنع خطأ "Failed to fetch" من الظهور كـ Unhandled Error في المتصفح.
 */
export const fetchWithTimeout = (
  url: string,
  options: RequestInit = {},
  timeoutMs = 10_000,
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timeoutId),
  );
};
