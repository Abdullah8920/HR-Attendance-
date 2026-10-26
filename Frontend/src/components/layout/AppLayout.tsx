import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { FloatingAiWidget } from '../FloatingAiWidget';
import Swal from 'sweetalert2';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Show SweetAlert on successful login
  useEffect(() => {
    const alertData = sessionStorage.getItem('hcm_login_alert');
    if (alertData) {
      sessionStorage.removeItem('hcm_login_alert');
      try {
        const { role, email } = JSON.parse(alertData);
        const roleLabel =
          role === 'ADMIN' ? 'System Administrator' : role === 'HR' ? 'HR Operations Manager' : 'Employee Self-Service';

        Swal.fire({
          icon: 'success',
          title: `Welcome Back! 🎉`,
          html: `
            <div style="font-family: inherit; text-align: center; margin-top: 8px;">
              <p style="font-size: 15px; font-weight: 700; color: #1E293B; margin-bottom: 4px;">
                Assalam-o-Alaikum, ${email || 'Team Member'}!
              </p>
              <p style="font-size: 13px; color: #64748B; margin-bottom: 12px;">
                You have successfully signed in as <b style="color: #4338CA;">${roleLabel}</b>.
              </p>
              <div style="background: #F1F5F9; border-radius: 10px; padding: 10px 14px; font-size: 12px; color: #475569; text-align: left;">
                ✨ <b>Tip:</b> Saylani AI Assistant is available 24/7 at the bottom-right circular button for any HR or salary inquiries.
              </div>
            </div>
          `,
          confirmButtonText: 'Enter Dashboard',
          confirmButtonColor: '#4338CA',
          timer: 3500,
          timerProgressBar: true,
          backdrop: 'rgba(15, 23, 42, 0.45)',
          customClass: {
            popup: 'rounded-2xl shadow-2xl',
            confirmButton: 'rounded-xl text-xs font-bold px-6 py-2.5 shadow-md',
          },
        });
      } catch (err) {
        console.error('SweetAlert display error:', err);
      }
    }
  }, []);

  const getPageTitle = (pathname: string) => {
    if (pathname.includes('/dashboard')) return 'Dashboard Overview';
    if (pathname.includes('/employees')) return 'Employee Directory';
    if (pathname.includes('/attendance')) return 'Attendance Management';
    if (pathname.includes('/leaves')) return 'Leave Management';
    if (pathname.includes('/payroll')) return 'Payroll & Compensation';
    if (pathname.includes('/analytics')) return 'Reports & Analytics';
    if (pathname.includes('/announcements')) return 'Company Announcements';
    if (pathname.includes('/ai-assistant')) return 'AI HR Assistant';
    if (pathname.includes('/audit-logs')) return 'System Audit Logs';
    if (pathname.includes('/settings')) return 'Organization Settings';
    return 'HCM Lite';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex relative">
      {/* Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <Header onToggleSidebar={() => setSidebarOpen(true)} title={getPageTitle(location.pathname)} />

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Floating AI Assistant Widget (Bottom Right) */}
      <FloatingAiWidget />
    </div>
  );
};
