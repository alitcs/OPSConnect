import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, getStoredUserId, setStoredUserId } from '../api/client';
import type { User } from '../types';

interface AuthContextValue {
  currentUser: User | null;
  loading: boolean;
  /** Switch the active mock user and reload their profile. */
  switchUser: (id: number) => Promise<void>;
  /** Re-fetch the current user (e.g. after editing the profile). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const user = await api.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const switchUser = useCallback(
    async (id: number) => {
      setStoredUserId(id);
      setLoading(true);
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  useEffect(() => {
    // Ensure a stored id exists, then load the user.
    setStoredUserId(getStoredUserId());
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const value = useMemo(
    () => ({ currentUser, loading, switchUser, refresh }),
    [currentUser, loading, switchUser, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
