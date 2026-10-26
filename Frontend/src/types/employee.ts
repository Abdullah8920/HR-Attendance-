import { Department, Designation } from './organization';

export type EmploymentStatus = 'ACTIVE' | 'PROBATION' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED';

export interface Employee {
  _id: string;
  companyId: string;
  userId?: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  departmentId?: Department | string;
  designationId?: Designation | string;
  salaryStructureId?: {
    _id: string;
    basicSalary: number;
    grossSalary: number;
  };
  joiningDate: string;
  exitDate?: string;
  employmentStatus: EmploymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeePayload {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  departmentId?: string;
  designationId?: string;
  joiningDate: string;
  basicSalary?: number;
}

export interface Employee360Data {
  profile: Employee;
  recentAttendance: any[];
  recentLeaves: any[];
  recentPayslips: any[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
