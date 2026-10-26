# Saylani HCM Lite — Frontend

A modern, clean, lightweight Human Capital Management (HCM Lite) web application frontend built for the Saylani Hackathon project.

---

## Tech Stack
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS (Clean SaaS indigo palette, spacious layout, rounded corners)
- **Routing**: React Router v6
- **HTTP Client**: Axios with JWT Bearer interceptor & session handling
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: Simple React Context (`AuthContext`, `ToastContext`)

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file (configured by default in `.env`):
```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## Features & Pages Implemented

1. **Authentication** (`/login`, `/setup`):
   - Secure Login with JWT Bearer tokens
   - First-run organization setup
   - 1-click test roles: **Admin**, **HR**, and **Employee**
   - Protected routes and automatic role filtering

2. **Dashboard** (`/dashboard`):
   - 4 Top KPI Cards (Total Employees, Present Today, On Leave, Late Arrivals)
   - Visual Attendance Overview chart
   - Pending action items / Employee personal summary & check-in/out quick action

3. **Employee Directory** (`/employees`):
   - Paginated employee list with live search and department filter
   - Add new employee modal
   - CSV export & import

4. **Attendance Management** (`/attendance`):
   - Daily attendance board with present, late, half-day, absent, on-leave filters
   - Date picker to view historical records
   - Employee check-in / check-out controls
   - Attendance correction requests & supervisor approval/rejection

5. **Leave Management** (`/leaves`):
   - Quota tracking for Casual (10), Sick (8), Annual (14), and Unpaid leave
   - Apply leave form (working days computed excluding weekends and holidays)
   - Admin/HR approve & reject controls with notes

6. **Payroll & Salary** (`/payroll`):
   - Payroll draft calculation
   - Finalization and locking (Admin only)
   - Employee personal payslip modal with earnings breakdown, attendance deductions, and tax withholding

7. **Analytics** (`/analytics`):
   - Weekly attendance & punctuality trend lines
   - Headcount by department distribution charts
   - Cost liabilities & attrition benchmarks

8. **AI HR Assistant** (`/ai-assistant`):
   - Interactive policy assistant answering questions on office timings, 15-minute grace period, leave quotas, half-day rules, and payroll deductions

9. **Company Announcements** (`/announcements`):
   - Company notice board with priority tags
   - Admin/HR create & delete controls

10. **Organization Settings** (`/settings`, Admin only):
    - Office start time, end time, grace period, and half-day threshold
    - Department and public holiday managers
    - HR manager account creation

11. **System Audit Logs** (`/audit-logs`, Admin only):
    - Searchable, paginated audit trail of all actions with actor, role, timestamp, and IP address
