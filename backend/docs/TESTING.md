# Saylani HCM Lite - Manual Testing & Verification Guide

This guide walks you through testing the entire backend flow using cURL or any API client (such as Postman / Thunder Client).

---

## 1. Health Check
```bash
curl http://localhost:5000/api/health
```
**Expected Response**:
```json
{
  "success": true,
  "message": "Saylani HCM Lite Backend is running cleanly.",
  "timestamp": "..."
}
```

---

## 2. Organization & First Admin Setup
On a clean database, initialize the company:
```bash
curl -X POST http://localhost:5000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Saylani Tech",
    "companyEmail": "info@saylani.org",
    "adminEmail": "admin@saylani.org",
    "adminPassword": "AdminPassword123!"
  }'
```
Save the returned `token`. Subsequent setup requests will be rejected with `409 Conflict`.

---

## 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@saylani.org",
    "password": "AdminPassword123!"
  }'
```

---

## 4. Create HR Account (Admin only)
```bash
curl -X POST http://localhost:5000/api/users/hr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "email": "hr@saylani.org",
    "password": "HrPassword123!"
  }'
```

---

## 5. Register an Employee (HR or Admin)
```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <HR_OR_ADMIN_TOKEN>" \
  -d '{
    "employeeCode": "EMP-001",
    "firstName": "Bilal",
    "lastName": "Ahmed",
    "email": "bilal@saylani.org",
    "joiningDate": "2026-01-01",
    "basicSalary": 100000
  }'
```
*Note: This automatically creates an employee user login with a temporary password and generates the initial salary structure (Basic = 100k, HRA = 40k, Medical = 10k, Gross = 150k).*

---

## 6. Employee Web Check-in & Check-out
Login as the employee (`bilal@saylani.org`), then check in:
```bash
curl -X POST http://localhost:5000/api/attendance/check-in \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>"
```
A second check-in on the same day will return `409 Conflict`.

Check out:
```bash
curl -X POST http://localhost:5000/api/attendance/check-out \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>"
```

---

## 7. Apply for Leave (Employee)
Get the list of leave types (e.g. Sick Leave ID):
```bash
curl http://localhost:5000/api/organization/leave-types \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>"
```

Apply for 2 days leave:
```bash
curl -X POST http://localhost:5000/api/leaves \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>" \
  -d '{
    "leaveTypeId": "<LEAVE_TYPE_ID>",
    "startDate": "2026-10-27",
    "endDate": "2026-10-28",
    "reason": "Family emergency"
  }'
```

Approve the leave as HR:
```bash
curl -X PATCH http://localhost:5000/api/leaves/<LEAVE_ID>/decision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <HR_TOKEN>" \
  -d '{
    "status": "APPROVED",
    "comment": "Approved by HR"
  }'
```

---

## 8. Generate Monthly Payroll Draft (HR or Admin)
```bash
curl -X POST http://localhost:5000/api/payroll/runs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <HR_OR_ADMIN_TOKEN>" \
  -d '{
    "month": 10,
    "year": 2026
  }'
```
Returns calculated gross salaries, working days, daily salaries, attendance deductions, unpaid leave deductions, and tax withholdings.

---

## 9. Finalize Payroll Run (Admin ONLY)
Verify HR is blocked:
```bash
curl -X POST http://localhost:5000/api/payroll/runs/<RUN_ID>/finalize \
  -H "Authorization: Bearer <HR_TOKEN>"
```
**Expected**: `403 Forbidden` (`Forbidden: role 'HR' is not authorized.`).

Finalize with Admin:
```bash
curl -X POST http://localhost:5000/api/payroll/runs/<RUN_ID>/finalize \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
**Expected**: `200 OK` (`Payroll finalized and locked.`).

---

## 10. View Payslips & Analytics
Employee views their payslip:
```bash
curl http://localhost:5000/api/payroll/payslips/me \
  -H "Authorization: Bearer <EMPLOYEE_TOKEN>"
```

Admin views analytics:
```bash
curl http://localhost:5000/api/analytics/admin \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
