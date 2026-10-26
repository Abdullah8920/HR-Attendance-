export interface CompanySettings {
  _id: string;
  name: string;
  email: string;
  officeStartTime: string;
  officeEndTime: string;
  gracePeriodMinutes: number;
  halfDayThresholdHours: number;
  weekendDays: number[];
  attendanceRadiusMeters: number;
  timezone: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  createdAt?: string;
}

export interface Designation {
  _id: string;
  title: string;
  code: string;
  departmentId?: string | { _id: string; name: string; code: string };
  description?: string;
}

export interface LeaveType {
  _id: string;
  name: string;
  code: string;
  annualQuota: number;
  isPaid: boolean;
  isActive?: boolean;
}

export interface Holiday {
  _id: string;
  name: string;
  date: string; // YYYY-MM-DD
  description?: string;
}
