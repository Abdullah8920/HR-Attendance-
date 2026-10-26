# Saylani HCM Lite - Backend

AI-assisted Human Capital Management System backend built with **Node.js, Express, and MongoDB (Mongoose)**. Clean, lightweight, and human-written JavaScript architecture.

---

## 1. Features

- **Three Defined Roles**: Admin, HR, Employee with server-side Role-Based Access Control (RBAC).
- **First-Run Setup**: Concurrency-safe initialization of company and first Admin account via API or CLI script.
- **Organization Settings**: Office start (09:00), 15-minute grace period (late after 09:15), half-day (< 5 hours), weekend days, departments, designations, holidays, leave types.
- **Employee Management**: Registration, automatic login creation with temporary password, directory search, pagination, Employee 360 overview, CSV import & export.
- **Attendance**: Authoritative check-in/out, late arrival detection, duplicate check-in prevention (`409 Conflict`), attendance calendar, HR daily board, correction request & approval.
- **Leave Management**: Casual (10), Sick (8), Annual (14), and Unpaid leave. Counts working days excluding weekends and public holidays. Overlapping leave check (`422`) and balance limit check (`422`).
- **Payroll & Tax Engine**:
  - Basic, HRA (40%), Medical (10%), Gross = 1.5x Basic.
  - Daily salary rate based on actual monthly working days.
  - Full absent deductions, half-day deductions, unpaid leave deductions.
  - Single-deduction invariant (no double deductions).
  - 5-tier annual tax slabs with monthly tax withholding.
  - Mid-month joiner/leaver proration.
  - Immutable payroll finalization (Admin only, locked against edits).
- **Analytics Dashboards**: Server-side aggregations for Admin, HR, and Employee.
- **Announcements & Audit Logging**: Company announcements and immutable operations audit trail.

---

## 2. Tech Stack

- **Runtime**: Node.js (v20+ or v24+)
- **Module System**: ES Modules (`"type": "module"`)
- **Framework**: Express.js
- **Database**: MongoDB / Mongoose
- **Auth & Security**: JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `helmet`, `express-rate-limit`

---

## 3. Project Structure

```text
hcm-lite-backend/
├── src/
│   ├── app.js                   # Express app configuration & middlewares
│   ├── server.js                # Server entry point & DB connection
│   ├── config/
│   │   ├── db.js                # Mongoose connection
│   │   └── env.js               # Environment variables
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── company.controller.js
│   │   ├── employee.controller.js
│   │   ├── attendance.controller.js
│   │   ├── leave.controller.js
│   │   ├── payroll.controller.js
│   │   ├── analytics.controller.js
│   │   ├── announcement.controller.js
│   │   └── audit.controller.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authenticate & role authorize
│   │   └── errorHandler.js      # Central error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Company.js
│   │   ├── Department.js
│   │   ├── Designation.js
│   │   ├── Employee.js
│   │   ├── LeaveType.js
│   │   ├── Holiday.js
│   │   ├── Attendance.js
│   │   ├── AttendanceCorrection.js
│   │   ├── LeaveRequest.js
│   │   ├── SalaryStructure.js
│   │   ├── PayrollRun.js
│   │   ├── Payslip.js
│   │   ├── Announcement.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── index.js             # Routes aggregator (/api)
│   │   ├── auth.routes.js
│   │   ├── organization.routes.js
│   │   ├── user.routes.js
│   │   ├── employee.routes.js
│   │   ├── attendance.routes.js
│   │   ├── leave.routes.js
│   │   ├── payroll.routes.js
│   │   ├── analytics.routes.js
│   │   ├── announcement.routes.js
│   │   └── audit.routes.js
│   └── utils/
│       ├── audit.js             # Audit logger helper
│       ├── dateUtils.js         # Working days, late check, dates
│       └── taxCalculator.js     # Tax slab calculations
├── scripts/
│   └── createAdmin.js           # CLI admin creation script
├── docs/
│   ├── API.md                   # Complete API reference
│   ├── DATABASE.md              # Collections & schemas
│   └── PAYROLL.md               # Payroll math & formulas
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 4. Setup & Running

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create a `.env` file (see `.env.example`):
```dotenv
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/hcm_lite
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=admin@saylanihcm.com
ADMIN_PASSWORD=AdminPassword123!
```

### 3. Initialize the first Admin & Company
Option A: Via CLI script:
```bash
npm run seed:admin
```
Option B: Via API:
Send `POST http://localhost:5000/api/auth/setup` with:
```json
{
  "companyName": "Saylani Enterprises",
  "companyEmail": "info@saylani.org",
  "adminEmail": "admin@saylani.org",
  "adminPassword": "AdminPassword123!"
}
```

### 4. Start the server
- **Development** (live reload):
  ```bash
  npm run dev
  ```
- **Production**:
  ```bash
  npm start
  ```

---

## 5. Main API Routes

| Resource | Route | Methods | Role Access |
|---|---|---|---|
| Health | `/api/health` | GET | Public |
| Auth Setup | `/api/auth/setup` | POST | Public (first run only) |
| Auth Login | `/api/auth/login` | POST | Public |
| Current User | `/api/auth/me` | GET | Authenticated |
| Change Password | `/api/auth/change-password` | PATCH | Authenticated |
| Organization | `/api/organization` | GET, PATCH | Admin |
| Departments | `/api/organization/departments` | GET, POST, DELETE | Admin (mutations) |
| Designations | `/api/organization/designations` | GET, POST, DELETE | Admin (mutations) |
| Holidays | `/api/organization/holidays` | GET, POST, DELETE | Admin (mutations) |
| Leave Types | `/api/organization/leave-types` | GET, POST | Admin (mutations) |
| Users | `/api/users/hr`, `/api/users/:id/status` | POST, PATCH | Admin |
| Employees | `/api/employees` | GET, POST, PATCH | Admin, HR, Employee |
| Employee 360 | `/api/employees/:id/360` | GET | Permitted profile & history |
| Attendance Check-In | `/api/attendance/check-in` | POST | Employee |
| Attendance Check-Out | `/api/attendance/check-out` | POST | Employee |
| Attendance Calendar | `/api/attendance/calendar` | GET | Authenticated |
| Attendance Board | `/api/attendance` | GET | Admin, HR |
| Attendance Correction | `/api/attendance/corrections` | POST, GET, PATCH | Employee request / HR decision |
| Leave Applications | `/api/leaves` | POST, GET | Employee |
| Leave Balances | `/api/leaves/balance/me` | GET | Employee |
| Leave Approval | `/api/leaves/:id/decision` | PATCH | Admin, HR |
| Salary Structure | `/api/payroll/salary-structures` | POST | Admin, HR |
| Payroll Draft | `/api/payroll/runs` | POST, GET | Admin, HR |
| Payroll Finalization | `/api/payroll/runs/:id/finalize` | POST | **Admin ONLY** |
| Payslips | `/api/payroll/payslips/me` | GET | Employee |
| Analytics | `/api/analytics/admin`, `/hr`, `/employee` | GET | Scoped per role |
| Announcements | `/api/announcements` | GET, POST, DELETE | Admin, HR, Employee |
| Audit Logs | `/api/audit` | GET | Admin ONLY |
