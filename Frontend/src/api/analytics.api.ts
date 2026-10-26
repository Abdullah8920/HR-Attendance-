import { apiClient } from './client';
import { AdminAnalytics, HRAnalytics, EmployeeAnalytics } from '../types/analytics';

export const analyticsApi = {
  getAdminAnalytics: async () => {
    const res = await apiClient.get<{ success: boolean; data: AdminAnalytics }>('/analytics/admin');
    return res.data;
  },

  getHRAnalytics: async () => {
    const res = await apiClient.get<{ success: boolean; data: HRAnalytics }>('/analytics/hr');
    return res.data;
  },

  getEmployeeAnalytics: async () => {
    const res = await apiClient.get<{ success: boolean; data: EmployeeAnalytics }>('/analytics/employee');
    return res.data;
  },
};
