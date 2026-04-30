import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import MobileBottomNav from './components/MobileBottomNav';
import QuickTaskSheet from './components/QuickTaskSheet';
import Dashboard from './pages/Dashboard';
import PartnerView from './pages/PartnerView';
import ActivityDetail from './pages/ActivityDetail';
import AllTasks from './pages/AllTasks';
import MasterCalendar from './pages/MasterCalendar';
import GlobalKanban from './pages/GlobalKanban';
import { GanttTimeline } from './components/GanttTimeline';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ReportPage from './pages/ReportPage';
import MELDashboard from './pages/MELDashboard';
import MELEntry from './pages/MELEntry';
import WeeklyPlan from './pages/WeeklyPlan';
import SettingsPage from './pages/SettingsPage';

const NotFound = () => (
  <div style={{ padding: '48px 32px', textAlign: 'center' }}>
    <div style={{ fontSize: '72px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>404</div>
    <h1 style={{ marginTop: '16px' }}>Trang không tồn tại</h1>
    <p style={{ color: 'var(--text2)', marginTop: '8px' }}>
      Đường dẫn bạn truy cập không có trong hệ thống.
    </p>
    <a href="/" className="btn btn-primary" style={{ marginTop: '24px', display: 'inline-block' }}>
      ← Về Dashboard
    </a>
  </div>
);

// Loading spinner shown while Supabase resolves the session
const AuthLoading = () => (
  <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg,#f5f5f0)' }}>
    <div style={{ textAlign:'center', color:'var(--text2,#6a6a66)' }}>
      <div style={{ fontSize:'28px', fontWeight:800, marginBottom:'12px' }}>
        <span style={{ color:'var(--accent,#2563eb)', fontStyle:'italic' }}>i</span>LEAD
      </div>
      <div style={{ fontSize:'13px' }}>Đang tải...</div>
    </div>
  </div>
);

// Access denied: email exists in auth but not in app_users whitelist
const AccessDenied = () => {
  const { signOut, session } = useAuth();
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg,#f5f5f0)', padding:'24px' }}>
      <div style={{ background:'var(--card,#fff)', borderRadius:'16px', padding:'40px 32px', maxWidth:'360px', textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,.10)' }}>
        <div style={{ fontSize:'40px', marginBottom:'12px' }}>🔒</div>
        <h2 style={{ margin:'0 0 8px', fontSize:'18px' }}>Không có quyền truy cập</h2>
        <p style={{ color:'var(--text2,#6a6a66)', fontSize:'13px', margin:'0 0 20px', lineHeight:1.6 }}>
          Email <strong>{session?.user?.email}</strong> chưa được cấp quyền truy cập.<br />
          Liên hệ Admin để được thêm vào danh sách.
        </p>
        <button className="btn btn-secondary" onClick={signOut}>Đăng xuất</button>
      </div>
    </div>
  );
};

// Guard: show login / loading / access-denied before rendering the app
function AuthGuard({ children }) {
  const { session, appUser, authLoading } = useAuth();
  if (authLoading)           return <AuthLoading />;
  if (!session)              return <LoginPage />;
  if (!appUser)              return <AccessDenied />;
  return children;
}

function AppShell() {
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [quickTaskOpen,  setQuickTaskOpen]  = useState(false);

  return (
    <BrowserRouter>
      <div className="app-container">
        <div
          className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <Topbar onHamburger={() => setSidebarOpen(o => !o)} />
          <main className="view-area">
            <Routes>
              <Route path="/"            element={<Dashboard />} />
              <Route path="/tasks"        element={<AllTasks />} />
              <Route path="/kanban"       element={<GlobalKanban />} />
              <Route path="/timeline"     element={<GanttTimeline />} />
              <Route path="/calendar"     element={<MasterCalendar />} />
              <Route path="/weekly"        element={<WeeklyPlan />} />
              <Route path="/partner/:id"  element={<PartnerView />} />
              <Route path="/activity/:id" element={<ActivityDetail />} />
              <Route path="/report"        element={<ReportPage />} />
              <Route path="/mel-dashboard" element={<MELDashboard />} />
              <Route path="/mel-entry"     element={<MELEntry />} />
              <Route path="/settings"      element={<SettingsPage />} />
              <Route path="*"              element={<NotFound />} />
            </Routes>
          </main>
        </div>
        {/* Mobile-only: bottom nav + quick task sheet */}
        <MobileBottomNav onQuickTask={() => setQuickTaskOpen(true)} />
        <QuickTaskSheet isOpen={quickTaskOpen} onClose={() => setQuickTaskOpen(false)} />
      </div>
    </BrowserRouter>
  );
}

function App() {
  useEffect(() => {
    const theme = localStorage.getItem('ilead_theme') || 'light';
    document.documentElement.dataset.theme = theme;
  }, []);

  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <DataProvider>
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          </DataProvider>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
