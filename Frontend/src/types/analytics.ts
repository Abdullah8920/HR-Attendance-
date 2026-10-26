export interface AdminAnalytics {
  headcount: number;
  exitedCount: number;
  attritionRate: string;
  monthlyPayrollCost: number;
  averageSalary: number;
  today: {
    date: string;
    present: number;
    late: number;
    halfDay: number;
    absent: number;
    onLeave: number;
    attendanceRate: string;
  };
  recentAudits: any[];
}

export interface HRAnalytics {
  headcount: number;
  today: {
    date: string;
    present: number;
    late: number;
    halfDay: number;
    absent: number;
    onLeave: number;
  };
  pendingActionItems: {
    pendingLeaves: number;
    pendingCorrections: number;
  };
  latestPayrollDraft: any;
}

export interface EmployeeAnalytics {
  weeklyHours: number;
  lateArrivalsCount: number;
  todayCheckIn: {
    status: string;
    checkIn?: string;
    checkOut?: string;
  } | null;
  leaveBalances: Array<{
    name: string;
    quota: number;
    used: number;
    remaining: number | string;
  }>;
  recentAttendance: any[];
  latestPayslip: any;
}
