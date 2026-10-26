import React, { useEffect, useState } from 'react';
import { employeeApi } from '../../api/employee.api';
import { organizationApi } from '../../api/organization.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Employee, CreateEmployeePayload } from '../../types/employee';
import { Department, Designation } from '../../types/organization';
import {
  Search,
  Plus,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export const EmployeeListPage: React.FC = () => {
  const { role } = useAuth();
  const { success, error: toastError } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addError, setAddError] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState<CreateEmployeePayload>({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    departmentId: '',
    designationId: '',
    joiningDate: new Date().toISOString().split('T')[0],
    basicSalary: 60000,
  });

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await employeeApi.getEmployees({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        departmentId: selectedDept || undefined,
      });
      setEmployees(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotal(res.pagination.total);
      }
    } catch (err: any) {
      setEmployees([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentsAndDesignations = async () => {
    try {
      const [deptRes, desigRes] = await Promise.all([
        organizationApi.getDepartments().catch(() => ({ data: [] })),
        organizationApi.getDesignations().catch(() => ({ data: [] })),
      ]);
      setDepartments(deptRes.data || []);
      setDesignations(desigRes.data || []);
    } catch {
      setDepartments([]);
      setDesignations([]);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, debouncedSearch, selectedDept]);

  useEffect(() => {
    fetchDepartmentsAndDesignations();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setAddError('');
    try {
      const payload: CreateEmployeePayload = {
        ...formData,
        departmentId: formData.departmentId || undefined,
        designationId: formData.designationId || undefined,
      };
      const res = await employeeApi.createEmployee(payload);
      success(`Employee created! Temporary password: ${res.data.temporaryPassword || 'Pass@1234'}`);
      setIsAddModalOpen(false);
      setFormData({
        employeeCode: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        departmentId: '',
        joiningDate: new Date().toISOString().split('T')[0],
        basicSalary: 60000,
      });
      fetchEmployees();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create employee.';
      setAddError(msg);
      toastError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await employeeApi.exportCsv();
      success('Employees CSV downloaded.');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Export failed.');
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;
    setActionLoading(true);
    try {
      const res = await employeeApi.importCsv(csvText);
      success(`Imported ${res.importedCount} employees!`);
      setIsImportModalOpen(false);
      setCsvText('');
      fetchEmployees();
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to import CSV.');
    } finally {
      setActionLoading(false);
    }
  };

  const canManage = role === 'ADMIN' || role === 'HR';

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Employee Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage personnel, profile records, and departmental assignments</p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={handleExportCsv}>
              Export
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Upload className="w-3.5 h-3.5" />} onClick={() => setIsImportModalOpen(true)}>
              Import
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => { setAddError(''); setIsAddModalOpen(true); }}>
              Add Employee
            </Button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by code, name, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              options={[{ value: '', label: 'All Departments' }, ...departments.map((d) => ({ value: d._id, label: d.name }))]}
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Employee Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <EmptyState
            title="No employees found"
            description="No employee records currently in the database. Add your first employee to get started."
            actionLabel={canManage ? 'Add Employee' : undefined}
            onAction={canManage ? () => setIsAddModalOpen(true) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => {
                  const dept =
                    typeof emp.departmentId === 'object' && emp.departmentId !== null
                      ? emp.departmentId?.name
                      : departments.find((d) => d._id === emp.departmentId)?.name || 'General';
                  const desig =
                    typeof emp.designationId === 'object' && emp.designationId !== null
                      ? emp.designationId?.title
                      : designations.find((d) => d._id === emp.designationId)?.title || 'Staff';

                  return (
                    <tr key={emp._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-100">
                            {emp.firstName?.[0]}
                            {emp.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{emp.employeeCode}</td>
                      <td className="py-3 px-4 text-slate-600">{dept || 'General'}</td>
                      <td className="py-3 px-4 text-slate-600">{desig || 'Staff'}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={emp.employmentStatus}>{emp.employmentStatus}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {page} of {totalPages} ({total} total employees)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Employee"
        description="Creates employee record, system login credentials, and salary structure"
        maxWidth="lg"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          {addError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {addError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Employee Code"
              required
              placeholder="EMP001"
              value={formData.employeeCode}
              onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
            />
            <Input
              label="First Name"
              required
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <Input
              label="Last Name"
              required
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              required
              placeholder="employee@domain.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone"
              placeholder="+92 300 1234567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Department"
              options={[
                { value: '', label: 'Select Department' },
                ...departments.map((d) => ({ value: d._id, label: d.name })),
                { value: 'IT', label: 'IT' },
                { value: 'Technical', label: 'Technical' },
                { value: 'Human Resource', label: 'Human Resource' },
              ]}
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            />

            <Select
              label="Designation"
              options={[
                { value: '', label: 'Select Designation' },
                ...designations.map((des) => ({ value: des._id, label: `${des.title} (${des.code})` })),
              ]}
              value={formData.designationId}
              onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Joining Date"
              type="date"
              required
              value={formData.joiningDate}
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
            />
            <Input
              label="Basic Salary (PKR)"
              type="number"
              value={String(formData.basicSalary)}
              onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
              helperText="Gross salary = Basic + 40% HRA + 10% Medical"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Register Employee
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Employees from CSV"
        description="Header format: employeeCode,firstName,lastName,email,joiningDate,basicSalary"
        maxWidth="lg"
      >
        <form onSubmit={handleImportCsv} className="space-y-4">
          <textarea
            className="w-full h-40 p-3 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338CA]/20 focus:border-[#4338CA]"
            placeholder={`employeeCode,firstName,lastName,email,joiningDate,basicSalary\nEMP001,John,Doe,john@domain.com,2026-01-01,65000`}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsImportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={actionLoading}>
              Upload & Import
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
