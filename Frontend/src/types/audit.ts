export interface AuditLog {
  _id: string;
  companyId: string;
  actorUserId?: {
    _id: string;
    email: string;
    role: string;
  };
  role: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  createdAt: string;
}
