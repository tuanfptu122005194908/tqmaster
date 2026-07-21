import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/lib/AppContext";
import { useState } from 'react';
import TopNav from "@/components/TopNav";
import AdminSidebar from "@/components/AdminSidebar";
import MobileNav from "@/components/MobileNav";
import AuthPage from "@/pages/AuthPage";

// User pages
import HomePage from "@/pages/user/HomePage";
import StudyHubPage from "@/pages/user/StudyHubPage";
import CartPage from "@/pages/user/CartPage";
import SubjectDetailPage from "@/pages/user/SubjectDetailPage";
import ExamPage from "@/pages/user/ExamPage";
import ProfilePage from "@/pages/user/ProfilePage";
import NewsPage from "@/pages/user/NewsPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AnnouncementPopup from "@/components/AnnouncementPopup";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminSubjects from "@/pages/admin/AdminSubjects";
import AdminExams from "@/pages/admin/AdminExams";
import AdminTheory from "@/pages/admin/AdminTheory";
import AdminAnnouncements from "@/pages/admin/AdminAnnouncements";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminNews from "@/pages/admin/AdminNews";
import { Loader2, Menu, X } from "lucide-react";

const queryClient = new QueryClient();

function AppShell() {
  const { profile, isAdmin, authLoading, currentView, examMode, emailVerified, userEmail, refreshAuthUser, passwordRecovery, clearPasswordRecovery, mustChangePassword, clearMustChangePassword, signOut } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Loading splash
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background))' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))', margin: '0 auto var(--space-3)' }} />
          <p style={{ color: 'hsl(var(--muted-fg))', fontSize: '0.875rem' }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  // Password recovery flow — let the user set a new password
  if (passwordRecovery) {
    return (
      <ResetPasswordPage
        onDone={async () => {
          clearPasswordRecovery();
          await signOut();
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
      />
    );
  }

  // Logged in but email not verified — gate everything
  if (userEmail && !emailVerified) {
    return <VerifyEmailPage email={userEmail} onVerified={refreshAuthUser} />;
  }

  // Logged in with a temporary (reset) password — force a password change
  if (userEmail && emailVerified && mustChangePassword) {
    return (
      <ResetPasswordPage
        forced
        onDone={async () => {
          clearMustChangePassword();
          await refreshAuthUser();
        }}
      />
    );
  }

  // Not logged in — show auth
  if (!profile) return <AuthPage />;

  // Exam page = full-screen, no chrome
  if (currentView === 'exam' && examMode !== null) return <ExamPage />;

  const renderPage = () => {
    if (isAdmin) {
      switch (currentView) {
        case 'admin-dashboard':     return <AdminDashboard />;
        case 'admin-subjects':      return <AdminSubjects />;
        case 'admin-exams':         return <AdminExams />;
        case 'admin-theory':        return <AdminTheory />;
        case 'admin-announcements': return <AdminAnnouncements />;
        case 'admin-orders':        return <AdminOrders />;
        case 'admin-coupons':       return <AdminCoupons />;
        case 'admin-users':         return <AdminUsers />;
        case 'admin-settings':      return <AdminSettings />;
        case 'admin-news':          return <AdminNews />;
        // Admin can still visit student pages
        case 'home':           return <HomePage />;
        case 'subject-detail': return <SubjectDetailPage />;
        case 'news':           return <NewsPage />;
        case 'study-hub':      return <StudyHubPage />;
        default:               return <AdminDashboard />;
      }
    }
    switch (currentView) {
      case 'home':           return <HomePage />;
      case 'my-courses':     return <HomePage />;
      case 'cart':           return <CartPage />;
      case 'subject-detail': return <SubjectDetailPage />;
      case 'profile':        return <ProfilePage />;
      case 'news':           return <NewsPage />;
      case 'study-hub':      return <StudyHubPage />;
      default:               return <HomePage />;
    }
  };

  const isAdminShell = isAdmin && currentView.startsWith('admin-');

  const adminVars = isAdminShell ? {
    '--background':              '210 40% 98%',
    '--surface':                 '0 0% 100%',
    '--surface-raised':          '0 0% 100%',
    '--foreground':              '222.2 84% 4.9%',
    '--muted-fg':                '215.4 16.3% 46.9%',
    '--subtle-fg':               '215.4 16.3% 60%',
    '--border':                  '214.3 31.8% 91.4%',
    '--border-strong':           '214.3 31.8% 85%',
    '--primary':                 '238 84% 60%',
    '--primary-light':           '238 84% 94%',
    '--primary-dark':            '238 84% 50%',
    '--primary-muted':           '238 84% 96%',
    '--primary-subtle':          '238 84% 98%',
    '--primary-foreground':      '0 0% 100%',
    '--success':                 '162 70% 40%',
    '--success-light':           '162 70% 95%',
    '--warning':                 '38 92% 50%',
    '--warning-light':           '38 92% 95%',
    '--danger':                  '346 84% 61%',
    '--danger-light':            '346 84% 96%',
    '--accent':                  '238 84% 60%',
    '--accent-light':            '238 84% 96%',
    '--accent-foreground':       '238 84% 40%',
    '--muted':                   '210 40% 96.1%',
    '--muted-foreground':        '215.4 16.3% 46.9%',
    '--input':                   '214.3 31.8% 91.4%',
    '--secondary':               '210 40% 96.1%',
    '--secondary-foreground':    '222.2 47.4% 11.2%',
    '--card':                    '0 0% 100%',
    '--card-foreground':         '222.2 84% 4.9%',
    '--popover':                 '0 0% 100%',
    '--popover-foreground':      '222.2 84% 4.9%',
    '--destructive':             '346 84% 61%',
    '--destructive-foreground':  '0 0% 100%',
    '--ring':                    '238 84% 60%',
    '--sidebar-background':      '0 0% 100%',
    '--sidebar-foreground':      '215.4 16.3% 46.9%',
    '--sidebar-primary':         '238 84% 60%',
    '--sidebar-primary-foreground': '0 0% 100%',
    '--sidebar-accent':          '238 84% 96%',
    '--sidebar-accent-foreground': '238 84% 50%',
    '--sidebar-border':          '214.3 31.8% 91.4%',
    '--sidebar-ring':            '238 84% 60%',
  } as React.CSSProperties : {};

  return (
    <div
      className={isAdminShell ? 'admin-shell' : ''}
      style={{
        ...adminVars,
        height: isAdminShell ? '100vh' : 'auto',
        minHeight: '100vh',
        overflow: isAdminShell ? 'hidden' : 'visible',
        background: 'hsl(var(--background))',
        display: 'flex',
        flexDirection: 'column',
        colorScheme: 'light',
      } as React.CSSProperties}>
      <TopNav />
      {isAdmin && currentView.startsWith('admin-') ? (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
          {/* Admin Mobile Header */}
          <div className="show-on-mobile" style={{ 
            height: '56px', display: 'flex', alignItems: 'center', padding: '0 var(--space-4)', 
            borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--surface-raised))'
          }}>
            <button className="touch-target btn-ghost" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <span style={{ fontWeight: 600, marginLeft: 'var(--space-3)' }}>Quản trị viên</span>
          </div>

          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <div className="hide-on-mobile" style={{ height: '100%', flexShrink: 0 }}>
              <AdminSidebar />
            </div>
            {/* Sidebar Overlay cho Mobile */}
            {isMobileMenuOpen && (
              <div 
                className="show-on-mobile"
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div 
                  style={{ 
                    width: '280px', height: '100%', background: 'hsl(var(--surface-raised))',
                    animation: 'slideInLeft 0.3s ease', display: 'flex', flexDirection: 'column'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 'var(--space-2)' }}>
                     <button className="btn-ghost touch-target" onClick={() => setIsMobileMenuOpen(false)}>
                       <X size={24} />
                     </button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <AdminSidebar />
                  </div>
                </div>
              </div>
            )}
            <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>{renderPage()}</main>
          </div>
        </div>
      ) : (
        <main style={{ flex: 1 }}>{renderPage()}</main>
      )}
      <MobileNav />
      {!isAdmin && <AnnouncementPopup />}
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <AppShell />
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
