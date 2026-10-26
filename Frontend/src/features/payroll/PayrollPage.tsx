import React, { useEffect, useState, useMemo } from 'react';
import { payrollApi } from '../../api/payroll.api';
import { employeeApi } from '../../api/employee.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PayrollRun, Payslip } from '../../types/payroll';
import { Employee } from '../../types/employee';
import {
  Banknote,
  Lock,
  FileText,
  Plus,
  Eye,
  Search,
  Download,
  Filter,
  User,
  Users,
  Layers,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingDown,
  Building,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { PayslipModal } from './PayslipModal';

export const PayrollPage: React.FC = () => {
  const { role, user } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'individual' | 'runs' | 'me'>('individual');
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [allPayslips, setAllPayslips] = useState<Payslip[]>([]);
  const [myPayslips, setMyPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedRun, setSelectedRun] = useState<{ run: PayrollRun; lines: Payslip[] } | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters for All Employee Payslips
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Draft Batch Modal
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [batchMonth, setBatchMonth] = useState(new Date().getMonth() + 1);
  const [batchYear, setBatchYear] = useState(new Date().getFullYear());
  const [batchNotes, setBatchNotes] = useState('Provisional payroll calculation');

  // Individual Payslip Modal
  const [isIndivModalOpen, setIsIndivModalOpen] = useState(false);
  const [indivEmployeeId, setIndivEmployeeId] = useState('');
  const [indivMonth, setIndivMonth] = useState(new Date().getMonth() + 1);
  const [indivYear, setIndivYear] = useState(new Date().getFullYear());
  const [indivStatus, setIndivStatus] = useState<'DRAFT' | 'FINALIZED'>('FINALIZED');

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      if (role === 'ADMIN' || role === 'HR') {
        const [runsRes, payslipsRes, empRes, meRes] = await Promise.all([
          payrollApi.getPayrollRuns().catch(() => ({ data: [] })),
          payrollApi.getAllPayslips().catch(() => ({ data: [] })),
          employeeApi.getEmployees({ limit: 200 }).catch(() => ({ data: [] })),
          payrollApi.getMyPayslips().catch(() => ({ data: [] })),
        ]);
        setRuns(runsRes.data || []);
        setAllPayslips(payslipsRes.data || []);
        setEmployees(empRes.data || []);
        setMyPayslips(meRes.data || []);
      } else {
        const res = await payrollApi.getMyPayslips().catch(() => ({ data: [] }));
        setMyPayslips(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [role]);

  // Filtered payslips
  const filteredPayslips = useMemo(() => {
    return allPayslips.filter((ps) => {
      const matchSearch =
        !searchQuery ||
        ps.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ps.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ps.departmentName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchEmp = !filterEmployeeId || 
        (typeof ps.employeeId === 'string' ? ps.employeeId === filterEmployeeId : ps.employeeId?._id === filterEmployeeId);

      const matchMonth = !filterMonth || ps.month === Number(filterMonth);
      const matchYear = !filterYear || ps.year === Number(filterYear);
      const matchStatus = !filterStatus || ps.status === filterStatus;

      return matchSearch && matchEmp && matchMonth && matchYear && matchStatus;
    });
  }, [allPayslips, searchQuery, filterEmployeeId, filterMonth, filterYear, filterStatus]);

  // Handle Generate Individual Payslip
  const handleGenerateIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indivEmployeeId) {
      toastError('Please select an employee');
      return;
    }
    setActionLoading(true);
    try {
      const res = await payrollApi.generateIndividualPayslip({
        employeeId: indivEmployeeId,
        month: indivMonth,
        year: indivYear,
        status: indivStatus,
      });
      success(`Individual payslip for ${res.data.employeeName} generated successfully!`);
      setIsIndivModalOpen(false);
      setSelectedPayslip(res.data);
      fetchPayrollData();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to generate individual payslip.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Batch Draft
  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await payrollApi.createPayrollDraft({ month: batchMonth, year: batchYear, notes: batchNotes });
      success(`Batch payroll draft for ${batchMonth}/${batchYear} generated!`);
      setIsDraftModalOpen(false);
      fetchPayrollData();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to generate payroll run.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Finalize Run
  const handleFinalize = async (id: string) => {
    if (!window.confirm('Are you sure you want to finalize this payroll run? This locks calculations and publishes individual payslips.')) {
      return;
    }
    setActionLoading(true);
    try {
      await payrollApi.finalizePayroll(id);
      success('Payroll run finalized and published to all employees!');
      fetchPayrollData();
      if (selectedRun && selectedRun.run._id === id) {
        setSelectedRun(null);
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Finalization failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewRun = async (runId: string) => {
    try {
      const res = await payrollApi.getPayrollRunById(runId);
      setSelectedRun(res.data);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Could not fetch run details.');
    }
  };

  // Employee-only view
  if (role === 'EMPLOYEE') {
    const latestPayslip = myPayslips[0];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Banknote className="w-5 h-5 text-indigo-700" /> My Individual Payslips
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Access, inspect, and download your verified monthly salary advice and tax withholding slips
            </p>
          </div>
          {latestPayslip && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => setSelectedPayslip(latestPayslip)}
            >
              Latest Slip ({latestPayslip.month}/{latestPayslip.year})
            </Button>
          )}
        </div>

        {/* Employee Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-white border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Latest Net Salary</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-indigo-950 font-mono">
                Rs. {latestPayslip ? (latestPayslip.netSalary || 0).toLocaleString() : '0'}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                {latestPayslip ? `${latestPayslip.month}/${latestPayslip.year}` : 'N/A'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Disbursed net take-home salary</p>
          </Card>

          <Card className="p-4 bg-white border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Gross Base Salary</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-slate-800 font-mono">
                Rs. {latestPayslip ? (latestPayslip.grossSalary || 0).toLocaleString() : '0'}
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                Gross
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Basic + HRA (40%) + Medical (10%)</p>
          </Card>

          <Card className="p-4 bg-white border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Last Deductions</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-red-600 font-mono">
                Rs. {latestPayslip ? (((latestPayslip.attendanceDeductions || 0) + (latestPayslip.unpaidLeaveDeductions || 0))).toLocaleString() : '0'}
              </span>
              <span className="text-[10px] text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full">
                Absences/Leaves
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Unexcused absence & half-day deductions</p>
          </Card>

          <Card className="p-4 bg-white border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Payslips Issued</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-slate-800 font-mono">
                {myPayslips.length} Slips
              </span>
              <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                History
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Verified records on file</p>
          </Card>
        </div>

        {/* Payslips Table */}
        <Card className="overflow-hidden border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Your Monthly Payslip History</h3>
            <span className="text-xs text-slate-400">{myPayslips.length} records</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : myPayslips.length === 0 ? (
            <EmptyState
              title="No payslips available yet"
              description="Your monthly payslips will automatically appear here once processed and issued by administration."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Pay Period</th>
                    <th className="py-3 px-4">Gross Earnings</th>
                    <th className="py-3 px-4">Attendance Deductions</th>
                    <th className="py-3 px-4">Tax Withheld</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myPayslips.map((ps) => (
                    <tr key={ps._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 font-mono">
                        {ps.month}/{ps.year}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-mono">Rs. {(ps.grossSalary || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-red-600 font-mono font-medium">
                        Rs. {((ps.attendanceDeductions || 0) + (ps.unpaidLeaveDeductions || 0)).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        Rs. {(ps.taxWithheld || ps.monthlyTaxWithheld || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-700 font-mono text-sm">
                        Rs. {(ps.netSalary || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={ps.status === 'FINALIZED' ? 'success' : 'warning'}>
                          {ps.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedPayslip(ps)}>
                          <FileText className="w-3.5 h-3.5 mr-1 text-indigo-600" /> View & Download PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Payslip Modal */}
        <PayslipModal payslip={selectedPayslip} onClose={() => setSelectedPayslip(null)} />
      </div>
    );
  }

  // Admin & HR View
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Banknote className="w-5 h-5 text-indigo-700" /> Payroll & Individual Payslips Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage individual employee payslips, download PDFs, run batch calculations, and finalize monthly salaries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<User className="w-3.5 h-3.5" />}
            onClick={() => setIsIndivModalOpen(true)}
          >
            Generate Individual Slip
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsDraftModalOpen(true)}
          >
            Generate Batch Draft
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('individual')}
          className={`pb-3 px-3 text-xs font-bold tracking-wide transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'individual'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> All Individual Payslips ({allPayslips.length})
        </button>

        <button
          onClick={() => setActiveTab('runs')}
          className={`pb-3 px-3 text-xs font-bold tracking-wide transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'runs'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" /> Batch Payroll Runs ({runs.length})
        </button>

        <button
          onClick={() => setActiveTab('me')}
          className={`pb-3 px-3 text-xs font-bold tracking-wide transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'me'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" /> My Personal Payslip ({myPayslips.length})
        </button>
      </div>

      {/* TAB 1: ALL INDIVIDUAL PAYSLIPS */}
      {activeTab === 'individual' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <Card className="p-4 border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-2">
                <Input
                  placeholder="Search by code, employee name, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div>
                <Select
                  options={[
                    { value: '', label: 'All Employees' },
                    ...employees.map((e) => ({
                      value: e._id,
                      label: `${e.employeeCode} - ${e.firstName} ${e.lastName}`,
                    })),
                  ]}
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value)}
                />
              </div>

              <div>
                <Select
                  options={[
                    { value: '', label: 'All Months' },
                    { value: '1', label: 'January' },
                    { value: '2', label: 'February' },
                    { value: '3', label: 'March' },
                    { value: '4', label: 'April' },
                    { value: '5', label: 'May' },
                    { value: '6', label: 'June' },
                    { value: '7', label: 'July' },
                    { value: '8', label: 'August' },
                    { value: '9', label: 'September' },
                    { value: '10', label: 'October' },
                    { value: '11', label: 'November' },
                    { value: '12', label: 'December' },
                  ]}
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                />
              </div>

              <div>
                <Select
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: 'FINALIZED', label: 'FINALIZED' },
                    { value: 'DRAFT', label: 'DRAFT' },
                  ]}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Individual Payslips Table */}
          <Card className="overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Individual Employee Payslips Directory</h3>
                <p className="text-[11px] text-slate-400">Click any employee slip to inspect details or export high-res PDF</p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {filteredPayslips.length} Payslips Found
              </span>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : filteredPayslips.length === 0 ? (
              <EmptyState
                title="No payslips found"
                description="No employee payslips match your search or filter criteria. Generate an individual slip or a batch draft to get started."
                actionLabel="Generate Individual Slip"
                onAction={() => setIsIndivModalOpen(true)}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Gross Salary</th>
                      <th className="py-3 px-4">Deductions</th>
                      <th className="py-3 px-4">Tax Withheld</th>
                      <th className="py-3 px-4">Net Salary</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayslips.map((ps) => (
                      <tr key={ps._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{ps.employeeName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {ps.employeeCode} {ps.departmentName ? `• ${ps.departmentName}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          {ps.month}/{ps.year}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-800">
                          Rs. {(ps.grossSalary || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-red-600">
                          Rs. {((ps.attendanceDeductions || 0) + (ps.unpaidLeaveDeductions || 0)).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          Rs. {(ps.taxWithheld || ps.monthlyTaxWithheld || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700 text-sm">
                          Rs. {(ps.netSalary || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={ps.status === 'FINALIZED' ? 'success' : 'warning'}>
                            {ps.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <Button size="sm" variant="outline" onClick={() => setSelectedPayslip(ps)}>
                            <FileText className="w-3.5 h-3.5 mr-1 text-indigo-600" /> View Slip
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: BATCH PAYROLL RUNS */}
      {activeTab === 'runs' && (
        <div className="space-y-6">
          <Card className="overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Historical & Batch Payroll Runs</h3>
              <span className="text-xs text-slate-400">{runs.length} runs</span>
            </div>

            {runs.length === 0 ? (
              <EmptyState
                title="No payroll runs generated"
                description="Click 'Generate Batch Draft' to calculate monthly attendance, deductions, and salaries for all staff."
                actionLabel="Generate Batch Draft"
                onAction={() => setIsDraftModalOpen(true)}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Working Days</th>
                      <th className="py-3 px-4">Total Gross</th>
                      <th className="py-3 px-4">Total Deductions</th>
                      <th className="py-3 px-4">Total Tax</th>
                      <th className="py-3 px-4">Total Net Payout</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {runs.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800 font-mono">
                          {r.month}/{r.year}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{r.workingDaysInMonth} days</td>
                        <td className="py-3 px-4 font-mono text-slate-700">Rs. {(r.totalGrossPay || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono text-red-600">
                          Rs. {((r.totalAttendanceDeductions || 0) + (r.totalUnpaidLeaveDeductions || 0)).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">Rs. {(r.totalTaxWithheld || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">Rs. {(r.totalNetPay || 0).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <Badge variant={r.status === 'FINALIZED' ? 'success' : 'warning'}>{r.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewRun(r._id)}>
                            <Eye className="w-3.5 h-3.5 mr-1" /> View Run
                          </Button>
                          {role === 'ADMIN' && r.status === 'DRAFT' && (
                            <Button size="sm" variant="primary" onClick={() => handleFinalize(r._id)}>
                              <Lock className="w-3.5 h-3.5 mr-1" /> Finalize
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Detailed Run Breakdown (if clicked) */}
          {selectedRun && (
            <Card className="p-5 border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Payroll Breakdown — {selectedRun.run.month}/{selectedRun.run.year}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Status: <Badge variant={selectedRun.run.status === 'FINALIZED' ? 'success' : 'warning'}>{selectedRun.run.status}</Badge> | Working Days: {selectedRun.run.workingDaysInMonth}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedRun(null)}>
                  Close Breakdown
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Gross</th>
                      <th className="py-2.5 px-3">Basic</th>
                      <th className="py-2.5 px-3">HRA</th>
                      <th className="py-2.5 px-3">Medical</th>
                      <th className="py-2.5 px-3">Att. Deduct</th>
                      <th className="py-2.5 px-3">Tax</th>
                      <th className="py-2.5 px-3">Net Pay</th>
                      <th className="py-2.5 px-3 text-right">View Slip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRun.lines.map((line) => (
                      <tr key={line._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {line.employeeName} <span className="text-slate-400 font-mono text-[10px]">({line.employeeCode})</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800">Rs. {(line.grossSalary || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">Rs. {(line.basicSalary || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">Rs. {(line.hra || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">Rs. {(line.medicalAllowance || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono text-red-600">Rs. {(line.attendanceDeductions || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">Rs. {(line.taxWithheld || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">Rs. {(line.netSalary || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => setSelectedPayslip(line)}>
                            <FileText className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Slip
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: MY PERSONAL PAYSLIP */}
      {activeTab === 'me' && (
        <Card className="overflow-hidden border border-slate-200">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Your Personal Finalized Payslips</h3>
            <p className="text-xs text-slate-400">Monthly slips linked to your user account profile</p>
          </div>

          {myPayslips.length === 0 ? (
            <EmptyState
              title="No personal payslips available"
              description="No payslip records are currently linked to your user ID."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Gross Salary</th>
                    <th className="py-3 px-4">Deductions</th>
                    <th className="py-3 px-4">Tax Withheld</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myPayslips.map((ps) => (
                    <tr key={ps._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 font-mono">{ps.month}/{ps.year}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">Rs. {(ps.grossSalary || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono text-red-600">
                        Rs. {((ps.attendanceDeductions || 0) + (ps.unpaidLeaveDeductions || 0)).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">Rs. {(ps.taxWithheld || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">Rs. {(ps.netSalary || 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <Badge variant={ps.status === 'FINALIZED' ? 'success' : 'warning'}>{ps.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button size="sm" variant="outline" onClick={() => setSelectedPayslip(ps)}>
                          <FileText className="w-3.5 h-3.5 mr-1 text-indigo-600" /> View & PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Shared Payslip Modal */}
      <PayslipModal payslip={selectedPayslip} onClose={() => setSelectedPayslip(null)} />

      {/* Modal: Generate Individual Payslip */}
      <Modal
        isOpen={isIndivModalOpen}
        onClose={() => setIsIndivModalOpen(false)}
        title="Generate Individual Employee Payslip"
        description="Select an employee to calculate their personal attendance, deductions, and tax withholding"
        maxWidth="md"
      >
        <form onSubmit={handleGenerateIndividual} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Select Employee</label>
            <Select
              options={[
                { value: '', label: 'Choose an Employee...' },
                ...employees.map((e) => ({
                  value: e._id,
                  label: `${e.employeeCode} - ${e.firstName} ${e.lastName}`,
                })),
              ]}
              value={indivEmployeeId}
              onChange={(e) => setIndivEmployeeId(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Month"
              options={[
                { value: 1, label: 'January' },
                { value: 2, label: 'February' },
                { value: 3, label: 'March' },
                { value: 4, label: 'April' },
                { value: 5, label: 'May' },
                { value: 6, label: 'June' },
                { value: 7, label: 'July' },
                { value: 8, label: 'August' },
                { value: 9, label: 'September' },
                { value: 10, label: 'October' },
                { value: 11, label: 'November' },
                { value: 12, label: 'December' },
              ]}
              value={indivMonth}
              onChange={(e) => setIndivMonth(Number(e.target.value))}
            />
            <Input
              label="Year"
              type="number"
              value={String(indivYear)}
              onChange={(e) => setIndivYear(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Status</label>
            <Select
              options={[
                { value: 'FINALIZED', label: 'FINALIZED (Immediately visible to employee)' },
                { value: 'DRAFT', label: 'DRAFT (Provisional preview)' },
              ]}
              value={indivStatus}
              onChange={(e) => setIndivStatus(e.target.value as any)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsIndivModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading} leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
              Calculate & Generate Slip
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Generate Batch Draft */}
      <Modal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        title="Generate Batch Payroll Draft"
        description="Calculates attendance records, unexcused absences, half-days, and 5-tier tax withholding for entire company"
      >
        <form onSubmit={handleCreateDraft} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Month"
              options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Month ${i + 1}` }))}
              value={batchMonth}
              onChange={(e) => setBatchMonth(Number(e.target.value))}
            />
            <Input
              label="Year"
              type="number"
              value={String(batchYear)}
              onChange={(e) => setBatchYear(Number(e.target.value))}
            />
          </div>

          <Input
            label="Notes"
            value={batchNotes}
            onChange={(e) => setBatchNotes(e.target.value)}
            placeholder="e.g. October 2026 payroll run"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsDraftModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Calculate Draft
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
