import { apiClient } from './client';
import { Employee, CreateEmployeePayload, Employee360Data, Pagination } from '../types/employee';

export const employeeApi = {
  getEmployees: async (params?: { page?: number; limit?: number; search?: string; departmentId?: string; status?: string }) => {
    const res = await apiClient.get<{ success: boolean; data: Employee[]; pagination: Pagination }>('/employees', { params });
    return res.data;
  },

  getEmployeeById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: Employee }>(`/employees/${id}`);
    return res.data;
  },

  createEmployee: async (payload: CreateEmployeePayload) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: { employee: Employee; temporaryPassword?: string } }>('/employees', payload);
    return res.data;
  },

  updateEmployee: async (id: string, payload: Partial<Employee>) => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: Employee }>(`/employees/${id}`, payload);
    return res.data;
  },

  getEmployee360: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: Employee360Data }>(`/employees/${id}/360`);
    return res.data;
  },

  exportCsv: async () => {
    const res = await apiClient.get('/employees/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'employees.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  importCsv: async (csvContent: string) => {
    const res = await apiClient.post<{ success: boolean; importedCount: number; errors: any[] }>('/employees/import', { csvContent });
    return res.data;
  },
};
