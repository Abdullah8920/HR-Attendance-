import { apiClient } from './client';
import { AttendanceRecord, DailyBoardResponse, AttendanceCorrection, CalendarDay } from '../types/attendance';

export const attendanceApi = {
  checkIn: async (coordinates?: { latitude: number; longitude: number }) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: AttendanceRecord }>('/attendance/check-in', { coordinates });
    return res.data;
  },

  checkOut: async () => {
    const res = await apiClient.post<{ success: boolean; message: string; data: AttendanceRecord }>('/attendance/check-out');
    return res.data;
  },

  getMyAttendance: async () => {
    const res = await apiClient.get<{ success: boolean; data: AttendanceRecord[] }>('/attendance/me');
    return res.data;
  },

  getDailyBoard: async (date?: string) => {
    const res = await apiClient.get<DailyBoardResponse>('/attendance', { params: { date } });
    return res.data;
  },

  getCalendar: async (params?: { year?: number; month?: number; employeeId?: string }) => {
    const res = await apiClient.get<{ success: boolean; year: number; month: number; data: CalendarDay[] }>('/attendance/calendar', { params });
    return res.data;
  },

  requestCorrection: async (payload: { date: string; requestedCheckIn?: string; requestedCheckOut?: string; reason: string }) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: AttendanceCorrection }>('/attendance/corrections', payload);
    return res.data;
  },

  getCorrections: async () => {
    const res = await apiClient.get<{ success: boolean; data: AttendanceCorrection[] }>('/attendance/corrections');
    return res.data;
  },

  decideCorrection: async (id: string, payload: { status: 'APPROVED' | 'REJECTED'; comment?: string }) => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: AttendanceCorrection }>(`/attendance/corrections/${id}/decision`, payload);
    return res.data;
  },
};
