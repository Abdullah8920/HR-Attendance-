# Saylani HCM Lite - Payroll Specification & Calculation Guide

This document describes the exact formulas, deduction algorithms, tax brackets, and immutability controls implemented in the HCM Lite payroll engine.

---

## 1. Salary Structure Formula

The default monthly compensation components are derived from the basic salary:

$$\text{HRA} = 0.40 \times \text{Basic Salary}$$
$$\text{Medical Allowance} = 0.10 \times \text{Basic Salary}$$
$$\text{Gross Salary} = \text{Basic Salary} + \text{HRA} + \text{Medical Allowance} + \text{Other Allowances}$$

With zero other allowances:
$$\text{Gross Monthly Salary} = 1.50 \times \text{Basic Salary}$$

### Concrete Example:
If Basic Salary = PKR 100,000:
- Basic Salary: PKR 100,000
- HRA (40%): PKR 40,000
- Medical Allowance (10%): PKR 10,000
- Other Allowances: PKR 0
- **Gross Monthly Salary**: PKR 150,000

All financial amounts are represented in integer PKR to avoid floating-point errors.

---

## 2. Working Days in Payroll Period

Working days in a month are determined dynamically by examining every calendar day of the target month:
1. Days matching configured company weekends (default: Sunday [0] and Saturday [6]) are excluded.
2. Days marked in the company `holidays` collection for that period are excluded.
3. The remaining days count as authoritative working days:
   $$\text{Working Days} = \text{Total Days in Month} - \text{Weekend Days} - \text{Public Holidays on Weekdays}$$

---

## 3. Daily Salary Rate

$$\text{Daily Salary} = \left\lfloor \frac{\text{Gross Monthly Salary}}{\text{Working Days in Month}} \right\rfloor$$

Example: For Gross = PKR 150,000 and 22 working days:
$$\text{Daily Salary} = \left\lfloor \frac{150,000}{22} \right\rfloor = \text{PKR } 6,818$$

---

## 4. Attendance & Leave Deductions

### A. Full Absent Day
A working day where the employee did not check in and had no approved leave:
$$\text{Deduction} = 1.0 \times \text{Daily Salary}$$

### B. Half-Day
A working day where the employee checked in and out, but the total duration was under the configured half-day threshold (default: 5 hours / 300 minutes):
$$\text{Deduction} = 0.5 \times \text{Daily Salary}$$

### C. Unpaid Leave
Approved leave under an unpaid leave type:
$$\text{Deduction} = 1.0 \times \text{Daily Salary per working day}$$

### D. Single-Deduction Invariant (No Double Deduction)
If a calendar day has an approved unpaid leave record, the attendance engine treats it exclusively as unpaid leave. It is never double-counted as an unexcused absence. Paid leaves (Casual, Sick, Annual) incur zero deduction.

---

## 5. Proration for Mid-Month Joiners & Leavers

If an employee joins after the 1st of the month or exits before the last day of the month:
1. Count the eligible working days within the employee's active tenure:
   $$\text{Eligible Working Days} = \sum_{\text{working days}} \mathbb{I}(\text{joiningDate} \le \text{date} \le \text{exitDate})$$
2. The eligible gross salary is prorated:
   $$\text{Prorated Gross} = \text{round}\left( \frac{\text{Eligible Working Days}}{\text{Working Days in Month}} \times \text{Gross Monthly Salary} \right)$$
3. Attendance and unpaid leave deductions apply only to expected working days within the active employment window.

---

## 6. Illustrative Annual Gross Tax Slabs

Annual gross salary is derived by:
$$\text{Annual Gross Salary} = \text{Applicable Monthly Gross} \times 12$$

| Income Bracket (PKR) | Formula |
|---|---|
| **0 – 600,000** | 0% |
| **600,001 – 1,200,000** | 5% of excess over 600,000 |
| **1,200,001 – 2,400,000** | PKR 30,000 + 15% of excess over 1,200,000 |
| **2,400,001 – 3,600,000** | PKR 210,000 + 25% of excess over 2,400,000 |
| **Above 3,600,000** | PKR 510,000 + 35% of excess over 3,600,000 |

### Monthly Tax Withholding:
$$\text{Monthly Tax Withholding} = \text{round}\left( \frac{\text{Annual Tax Liability}}{12} \right)$$

---

## 7. Net Salary Formula

$$\text{Net Salary} = \text{Prorated Gross} - \text{Attendance Deductions} - \text{Unpaid Leave Deductions} - \text{Monthly Tax Withheld} - \text{Other Deductions}$$

---

## 8. Finalization & Immutability Integrity

1. **Role Restriction**: Only users with the `ADMIN` role can execute `POST /api/payroll/runs/:id/finalize`. HR users receive `403 Forbidden`.
2. **Snapshot Creation**: During finalization, all employee line items are saved as immutable `Payslip` documents containing the exact historical figures (rates, working days, deductions, tax, net salary).
3. **Locking**: Once a payroll run is marked `FINALIZED`, the draft calculation endpoint rejects re-calculation attempts for that month.
4. **Historical Isolation**: Any subsequent salary structure revisions or tax configuration updates will not alter historical finalized payslips.
