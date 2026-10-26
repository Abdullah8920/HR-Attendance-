import { apiClient } from './client';
import { AuditLog } from '../types/audit';
import { Pagination } from '../types/employee';

export const auditApi = {
  getAuditLogs: async (params?: { page?: number; limit?: number; action?: string }) => {
    const res = await apiClient.get<{ success: boolean; data: AuditLog[]; pagination: Pagination }>('/audit', { params });
    return res.data;
  },
};
