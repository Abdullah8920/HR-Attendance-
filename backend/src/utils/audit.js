import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({
  companyId,
  actorUserId,
  role,
  action,
  entityType,
  entityId,
  details,
  req,
}) => {
  try {
    await AuditLog.create({
      companyId,
      actorUserId,
      role,
      action,
      entityType,
      entityId,
      details,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};
