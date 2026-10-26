import { apiClient } from './client';
import { AuthUser, LoginResponse, SetupPayload } from '../types/auth';

export const authApi = {
  setup: async (payload: SetupPayload) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: { company: any; user: AuthUser; token: string } }>('/auth/setup', payload);
    return res.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return res.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // ignore
    }
  },

  getMe: async () => {
    const res = await apiClient.get<{ success: boolean; data: AuthUser }>('/auth/me');
    return res.data;
  },

  changePassword: async (payload: { oldPassword: string; newPassword: string }) => {
    const res = await apiClient.patch<{ success: boolean; message: string }>('/auth/change-password', payload);
    return res.data;
  },

  getDemoAccounts: async () => {
    const res = await apiClient.get<{
      success: boolean;
      data: Array<{
        role: 'ADMIN' | 'HR' | 'EMPLOYEE';
        email: string;
        password: string;
        label: string;
        description: string;
      }>;
    }>('/auth/demo-accounts');
    return res.data;
  },

  seedDemo: async () => {
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>('/auth/seed-demo');
    return res.data;
  },
};
