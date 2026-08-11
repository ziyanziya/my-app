import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiFetch } from '../api/client';

type AdminUser = { id: number; name: string; email: string; role: string };
type AuthState = { accessToken: string; refreshToken?: string; user: AdminUser };
type AuthContextValue = {
  session: AuthState | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = 'sirat-admin-session';
const AuthContext = createContext<AuthContextValue | null>(null);

const loadSession = (): AuthState | null => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthState | null>(loadSession);
  useEffect(() => {
    const syncSession = () => setSession(loadSession());
    window.addEventListener('sirat-admin-session-refreshed', syncSession);
    return () => window.removeEventListener('sirat-admin-session-refreshed', syncSession);
  }, []);
  const value = useMemo<AuthContextValue>(() => ({
    session,
    async login(identifier, password) {
      const response = await apiFetch<{ data: { accessToken: string; refreshToken: string; user: AdminUser } }>('/auth/login', {
        method: 'POST', body: JSON.stringify({ identifier, password }),
      });
      const next = { accessToken: response.data.accessToken, refreshToken: response.data.refreshToken, user: response.data.user };
      if (next.user.role !== 'admin') throw new Error('هذا الحساب لا يملك صلاحية دخول منصة الإدارة.');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSession(next);
    },
    logout() { localStorage.removeItem(STORAGE_KEY); setSession(null); },
  }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
