import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title = 'Dashboard' }) => {
  const { user, role, logout } = useAuth();

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-20 h-[68px] bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-[-0.025em]">{title}</h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* User profile capsule */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
            {getInitials(user?.email)}
          </div>
          <div className="hidden md:block text-left text-xs">
            <div className="font-semibold text-slate-800 truncate max-w-[160px]">{user?.email}</div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">{role}</div>
          </div>
        </div>

        {/* Logout button */}
        <Button variant="ghost" size="sm" onClick={logout} className="text-slate-500 hover:text-red-600">
          <LogOut className="w-4 h-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
};
