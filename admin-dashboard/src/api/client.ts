const API_PORT = 5002;
const SESSION_STORAGE_KEY = 'sirat-admin-session';

const getBaseUrl = () => {
  const configured = ((import.meta as any).env?.VITE_API_URL as string | undefined);
  if (configured) return configured.replace(/\/+$/, '');
  return `http://${window.location.hostname}:${API_PORT}/api/v1`;
};

export const apiUrl = getBaseUrl();

type StoredSession = { accessToken: string; refreshToken?: string };

async function refreshStoredAccessToken(): Promise<string | null> {
  let session: StoredSession | null = null;
  try {
    session = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
  if (!session?.refreshToken) return null;

  const response = await fetch(`${apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  if (!response.ok) return null;

  const body = await response.json() as { data?: { accessToken?: string } };
  const accessToken = body.data?.accessToken;
  if (!accessToken) return null;

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...session, accessToken }));
  window.dispatchEvent(new Event('sirat-admin-session-refreshed'));
  return accessToken;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, accessToken?: string | null): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const send = (token = accessToken): Promise<Response> => fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  let response: Response;
  try {
    response = await send();
    if (response.status === 401 && path !== '/auth/refresh') {
      const refreshedToken = await refreshStoredAccessToken();
      if (refreshedToken) response = await send(refreshedToken);
    }
  } catch {
    throw new Error('تعذر الاتصال بالخادم. تأكد من تشغيل خادم الصراط ثم حاول مجددًا.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) throw new Error('الرمز غير صالح أو منتهي الصلاحية. أعد تسجيل الدخول.');
    throw new Error(body?.message || body?.error?.message || 'تعذر تنفيذ الطلب.');
  }
  return body as T;
}
