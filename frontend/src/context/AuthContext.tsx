import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../api/client';
import {
  getSessionUserId,
  loginWithTeams as authLoginWithTeams,
  logout as authLogout,
} from '../api/auth';
import type { User } from '../types';

interface AuthContextValue {
  currentUser: User | null;
  loading: boolean;
  authError: string | null;
  isAuthenticated: boolean;
  /** Sign in via the mock Microsoft Teams SSO flow using an @ontario.ca account. */
  loginWithTeams: (email: string) => Promise<void>;
  /** End the current session. */
  logout: () => void;
  /** Re-fetch the current user (e.g. after editing the profile). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (getSessionUserId() === null) {
      setCurrentUser(null);
      return;
    }
    const user = await api.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const loginWithTeams = useCallback(
    async (email: string) => {
      setAuthError(null);
      authLoginWithTeams(email);
      setLoading(true);
      try {
        await refresh();
      } catch (error) {
        setAuthError('Could not restore your demo session. Please sign in again.');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const logout = useCallback(() => {
    authLogout();
    setCurrentUser(null);
    setAuthError(null);
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => {
        setCurrentUser(null);
        setAuthError('Could not restore your demo session. Please sign in again.');
      })
      .finally(() => setLoading(false));
  }, [refresh]);

  const value = useMemo(
    () => ({
      currentUser,
      loading,
      authError,
      isAuthenticated: currentUser !== null,
      loginWithTeams,
      logout,
      refresh,
    }),
    [currentUser, loading, authError, loginWithTeams, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
