import { PayrollRun } from '../models/PayrollRun.js';
import { Payslip } from '../models/Payslip.js';
import { Employee } from '../models/Employee.js';
import { SalaryStructure } from '../models/SalaryStructure.js';
import { Attendance } from '../models/Attendance.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { LeaveType } from '../models/LeaveType.js';
import { Holiday } from '../models/Holiday.js';
import { Company } from '../models/Company.js';
import { getWorkingDaysInMonth, formatDate, parseDate } from '../utils/dateUtils.js';
import { calculateTax } from '../utils/taxCalculator.js';
import { logAudit } from '../utils/audit.js';

export const setSalaryStructure = async (req, res, next) => {
  try {
    const { employeeId, basicSalary, otherAllowances = 0, effectiveFrom } = req.body;
    if (!employeeId || !basicSalary || basicSalary <= 0) {
      return res.status(400).json({ success: false, message: 'Valid employeeId and basicSalary are required.' });
    }

    const employee = await Employee.findOne({ _id: employeeId, companyId: req.user.companyId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const basic = Math.round(basicSalary);
    const hra = Math.round(basic * 0.4);
    const medical = Math.round(basic * 0.1);
    const other = Math.round(otherAllowances);
    const gross = basic + hra + medical + other;

    await SalaryStructure.updateMany(
      { companyId: req.user.companyId, employeeId, isActive: true },
      { $set: { isActive: false } }
    );

    const salary = await SalaryStructure.create({
      companyId: req.user.companyId,
      employeeId,
      basicSalary: basic,
      hra,
      medicalAllowance: medical,
      otherAllowances: other,
      grossSalary: gross,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      isActive: true,
    });

    employee.salaryStructureId = salary._id;
    await employee.save();

    res.status(201).json({ success: true, message: 'Salary structure updated.', data: salary });
  } catch (error) {
    next(error);
  }
};

export const createPayrollDraft = async (req, res, next) => {
  try {
    const { month, year, notes } = req.body;
    if (!month || !year || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'Valid month (1-12) and year are required.' });
    }

    // Check if finalized run already exists
    const existingRun = await PayrollRun.findOne({ companyId: req.user.companyId, month, year });
    if (existingRun && existingRun.status === 'FINALIZED') {
      return res.status(400).json({ success: false, message: `Payroll for ${year}-${month} is finalized and locked.` });
    }

    const company = await Company.findById(req.user.companyId);
    const weekendDays = company?.weekendDays || [0, 6];

    const monthStr = String(month).padStart(2, '0');
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStart = `${year}-${monthStr}-01`;
    const monthEnd = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

    // Holidays & working days
    const holidays = await Holiday.find({ companyId: req.user.companyId, date: { $gte: monthStart, $lte: monthEnd } });
    const holidayDates = holidays.map((h) => h.date);

    const { count: workingDaysInMonth, workingDates } = getWorkingDaysInMonth(year, month, weekendDays, holidayDates);
    if (workingDaysInMonth <= 0) {
      return res.status(400).json({ success: false, message: 'No working days found in month.' });
    }

    // Fetch active employees with salary structures
    const employees = await Employee.find({
      companyId: req.user.companyId,
      employmentStatus: { $in: ['ACTIVE', 'PROBATION', 'ON_LEAVE'] },
      joiningDate: { $lte: new Date(monthEnd) },
      $or: [{ exitDate: { $exists: false } }, { exitDate: null }, { exitDate: { $gte: new Date(monthStart) } }],
    })
      .populate('departmentId', 'name')
      .populate('designationId', 'title')
      .populate('salaryStructureId');

    const unpaidLeaveType = await LeaveType.findOne({ companyId: req.user.companyId, isPaid: false });

    const [attendances, leaves] = await Promise.all([
      Attendance.find({ companyId: req.user.companyId, date: { $gte: monthStart, $lte: monthEnd } }),
      LeaveRequest.find({ companyId: req.user.companyId, status: 'APPROVED', startDate: { $lte: monthEnd }, endDate: { $gte: monthStart } }),
    ]);

    let payrollRun = existingRun;
    if (!payrollRun) {
      payrollRun = new PayrollRun({
        companyId: req.user.companyId,
        month,
        year,
        workingDaysInMonth,
        status: 'DRAFT',
        createdBy: req.user.userId,
        notes,
      });
    } else {
      payrollRun.workingDaysInMonth = workingDaysInMonth;
      await Payslip.deleteMany({ payrollRunId: payrollRun._id });
    }

    let totalGross = 0;
    let totalAttDeductions = 0;
    let totalUnpaidDeductions = 0;
    let totalTax = 0;
    let totalNet = 0;
    const payslips = [];

    for (const emp of employees) {
      const salary = emp.salaryStructureId;
      if (!salary || salary.grossSalary <= 0) continue;

      const grossSalary = salary.grossSalary;
      const dailySalary = Math.round(grossSalary / workingDaysInMonth);

      // Mid-month joiner / leaver proration
      const empJoin = new Date(emp.joiningDate);
      const empExit = emp.exitDate ? new Date(emp.exitDate) : null;

      let eligibleDays = 0;
      for (const wDate of workingDates) {
        const dObj = parseDate(wDate);
        if (dObj >= empJoin && (!empExit || dObj <= empExit)) {
          eligibleDays++;
        }
      }

      const proratedGross = eligibleDays < workingDaysInMonth
        ? Math.round((eligibleDays / workingDaysInMonth) * grossSalary)
        : grossSalary;

      const empAtt = attendances.filter((a) => a.employeeId.toString() === emp._id.toString());
      const empLeaves = leaves.filter((l) => l.employeeId.toString() === emp._id.toString());
      const attMap = new Map(empAtt.map((a) => [a.date, a]));

      let absentDays = 0;
      let halfDays = 0;
      let unpaidDays = 0;

      for (const wDate of workingDates) {
        const dObj = parseDate(wDate);
        if (dObj < empJoin || (empExit && dObj > empExit)) continue;

        const att = attMap.get(wDate);
        const onLeave = empLeaves.find((l) => l.startDate <= wDate && l.endDate >= wDate);

        if (onLeave) {
          if (unpaidLeaveType && onLeave.leaveTypeId.toString() === unpaidLeaveType._id.toString()) {
            unpaidDays++;
          }
          // Paid leaves have 0 deduction
        } else if (att) {
          if (att.status === 'HALF_DAY') halfDays++;
          else if (att.status === 'ABSENT') absentDays++;
        } else {
          absentDays++;
        }
      }

      const attDeduction = Math.round(absentDays * dailySalary + halfDays * (0.5 * dailySalary));
      const unpaidDeduction = Math.round(unpaidDays * dailySalary);
      const taxData = calculateTax(proratedGross);
      const monthlyTax = taxData.monthlyTax;

      const netSalary = Math.max(0, proratedGross - attDeduction - unpaidDeduction - monthlyTax);

      totalGross += proratedGross;
      totalAttDeductions += attDeduction;
      totalUnpaidDeductions += unpaidDeduction;
      totalTax += monthlyTax;
      totalNet += netSalary;

      payslips.push({
        companyId: req.user.companyId,
        payrollRunId: payrollRun._id,
        employeeId: emp._id,
        month,
        year,
        employeeCode: emp.employeeCode,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        departmentName: emp.departmentId?.name || '',
        designationName: emp.designationId?.title || '',
        basicSalary: salary.basicSalary,
        hra: salary.hra,
        medicalAllowance: salary.medicalAllowance,
        otherAllowances: salary.otherAllowances || 0,
        grossSalary,
        workingDaysInMonth,
        eligibleWorkingDays: eligibleDays,
        proratedGrossSalary: proratedGross,
        dailySalary,
        absentDays,
        halfDays,
        unpaidLeaveDays: unpaidDays,
        attendanceDeductions: attDeduction,
        unpaidLeaveDeductions: unpaidDeduction,
        otherDeductions: 0,
        totalDeductions: attDeduction + unpaidDeduction + monthlyTax,
        annualGrossSalary: taxData.annualGross,
        annualTaxLiability: taxData.annualTax,
        monthlyTaxWithheld: monthlyTax,
        netSalary,
        status: 'DRAFT',
      });
    }

    payrollRun.employeeCount = payslips.length;
    payrollRun.totalGrossSalary = totalGross;
    payrollRun.totalAttendanceDeductions = totalAttDeductions;
    payrollRun.totalUnpaidLeaveDeductions = totalUnpaidDeductions;
    payrollRun.totalTax = totalTax;
    payrollRun.totalNetSalary = totalNet;

    await payrollRun.save();
    if (payslips.length > 0) {
      await Payslip.insertMany(payslips);
    }

    res.status(201).json({
      success: true,
      message: 'Payroll draft created.',
      data: { payrollRun, employeeCount: payslips.length },
    });
  } catch (error) {
    next(error);
  }
};

