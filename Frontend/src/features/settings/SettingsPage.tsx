import React, { useEffect, useState } from 'react';
import { organizationApi } from '../../api/organization.api';
import { useToast } from '../../context/ToastContext';
import { CompanySettings, Department, Designation, Holiday } from '../../types/organization';
import {
  Clock,
  Building,
  Briefcase,
  Calendar,
  UserPlus,
  Trash2,
  Plus,
  Save,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';

export const SettingsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // New dept / designation / holiday / HR state
  const [newDept, setNewDept] = useState({ name: '', code: '' });
  const [newDesig, setNewDesig] = useState({ title: '', code: '', departmentId: '' });
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '' });
  const [newHR, setNewHR] = useState({ email: '', password: '' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [settRes, deptRes, desigRes, holiRes] = await Promise.all([
        organizationApi.getSettings().catch(() => ({ data: null })),
        organizationApi.getDepartments().catch(() => ({ data: [] })),
        organizationApi.getDesignations().catch(() => ({ data: [] })),
        organizationApi.getHolidays().catch(() => ({ data: [] })),
      ]);

      if (settRes.data) {
        setSettings(settRes.data);
      } else {
        setSettings({
          _id: '',
          name: '',
          email: '',
          officeStartTime: '09:00',
          officeEndTime: '18:00',
          gracePeriodMinutes: 15,
          halfDayThresholdHours: 5,
          weekendDays: [0, 6],
          attendanceRadiusMeters: 500,
          timezone: 'Asia/Karachi',
        });
      }
      setDepartments(deptRes.data || []);
      setDesignations(desigRes.data || []);
      setHolidays(holiRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setActionLoading(true);
    try {
      await organizationApi.updateSettings({
        name: settings.name,
        officeStartTime: settings.officeStartTime,
        officeEndTime: settings.officeEndTime,
        gracePeriodMinutes: Number(settings.gracePeriodMinutes),
        halfDayThresholdHours: Number(settings.halfDayThresholdHours),
      });
      success('Organization timings updated.');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.name || !newDept.code) return;
    try {
      await organizationApi.createDepartment(newDept);
      success('Department added.');
      setNewDept({ name: '', code: '' });
      fetchAll();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to add department.');
    }
  };

  const handleDeleteDept = async (id: string) => {
    try {
      await organizationApi.deleteDepartment(id);
      success('Department deleted.');
      fetchAll();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const handleAddDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesig.title || !newDesig.code) return;
    try {
      await organizationApi.createDesignation({
        title: newDesig.title,
        code: newDesig.code,
        departmentId: newDesig.departmentId || undefined,
      });
      success('Designation added.');
      setNewDesig({ title: '', code: '', departmentId: '' });
      fetchAll();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to add designation.');
    }
  };

  const handleDeleteDesignation = async (id: string) => {
    try {
      await organizationApi.deleteDesignation(id);
      success('Designation deleted.');
      fetchAll();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete designation.');
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.name || !newHoliday.date) return;
    try {
      await organizationApi.createHoliday(newHoliday);
      success('Holiday added.');
      setNewHoliday({ name: '', date: '' });
      fetchAll();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to add holiday.');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await organizationApi.deleteHoliday(id);
      success('Holiday removed.');
      fetchAll();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const handleCreateHR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHR.email || !newHR.password) return;
    try {
      await organizationApi.createHR(newHR);
      success(`HR Account created for ${newHR.email}!`);
      setNewHR({ email: '', password: '' });
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to create HR account.');
    }
  };

  if (loading || !settings) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Organization Configuration</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage office work hours, departments, job designations, and public holidays</p>
      </div>

      {/* Office Timings & Company Profile */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-700" /> Office Timings & Attendance Rules
        </h3>
        <p className="text-xs text-slate-400 mb-5">Rules applied automatically by the backend check-in engine</p>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            />
            <Input label="Company Email" disabled value={settings.email || ''} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Office Start Time"
              type="time"
              value={settings.officeStartTime}
              onChange={(e) => setSettings({ ...settings, officeStartTime: e.target.value })}
            />
            <Input
              label="Office End Time"
              type="time"
              value={settings.officeEndTime}
              onChange={(e) => setSettings({ ...settings, officeEndTime: e.target.value })}
            />
            <Input
              label="Grace Period (Minutes)"
              type="number"
              value={String(settings.gracePeriodMinutes)}
              onChange={(e) => setSettings({ ...settings, gracePeriodMinutes: Number(e.target.value) })}
            />
            <Input
              label="Half-Day Min (Hours)"
              type="number"
              value={String(settings.halfDayThresholdHours)}
              onChange={(e) => setSettings({ ...settings, halfDayThresholdHours: Number(e.target.value) })}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" variant="primary" type="submit" isLoading={actionLoading} leftIcon={<Save className="w-3.5 h-3.5" />}>
              Save Timing Rules
            </Button>
          </div>
        </form>
      </Card>

      {/* Departments & Designations in 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-700" /> Departments
          </h3>
          <p className="text-xs text-slate-400 mb-4">Organizational branches</p>

          <form onSubmit={handleAddDept} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Name (e.g. Engineering)"
              className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              value={newDept.name}
              onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Code (ENG)"
              className="w-20 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 uppercase focus:outline-none"
              value={newDept.code}
              onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
              required
            />
            <Button size="sm" variant="outline" type="submit">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </form>

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {departments.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No departments created yet.</div>
            ) : (
              departments.map((d) => (
                <div key={d._id} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {d.name} <span className="text-slate-400 font-mono text-[11px]">({d.code})</span>
                  </span>
                  <button onClick={() => handleDeleteDept(d._id)} className="text-slate-400 hover:text-red-600 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Designations */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-700" /> Job Designations
          </h3>
          <p className="text-xs text-slate-400 mb-4">Roles and job titles</p>

          <form onSubmit={handleAddDesignation} className="space-y-2 mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Title (e.g. Software Engineer)"
                className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                value={newDesig.title}
                onChange={(e) => setNewDesig({ ...newDesig, title: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Code (SE)"
                className="w-20 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 uppercase focus:outline-none"
                value={newDesig.code}
                onChange={(e) => setNewDesig({ ...newDesig, code: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2">
              <select
                className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none bg-white"
                value={newDesig.departmentId}
                onChange={(e) => setNewDesig({ ...newDesig, departmentId: e.target.value })}
              >
                <option value="">Department (Optional)</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <Button size="sm" variant="outline" type="submit">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>
          </form>

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {designations.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No designations created yet.</div>
            ) : (
              designations.map((des) => (
                <div key={des._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{des.title}</span>
                    <span className="text-slate-400 font-mono text-[11px] ml-1">({des.code})</span>
                  </div>
                  <button onClick={() => handleDeleteDesignation(des._id)} className="text-slate-400 hover:text-red-600 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Public Holidays & HR Account */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Public Holidays */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-700" /> Public Holidays
          </h3>
          <p className="text-xs text-slate-400 mb-4">Excluded from working days</p>

          <form onSubmit={handleAddHoliday} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Holiday Name"
              className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              value={newHoliday.name}
              onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
            />
            <input
              type="date"
              className="w-32 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
            />
            <Button size="sm" variant="outline" type="submit">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </form>

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {holidays.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No holidays registered.</div>
            ) : (
              holidays.map((h) => (
                <div key={h._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{h.name}</span>
                    <span className="text-slate-400 block text-[10px]">{h.date}</span>
                  </div>
                  <button onClick={() => handleDeleteHoliday(h._id)} className="text-slate-400 hover:text-red-600 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Create HR Account */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-700" /> Create HR Manager
          </h3>
          <p className="text-xs text-slate-400 mb-4">Assigns the HR management role</p>

          <form onSubmit={handleCreateHR} className="space-y-3">
            <Input
              placeholder="hr.manager@domain.com"
              type="email"
              required
              value={newHR.email}
              onChange={(e) => setNewHR({ ...newHR, email: e.target.value })}
            />
            <Input
              placeholder="Password (min 6 chars)"
              type="password"
              required
              value={newHR.password}
              onChange={(e) => setNewHR({ ...newHR, password: e.target.value })}
            />
            <Button size="sm" variant="primary" type="submit" className="w-full">
              Create HR User
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
