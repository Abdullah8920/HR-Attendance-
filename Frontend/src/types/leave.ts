import { LeaveType } from './organization';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveBalance {
  leaveTypeId: string;
  name: string;
  code: string;
  isPaid: boolean;
  annualQuota: number;
  usedDays: number;
  remainingDays: number | string;
}

export interface LeaveRequest {
  _id: string;
  companyId: string;
  employeeId: {
    _id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  leaveTypeId: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
}

export interface ApplyLeavePayload {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}
