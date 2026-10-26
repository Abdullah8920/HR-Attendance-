import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  Banknote,
  BarChart3,
  Bot,
  Bell,
  FileText,
  Settings,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
}

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = true,
  onClose,
}) => {
  const { role } = useAuth();

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      allowedRoles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      label: 'Employees',
      path: '/employees',
      icon: <Users className="w-4 h-4" />,
      allowedRoles: ['ADMIN', 'HR'],
    },
    {
      label: 'Attendance',
      path: '/attendance',
      icon: <CalendarCheck className="w-4 h-4" />,
      allowedRoles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      label: 'Leave Management',
      path: '/leaves',
      icon: <CalendarDays className="w-4 h-4" />,
      allowedRoles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      label: role === 'EMPLOYEE' ? 'My Payslips' : 'Payroll',
      path: '/payroll',
      icon: <Banknote className="w-4 h-4" />,
      allowedRoles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      label: 'Analytics',
      path: '/analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      allowedRoles: ['ADMIN', 'HR'],
    },
    {
      label: 'Announcements',
      path: '/announcements',
      icon: <Bell className="w-4 h-4" />,
      allowedRoles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      label: 'Audit Logs',
      path: '/audit-logs',
      icon: <FileText className="w-4 h-4" />,
      allowedRoles: ['ADMIN'], // Admin-only
    },
    {
      label: 'Organization Settings',
      path: '/settings',
      icon: <Settings className="w-4 h-4" />,
      allowedRoles: ['ADMIN'], // Admin-only
    },
  ];

  const visibleItems = navItems.filter((item) => role && item.allowedRoles.includes(role));

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4338CA] to-[#8B5CF6] flex items-center justify-center text-white shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm tracking-tight block">Saylani HCM</span>
            <span className="text-[10px] uppercase font-semibold text-indigo-600 tracking-wider">Enterprise Lite</span>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-[#4338CA] font-semibold shadow-[inset_2px_0_0_#6366f1]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`${isActive ? 'text-[#4338CA]' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* User Role status tag in footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Logged in as</span>
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              {role || 'User'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
