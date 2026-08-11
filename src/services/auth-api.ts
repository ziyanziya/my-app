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

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}/api/v1`;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    return `${protocol}//${hostname}:${API_PORT}/api/v1`;
  }

  const expoDevelopmentHost = getExpoDevelopmentHost();
  if (expoDevelopmentHost) {
    return `http://${expoDevelopmentHost}:${API_PORT}/api/v1`;
  }

  return `http://localhost:${API_PORT}/api/v1`;
};