export const finalizePayroll = async (req, res, next) => {
  try {
    const run = await PayrollRun.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!run) return res.status(404).json({ success: false, message: 'Payroll run not found.' });

    if (run.status === 'FINALIZED') {
      return res.status(400).json({ success: false, message: 'Payroll run is already finalized and locked.' });
    }

    run.status = 'FINALIZED';
    run.finalizedBy = req.user.userId;
    run.finalizedAt = new Date();
    await run.save();

    await Payslip.updateMany({ payrollRunId: run._id }, { $set: { status: 'FINALIZED' } });

    await logAudit({
      companyId: req.user.companyId,
      actorUserId: req.user.userId,
      role: 'ADMIN',
      action: 'FINALIZE_PAYROLL',
      entityType: 'PayrollRun',
      entityId: run._id,
      req,
    });

    res.status(200).json({ success: true, message: 'Payroll finalized and locked.', data: run });
  } catch (error) {
    next(error);
  }
};

export const getPayrollRuns = async (req, res, next) => {
  try {
    const list = await PayrollRun.find({ companyId: req.user.companyId })
      .populate('createdBy', 'email')
      .populate('finalizedBy', 'email')
      .sort({ year: -1, month: -1 });

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const getPayrollRunById = async (req, res, next) => {
  try {
    const run = await PayrollRun.findOne({ _id: req.params.id, companyId: req.user.companyId })
      .populate('createdBy', 'email')
      .populate('finalizedBy', 'email');

    if (!run) return res.status(404).json({ success: false, message: 'Payroll run not found.' });

    const lines = await Payslip.find({ payrollRunId: run._id }).sort({ employeeCode: 1 });
    res.status(200).json({ success: true, data: { run, lines } });
  } catch (error) {
    next(error);
  }
};

export const getAllPayslips = async (req, res, next) => {
  try {
    const { employeeId, month, year, status, search, page = 1, limit = 50 } = req.query;
    const query = { companyId: req.user.companyId };

    if (employeeId) query.employeeId = employeeId;
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
        { departmentName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [list, total] = await Promise.all([
      Payslip.find(query)
        .populate('employeeId', 'employeeCode firstName lastName email phone departmentId designationId')
        .sort({ year: -1, month: -1, employeeCode: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Payslip.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: list,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const generateIndividualPayslip = async (req, res, next) => {
  try {
    const { employeeId, month, year, status = 'FINALIZED' } = req.body;
    if (!employeeId || !month || !year || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'Valid employeeId, month (1-12), and year are required.' });
    }

    const employee = await Employee.findOne({ _id: employeeId, companyId: req.user.companyId })
      .populate('departmentId', 'name')
      .populate('designationId', 'title')
      .populate('salaryStructureId');

    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    if (!employee.salaryStructureId || employee.salaryStructureId.grossSalary <= 0) {
      return res.status(400).json({ success: false, message: 'Employee does not have an active salary structure assigned.' });
    }

    const salary = employee.salaryStructureId;
    const company = await Company.findById(req.user.companyId);
    const weekendDays = company?.weekendDays || [0, 6];

    const monthStr = String(month).padStart(2, '0');
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStart = `${year}-${monthStr}-01`;
    const monthEnd = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

    const holidays = await Holiday.find({ companyId: req.user.companyId, date: { $gte: monthStart, $lte: monthEnd } });
    const holidayDates = holidays.map((h) => h.date);

    const { count: workingDaysInMonth, workingDates } = getWorkingDaysInMonth(year, month, weekendDays, holidayDates);
    if (workingDaysInMonth <= 0) {
      return res.status(400).json({ success: false, message: 'No working days found in the selected month.' });
    }

    const unpaidLeaveType = await LeaveType.findOne({ companyId: req.user.companyId, isPaid: false });

    const [attendances, leaves] = await Promise.all([
      Attendance.find({ companyId: req.user.companyId, employeeId: employee._id, date: { $gte: monthStart, $lte: monthEnd } }),
      LeaveRequest.find({
        companyId: req.user.companyId,
        employeeId: employee._id,
        status: 'APPROVED',
        startDate: { $lte: monthEnd },
        endDate: { $gte: monthStart },
      }),
    ]);

    const grossSalary = salary.grossSalary;
    const dailySalary = Math.round(grossSalary / workingDaysInMonth);

    // Proration for join / exit dates
    const empJoin = new Date(employee.joiningDate);
    const empExit = employee.exitDate ? new Date(employee.exitDate) : null;

    let eligibleDays = 0;
    for (const wDate of workingDates) {
      const dObj = parseDate(wDate);
      if (dObj >= empJoin && (!empExit || dObj <= empExit)) {
        eligibleDays++;
      }
    }

    const proratedGross = eligibleDays < workingDaysInMonth
      ? Math.round((eligibleDays / workingDaysInMonth) * grossSalary)
      : grossSalary;

    const attMap = new Map(attendances.map((a) => [a.date, a]));

    let absentDays = 0;
    let halfDays = 0;
    let unpaidDays = 0;

    for (const wDate of workingDates) {
      const dObj = parseDate(wDate);
      if (dObj < empJoin || (empExit && dObj > empExit)) continue;

      const att = attMap.get(wDate);
      const onLeave = leaves.find((l) => l.startDate <= wDate && l.endDate >= wDate);

      if (onLeave) {
        if (unpaidLeaveType && onLeave.leaveTypeId.toString() === unpaidLeaveType._id.toString()) {
          unpaidDays++;
        }
      } else if (att) {
        if (att.status === 'HALF_DAY') halfDays++;
        else if (att.status === 'ABSENT') absentDays++;
      } else {
        absentDays++;
      }
    }

    const attDeduction = Math.round(absentDays * dailySalary + halfDays * (0.5 * dailySalary));
    const unpaidDeduction = Math.round(unpaidDays * dailySalary);
    const taxData = calculateTax(proratedGross);
    const monthlyTax = taxData.monthlyTax;

    const netSalary = Math.max(0, proratedGross - attDeduction - unpaidDeduction - monthlyTax);

    // Link or create associated PayrollRun
    let payrollRun = await PayrollRun.findOne({ companyId: req.user.companyId, month, year });
    if (!payrollRun) {
      payrollRun = await PayrollRun.create({
        companyId: req.user.companyId,
        month,
        year,
        workingDaysInMonth,
        status: status === 'FINALIZED' ? 'FINALIZED' : 'DRAFT',
        createdBy: req.user.userId,
        notes: `Individual payslip generation for ${employee.firstName} ${employee.lastName}`,
      });
    }

    // Upsert payslip for this employee and period
    const payslip = await Payslip.findOneAndUpdate(
      { companyId: req.user.companyId, employeeId: employee._id, month, year },
      {
        $set: {
          payrollRunId: payrollRun._id,
          employeeCode: employee.employeeCode,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          departmentName: employee.departmentId?.name || '',
          designationName: employee.designationId?.title || '',
          basicSalary: salary.basicSalary,
          hra: salary.hra,
          medicalAllowance: salary.medicalAllowance,
          otherAllowances: salary.otherAllowances || 0,
          grossSalary,
          workingDaysInMonth,
          eligibleWorkingDays: eligibleDays,
          proratedGrossSalary: proratedGross,
          dailySalary,
          absentDays,
          halfDays,
          unpaidLeaveDays: unpaidDays,
          attendanceDeductions: attDeduction,
          unpaidLeaveDeductions: unpaidDeduction,
          otherDeductions: 0,
          totalDeductions: attDeduction + unpaidDeduction + monthlyTax,
          annualGrossSalary: taxData.annualGross,
          annualTaxLiability: taxData.annualTax,
          monthlyTaxWithheld: monthlyTax,
          netSalary,
          status,
          generatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    await logAudit({
      companyId: req.user.companyId,
      actorUserId: req.user.userId,
      role: req.user.role,
      action: 'GENERATE_INDIVIDUAL_PAYSLIP',
      entityType: 'Payslip',
      entityId: payslip._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Payslip for ${employee.firstName} ${employee.lastName} generated successfully!`,
      data: payslip,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPayslips = async (req, res, next) => {
  try {
    let employeeId = req.user.employeeId;
    if (!employeeId) {
      const emp = await Employee.findOne({
        companyId: req.user.companyId,
        $or: [{ userId: req.user.userId }, { email: req.user.email }],
      });
      if (emp) {
        employeeId = emp._id.toString();
      }
    }

    if (!employeeId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const list = await Payslip.find({ companyId: req.user.companyId, employeeId }).sort({ year: -1, month: -1 });
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const getPayslipById = async (req, res, next) => {
  try {
    const payslip = await Payslip.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found.' });

    let employeeId = req.user.employeeId;
    if (!employeeId && req.user.role === 'EMPLOYEE') {
      const emp = await Employee.findOne({
        companyId: req.user.companyId,
        $or: [{ userId: req.user.userId }, { email: req.user.email }],
      });
      if (emp) {
        employeeId = emp._id.toString();
      }
    }

    if (req.user.role === 'EMPLOYEE' && payslip.employeeId.toString() !== employeeId?.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own payslip.' });
    }

    res.status(200).json({ success: true, data: payslip });
  } catch (error) {
    next(error);
  }
};
