# Saylani HCM Lite - Database Schema Reference

All data collections are scoped to `companyId` for clean multi-tenant isolation.

---

## Collections

### 1. `users`
- `companyId` (ObjectId, ref: Company)
- `email` (String, unique, lowercase)
- `password` (String, bcrypt hash)
- `role` (String: `ADMIN`, `HR`, `EMPLOYEE`)
- `isActive` (Boolean, default: true)
- `mustChangePassword` (Boolean, default: false)
- `employeeId` (ObjectId, ref: Employee)
- `lastLoginAt` (Date)

### 2. `companies`
- `name`, `email`, `phone`, `address`
- `currency` (String, default: 'PKR')
- `timezone` (String, default: 'Asia/Karachi')
- `officeStartTime` (String, default: '09:00')
- `officeEndTime` (String, default: '18:00')
- `gracePeriodMinutes` (Number, default: 15)
- `halfDayThresholdHours` (Number, default: 5)
- `weekendDays` (Array: `[0, 6]` -> Sunday, Saturday)
- `officeLatitude`, `officeLongitude`, `officeRadiusMeters`

### 3. `departments`
- `companyId` (ObjectId)
- `name`, `code` (unique per company), `description`
- `isActive` (Boolean)

### 4. `designations`
- `companyId` (ObjectId)
- `departmentId` (ObjectId)
- `title`, `code` (unique per company), `description`

### 5. `employees`
- `companyId`, `userId`
- `employeeCode` (unique per company)
- `firstName`, `lastName`, `email`, `phone`, `address`
- `departmentId`, `designationId`
- `employmentStatus` (`ACTIVE`, `PROBATION`, `ON_LEAVE`, `TERMINATED`, `RESIGNED`)
- `joiningDate`, `exitDate`
- `salaryStructureId`

### 6. `attendances`
- `companyId`, `employeeId`
- `date` (`YYYY-MM-DD`)
- `checkIn`, `checkOut`
- `workingMinutes` (Number)
- `status` (`PRESENT`, `LATE`, `HALF_DAY`, `ABSENT`, `ON_LEAVE`, `HOLIDAY`, `WEEKEND`)
- `isCorrected`, `correctionId`
- *Unique compound index*: `{ companyId: 1, employeeId: 1, date: 1 }`

### 7. `attendancecorrections`
- `companyId`, `employeeId`, `date`
- `requestedCheckIn`, `requestedCheckOut`, `reason`
- `status` (`PENDING`, `APPROVED`, `REJECTED`)
- `reviewedBy`, `reviewedAt`, `reviewComment`

### 8. `leavetypes`
- `companyId`, `name`, `code`, `annualQuota`, `isPaid`

### 9. `leaverequests`
- `companyId`, `employeeId`, `leaveTypeId`
- `startDate`, `endDate`, `daysCount`
- `reason`, `status` (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`)
- `reviewedBy`, `reviewedAt`, `reviewComment`

### 10. `holidays`
- `companyId`, `name`, `date` (`YYYY-MM-DD`), `description`

### 11. `salarystructures`
- `companyId`, `employeeId`
- `basicSalary`, `hra` (40%), `medicalAllowance` (10%), `otherAllowances`, `grossSalary` (1.5x basic)
- `effectiveFrom`, `isActive`

### 12. `payrollruns`
- `companyId`, `month`, `year`, `workingDaysInMonth`
- `status` (`DRAFT`, `FINALIZED`)
- `employeeCount`, `totalGrossSalary`, `totalAttendanceDeductions`, `totalUnpaidLeaveDeductions`, `totalTax`, `totalNetSalary`
- `createdBy`, `finalizedBy`, `finalizedAt`
- *Unique compound index*: `{ companyId: 1, year: 1, month: 1 }`

### 13. `payslips`
- `companyId`, `payrollRunId`, `employeeId`
- `month`, `year`, `employeeCode`, `employeeName`, `departmentName`, `designationName`
- `basicSalary`, `hra`, `medicalAllowance`, `grossSalary`
- `workingDaysInMonth`, `eligibleWorkingDays`, `proratedGrossSalary`, `dailySalary`
- `absentDays`, `halfDays`, `unpaidLeaveDays`
- `attendanceDeductions`, `unpaidLeaveDeductions`, `otherDeductions`, `totalDeductions`
- `annualGrossSalary`, `annualTaxLiability`, `monthlyTaxWithheld`, `netSalary`
- `status` (`DRAFT`, `FINALIZED`)

### 14. `announcements`
- `companyId`, `title`, `message`, `priority`, `targetAudience`, `departmentId`, `createdBy`, `isActive`

### 15. `auditlogs`
- `companyId`, `actorUserId`, `role`, `action`, `entityType`, `entityId`, `details`, `ipAddress`, `userAgent`
