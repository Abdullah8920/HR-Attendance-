import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsApi } from '../../api/analytics.api';
import { attendanceApi } from '../../api/attendance.api';
import { announcementApi } from '../../api/announcement.api';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  CalendarCheck,
  CalendarDays,
  Clock,
  Play,
  Square,
  Banknote,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Bell,
  FileText,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowUpRight,
  DollarSign,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user, role } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [hrData, setHrData] = useState<any>(null);
  const [empData, setEmpData] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (role === 'ADMIN') {
        const [res, ann] = await Promise.all([
          analyticsApi.getAdminAnalytics(),
          announcementApi.getAnnouncements().catch(() => ({ data: [] })),
        ]);
        setAdminData(res.data);
        setAnnouncements(ann.data || []);
      } else if (role === 'HR') {
        const [res, ann] = await Promise.all([
          analyticsApi.getHRAnalytics(),
          announcementApi.getAnnouncements().catch(() => ({ data: [] })),
        ]);
        setHrData(res.data);
        setAnnouncements(ann.data || []);
      } else {
        const [res, ann] = await Promise.all([
          analyticsApi.getEmployeeAnalytics(),
          announcementApi.getAnnouncements().catch(() => ({ data: [] })),
        ]);
        setEmpData(res.data);
        setAnnouncements(ann.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  // Employee Check-In / Check-Out
  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceApi.checkIn();
      success(res.message || 'Checked in successfully!');
      fetchDashboardData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Check-in failed or already checked in.';
      toastError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceApi.checkOut();
      success(res.message || 'Checked out successfully!');
      fetchDashboardData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Check-out failed.';
      toastError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ======================================================================
  // 1. EMPLOYEE DASHBOARD (Self-Service View)
  // Reduced: NO company headcount, NO company payroll, NO company charts,
  //          NO pending approvals for others.
  // Included: Check-In/Out Punch, Personal Weekly Hours, Leave Quotas,
  //           Recent Attendance Logs, Latest Payslip, Announcements.
  // ======================================================================
  if (role === 'EMPLOYEE') {
    const data = empData || {};
    const profile = data.profile || {};
    const today = data.today || data.todayCheckIn || {};
    const isCheckedIn = Boolean(today.isCheckedIn || today.checkIn);
    const isCheckedOut = Boolean(today.isCheckedOut || today.checkOut);
    const weeklyHours = data.weeklyHours ?? data.hoursWorkedThisWeek ?? 0;
    const lateArrivals = data.lateArrivalsCount ?? 0;
    const leaveBalances = data.leaveBalances || [];
    const recentAttendance = data.recentAttendance || [];
    const lastPayslip = data.lastPayslip || null;

    const empName = profile.firstName
      ? `${profile.firstName} ${profile.lastName}`
      : user?.email?.split('@')[0];

    const departmentName = profile.departmentId?.name || 'Engineering';
    const designationTitle = profile.designationId?.title || 'Staff Member';

    return (
      <div className="space-y-6">
        {/* Welcome & Live Punch Card */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[11px] font-semibold border border-indigo-400/20">
                Employee Portal
              </span>
              <span className="text-xs text-indigo-200 font-mono">
                {profile.employeeCode ? `#${profile.employeeCode}` : ''}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Welcome back, {empName}
            </h2>
            <p className="text-xs text-indigo-200 mt-1">
              {designationTitle} &bull; {departmentName} &bull; {user?.email}
            </p>
          </div>

          {/* Punch Button & Live Status */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 flex items-center gap-4">
            <div>
              <span className="text-[11px] text-indigo-200 font-medium block">Today's Attendance</span>
              <span className="text-sm font-bold text-white block">
                {today.status === 'PRESENT'
                  ? 'Active / Present'
                  : today.status === 'LATE'
                  ? 'Present (Late)'
                  : isCheckedIn && !isCheckedOut
                  ? 'Checked In'
                  : isCheckedOut
                  ? 'Checked Out'
                  : 'Not Checked In'}
              </span>
              <span className="text-[10px] text-indigo-300">
                {today.checkIn
                  ? `In: ${new Date(today.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Shift starts 09:00 AM'}
                {today.checkOut
                  ? ` &bull; Out: ${new Date(today.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : ''}
              </span>
            </div>

            <div className="shrink-0">
              {!isCheckedIn ? (
                <Button
                  variant="primary"
                  className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold shadow-md"
                  leftIcon={<Play className="w-4 h-4 text-indigo-600" />}
                  onClick={handleCheckIn}
                  isLoading={actionLoading}
                >
                  Check In Now
                </Button>
              ) : !isCheckedOut ? (
                <Button
                  variant="secondary"
                  className="bg-rose-500 hover:bg-rose-600 text-white border-0 font-bold shadow-md"
                  leftIcon={<Square className="w-4 h-4 text-white" />}
                  onClick={handleCheckOut}
                  isLoading={actionLoading}
                >
                  Check Out
                </Button>
              ) : (
                <Badge variant="present" size="md" className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                  Completed Today
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* 4 Personal KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Today's Punch</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900">
              {today.status || 'Not Checked In'}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {today.checkIn
                ? `Logged at ${new Date(today.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Grace period: 15 mins'}
            </span>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Weekly Hours</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900">{weeklyHours} hrs</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Standard target: 40 hrs</span>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Late Arrivals</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900">{lateArrivals}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">This month</span>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Leave Balance</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold text-slate-900">
              {leaveBalances.find((b: any) => b.name?.toLowerCase().includes('casual'))?.remaining ?? 10} days
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Remaining Casual leave</span>
          </Card>
        </div>

        {/* 2 Main Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Recent Attendance Logs & Latest Payslip */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">My Recent Attendance</h3>
                  <p className="text-xs text-slate-400">Your recent punch-in and punch-out history</p>
                </div>
                <Link to="/attendance" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  View Full History <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                      <th className="py-2.5 px-3 rounded-l-lg">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Check-In</th>
                      <th className="py-2.5 px-3">Check-Out</th>
                      <th className="py-2.5 px-3 rounded-r-lg">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentAttendance.length > 0 ? (
                      recentAttendance.slice(0, 5).map((att: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-medium text-slate-800">{att.date}</td>
                          <td className="py-3 px-3">
                            <Badge variant={att.status}>{att.status}</Badge>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-mono">
                            {att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-mono">
                            {att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {att.workingMinutes ? `${Math.floor(att.workingMinutes / 60)}h ${att.workingMinutes % 60}m` : '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No attendance records found yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Latest Payslip Summary */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Latest Finalized Payslip</h3>
                  <p className="text-xs text-slate-400">Summary of your monthly compensation & deductions</p>
                </div>
                <Link to="/payroll" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  All Payslips <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {lastPayslip ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        Month: {lastPayslip.month}/{lastPayslip.year}
                      </span>
                      <Badge variant="finalized">Finalized</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-4">
                      <span>Gross: Rs. {lastPayslip.grossPay?.toLocaleString()}</span>
                      <span>Deductions: Rs. {lastPayslip.totalDeductions?.toLocaleString()}</span>
                      <span>Tax: Rs. {lastPayslip.taxWithheld?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Take Home Pay</span>
                    <span className="text-lg font-bold text-emerald-700">
                      Rs. {lastPayslip.netPay?.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl">
                  <Banknote className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No finalized payslips available yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Your monthly salary slip will appear here once finalized by HR & Finance</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Leave Quotas & Announcements */}
          <div className="space-y-6">
            {/* Leave Quotas */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Leave Balances</h3>
                <Link to="/leaves" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5">
                  Apply <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {leaveBalances.length > 0 ? (
                  leaveBalances.map((b: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{b.name}</div>
                        <div className="text-[10px] text-slate-500">Used: {b.used} of {b.quota} days</div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-indigo-700">{b.remaining}</span>
                        <span className="text-[10px] text-slate-400 block">available</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 text-center py-4">No leave quotas defined.</div>
                )}
              </div>

              <Link to="/leaves" className="block mt-4">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Request Time Off
                </Button>
              </Link>
            </Card>

            {/* Company Announcements */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-indigo-600" /> Announcements
                </h3>
                <Link to="/announcements" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {announcements.length > 0 ? (
                  announcements.slice(0, 3).map((a: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800 line-clamp-1">{a.title}</span>
                        <Badge variant="neutral" size="sm">{a.priority || 'Normal'}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{a.message || a.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 text-center py-4">
                    No active announcements today.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ======================================================================
  // 2. HR OPERATIONS DASHBOARD
  // Reduced: NO company-wide financial liability (monthly payroll cost),
  //          NO admin audit logs feed, NO settings.
  // Included: Headcount, Today Attendance stats, Attendance Chart,
  //           Pending leave approvals, Pending corrections, Draft payroll status.
  // ======================================================================
  if (role === 'HR') {
    const stats = hrData || {};
    const today = stats.today || {};
    const pendingItems = stats.pendingActionItems || {};

    const hrKpis = [
      {
        label: 'Total Headcount',
        value: stats.headcount || 0,
        subtext: 'Active workforce members',
        icon: <Users className="w-4 h-4 text-indigo-700" />,
        bg: 'bg-indigo-50',
      },
      {
        label: 'Present Today',
        value: today.present || 0,
        subtext: 'Punched in on time',
        icon: <CalendarCheck className="w-4 h-4 text-emerald-700" />,
        bg: 'bg-emerald-50',
      },
      {
        label: 'On Leave Today',
        value: today.onLeave || 0,
        subtext: 'Approved time off',
        icon: <CalendarDays className="w-4 h-4 text-purple-700" />,
        bg: 'bg-purple-50',
      },
      {
        label: 'Late Arrivals',
        value: today.late || 0,
        subtext: 'Arrived after grace time',
        icon: <Clock className="w-4 h-4 text-amber-700" />,
        bg: 'bg-amber-50',
      },
    ];

    const chartData = [
      { name: 'Present', count: today.present || 0, fill: '#16A34A' },
      { name: 'Late', count: today.late || 0, fill: '#D97706' },
      { name: 'Half Day', count: today.halfDay || 0, fill: '#EA580C' },
      { name: 'On Leave', count: today.onLeave || 0, fill: '#8B5CF6' },
      { name: 'Absent', count: today.absent || 0, fill: '#DC2626' },
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                HR Workspace
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Workforce Operations & Attendance
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review daily presence, approve leave applications, and manage staff operations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/employees">
              <Button size="sm" variant="outline" leftIcon={<Users className="w-3.5 h-3.5" />}>
                Manage Employees
              </Button>
            </Link>
            <Link to="/leaves">
              <Button size="sm" variant="primary" leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Review Leaves ({pendingItems.pendingLeaves || 0})
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Main KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hrKpis.map((kpi, idx) => (
            <Card key={idx} className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                  {kpi.icon}
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{kpi.value}</div>
              <span className="text-[11px] text-slate-400 mt-1 block">{kpi.subtext}</span>
            </Card>
          ))}
        </div>

        {/* 2 Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section 1: Attendance Distribution Bar Chart */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Today's Attendance Overview</h3>
                <p className="text-xs text-slate-400">Real-time status breakdown for today</p>
              </div>
              <Badge variant="neutral">{today.date || new Date().toISOString().split('T')[0]}</Badge>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Section 2: Pending Action Items (HR Queue) */}
          <Card className="p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Pending HR Tasks</h3>
              <p className="text-xs text-slate-400 mb-4">Items requiring HR review or approval</p>

              <div className="space-y-3">
                <Link to="/leaves" className="block p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100/70 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">Pending Leave Requests</div>
                      <div className="text-[10px] text-slate-500">Awaiting supervisor decision</div>
                    </div>
                    <span className="text-base font-bold text-amber-700">
                      {pendingItems.pendingLeaves || 0}
                    </span>
                  </div>
                </Link>

                <Link to="/attendance" className="block p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 hover:bg-indigo-100/70 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">Attendance Corrections</div>
                      <div className="text-[10px] text-slate-500">Employee discrepancy submissions</div>
                    </div>
                    <span className="text-base font-bold text-indigo-700">
                      {pendingItems.pendingCorrections || 0}
                    </span>
                  </div>
                </Link>

                <Link to="/payroll" className="block p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">Monthly Payroll Draft</div>
                      <div className="text-[10px] text-slate-500">Generate & audit monthly payroll</div>
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {stats.latestPayrollDraft ? 'Draft Ready' : 'Review'}
                    </span>
                  </div>
                </Link>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Overall Presence</span>
              <span className="font-semibold text-emerald-600">
                {stats.headcount > 0 ? `${(((today.present || 0) + (today.late || 0)) / stats.headcount * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ======================================================================
  // 3. ADMIN EXECUTIVE DASHBOARD
  // Full executive control: headcount, attendance, payroll liability,
  //                         audit logs, and master settings shortcuts.
  // ======================================================================
  const stats = adminData || {};
  const today = stats.today || {};

  const adminKpis = [
    {
      label: 'Total Employees',
      value: stats.headcount || 0,
      subtext: `Attrition Rate: ${stats.attritionRate || '0%'}`,
      icon: <Users className="w-4 h-4 text-indigo-700" />,
      bg: 'bg-indigo-50',
    },
    {
      label: 'Present Today',
      value: today.present || 0,
      subtext: `Rate: ${today.attendanceRate || '0%'}`,
      icon: <CalendarCheck className="w-4 h-4 text-emerald-700" />,
      bg: 'bg-emerald-50',
    },
    {
      label: 'Monthly Payroll Liability',
      value: `Rs. ${(stats.monthlyPayrollCost || 0).toLocaleString()}`,
      subtext: `Avg: Rs. ${(stats.averageSalary || 0).toLocaleString()}`,
      icon: <DollarSign className="w-4 h-4 text-purple-700" />,
      bg: 'bg-purple-50',
    },
    {
      label: 'Late Arrivals',
      value: today.late || 0,
      subtext: `${today.onLeave || 0} on approved leave`,
      icon: <Clock className="w-4 h-4 text-amber-700" />,
      bg: 'bg-amber-50',
    },
  ];

  const chartData = [
    { name: 'Present', count: today.present || 0, fill: '#16A34A' },
    { name: 'Late', count: today.late || 0, fill: '#D97706' },
    { name: 'Half Day', count: today.halfDay || 0, fill: '#EA580C' },
    { name: 'On Leave', count: today.onLeave || 0, fill: '#8B5CF6' },
    { name: 'Absent', count: today.absent || 0, fill: '#DC2626' },
  ];

  const recentAudits = stats.recentAudits || [];

  return (
    <div className="space-y-6">
      {/* Executive Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-200">
              Executive Overview
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Company Executive Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Workforce attendance, payroll liability, compliance, and audit monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/settings">
            <Button size="sm" variant="outline">
              Org Settings
            </Button>
          </Link>
          <Link to="/payroll">
            <Button size="sm" variant="primary">
              Run & Finalize Payroll
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminKpis.map((kpi, idx) => (
          <Card key={idx} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                {kpi.icon}
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{kpi.value}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">{kpi.subtext}</span>
          </Card>
        ))}
      </div>

      {/* 2 Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: Attendance Overview Chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Workforce Attendance Breakdown</h3>
              <p className="text-xs text-slate-400">Today's company-wide presence metrics</p>
            </div>
            <Badge variant="neutral">{today.date || new Date().toISOString().split('T')[0]}</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #E2E8F0' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Section 2: Recent Audit Trail */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" /> Recent Audit Activity
              </h3>
              <Link to="/audit-logs" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                View All
              </Link>
            </div>
            <p className="text-xs text-slate-400 mb-4">Live security & compliance actions</p>

            <div className="space-y-2.5">
              {recentAudits.length > 0 ? (
                recentAudits.slice(0, 5).map((log: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Role: {log.role} &bull; Entity: {log.entityType}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-6">
                  No recent audit logs.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Attendance Rate</span>
            <span className="font-semibold text-emerald-600">{today.attendanceRate || '0%'}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
