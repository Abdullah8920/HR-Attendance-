import { Attendance } from '../models/Attendance.js';
import { AttendanceCorrection } from '../models/AttendanceCorrection.js';
import { Company } from '../models/Company.js';
import { Employee } from '../models/Employee.js';
import { Holiday } from '../models/Holiday.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { formatDate, isLateArrival, calculateMinutes, isWeekend } from '../utils/dateUtils.js';

export const checkIn = async (req, res, next) => {
  try {
    if (!req.user.employeeId) {
      return res.status(403).json({ success: false, message: 'Only employees can check in.' });
    }

    const todayStr = formatDate(new Date());

    const existing = await Attendance.findOne({
      companyId: req.user.companyId,
      employeeId: req.user.employeeId,
      date: todayStr,
    });

    if (existing && existing.checkIn) {
      return res.status(409).json({ success: false, message: 'Already checked in today.' });
    }

    const company = await Company.findById(req.user.companyId);
    const now = new Date();
    const isLate = isLateArrival(now, company?.officeStartTime || '09:00', company?.gracePeriodMinutes || 15);
    const status = isLate ? 'LATE' : 'PRESENT';

    const attendance = await Attendance.findOneAndUpdate(
      { companyId: req.user.companyId, employeeId: req.user.employeeId, date: todayStr },
      { $set: { checkIn: now, status, location: req.body.coordinates } },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: `Checked in. Status: ${status}`, data: attendance });
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req, res, next) => {
  try {
    if (!req.user.employeeId) {
      return res.status(403).json({ success: false, message: 'Only employees can check out.' });
    }

    const todayStr = formatDate(new Date());

    const attendance = await Attendance.findOne({
      companyId: req.user.companyId,
      employeeId: req.user.employeeId,
      date: todayStr,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ success: false, message: 'No check-in record found for today.' });
    }

    const now = new Date();
    const minutes = calculateMinutes(attendance.checkIn, now);
    const company = await Company.findById(req.user.companyId);
    const halfDayHours = company?.halfDayThresholdHours || 5;

    let status = attendance.status;
    if (minutes / 60 < halfDayHours) {
      status = 'HALF_DAY';
    }

    attendance.checkOut = now;
    attendance.workingMinutes = minutes;
    attendance.status = status;
    await attendance.save();

    res.status(200).json({ success: true, message: 'Checked out.', data: attendance });
  } catch (error) {
    next(error);
  }
};

