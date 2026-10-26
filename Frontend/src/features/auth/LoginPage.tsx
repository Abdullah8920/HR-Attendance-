import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/auth.api';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, User, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface DemoAccount {
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
  email: string;
  password: string;
  label: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
}

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'HR' | 'EMPLOYEE' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const demoAccounts: DemoAccount[] = [
    {
      role: 'ADMIN',
      email: 'admin@saylanihcm.com',
      password: 'AdminPassword123!',
      label: 'Admin',
      badge: 'Full Access',
      description: 'Executive overview, company settings, audit logs & finalize payroll',
      icon: <ShieldCheck className="w-4 h-4 text-indigo-600" />,
    },
    {
      role: 'HR',
      email: 'hr@saylanihcm.com',
      password: 'HrPassword123!',
      label: 'HR Manager',
      badge: 'Operations',
      description: 'Manage staff, approve leaves, daily attendance board & payroll drafts',
      icon: <UserCheck className="w-4 h-4 text-emerald-600" />,
    },
    {
      role: 'EMPLOYEE',
      email: 'employee@saylanihcm.com',
      password: 'EmployeePassword123!',
      label: 'Employee',
      badge: 'Self-Service',
      description: 'Hamza Khan: daily punch in/out, view personal payslips & apply leaves',
      icon: <User className="w-4 h-4 text-purple-600" />,
    },
  ];

  const handleSelectDemo = (acc: DemoAccount) => {
    setSelectedRole(acc.role);
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  const handleQuickLogin = async (acc: DemoAccount) => {
    setSelectedRole(acc.role);
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    setIsLoading(true);

    try {
      await login(acc.email, acc.password);
      sessionStorage.setItem(
        'hcm_login_alert',
        JSON.stringify({ role: acc.role, email: acc.email })
      );
      success(`Logged in as ${acc.label}!`);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials or initialize accounts.';
      setError(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      sessionStorage.setItem(
        'hcm_login_alert',
        JSON.stringify({ role: selectedRole || 'USER', email })
      );
      success('Logged in successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedAccounts = async () => {
    setIsSeeding(true);
    try {
      await authApi.seedDemo();
      success('Admin, HR, and Employee demo accounts seeded successfully!');
      setError('');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to seed accounts.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4338CA] to-[#8B5CF6] items-center justify-center text-white shadow-md mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight"> HCM Enterprise</h2>
        <p className="mt-1 text-xs text-slate-500">Sign in to your role-based Human Capital Workspace</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-7 px-6 sm:px-8 shadow-card rounded-2xl border border-slate-200">

          {/* Quick Role Switcher Pills */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Select Role to Sign In
              </span>
              <span className="text-[10px] text-slate-400">Click to fill credentials</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((acc) => {
                const isSelected = selectedRole === acc.role;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center ${isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                  >
                    <div className="mb-1">{acc.icon}</div>
                    <span className="text-xs font-bold text-slate-800 leading-tight">{acc.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{acc.badge}</span>
                  </button>
                );
              })}
            </div>

            {selectedRole && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    {demoAccounts.find((d) => d.role === selectedRole)?.label} Permissions:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {demoAccounts.find((d) => d.role === selectedRole)?.description}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  className="shrink-0 ml-3 text-xs"
                  isLoading={isLoading}
                  onClick={() => {
                    const acc = demoAccounts.find((d) => d.role === selectedRole);
                    if (acc) handleQuickLogin(acc);
                  }}
                >
                  Quick Sign In
                </Button>
              </div>
            )}
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[11px] uppercase font-semibold">Or enter credentials</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSelectedRole(null);
              }}
              placeholder="e.g. hr@saylanihcm.com or employee@saylanihcm.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Demo Credentials reference box */}
          {/* <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-2">
              <span>Standard System Accounts:</span>
              <button
                type="button"
                onClick={handleSeedAccounts}
                disabled={isSeeding}
                className="text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold underline disabled:opacity-50"
              >
                {isSeeding ? 'Seeding...' : 'Reset / Seed Accounts'}
              </button>
            </div>
            <div className="space-y-1.5 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-slate-600">
              <div className="flex justify-between items-center">
                <span><b className="text-slate-800">Admin:</b> admin@saylanihcm.com</span>
                <span className="text-slate-400">AdminPassword123!</span>
              </div>
              <div className="flex justify-between items-center">
                <span><b className="text-slate-800">HR:</b> hr@saylanihcm.com</span>
                <span className="text-slate-400">HrPassword123!</span>
              </div>
              <div className="flex justify-between items-center">
                <span><b className="text-slate-800">Employee:</b> employee@saylanihcm.com</span>
                <span className="text-slate-400">EmployeePassword123!</span>
              </div>
            </div>
          </div> */}

          <div className="mt-4 text-center text-xs text-slate-500">
            <span>First time running the system? </span>
            <Link to="/setup" className="font-semibold text-[#4338CA] hover:underline">
              Initial Setup
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
