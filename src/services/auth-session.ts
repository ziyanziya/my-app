import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthApiBaseUrl } from './auth-api';

export const AUTH_TOKEN_KEY = 'authToken';
export const AUTH_REFRESH_TOKEN_KEY = 'authRefreshToken';
export const AUTH_USER_NAME_KEY = 'authUserName';

type AuthTokens = { accessToken?: string; refreshToken?: string };

export const clearAuthSession = () => AsyncStorage.multiRemove([
  AUTH_TOKEN_KEY,
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_USER_NAME_KEY,
]);

export async function saveAuthSession({ accessToken, refreshToken }: AuthTokens, name?: string) {
  if (!accessToken || !refreshToken) throw new Error('AUTH_RESPONSE_INVALID');
  const values: [string, string][] = [[AUTH_TOKEN_KEY, accessToken], [AUTH_REFRESH_TOKEN_KEY, refreshToken]];
  if (name) values.push([AUTH_USER_NAME_KEY, name]);
  await AsyncStorage.multiSet(values);
  if (!name) await AsyncStorage.removeItem(AUTH_USER_NAME_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await AsyncStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;
  const response = await fetch(`${getAuthApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const payload = await response.json().catch(() => null);
  const accessToken = payload?.data?.accessToken;
  if (!response.ok || !accessToken) return null;
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  return accessToken;
}

/** Sends a protected request and retries once after an expired access token. */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) throw new Error('AUTH_REQUIRED');
  const requestWith = (accessToken: string): RequestInit => ({
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
  });
  const response = await fetch(url, requestWith(token));
  if (response.status !== 401) return response;
  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    await clearAuthSession();
    return response;
  }
  return fetch(url, requestWith(refreshed));
}
