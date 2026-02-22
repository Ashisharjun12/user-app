
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../api/api';

interface User {
  _id: string;
  phone: string;
  role: string;
  name?: string;
  email?: string;
  dob?: string;
  city?: string;
  image?: string;
  locationEnabled?: boolean;
  location?: { lat: number; lng: number };
  address?: string;
  isProfileComplete?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (phone: string, code: string, name?: string) => Promise<boolean>;
  updateProfile: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  sendOtp: (phone: string) => Promise<boolean>;
  checkAuth: () => Promise<void>;
  checkUser: (phone: string) => Promise<boolean>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  checkAuth: async () => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
        try {
            const res = await api.get('/auth/me');
            const user = res.data;
            set({ user, isAuthenticated: true });
        } catch (error) {
            console.error("Token invalid or expired", error);
            await SecureStore.deleteItemAsync('userToken');
            set({ user: null, isAuthenticated: false });
        }
    } else {
        set({ isAuthenticated: false });
    }
  },

  login: async (phone, code, name) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/verify-otp', { phone, code, role: 'user', name });
      await SecureStore.setItemAsync('userToken', res.data.token);
      const user = res.data.user;
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false 
      });
      return true;
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Login failed' 
      });
      return false;
    }
  },

  updateProfile: async (data: any) => {
      set({ isLoading: true, error: null });
      try {
          const res = await api.put('/users/profile', data);
          set((state) => ({
              user: { ...state.user, ...res.data },
              isLoading: false
          }));
          return true;
      } catch (error: any) {
          set({
              isLoading: false,
              error: error.response?.data?.message || 'Profile update failed'
          });
          return false;
      }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('userToken');
    set({ user: null, isAuthenticated: false });
  },

  sendOtp: async (phone) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/send-otp', { phone });
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to send OTP' 
      });
      return false;
    }
  },

  checkUser: async (phone) => {
      try {
          const res = await api.post('/auth/check-user', { phone });
          return res.data.exists;
      } catch (error) {
          return false;
      }
  }
}));

export default useAuthStore;
