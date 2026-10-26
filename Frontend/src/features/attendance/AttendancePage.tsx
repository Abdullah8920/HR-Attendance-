import React, { useEffect, useState } from 'react';
import { attendanceApi } from '../../api/attendance.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DailyBoardResponse, AttendanceCorrection, AttendanceRecord } from '../../types/attendance';
import {
  CalendarCheck,
  Play,
  Square,
  CheckCircle,
  XCircle,
  Plus,
  Clock,
  Calendar,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export const AttendancePage: React.FC = () => {
  const { role } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'board' | 'corrections'>('board');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [boardData, setBoardData] = useState<DailyBoardResponse | null>(null);
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Check in/out loading
  const [actionLoading, setActionLoading] = useState(false);

  // Correction Modal
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    requestedCheckIn: '',
    requestedCheckOut: '',
    reason: '',
  });

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      if (role === 'EMPLOYEE') {
        const res = await attendanceApi.getMyAttendance().catch(() => ({ data: [] }));
        setMyRecords(res.data || []);
      } else {
        const res = await attendanceApi.getDailyBoard(date).catch(() => null);
        setBoardData(res);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCorrections = async () => {
    try {
      const res = await attendanceApi.getCorrections();
      setCorrections(res.data || []);
    } catch {
      setCorrections([]);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
    fetchCorrections();
  }, [date, role]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceApi.checkIn();
      success(res.message || 'Checked in successfully!');
      fetchAttendanceData();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceApi.checkOut();
      success(res.message || 'Checked out successfully!');
      fetchAttendanceData();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await attendanceApi.requestCorrection({
        date: correctionForm.date,
        requestedCheckIn: correctionForm.requestedCheckIn ? `${correctionForm.date}T${correctionForm.requestedCheckIn}:00.000Z` : undefined,
        requestedCheckOut: correctionForm.requestedCheckOut ? `${correctionForm.date}T${correctionForm.requestedCheckOut}:00.000Z` : undefined,
        reason: correctionForm.reason,
      });
      success('Attendance correction submitted successfully.');
      setIsCorrectionModalOpen(false);
      setCorrectionForm({
        date: new Date().toISOString().split('T')[0],
        requestedCheckIn: '',
        requestedCheckOut: '',
        reason: '',
      });
      fetchCorrections();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecideCorrection = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await attendanceApi.decideCorrection(id, { status: decision, comment: `Marked ${decision} by supervisor` });
      success(`Correction request ${decision.toLowerCase()}.`);
      fetchCorrections();
      fetchAttendanceData();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Decision update failed.');
    }
  };

  const isTodayPunchedIn = role === 'EMPLOYEE' && myRecords.some(r => r.date === new Date().toISOString().split('T')[0] && r.checkIn);
  const isTodayPunchedOut = role === 'EMPLOYEE' && myRecords.some(r => r.date === new Date().toISOString().split('T')[0] && r.checkOut);

  const filteredCompanyEmployees = (boardData?.employees || []).filter((e) => {
    if (!statusFilter) return true;
    return e.status === statusFilter;
  });

  const filteredMyRecords = myRecords.filter((r) => {
    if (!statusFilter) return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {role === 'EMPLOYEE' ? 'My Attendance & Punch Card' : 'Company Attendance Management'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {role === 'EMPLOYEE'
              ? 'Log your daily check-in/out and review your personal attendance logs'
              : 'Review daily presence, late arrivals, and decide on correction requests'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {role === 'EMPLOYEE' ? (
            <>
              {!isTodayPunchedIn ? (
                <Button size="sm" variant="primary" leftIcon={<Play className="w-3.5 h-3.5" />} onClick={handleCheckIn} isLoading={actionLoading}>
                  Check In
                </Button>
              ) : !isTodayPunchedOut ? (
                <Button size="sm" variant="secondary" className="border border-slate-200 text-rose-600 hover:bg-rose-50" leftIcon={<Square className="w-3.5 h-3.5 text-rose-600" />} onClick={handleCheckOut} isLoading={actionLoading}>
                  Check Out
                </Button>
              ) : (
                <Badge variant="present" size="md">
                  Punched Out Today
                </Badge>
              )}
            </>
          ) : (
            <>
              <Button size="sm" variant="primary" leftIcon={<Play className="w-3.5 h-3.5" />} onClick={handleCheckIn} isLoading={actionLoading}>
                Check In
              </Button>
              <Button size="sm" variant="secondary" className="border border-slate-200 text-slate-700" leftIcon={<Square className="w-3.5 h-3.5 text-red-600" />} onClick={handleCheckOut} isLoading={actionLoading}>
                Check Out
              </Button>
            </>
          )}

          <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsCorrectionModalOpen(true)}>
            Request Correction
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('board')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'board' ? 'border-[#4338CA] text-[#4338CA]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {role === 'EMPLOYEE' ? 'My Attendance Logs' : 'Daily Attendance Board'}
        </button>
        <button
          onClick={() => setActiveTab('corrections')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'corrections' ? 'border-[#4338CA] text-[#4338CA]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>{role === 'EMPLOYEE' ? 'My Correction Requests' : 'Correction Requests'}</span>
          {corrections.filter((c) => c.status === 'PENDING').length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {corrections.filter((c) => c.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'board' ? (
        <div className="space-y-4">
          {/* Summary Strip */}
          {role === 'EMPLOYEE' ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Card className="p-3 text-center">
                <span className="text-[11px] text-slate-400 font-medium block">Total Recorded</span>
                <span className="text-lg font-bold text-slate-800">{myRecords.length} days</span>
              </Card>
              <Card className="p-3 text-center bg-green-50/50 border-green-100">
                <span className="text-[11px] text-green-700 font-medium block">Present</span>
                <span className="text-lg font-bold text-green-800">
                  {myRecords.filter((r) => r.status === 'PRESENT').length}
                </span>
              </Card>
              <Card className="p-3 text-center bg-amber-50/50 border-amber-100">
                <span className="text-[11px] text-amber-700 font-medium block">Late</span>
                <span className="text-lg font-bold text-amber-800">
                  {myRecords.filter((r) => r.status === 'LATE').length}
                </span>
              </Card>
              <Card className="p-3 text-center bg-orange-50/50 border-orange-100">
                <span className="text-[11px] text-orange-700 font-medium block">Half Day</span>
                <span className="text-lg font-bold text-orange-800">
                  {myRecords.filter((r) => r.status === 'HALF_DAY').length}
                </span>
              </Card>
              <Card className="p-3 text-center bg-purple-50/50 border-purple-100">
                <span className="text-[11px] text-purple-700 font-medium block">Total Hours</span>
                <span className="text-lg font-bold text-purple-800">
                  {Math.round(myRecords.reduce((acc, r) => acc + (r.workingMinutes || 0), 0) / 60)} hrs
                </span>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <Card className="p-3 text-center">
                <span className="text-[11px] text-slate-400 font-medium block">Total</span>
                <span className="text-lg font-bold text-slate-800">{boardData?.summary?.total || 0}</span>
              </Card>
              <Card className="p-3 text-center bg-green-50/50 border-green-100">
                <span className="text-[11px] text-green-700 font-medium block">Present</span>
                <span className="text-lg font-bold text-green-800">{boardData?.summary?.present || 0}</span>
              </Card>
              <Card className="p-3 text-center bg-amber-50/50 border-amber-100">
                <span className="text-[11px] text-amber-700 font-medium block">Late</span>
                <span className="text-lg font-bold text-amber-800">{boardData?.summary?.late || 0}</span>
              </Card>
              <Card className="p-3 text-center bg-orange-50/50 border-orange-100">
                <span className="text-[11px] text-orange-700 font-medium block">Half Day</span>
                <span className="text-lg font-bold text-orange-800">{boardData?.summary?.halfDay || 0}</span>
              </Card>
              <Card className="p-3 text-center bg-purple-50/50 border-purple-100">
                <span className="text-[11px] text-purple-700 font-medium block">On Leave</span>
                <span className="text-lg font-bold text-purple-800">{boardData?.summary?.onLeave || 0}</span>
              </Card>
              <Card className="p-3 text-center bg-red-50/50 border-red-100">
                <span className="text-[11px] text-red-700 font-medium block">Absent</span>
                <span className="text-lg font-bold text-red-800">{boardData?.summary?.absent || 0}</span>
              </Card>
            </div>
          )}

          {/* Filter Row */}
          <Card className="p-3 flex flex-wrap items-center justify-between gap-3">
            {role !== 'EMPLOYEE' && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">Select Date:</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>
          </Card>

          {/* Table */}
          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : role === 'EMPLOYEE' ? (
              filteredMyRecords.length === 0 ? (
                <EmptyState
                  title="No attendance records found"
                  description="You have no recorded attendance entries matching your filter."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Check-In</th>
                        <th className="py-3 px-4">Check-Out</th>
                        <th className="py-3 px-4">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMyRecords.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-medium text-slate-800">{r.date}</td>
                          <td className="py-3 px-4">
                            <Badge variant={r.status}>{r.status}</Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-mono">
                            {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-mono">
                            {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {r.workingMinutes ? `${Math.floor(r.workingMinutes / 60)}h ${r.workingMinutes % 60}m` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : filteredCompanyEmployees.length === 0 ? (
              <EmptyState
                title="No attendance records"
                description={`No attendance records found for ${date}.`}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Check-In</th>
                      <th className="py-3 px-4">Check-Out</th>
                      <th className="py-3 px-4">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCompanyEmployees.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {item.employee.name}
                          <span className="text-slate-400 font-mono ml-2 text-[11px]">({item.employee.code})</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.employee.department || '—'}</td>
                        <td className="py-3 px-4">
                          <Badge variant={item.status}>{item.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.checkIn ? new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.checkOut ? new Date(item.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.workingMinutes ? `${Math.floor(item.workingMinutes / 60)}h ${item.workingMinutes % 60}m` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* Correction Requests Tab */
        <Card className="overflow-hidden">
          {corrections.length === 0 ? (
            <EmptyState
              title="No correction requests"
              description="No attendance discrepancy correction requests submitted."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    {(role === 'ADMIN' || role === 'HR') && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {corrections.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {c.employeeId?.firstName} {c.employeeId?.lastName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{c.date}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{c.reason}</td>
                      <td className="py-3 px-4">
                        <Badge variant={c.status}>{c.status}</Badge>
                      </td>
                      {(role === 'ADMIN' || role === 'HR') && (
                        <td className="py-3 px-4 text-right">
                          {c.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDecideCorrection(c._id, 'APPROVED')}
                                className="text-green-600 hover:text-green-800 font-semibold text-xs flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleDecideCorrection(c._id, 'REJECTED')}
                                className="text-red-600 hover:text-red-800 font-semibold text-xs flex items-center gap-1 ml-2"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Decided</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Correction Request Modal */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="Submit Attendance Correction"
        description="Provide reason and requested check-in/out times"
      >
        <form onSubmit={handleSubmitCorrection} className="space-y-4">
          <Input
            label="Date"
            type="date"
            required
            value={correctionForm.date}
            onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Requested Check-In"
              type="time"
              value={correctionForm.requestedCheckIn}
              onChange={(e) => setCorrectionForm({ ...correctionForm, requestedCheckIn: e.target.value })}
            />
            <Input
              label="Requested Check-Out"
              type="time"
              value={correctionForm.requestedCheckOut}
              onChange={(e) => setCorrectionForm({ ...correctionForm, requestedCheckOut: e.target.value })}
            />
          </div>

          <Input
            label="Reason"
            required
            placeholder="e.g. Missed punch due to server network issue"
            value={correctionForm.reason}
            onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsCorrectionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
