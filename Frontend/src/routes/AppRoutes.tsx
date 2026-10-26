import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

// Layout
import { AppLayout } from '../components/layout/AppLayout';

// Pages
import { LoginPage } from '../features/auth/LoginPage';
import { SetupPage } from '../features/auth/SetupPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { EmployeeListPage } from '../features/employees/EmployeeListPage';
import { AttendancePage } from '../features/attendance/AttendancePage';
import { LeavePage } from '../features/leave/LeavePage';
import { PayrollPage } from '../features/payroll/PayrollPage';
import { AnalyticsPage } from '../features/analytics/AnalyticsPage';
import { AiAssistantPage } from '../features/ai-assistant/AiAssistantPage';
import { AnnouncementsPage } from '../features/announcements/AnnouncementsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { AuditLogsPage } from '../features/audit-logs/AuditLogsPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/setup" element={<SetupPage />} />

      {/* Authenticated Dashboard Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="employees"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
              <EmployeeListPage />
            </ProtectedRoute>
          }
        />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="leaves" element={<LeavePage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route
          path="analytics"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route path="ai-assistant" element={<AiAssistantPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />

        {/* Admin-only Routes */}
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
