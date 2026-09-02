import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/lib/AppContext";
import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import TopNav from "@/components/TopNav";
import AdminSidebar from "@/components/AdminSidebar";
import MobileNav from "@/components/MobileNav";
import AnnouncementPopup from "@/components/AnnouncementPopup";
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const HomePage = lazy(() => import("@/pages/user/HomePage"));
const StudyHubPage = lazy(() => import("@/pages/user/StudyHubPage"));
const CartPage = lazy(() => import("@/pages/user/CartPage"));
const SubjectDetailPage = lazy(() => import("@/pages/user/SubjectDetailPage"));
const ExamPage = lazy(() => import("@/pages/user/ExamPage"));
const ProfilePage = lazy(() => import("@/pages/user/ProfilePage"));
const NewsPage = lazy(() => import("@/pages/user/NewsPage"));
const VerifyEmailPage = lazy(() => import("@/pages/VerifyEmailPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminSubjects = lazy(() => import("@/pages/admin/AdminSubjects"));
const AdminExams = lazy(() => import("@/pages/admin/AdminExams"));
const AdminTheory = lazy(() => import("@/pages/admin/AdminTheory"));
const AdminAnnouncements = lazy(() => import("@/pages/admin/AdminAnnouncements"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminCoupons = lazy(() => import("@/pages/admin/AdminCoupons"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminNews = lazy(() => import("@/pages/admin/AdminNews"));
const AdminQuestionReports = lazy(() => import("@/pages/admin/AdminQuestionReports"));
const AdminBackup = lazy(() => import("@/pages/admin/AdminBackup"));
const AdminChat = lazy(() => import("@/pages/admin/AdminChat"));
const AdminExamStats = lazy(() => import("@/pages/admin/AdminExamStats"));

import ChatWidget from "@/components/chat/ChatWidget";
import { BootScreen, PageSkeleton } from "@/components/Skeleton";
import { Loader2, Menu, X } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { profile, isAdmin, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) {
    return <BootScreen label="Đang tải…" />;
  }

  if (!profile) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function UserLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useApp();
  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--background))', display: 'flex', flexDirection: 'column', colorScheme: 'light' }}>
      <TopNav />
      <main style={{ flex: 1 }}>{children}</main>
      <MobileNav />
      {!isAdmin && <AnnouncementPopup />}
      <ChatWidget />
    </div>
  );
}

const adminVars = {
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
} as React.CSSProperties;

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div
      className="admin-shell"
      style={{
        ...adminVars,
        height: '100vh',
        overflow: 'hidden',
        background: 'hsl(var(--background))',
        display: 'flex',
        flexDirection: 'column',
        colorScheme: 'light',
      }}>
      <TopNav />
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
        <div className="show-on-mobile" style={{ height: '56px', display: 'flex', alignItems: 'center', padding: '0 var(--space-4)', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--surface-raised))' }}>
          <button className="touch-target btn-ghost" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
          <span style={{ fontWeight: 600, marginLeft: 'var(--space-3)' }}>Quản trị viên</span>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <div className="hide-on-mobile" style={{ height: '100%', flexShrink: 0 }}>
            <AdminSidebar />
          </div>
          {isMobileMenuOpen && (
            <div className="show-on-mobile" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} onClick={() => setIsMobileMenuOpen(false)}>
              <div style={{ width: '280px', height: '100%', background: 'hsl(var(--surface-raised))', animation: 'slideInLeft 0.3s ease', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
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
          <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>{children}</main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}

function AppShell() {
  const { profile, authLoading, emailVerified, userEmail, passwordRecovery, clearPasswordRecovery, mustChangePassword, clearMustChangePassword, signOut, refreshAuthUser } = useApp();

  if (authLoading) {
    return <BootScreen label="Đang tải…" />;
  }

  if (passwordRecovery) {
    return (
      <Suspense fallback={<BootScreen />}><ResetPasswordPage
        onDone={async () => {
          clearPasswordRecovery();
          await signOut();
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
      /></Suspense>
    );
  }

  if (userEmail && !emailVerified) {
    return <Suspense fallback={<BootScreen />}><VerifyEmailPage email={userEmail} onVerified={refreshAuthUser} /></Suspense>;
  }

  if (userEmail && emailVerified && mustChangePassword) {
    return (
      <Suspense fallback={<BootScreen />}><ResetPasswordPage
        forced
        onDone={async () => {
          clearMustChangePassword();
          await refreshAuthUser();
        }}
      /></Suspense>
    );
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
    <Routes>
      {/* Public Landing Route */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/auth" element={!profile ? <AuthPage /> : <Navigate to="/" />} />
      <Route path="/verify-email" element={<VerifyEmailPage email={userEmail!} onVerified={refreshAuthUser} />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* User routes: Unauthenticated visitors on '/' see the LandingPage */}
      <Route path="/" element={!profile ? <LandingPage /> : <ProtectedRoute><UserLayout><HomePage /></UserLayout></ProtectedRoute>} />
      <Route path="/my-courses" element={<ProtectedRoute><UserLayout><HomePage /></UserLayout></ProtectedRoute>} />
      <Route path="/cart" element={<ProtectedRoute><UserLayout><CartPage /></UserLayout></ProtectedRoute>} />
      <Route path="/subjects/:id" element={<ProtectedRoute><UserLayout><SubjectDetailPage /></UserLayout></ProtectedRoute>} />
      <Route path="/exams/:id" element={<ProtectedRoute><ExamPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><UserLayout><ProfilePage /></UserLayout></ProtectedRoute>} />
      <Route path="/news" element={<ProtectedRoute><UserLayout><NewsPage /></UserLayout></ProtectedRoute>} />
      <Route path="/study-hub" element={<ProtectedRoute><UserLayout><StudyHubPage /></UserLayout></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin><Navigate to="/admin/dashboard" replace /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/subjects" element={<ProtectedRoute requireAdmin><AdminLayout><AdminSubjects /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/exams" element={<ProtectedRoute requireAdmin><AdminLayout><AdminExams /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/theory" element={<ProtectedRoute requireAdmin><AdminLayout><AdminTheory /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/announcements" element={<ProtectedRoute requireAdmin><AdminLayout><AdminAnnouncements /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminLayout><AdminOrders /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/coupons" element={<ProtectedRoute requireAdmin><AdminLayout><AdminCoupons /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/news" element={<ProtectedRoute requireAdmin><AdminLayout><AdminNews /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><AdminLayout><AdminQuestionReports /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/backup" element={<ProtectedRoute requireAdmin><AdminLayout><AdminBackup /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/chat" element={<ProtectedRoute requireAdmin><AdminLayout><AdminChat /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/exam-stats" element={<ProtectedRoute requireAdmin><AdminLayout><AdminExamStats /></AdminLayout></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AppProvider>
          <Toaster />
          <Sonner />
          <AppShell />
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
