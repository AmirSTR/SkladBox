import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch, clearToken, getToken, setToken } from './api';
import type { User } from './types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    companyName: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!getToken()) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await apiFetch<{ user: User }>('/auth/me');
        setUser(data.user);
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void loadUser();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      companyName: string,
    ) => {
      const data = await apiFetch<{ token: string; user: User }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ name, email, password, companyName }),
        },
      );

      setToken(data.token);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [isLoading, login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
