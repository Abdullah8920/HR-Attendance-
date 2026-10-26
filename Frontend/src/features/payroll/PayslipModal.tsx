import React, { useRef, useState } from 'react';
import { Payslip } from '../../types/payroll';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Download, Printer, Building2, CheckCircle2, ShieldCheck, FileCheck, Calendar, Clock, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PayslipModalProps {
  payslip: Payslip | null;
  onClose: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const PayslipModal: React.FC<PayslipModalProps> = ({ payslip, onClose }) => {
  const payslipRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!payslip) return null;

  const monthName = MONTH_NAMES[(payslip.month || 1) - 1] || `Month ${payslip.month}`;
  const totalDeductions = (payslip.attendanceDeductions || 0) + 
                          (payslip.unpaidLeaveDeductions || 0) + 
                          (payslip.taxWithheld || payslip.monthlyTaxWithheld || 0);

  const handleDownloadPdf = async () => {
    if (!payslipRef.current) return;
    setIsDownloading(true);
    try {
      const element = payslipRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 297));
      const filename = `Payslip_${payslip.employeeCode}_${monthName}_${payslip.year}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={!!payslip}
      onClose={onClose}
      title={`Payslip — ${payslip.employeeName}`}
      description={`Official salary breakdown for ${monthName} ${payslip.year}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 font-sans">
        {/* Printable/Capturable Payslip Container */}
        <div
          ref={payslipRef}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-slate-800 space-y-5"
        >
          {/* Header */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-100">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                    SAYLANI WELFARE INTERNATIONAL TRUST
                  </h3>
                  <p className="text-xs font-semibold text-indigo-700 tracking-wide mt-1 uppercase">
                    Human Capital Management System
                  </p>
                  <p className="text-[11px] text-slate-500">Official Monthly Salary Advice & Tax Withholding Statement</p>
                </div>
              </div>

              <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pay Period</span>
                <span className="text-sm font-extrabold text-indigo-900 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                  {monthName} {payslip.year}
                </span>
                <div className="mt-1">
                  <Badge variant={payslip.status === 'FINALIZED' ? 'success' : 'warning'}>
                    {payslip.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Information Card */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Employee Name</span>
              <span className="font-bold text-slate-900 text-sm">{payslip.employeeName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Employee ID / Code</span>
              <span className="font-mono font-bold text-indigo-700 text-sm">{payslip.employeeCode}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Department</span>
              <span className="font-semibold text-slate-800">{payslip.departmentName || 'General Staff'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Designation</span>
              <span className="font-semibold text-slate-800">{payslip.designationName || 'Staff Member'}</span>
            </div>
          </div>

          {/* Attendance & Working Days Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-400 block">Working Days</span>
              <span className="font-bold text-slate-800 text-sm">{payslip.workingDaysInMonth} days</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-400 block">Worked / Present</span>
              <span className="font-bold text-emerald-700 text-sm">
                {payslip.actualWorkingDays !== undefined 
                  ? payslip.actualWorkingDays 
                  : (payslip.eligibleWorkingDays || payslip.workingDaysInMonth) - (payslip.absentDays || 0)} days
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-400 block">Absences</span>
              <span className={`font-bold text-sm ${payslip.absentDays > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                {payslip.absentDays || 0} days
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-400 block">Half Days</span>
              <span className={`font-bold text-sm ${payslip.halfDays > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                {payslip.halfDays || 0}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-semibold text-slate-400 block">Daily Rate</span>
              <span className="font-mono font-bold text-slate-800 text-sm">Rs. {(payslip.dailySalary || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Side-by-side Earnings & Deductions Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Earnings Breakdown */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-emerald-50/70 border-b border-emerald-100 px-3.5 py-2 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Earnings
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">Amount (PKR)</span>
              </div>
              <div className="p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-600">Basic Salary</span>
                  <span className="font-mono font-medium text-slate-800">Rs. {(payslip.basicSalary || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-600">House Rent Allowance (HRA 40%)</span>
                  <span className="font-mono font-medium text-slate-800">Rs. {(payslip.hra || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-600">Medical Allowance (10%)</span>
                  <span className="font-mono font-medium text-slate-800">Rs. {(payslip.medicalAllowance || 0).toLocaleString()}</span>
                </div>
                {Boolean(payslip.otherAllowances && payslip.otherAllowances > 0) && (
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-600">Other Allowances</span>
                    <span className="font-mono font-medium text-slate-800">Rs. {(payslip.otherAllowances || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-bold text-slate-900">
                  <span>Gross Earnings</span>
                  <span className="font-mono text-emerald-700">Rs. {(payslip.grossSalary || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-red-50/70 border-b border-red-100 px-3.5 py-2 flex items-center justify-between">
                <span className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Deductions & Tax
                </span>
                <span className="text-[11px] font-semibold text-red-700">Amount (PKR)</span>
              </div>
              <div className="p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-600">Attendance Deductions (Unexcused/Half)</span>
                  <span className="font-mono font-medium text-red-600">Rs. {(payslip.attendanceDeductions || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-600">Unpaid Leave Deductions</span>
                  <span className="font-mono font-medium text-red-600">Rs. {(payslip.unpaidLeaveDeductions || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-600">Income Tax Withholding</span>
                  <span className="font-mono font-medium text-slate-800">
                    Rs. {(payslip.taxWithheld || payslip.monthlyTaxWithheld || 0).toLocaleString()}
                  </span>
                </div>
                {Boolean(payslip.otherDeductions && payslip.otherDeductions > 0) && (
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-600">Other Deductions</span>
                    <span className="font-mono font-medium text-slate-800">Rs. {(payslip.otherDeductions || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-bold text-slate-900">
                  <span>Total Deductions</span>
                  <span className="font-mono text-red-600">Rs. {totalDeductions.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Take-Home Pay Highlight Card */}
          <div className="bg-gradient-to-r from-[#4338CA] to-[#3730A3] text-white rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm">
            <div>
              <span className="text-xs uppercase tracking-wider text-indigo-200 font-semibold block">
                Net Take-Home Salary (Disbursed)
              </span>
              <p className="text-[11px] text-indigo-200 mt-0.5">
                Gross Earnings minus Attendance, Leave, and Tax Withholdings
              </p>
            </div>
            <div className="mt-2 sm:mt-0 text-right">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white block">
                Rs. {(payslip.netSalary || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Formal Footer / Certification */}
          <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Electronically generated and verified by Saylani HCM Payroll Engine.</span>
            </div>
            <div className="font-mono">
              Generated: {new Date(payslip.generatedAt || payslip.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-3.5 h-3.5" />}>
            Print Slip
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadPdf}
              isLoading={isDownloading}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download PDF Slip
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
