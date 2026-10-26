export type UserRole = 'ADMIN' | 'HR' | 'EMPLOYEE';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  companyId: string;
  employeeId?: string;
  mustChangePassword?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    token: string;
  };
}

export interface SetupPayload {
  companyName: string;
  companyEmail: string;
  adminEmail: string;
  adminPassword: string;
  officeStartTime?: string;
  officeEndTime?: string;
  gracePeriodMinutes?: number;
}
