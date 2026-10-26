export interface Announcement {
  _id: string;
  companyId: string;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  targetAudience: 'ALL' | 'DEPARTMENT' | 'MANAGEMENT';
  departmentId?: string;
  createdBy?: { _id: string; email: string };
  isActive: boolean;
  createdAt: string;
}
