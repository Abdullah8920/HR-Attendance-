import { apiClient } from './client';
import { LeaveBalance, LeaveRequest, ApplyLeavePayload } from '../types/leave';

export const leaveApi = {
  getMyBalances: async () => {
    const res = await apiClient.get<{ success: boolean; data: LeaveBalance[] }>('/leaves/balance/me');
    return res.data;
  },

  getMyLeaves: async () => {
    const res = await apiClient.get<{ success: boolean; data: LeaveRequest[] }>('/leaves/me');
    return res.data;
  },

  getAllLeaves: async (status?: string) => {
    const res = await apiClient.get<{ success: boolean; data: LeaveRequest[] }>('/leaves', { params: { status } });
    return res.data;
  },

  applyLeave: async (payload: ApplyLeavePayload) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: LeaveRequest }>('/leaves', payload);
    return res.data;
  },

  cancelLeave: async (id: string) => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: LeaveRequest }>(`/leaves/${id}/cancel`);
    return res.data;
  },

  decideLeave: async (id: string, payload: { status: 'APPROVED' | 'REJECTED'; comment?: string }) => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: LeaveRequest }>(`/leaves/${id}/decision`, payload);
    return res.data;
  },
};
