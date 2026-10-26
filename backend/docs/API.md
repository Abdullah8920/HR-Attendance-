# Saylani HCM Lite - API Reference

Base URL: `http://localhost:5000/api`

Protected endpoints require header:
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Health Check
- **`GET /api/health`** (Public)
  - Returns backend health status.

---

## 2. Authentication (`/api/auth`)
- **`POST /api/auth/setup`** (Public - locks after first run)
  - Body: `{ companyName, companyEmail, adminEmail, adminPassword, officeStartTime, officeEndTime, gracePeriodMinutes }`
  - Creates the initial company and first Admin account.
- **`POST /api/auth/login`** (Public)
  - Body: `{ email, password }`
  - Returns user profile and JWT token.
- **`POST /api/auth/logout`** (Authenticated)
- **`GET /api/auth/me`** (Authenticated)
- **`PATCH /api/auth/change-password`** (Authenticated)
  - Body: `{ oldPassword, newPassword }`

---

## 3. Organization Configuration (`/api/organization`)
- **`GET /api/organization`** - Company settings (timings, grace period, weekend days)
- **`PATCH /api/organization`** - Update settings (Admin)
- **`GET /api/organization/departments`** - List departments
- **`POST /api/organization/departments`** - Create department (Admin)
- **`DELETE /api/organization/departments/:id`** - Delete department (Admin)
- **`GET /api/organization/designations`** - List designations
- **`POST /api/organization/designations`** - Create designation (Admin)
- **`DELETE /api/organization/designations/:id`** - Delete designation (Admin)
- **`GET /api/organization/leave-types`** - List leave types & quotas
- **`POST /api/organization/leave-types`** - Create leave type (Admin)
- **`GET /api/organization/holidays`** - List holidays
- **`POST /api/organization/holidays`** - Create holiday (Admin)
- **`DELETE /api/organization/holidays/:id`** - Delete holiday (Admin)

---

## 4. User Accounts (`/api/users`)
- **`POST /api/users/hr`** (Admin only)
  - Body: `{ email, password }`
  - Creates an HR user account.
- **`PATCH /api/users/:id/status`** (Admin only)
  - Body: `{ isActive: true / false }`
- **`PATCH /api/users/:id/reset-password`** (Admin only)
  - Body: `{ newPassword }`

---

## 5. Employee Directory (`/api/employees`)
- **`POST /api/employees`** (Admin, HR)
  - Body: `{ employeeCode, firstName, lastName, email, phone, address, departmentId, designationId, joiningDate, basicSalary }`
  - Registers employee, generates temporary user login account (`mustChangePassword: true`), and creates initial salary structure.
- **`GET /api/employees`** (Authenticated)
  - Query params: `page`, `limit`, `search`, `departmentId`, `status`.
- **`GET /api/employees/:id`** - Employee details.
- **`PATCH /api/employees/:id`** - Update employee (Employee can only update own phone/address; HR/Admin can update job fields).
- **`GET /api/employees/:id/360`** - Employee 360 overview (profile, recent 10 attendance, leaves, payslips).
- **`GET /api/employees/export`** (Admin, HR) - Downloads employee directory CSV.
- **`POST /api/employees/import`** (Admin, HR) - Imports employees from CSV text.

---

## 6. Attendance Module (`/api/attendance`)
- **`POST /api/attendance/check-in`** (Employee)
  - Rejects duplicate check-in with `409 Conflict`.
  - Check-in after 09:15 is marked `LATE`; otherwise `PRESENT`.
- **`POST /api/attendance/check-out`** (Employee)
  - Calculates working minutes. If working duration < 5 hours, marked `HALF_DAY`.
- **`GET /api/attendance/me`** (Employee) - Own attendance records.
- **`GET /api/attendance/calendar`** (Authenticated) - Monthly calendar view (with weekend, holiday, leave markers).
- **`GET /api/attendance`** (Admin, HR) - Daily attendance board with present, late, half-day, absent, on-leave employees.
- **`POST /api/attendance/corrections`** (Employee) - Request correction with date and reason.
- **`GET /api/attendance/corrections`** - List correction requests.
- **`PATCH /api/attendance/corrections/:id/decision`** (Admin, HR) - Approve/Reject correction request.

---

## 7. Leave Management (`/api/leaves`)
- **`POST /api/leaves`** (Employee)
  - Body: `{ leaveTypeId, startDate, endDate, reason }`
  - Computes working days excluding weekends and holidays.
  - Rejects overlapping leave requests with `422`.
  - Rejects paid leave requests exceeding remaining balance with `422`.
- **`GET /api/leaves/balance/me`** (Employee) - Leave quotas, used days, remaining days.
- **`GET /api/leaves/me`** (Employee) - Leave history.
- **`GET /api/leaves`** (Admin, HR) - All leave requests.
- **`PATCH /api/leaves/:id/cancel`** (Employee) - Cancel own pending leave.
- **`PATCH /api/leaves/:id/decision`** (Admin, HR) - Approve/Reject leave with comments.

---

## 8. Payroll & Salary (`/api/payroll`)
- **`POST /api/payroll/salary-structures`** (Admin, HR)
  - Body: `{ employeeId, basicSalary, otherAllowances, effectiveFrom }`
  - Formula: HRA = 40% of basic, Medical = 10% of basic, Gross = 1.5x basic.
- **`POST /api/payroll/runs`** (Admin, HR)
  - Body: `{ month, year, notes }`
  - Generates payroll draft based on working days, salary structures, attendance deductions, unpaid leave deductions, and tax withholdings.
- **`GET /api/payroll/runs`** (Admin, HR) - List payroll runs.
- **`GET /api/payroll/runs/:id`** (Admin, HR) - Payroll run details and line items.
- **`POST /api/payroll/runs/:id/finalize`** (Admin ONLY - HR forbidden with `403`)
  - Locks payroll run and publishes finalized employee payslips.
- **`GET /api/payroll/payslips/me`** (Employee) - Own finalized payslips.
- **`GET /api/payroll/payslips/:id`** - View single payslip.

---

## 9. Analytics & Dashboards (`/api/analytics`)
- **`GET /api/analytics/admin`** (Admin only)
  - Headcount, attrition, today's attendance stats, late count, monthly payroll cost, average salary, recent audit logs.
- **`GET /api/analytics/hr`** (Admin, HR)
  - Headcount, today's attendance, pending leave approvals, pending corrections, latest payroll draft.
- **`GET /api/analytics/employee`** (Employee)
  - Check-in status today, weekly hours, late count, leave balances, recent attendance, latest payslip.

---

## 10. Announcements & Audit
- **`GET /api/announcements`** - List active announcements.
- **`POST /api/announcements`** (Admin, HR) - Create announcement.
- **`DELETE /api/announcements/:id`** (Admin, HR) - Delete announcement.
- **`GET /api/audit`** (Admin only) - Paginated audit logs.
