import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../context/ToastContext';
import { Building2, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const SetupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    companyName: 'Saylani Welfare Trust',
    companyEmail: 'info@saylani.org',
    adminEmail: 'admin@saylanihcm.com',
    adminPassword: 'AdminPassword123!',
    officeStartTime: '09:00',
    officeEndTime: '18:00',
    gracePeriodMinutes: 15,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authApi.setup({
        ...formData,
        gracePeriodMinutes: Number(formData.gracePeriodMinutes),
      });
      success('Organization setup completed! Please login with your admin credentials.');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Setup failed. The system might already be initialized.';
      setError(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-[#4338CA] items-center justify-center text-white shadow-md mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">First-Time Setup</h2>
        <p className="mt-1 text-xs text-slate-500">Initialize company settings and create the primary administrator</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-card rounded-2xl border border-slate-200">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                name="companyName"
                required
                value={formData.companyName}
                onChange={handleChange}
              />
              <Input
                label="Company Email"
                name="companyEmail"
                type="email"
                required
                value={formData.companyEmail}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Admin Email"
                name="adminEmail"
                type="email"
                required
                value={formData.adminEmail}
                onChange={handleChange}
              />
              <Input
                label="Admin Password"
                name="adminPassword"
                type="password"
                required
                value={formData.adminPassword}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Office Start"
                name="officeStartTime"
                type="time"
                value={formData.officeStartTime}
                onChange={handleChange}
              />
              <Input
                label="Office End"
                name="officeEndTime"
                type="time"
                value={formData.officeEndTime}
                onChange={handleChange}
              />
              <Input
                label="Grace (Min)"
                name="gracePeriodMinutes"
                type="number"
                value={String(formData.gracePeriodMinutes)}
                onChange={handleChange}
              />
            </div>

            <Button type="submit" variant="primary" className="w-full mt-4" isLoading={isLoading}>
              Complete Setup & Create Company
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="inline-flex items-center text-xs text-slate-500 hover:text-indigo-600">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
