import { create } from 'zustand';
import { socketClient } from '../socket';

const TOKEN_KEY = 'trivia_auth_token';
const USER_KEY = 'trivia_auth_user';

interface AuthUser {
  userId: number;
  username: string;
  isAdmin: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  initFromStorage: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: false,
  error: null,

  initFromStorage: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    if (token && userRaw) {
      try {
         const storedUser = JSON.parse(userRaw) as Partial<AuthUser>;
         const user: AuthUser = {
           userId: storedUser.userId!,
           username: storedUser.username!,
           isAdmin: storedUser.isAdmin === true,
         };
        set({ token, user });

        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
          .then(async (response) => {
            if (response.status === 401) {
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(USER_KEY);
              set({ token: null, user: null });
              socketClient.reconnectWithToken(null);
              return;
            }
            if (!response.ok) throw new Error('Session refresh failed');
            const data = await response.json();
            const refreshedUser: AuthUser = {
              userId: data.userId,
              username: data.username,
              isAdmin: data.isAdmin === true,
            };
            localStorage.setItem(USER_KEY, JSON.stringify(refreshedUser));
            set({ user: refreshedUser });
          })
          .catch(() => {
            // Keep the cached session usable while the server is temporarily unavailable.
          });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ isLoading: false, error: data.error || 'Login failed' });
        return false;
      }
       const user: AuthUser = { userId: data.userId, username: data.username, isAdmin: data.isAdmin === true };
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ token: data.token, user, isLoading: false, error: null });
      socketClient.reconnectWithToken(data.token);
      return true;
    } catch {
      set({ isLoading: false, error: 'Network error. Please try again.' });
      return false;
    }
  },

  register: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ isLoading: false, error: data.error || 'Registration failed' });
        return false;
      }
       const user: AuthUser = { userId: data.userId, username: data.username, isAdmin: data.isAdmin === true };
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ token: data.token, user, isLoading: false, error: null });
      socketClient.reconnectWithToken(data.token);
      return true;
    } catch {
      set({ isLoading: false, error: 'Network error. Please try again.' });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null, error: null });
    socketClient.reconnectWithToken(null);
  },

  clearError: () => set({ error: null }),
}));
