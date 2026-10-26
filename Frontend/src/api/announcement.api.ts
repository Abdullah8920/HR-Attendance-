import { apiClient } from './client';
import { Announcement } from '../types/announcement';

export const announcementApi = {
  getAnnouncements: async () => {
    const res = await apiClient.get<{ success: boolean; data: Announcement[] }>('/announcements');
    return res.data;
  },

  createAnnouncement: async (payload: {
    title: string;
    message: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    targetAudience?: 'ALL' | 'DEPARTMENT' | 'MANAGEMENT';
    departmentId?: string;
  }) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: Announcement }>('/announcements', payload);
    return res.data;
  },

  deleteAnnouncement: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/announcements/${id}`);
    return res.data;
  },
};