export const getMyAttendance = async (req, res, next) => {
  try {
    if (!req.user.employeeId) return res.status(404).json({ success: false, message: 'No employee profile.' });
    const records = await Attendance.find({ companyId: req.user.companyId, employeeId: req.user.employeeId }).sort({ date: -1 });
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

export const getCalendar = async (req, res, next) => {
  try {
    const employeeId = req.user.role === 'EMPLOYEE' ? req.user.employeeId : req.query.employeeId || req.user.employeeId;
    if (!employeeId) return res.status(400).json({ success: false, message: 'Employee ID required.' });

    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const monthStr = String(month).padStart(2, '0');

    const company = await Company.findById(req.user.companyId);
    const weekendDays = company?.weekendDays || [0, 6];

    const [attendances, holidays, leaves] = await Promise.all([
      Attendance.find({ companyId: req.user.companyId, employeeId, date: { $regex: `^${year}-${monthStr}-` } }),
      Holiday.find({ companyId: req.user.companyId, date: { $regex: `^${year}-${monthStr}-` } }),
      LeaveRequest.find({ companyId: req.user.companyId, employeeId, status: 'APPROVED' }),
    ]);

    const holidayDates = holidays.map((h) => h.date);
    const attMap = new Map(attendances.map((a) => [a.date, a]));
    const daysInMonth = new Date(year, month, 0).getDate();
    const calendar = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dateStr = formatDate(dateObj);
      const att = attMap.get(dateStr);

      if (att) {
        calendar.push({ date: dateStr, status: att.status, checkIn: att.checkIn, checkOut: att.checkOut, workingMinutes: att.workingMinutes });
      } else if (holidayDates.includes(dateStr)) {
        calendar.push({ date: dateStr, status: 'HOLIDAY' });
      } else if (isWeekend(dateObj, weekendDays)) {
        calendar.push({ date: dateStr, status: 'WEEKEND' });
      } else {
        const onLeave = leaves.some((l) => l.startDate <= dateStr && l.endDate >= dateStr);
        calendar.push({ date: dateStr, status: onLeave ? 'ON_LEAVE' : 'ABSENT' });
      }
    }

    res.status(200).json({ success: true, year, month, data: calendar });
  } catch (error) {
    next(error);
  }
};

export const getDailyBoard = async (req, res, next) => {
  try {
    const dateStr = req.query.date || formatDate(new Date());
    const company = await Company.findById(req.user.companyId);
    const weekendDays = company?.weekendDays || [0, 6];

    const [employees, holidays, leaves, attendances] = await Promise.all([
      Employee.find({ companyId: req.user.companyId, employmentStatus: 'ACTIVE' }).populate('departmentId', 'name'),
      Holiday.find({ companyId: req.user.companyId, date: dateStr }),
      LeaveRequest.find({ companyId: req.user.companyId, status: 'APPROVED', startDate: { $lte: dateStr }, endDate: { $gte: dateStr } }),
      Attendance.find({ companyId: req.user.companyId, date: dateStr }),
    ]);

    const isHoli = holidays.length > 0;
    const isWknd = isWeekend(new Date(dateStr), weekendDays);
    const attMap = new Map(attendances.map((a) => [a.employeeId.toString(), a]));
    const leaveMap = new Map(leaves.map((l) => [l.employeeId.toString(), true]));

    const list = employees.map((emp) => {
      const att = attMap.get(emp._id.toString());
      const onLeave = leaveMap.has(emp._id.toString());

      let status = 'ABSENT';
      if (att) status = att.status;
      else if (onLeave) status = 'ON_LEAVE';
      else if (isHoli) status = 'HOLIDAY';
      else if (isWknd) status = 'WEEKEND';

      return {
        employee: { id: emp._id, code: emp.employeeCode, name: `${emp.firstName} ${emp.lastName}`, department: emp.departmentId?.name },
        status,
        checkIn: att?.checkIn,
        checkOut: att?.checkOut,
        workingMinutes: att?.workingMinutes || 0,
      };
    });

    res.status(200).json({
      success: true,
      date: dateStr,
      summary: {
        total: employees.length,
        present: list.filter((i) => i.status === 'PRESENT').length,
        late: list.filter((i) => i.status === 'LATE').length,
        halfDay: list.filter((i) => i.status === 'HALF_DAY').length,
        absent: list.filter((i) => i.status === 'ABSENT').length,
        onLeave: list.filter((i) => i.status === 'ON_LEAVE').length,
      },
      employees: list,
    });
  } catch (error) {
    next(error);
  }
};

export const requestCorrection = async (req, res, next) => {
  try {
    const { date, requestedCheckIn, requestedCheckOut, reason } = req.body;
    if (!date || !reason) return res.status(400).json({ success: false, message: 'Date and reason are required.' });

    const correction = await AttendanceCorrection.create({
      companyId: req.user.companyId,
      employeeId: req.user.employeeId,
      date,
      requestedCheckIn: requestedCheckIn ? new Date(requestedCheckIn) : undefined,
      requestedCheckOut: requestedCheckOut ? new Date(requestedCheckOut) : undefined,
      reason,
      status: 'PENDING',
    });

    res.status(201).json({ success: true, message: 'Correction request submitted.', data: correction });
  } catch (error) {
    next(error);
  }
};

export const getCorrections = async (req, res, next) => {
  try {
    const filter = { companyId: req.user.companyId };
    if (req.user.role === 'EMPLOYEE') filter.employeeId = req.user.employeeId;

    const list = await AttendanceCorrection.find(filter)
      .populate('employeeId', 'employeeCode firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const decideCorrection = async (req, res, next) => {
  try {
    const { status, comment } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED.' });
    }

    const correction = await AttendanceCorrection.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!correction) return res.status(404).json({ success: false, message: 'Correction request not found.' });

    correction.status = status;
    correction.reviewedBy = req.user.userId;
    correction.reviewedAt = new Date();
    correction.reviewComment = comment;
    await correction.save();

    if (status === 'APPROVED') {
      const checkIn = correction.requestedCheckIn || new Date();
      const checkOut = correction.requestedCheckOut;
      const minutes = checkOut ? calculateMinutes(checkIn, checkOut) : 0;
      const attStatus = minutes / 60 < 5 && checkOut ? 'HALF_DAY' : 'PRESENT';

      await Attendance.findOneAndUpdate(
        { companyId: req.user.companyId, employeeId: correction.employeeId, date: correction.date },
        { $set: { checkIn, checkOut, workingMinutes: minutes, status: attStatus, isCorrected: true, correctionId: correction._id } },
        { upsert: true }
      );
    }

    res.status(200).json({ success: true, message: `Correction request ${status.toLowerCase()}.`, data: correction });
  } catch (error) {
    next(error);
  }
};
