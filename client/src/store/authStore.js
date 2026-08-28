import { create } from 'zustand';
import { authService } from '../services/auth';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    if (typeof window === 'undefined') return;
    const storedToken = localStorage.getItem('mailsense_token');
    const storedUser = localStorage.getItem('mailsense_user');

    if (storedToken && storedUser) {
      try {
        set({
          token: storedToken,
          user: JSON.parse(storedUser),
          isAuthenticated: true,
          isLoading: false,
        });

        // Refresh profile in background
        const res = await authService.getProfile();
        if (res.data) {
          localStorage.setItem('mailsense_user', JSON.stringify(res.data));
          set({ user: res.data });
        }
      } catch (err) {
        console.warn('Session expired or invalid, logging out.');
        get().logout();
      }
    } else {
      set({ isLoading: false });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await authService.login(credentials);
      const { user, token } = res.data;
      localStorage.setItem('mailsense_token', token);
      localStorage.setItem('mailsense_user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true, user };
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authService.register(data);
      const { user, token } = res.data;
      localStorage.setItem('mailsense_token', token);
      localStorage.setItem('mailsense_user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true, user };
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mailsense_token');
      localStorage.removeItem('mailsense_user');
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  updateUser: (userData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mailsense_user', JSON.stringify(userData));
    }
    set({ user: userData });
  },
}));
