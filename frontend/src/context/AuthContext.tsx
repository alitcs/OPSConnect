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
  login as authLogin,
  logout as authLogout,
  signup as authSignup,
  type LoginInput,
  type SignupInput,
} from '../api/auth';
import type { User } from '../types';

interface AuthContextValue {
  currentUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  /** Log in with an @ontario.ca email and password. */
  login: (input: LoginInput) => Promise<void>;
  /** Register a new @ontario.ca account. */
  signup: (input: SignupInput) => Promise<void>;
  /** End the current session. */
  logout: () => void;
  /** Re-fetch the current user (e.g. after editing the profile). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (getSessionUserId() === null) {
      setCurrentUser(null);
      return;
    }
    const user = await api.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      authLogin(input);
      setLoading(true);
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const signup = useCallback(
    async (input: SignupInput) => {
      authSignup(input);
      setLoading(true);
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const logout = useCallback(() => {
    authLogout();
    setCurrentUser(null);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const value = useMemo(
    () => ({
      currentUser,
      loading,
      isAuthenticated: currentUser !== null,
      login,
      signup,
      logout,
      refresh,
    }),
    [currentUser, loading, login, signup, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
