export interface SalaryStructure {
  _id: string;
  companyId: string;
  employeeId: string;
  basicSalary: number;
  hra: number;
  medicalAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  effectiveFrom: string;
  isActive: boolean;
}

export interface PayrollRun {
  _id: string;
  companyId: string;
  month: number;
  year: number;
  workingDaysInMonth: number;
  totalGrossPay: number;
  totalAttendanceDeductions: number;
  totalUnpaidLeaveDeductions: number;
  totalTaxWithheld: number;
  totalNetPay: number;
  status: 'DRAFT' | 'FINALIZED';
  createdBy?: { _id: string; email: string };
  finalizedBy?: { _id: string; email: string };
  finalizedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface Payslip {
  _id: string;
  companyId: string;
  payrollRunId: string;
  employeeId: string | { _id: string; employeeCode: string; firstName: string; lastName: string; email: string; phone?: string; departmentId?: any; designationId?: any };
  employeeCode: string;
  employeeName: string;
  departmentName?: string;
  designationName?: string;
  month: number;
  year: number;
  workingDaysInMonth: number;
  eligibleWorkingDays?: number;
  actualWorkingDays?: number;
  dailySalary: number;
  grossSalary: number;
  basicSalary: number;
  hra: number;
  medicalAllowance: number;
  otherAllowances: number;
  proratedGrossSalary?: number;
  absentDays: number;
  halfDays: number;
  unpaidLeaveDays: number;
  attendanceDeductions: number;
  unpaidLeaveDeductions: number;
  otherDeductions?: number;
  taxWithheld?: number;
  monthlyTaxWithheld?: number;
  annualGrossSalary?: number;
  annualTaxLiability?: number;
  totalDeductions?: number;
  netSalary: number;
  status: 'DRAFT' | 'FINALIZED';
  generatedAt?: string;
  createdAt: string;
}
