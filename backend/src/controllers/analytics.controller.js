import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { AttendanceCorrection } from '../models/AttendanceCorrection.js';
import { PayrollRun } from '../models/PayrollRun.js';
import { Payslip } from '../models/Payslip.js';
import { AuditLog } from '../models/AuditLog.js';
import { SalaryStructure } from '../models/SalaryStructure.js';
import { LeaveType } from '../models/LeaveType.js';
import { formatDate } from '../utils/dateUtils.js';

export const getAdminAnalytics = async (req, res, next) => {
  try {
    const todayStr = formatDate(new Date());

    const [activeCount, exitedCount, todayAtt, todayLeaves, salaries, recentAudits] = await Promise.all([
      Employee.countDocuments({ companyId: req.user.companyId, employmentStatus: { $in: ['ACTIVE', 'PROBATION'] } }),
      Employee.countDocuments({ companyId: req.user.companyId, employmentStatus: { $in: ['TERMINATED', 'RESIGNED'] } }),
      Attendance.find({ companyId: req.user.companyId, date: todayStr }),
      LeaveRequest.find({ companyId: req.user.companyId, status: 'APPROVED', startDate: { $lte: todayStr }, endDate: { $gte: todayStr } }),
      SalaryStructure.find({ companyId: req.user.companyId, isActive: true }),
      AuditLog.find({ companyId: req.user.companyId }).sort({ createdAt: -1 }).limit(10),
    ]);

    const present = todayAtt.filter((a) => a.status === 'PRESENT').length;
    const late = todayAtt.filter((a) => a.status === 'LATE').length;
    const halfDay = todayAtt.filter((a) => a.status === 'HALF_DAY').length;
    const onLeave = todayLeaves.length;
    const working = present + late + halfDay;
    const absent = Math.max(0, activeCount - working - onLeave);

    const totalPayroll = salaries.reduce((sum, s) => sum + s.grossSalary, 0);
    const avgSalary = salaries.length > 0 ? Math.round(totalPayroll / salaries.length) : 0;

    res.status(200).json({
      success: true,
      data: {
        headcount: activeCount,
        exitedCount,
        attritionRate: activeCount + exitedCount > 0 ? `${(((exitedCount) / (activeCount + exitedCount)) * 100).toFixed(1)}%` : '0%',
        monthlyPayrollCost: totalPayroll,
        averageSalary: avgSalary,
        today: {
          date: todayStr,
          present,
          late,
          halfDay,
          absent,
          onLeave,
          attendanceRate: activeCount > 0 ? `${((working / activeCount) * 100).toFixed(1)}%` : '0%',
        },
        recentAudits,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHRAnalytics = async (req, res, next) => {
  try {
    const todayStr = formatDate(new Date());

    const [activeCount, todayAtt, todayLeaves, pendingLeaves, pendingCorrections, draftRun] = await Promise.all([
      Employee.countDocuments({ companyId: req.user.companyId, employmentStatus: { $in: ['ACTIVE', 'PROBATION'] } }),
      Attendance.find({ companyId: req.user.companyId, date: todayStr }),
      LeaveRequest.find({ companyId: req.user.companyId, status: 'APPROVED', startDate: { $lte: todayStr }, endDate: { $gte: todayStr } }),
      LeaveRequest.countDocuments({ companyId: req.user.companyId, status: 'PENDING' }),
      AttendanceCorrection.countDocuments({ companyId: req.user.companyId, status: 'PENDING' }),
      PayrollRun.findOne({ companyId: req.user.companyId, status: 'DRAFT' }).sort({ year: -1, month: -1 }),
    ]);

    const present = todayAtt.filter((a) => a.status === 'PRESENT').length;
    const late = todayAtt.filter((a) => a.status === 'LATE').length;
    const halfDay = todayAtt.filter((a) => a.status === 'HALF_DAY').length;
    const onLeave = todayLeaves.length;
    const working = present + late + halfDay;
    const absent = Math.max(0, activeCount - working - onLeave);

    res.status(200).json({
      success: true,
      data: {
        headcount: activeCount,
        today: { date: todayStr, present, late, halfDay, absent, onLeave },
        pendingActionItems: { pendingLeaves, pendingCorrections },
        latestPayrollDraft: draftRun,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeAnalytics = async (req, res, next) => {
  try {
    if (!req.user.employeeId) return res.status(404).json({ success: false, message: 'No employee profile.' });

    const todayStr = formatDate(new Date());
    const year = new Date().getFullYear();
    const currentMonthPrefix = `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const [todayAtt, recentAtt, leaveTypes, approvedLeaves, lastPayslip, employeeProfile, lateCount] = await Promise.all([
      Attendance.findOne({ companyId: req.user.companyId, employeeId: req.user.employeeId, date: todayStr }),
      Attendance.find({ companyId: req.user.companyId, employeeId: req.user.employeeId }).sort({ date: -1 }).limit(10),
      LeaveType.find({ companyId: req.user.companyId, isActive: true }),
      LeaveRequest.find({ companyId: req.user.companyId, employeeId: req.user.employeeId, status: 'APPROVED', startDate: { $regex: `^${year}-` } }),
      Payslip.findOne({ companyId: req.user.companyId, employeeId: req.user.employeeId, status: 'FINALIZED' }).sort({ year: -1, month: -1 }),
      Employee.findById(req.user.employeeId).populate('departmentId', 'name').populate('designationId', 'title'),
      Attendance.countDocuments({ companyId: req.user.companyId, employeeId: req.user.employeeId, status: 'LATE', date: { $regex: `^${currentMonthPrefix}` } }),
    ]);

    const leaveBalances = leaveTypes.map((type) => {
      const used = approvedLeaves.filter((l) => l.leaveTypeId.toString() === type._id.toString()).reduce((sum, l) => sum + l.daysCount, 0);
      return {
        name: type.name,
        code: type.code,
        quota: type.annualQuota,
        used,
        remaining: type.isPaid ? Math.max(0, type.annualQuota - used) : 'Unlimited',
      };
    });

    const totalMinutes = recentAtt.reduce((sum, a) => sum + (a.workingMinutes || 0), 0);
    const weeklyHours = Number((totalMinutes / 60).toFixed(1));

    res.status(200).json({
      success: true,
      data: {
        profile: employeeProfile,
        today: {
          isCheckedIn: Boolean(todayAtt?.checkIn),
          isCheckedOut: Boolean(todayAtt?.checkOut),
          checkIn: todayAtt?.checkIn,
          checkOut: todayAtt?.checkOut,
          status: todayAtt?.status || 'NOT_CHECKED_IN',
        },
        todayCheckIn: {
          checkIn: todayAtt?.checkIn,
          checkOut: todayAtt?.checkOut,
          status: todayAtt?.status || 'NOT_CHECKED_IN',
        },
        hoursWorkedThisWeek: weeklyHours,
        weeklyHours: weeklyHours,
        lateArrivalsCount: lateCount,
        leaveBalances,
        recentAttendance: recentAtt,
        lastPayslip,
      },
    });
  } catch (error) {
    next(error);
  }
};
