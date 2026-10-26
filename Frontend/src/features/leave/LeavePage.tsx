import React, { useEffect, useState } from 'react';
import { leaveApi } from '../../api/leave.api';
import { organizationApi } from '../../api/organization.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LeaveBalance, LeaveRequest } from '../../types/leave';
import { LeaveType } from '../../types/organization';
import {
  CalendarDays,
  Plus,
  CheckCircle,
  XCircle,
  Ban,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export const LeavePage: React.FC = () => {
  const { role } = useAuth();
  const { success, error: toastError } = useToast();

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchLeaveData = async () => {
    setLoading(true);
    try {
      const typesRes = await organizationApi.getLeaveTypes().catch(() => ({ data: [] }));
      setLeaveTypes(typesRes.data);

      if (role === 'EMPLOYEE') {
        const [balRes, myLeavesRes] = await Promise.all([
          leaveApi.getMyBalances().catch(() => ({ data: [] })),
          leaveApi.getMyLeaves().catch(() => ({ data: [] })),
        ]);
        setBalances(balRes.data);
        setLeaves(myLeavesRes.data);
      } else {
        // ADMIN / HR: No personal employee balance; fetch all company leave requests
        setBalances([]);
        const listRes = await leaveApi.getAllLeaves().catch(() => ({ data: [] }));
        setLeaves(listRes.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, [role]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await leaveApi.applyLeave(formData);
      success('Leave application submitted!');
      setIsApplyModalOpen(false);
      setFormData({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      fetchLeaveData();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to submit leave.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecide = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await leaveApi.decideLeave(id, { status, comment: `Decision recorded as ${status}` });
      success(`Leave ${status.toLowerCase()}.`);
      fetchLeaveData();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Decision failed.');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await leaveApi.cancelLeave(id);
      success('Leave request cancelled.');
      fetchLeaveData();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Leave Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Annual leave quotas, employee applications, and approvals</p>
        </div>

        <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsApplyModalOpen(true)}>
          Apply for Leave
        </Button>
      </div>

      {/* Leave Balances Cards */}
      {balances.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {balances.map((b) => (
            <Card key={b.leaveTypeId} className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">{b.name}</span>
                <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {b.code}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{b.remainingDays}</span>
                <span className="text-xs text-slate-400">/ {b.isPaid ? `${b.annualQuota} annual` : 'unlimited'}</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">Used: {b.usedDays} days</div>
            </Card>
          ))}
        </div>
      )}

      {/* Leave History & Approvals Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            {role === 'ADMIN' || role === 'HR' ? 'Company Leave Requests' : 'My Leave Applications'}
          </h3>
          <span className="text-xs text-slate-400">{leaves.length} records</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : leaves.length === 0 ? (
          <EmptyState
            title="No leave requests"
            description="No leave applications submitted yet."
            actionLabel="Apply for Leave"
            onAction={() => setIsApplyModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Date Range</th>
                  <th className="py-3 px-4">Working Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {l.employeeId?.firstName} {l.employeeId?.lastName}
                      <span className="text-slate-400 font-mono ml-1 text-[11px]">({l.employeeId?.employeeCode})</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{l.leaveTypeId?.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {l.startDate} → {l.endDate}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">{l.daysCount} d</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{l.reason}</td>
                    <td className="py-3 px-4">
                      <Badge variant={l.status}>{l.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {(role === 'ADMIN' || role === 'HR') && l.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDecide(l._id, 'APPROVED')}
                            className="text-green-600 hover:text-green-800 font-semibold text-xs flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleDecide(l._id, 'REJECTED')}
                            className="text-red-600 hover:text-red-800 font-semibold text-xs flex items-center gap-1 ml-2"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : l.status === 'PENDING' && role === 'EMPLOYEE' ? (
                        <button
                          onClick={() => handleCancel(l._id)}
                          className="text-slate-500 hover:text-red-600 font-medium text-xs flex items-center gap-1 ml-auto"
                        >
                          <Ban className="w-3.5 h-3.5" /> Cancel
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Leave"
        description="Select leave type, date range, and reason. Working days exclude weekends and holidays."
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <Select
            label="Leave Type"
            required
            options={[
              { value: '', label: 'Select Leave Type' },
              ...leaveTypes.map((t) => ({ value: t._id, label: `${t.name} (${t.annualQuota} days)` })),
            ]}
            value={formData.leaveTypeId}
            onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <Input
            label="Reason for Leave"
            required
            placeholder="e.g. Urgent family matter / medical recovery"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
