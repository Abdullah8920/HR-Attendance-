import { AuditLog } from '../models/AuditLog.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { companyId: req.user.companyId };
    if (req.query.action) filter.action = req.query.action;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actorUserId', 'email role')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};
