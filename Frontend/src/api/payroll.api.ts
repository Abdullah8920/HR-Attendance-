import { apiClient } from './client';
import { PayrollRun, Payslip, SalaryStructure } from '../types/payroll';

export const payrollApi = {
  setSalaryStructure: async (payload: { employeeId: string; basicSalary: number; otherAllowances?: number; effectiveFrom?: string }) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: SalaryStructure }>('/payroll/salary-structures', payload);
    return res.data;
  },

  createPayrollDraft: async (payload: { month: number; year: number; notes?: string }) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: { payrollRun: PayrollRun; employeeCount: number } }>('/payroll/runs', payload);
    return res.data;
  },

  getPayrollRuns: async () => {
    const res = await apiClient.get<{ success: boolean; data: PayrollRun[] }>('/payroll/runs');
    return res.data;
  },

  getPayrollRunById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: { run: PayrollRun; lines: Payslip[] } }>(`/payroll/runs/${id}`);
    return res.data;
  },

  finalizePayroll: async (id: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: PayrollRun }>(`/payroll/runs/${id}/finalize`);
    return res.data;
  },

  getAllPayslips: async (params?: {
    employeeId?: string;
    month?: number;
    year?: number;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get<{
      success: boolean;
      data: Payslip[];
      pagination?: { page: number; limit: number; total: number; totalPages: number };
    }>('/payroll/payslips', { params });
    return res.data;
  },

  generateIndividualPayslip: async (payload: {
    employeeId: string;
    month: number;
    year: number;
    status?: 'DRAFT' | 'FINALIZED';
  }) => {
    const res = await apiClient.post<{ success: boolean; message: string; data: Payslip }>('/payroll/payslips/generate-individual', payload);
    return res.data;
  },

  getMyPayslips: async () => {
    const res = await apiClient.get<{ success: boolean; data: Payslip[] }>('/payroll/payslips/me');
    return res.data;
  },

  getPayslipById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: Payslip }>(`/payroll/payslips/${id}`);
    return res.data;
  },
};
