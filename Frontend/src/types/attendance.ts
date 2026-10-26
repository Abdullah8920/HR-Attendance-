export type AttendanceStatus = 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'ON_LEAVE' | 'WEEKEND' | 'HOLIDAY';

export interface AttendanceRecord {
  _id: string;
  companyId: string;
  employeeId: string | { _id: string; firstName: string; lastName: string; employeeCode: string };
  date: string; // YYYY-MM-DD
  checkIn?: string;
  checkOut?: string;
  workingMinutes?: number;
  status: AttendanceStatus;
  isCorrected?: boolean;
  correctionId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface DailyBoardEmployee {
  employee: {
    id: string;
    code: string;
    name: string;
    department?: string;
  };
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  workingMinutes: number;
}

export interface DailyBoardSummary {
  total: number;
  present: number;
  late: number;
  halfDay: number;
  absent: number;
  onLeave: number;
}

export interface DailyBoardResponse {
  success: boolean;
  date: string;
  summary: DailyBoardSummary;
  employees: DailyBoardEmployee[];
}

export interface AttendanceCorrection {
  _id: string;
  companyId: string;
  employeeId: {
    _id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
  date: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
}

export interface CalendarDay {
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  workingMinutes?: number;
}
