import { LeaveRequest } from '../models/LeaveRequest.js';
import { LeaveType } from '../models/LeaveType.js';
import { Holiday } from '../models/Holiday.js';
import { Company } from '../models/Company.js';
import { getWorkingDaysBetween } from '../utils/dateUtils.js';

export const getLeaveBalances = async (req, res, next) => {
  try {
    const employeeId = req.user.role === 'EMPLOYEE' ? req.user.employeeId : req.query.employeeId || req.user.employeeId;
    if (!employeeId) return res.status(400).json({ success: false, message: 'Employee ID required.' });

    const currentYear = new Date().getFullYear();
    const [types, approvedLeaves] = await Promise.all([
      LeaveType.find({ companyId: req.user.companyId, isActive: true }),
      LeaveRequest.find({ companyId: req.user.companyId, employeeId, status: 'APPROVED', startDate: { $regex: `^${currentYear}-` } }),
    ]);

    const balances = types.map((type) => {
      const used = approvedLeaves
        .filter((l) => l.leaveTypeId.toString() === type._id.toString())
        .reduce((sum, l) => sum + l.daysCount, 0);

      const remaining = type.isPaid ? Math.max(0, type.annualQuota - used) : 'Unlimited';

      return {
        leaveTypeId: type._id,
        name: type.name,
        code: type.code,
        isPaid: type.isPaid,
        annualQuota: type.annualQuota,
        usedDays: used,
        remainingDays: remaining,
      };
    });

    res.status(200).json({ success: true, data: balances });
  } catch (error) {
    next(error);
  }
};

export const applyLeave = async (req, res, next) => {
  try {
    const { leaveTypeId, startDate, endDate, reason } = req.body;
    if (!leaveTypeId || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (startDate > endDate) {
      return res.status(422).json({ success: false, message: 'Start date cannot be after end date.' });
    }

    const leaveType = await LeaveType.findOne({ _id: leaveTypeId, companyId: req.user.companyId });
    if (!leaveType) return res.status(404).json({ success: false, message: 'Leave type not found.' });

    const company = await Company.findById(req.user.companyId);
    const holidays = await Holiday.find({ companyId: req.user.companyId, date: { $gte: startDate, $lte: endDate } });
    const holidayDates = holidays.map((h) => h.date);

    // Working days only (exclude weekends and holidays)
    const { count: workingDays } = getWorkingDaysBetween(startDate, endDate, company?.weekendDays || [0, 6], holidayDates);
    if (workingDays <= 0) {
      return res.status(422).json({ success: false, message: 'Selected date range contains no working days.' });
    }

    // Overlap check
    const overlap = await LeaveRequest.findOne({
      companyId: req.user.companyId,
      employeeId: req.user.employeeId,
      status: { $in: ['APPROVED', 'PENDING'] },
      $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
    });
    if (overlap) {
      return res.status(422).json({ success: false, message: `Overlapping leave already exists (${overlap.status}).` });
    }

    // Balance check for paid leaves
    if (leaveType.isPaid && leaveType.annualQuota > 0) {
      const year = new Date(startDate).getFullYear();
      const approved = await LeaveRequest.find({
        companyId: req.user.companyId,
        employeeId: req.user.employeeId,
        leaveTypeId,
        status: 'APPROVED',
        startDate: { $regex: `^${year}-` },
      });
      const used = approved.reduce((sum, l) => sum + l.daysCount, 0);
      const remaining = leaveType.annualQuota - used;

      if (workingDays > remaining) {
        return res.status(422).json({
          success: false,
          message: `Insufficient leave balance. Requested: ${workingDays}, Available: ${remaining}.`,
        });
      }
    }

    const leave = await LeaveRequest.create({
      companyId: req.user.companyId,
      employeeId: req.user.employeeId,
      leaveTypeId,
      startDate,
      endDate,
      daysCount: workingDays,
      reason,
      status: 'PENDING',
    });

    res.status(201).json({ success: true, message: 'Leave application submitted.', data: leave });
  } catch (error) {
    next(error);
  }
};

export const getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await LeaveRequest.find({ companyId: req.user.companyId, employeeId: req.user.employeeId })
      .populate('leaveTypeId', 'name code isPaid')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    next(error);
  }
};

export const getLeaves = async (req, res, next) => {
  try {
    const filter = { companyId: req.user.companyId };
    if (req.query.status) filter.status = req.query.status;

    const list = await LeaveRequest.find(filter)
      .populate('employeeId', 'employeeCode firstName lastName email')
      .populate('leaveTypeId', 'name code isPaid')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const cancelLeave = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findOne({ _id: req.params.id, companyId: req.user.companyId, employeeId: req.user.employeeId });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found.' });

    if (leave.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Cannot cancel a leave that is already ${leave.status}.` });
    }

    leave.status = 'CANCELLED';
    await leave.save();

    res.status(200).json({ success: true, message: 'Leave request cancelled.', data: leave });
  } catch (error) {
    next(error);
  }
};

export const decideLeave = async (req, res, next) => {
  try {
    const { status, comment } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED.' });
    }

    const leave = await LeaveRequest.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found.' });

    leave.status = status;
    leave.reviewedBy = req.user.userId;
    leave.reviewedAt = new Date();
    leave.reviewComment = comment;
    await leave.save();

    res.status(200).json({ success: true, message: `Leave ${status.toLowerCase()}.`, data: leave });
  } catch (error) {
    next(error);
  }
};
