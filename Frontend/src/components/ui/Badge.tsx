import React from 'react';

export type BadgeVariant =
  | 'present'
  | 'late'
  | 'halfDay'
  | 'absent'
  | 'onLeave'
  | 'weekend'
  | 'holiday'
  | 'approved'
  | 'pending'
  | 'rejected'
  | 'cancelled'
  | 'draft'
  | 'finalized'
  | 'active'
  | 'inactive'
  | 'admin'
  | 'hr'
  | 'employee'
  | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant | string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '', size = 'md' }) => {
  const normVariant = variant.toLowerCase().replace(/_/g, '');

  const stylesMap: Record<string, string> = {
    present: 'bg-green-50 text-green-700 border-green-200',
    late: 'bg-amber-50 text-amber-700 border-amber-200',
    halfday: 'bg-orange-50 text-orange-700 border-orange-200',
    absent: 'bg-red-50 text-red-700 border-red-200',
    onleave: 'bg-purple-50 text-purple-700 border-purple-200',
    weekend: 'bg-slate-100 text-slate-600 border-slate-200',
    holiday: 'bg-blue-50 text-blue-700 border-blue-200',

    approved: 'bg-green-50 text-green-700 border-green-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200',

    draft: 'bg-amber-50 text-amber-700 border-amber-200',
    finalized: 'bg-indigo-50 text-indigo-700 border-indigo-200',

    active: 'bg-green-50 text-green-700 border-green-200',
    probation: 'bg-blue-50 text-blue-700 border-blue-200',
    inactive: 'bg-slate-100 text-slate-500 border-slate-200',
    resigned: 'bg-slate-100 text-slate-600 border-slate-200',
    terminated: 'bg-red-50 text-red-700 border-red-200',

    admin: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold',
    hr: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
    employee: 'bg-slate-100 text-slate-700 border-slate-200',

    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const currentStyle = stylesMap[normVariant] || stylesMap.neutral;
  const sizeStyle = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeStyle} ${currentStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      <span>{children}</span>
    </span>
  );
};
