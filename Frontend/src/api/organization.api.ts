import { apiClient } from './client';
import { CompanySettings, Department, Designation, LeaveType, Holiday } from '../types/organization';

export const organizationApi = {
  getSettings: async () => {
    const res = await apiClient.get<{ success: boolean; data: CompanySettings }>('/organization');
    return res.data;
  },

  updateSettings: async (settings: Partial<CompanySettings>) => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: CompanySettings }>('/organization', settings);
    return res.data;
  },

  // Departments
  getDepartments: async () => {
    const res = await apiClient.get<{ success: boolean; data: Department[] }>('/organization/departments');
    return res.data;
  },

  createDepartment: async (payload: { name: string; code: string; description?: string }) => {
    const res = await apiClient.post<{ success: boolean; data: Department }>('/organization/departments', payload);
    return res.data;
  },

  deleteDepartment: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/organization/departments/${id}`);
    return res.data;
  },

  // Designations
  getDesignations: async () => {
    const res = await apiClient.get<{ success: boolean; data: Designation[] }>('/organization/designations');
    return res.data;
  },

  createDesignation: async (payload: { title: string; code: string; departmentId?: string; description?: string }) => {
    const res = await apiClient.post<{ success: boolean; data: Designation }>('/organization/designations', payload);
    return res.data;
  },

  deleteDesignation: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/organization/designations/${id}`);
    return res.data;
  },

  // Leave Types
  getLeaveTypes: async () => {
    const res = await apiClient.get<{ success: boolean; data: LeaveType[] }>('/organization/leave-types');
    return res.data;
  },

  createLeaveType: async (payload: { name: string; code: string; annualQuota: number; isPaid: boolean }) => {
    const res = await apiClient.post<{ success: boolean; data: LeaveType }>('/organization/leave-types', payload);
    return res.data;
  },

  // Holidays
  getHolidays: async () => {
    const res = await apiClient.get<{ success: boolean; data: Holiday[] }>('/organization/holidays');
    return res.data;
  },

  createHoliday: async (payload: { name: string; date: string; description?: string }) => {
    const res = await apiClient.post<{ success: boolean; data: Holiday }>('/organization/holidays', payload);
    return res.data;
  },

  deleteHoliday: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/organization/holidays/${id}`);
    return res.data;
  },

  // HR Account creation
  createHR: async (payload: { email: string; password: string }) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>('/users/hr', payload);
    return res.data;
  },
};
