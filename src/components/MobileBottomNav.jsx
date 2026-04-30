import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import './MobileBottomNav.css';

const MOBILE_TEAM = [
  { id: 'jthanh',  name: 'Jim Thanh',   initials: 'JT', color: '#2563eb' },
  { id: 'hphung',  name: 'Hieu Phung',  initials: 'HP', color: '#7c3aed' },
  { id: 'yton',    name: 'Yen Ton',     initials: 'YT', color: '#16a34a' },
  { id: 'tnguyen', name: 'Truc Nguyen', initials: 'TN', color: '#d97706' },
];

const MobileBottomNav = ({ onQuickTask }) => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { partners } = useData();
  const { appUser, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const go = (path) => { navigate(path); setDrawerOpen(false); };

  const initials = appUser?.display_name
    ? appUser.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      {/* ── Bottom Nav Bar ─────────────────────────────────────── */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mbn-tab${isActive('/') ? ' mbn-active' : ''}`}
          onClick={() => go('/')}
        >
          <span className="mbn-icon">🏠</span>
          <span className="mbn-label">Dashboard</span>
        </button>

        <button
          className={`mbn-tab${isActive('/tasks') ? ' mbn-active' : ''}`}
          onClick={() => go('/tasks')}
        >
          <span className="mbn-icon">✓</span>
          <span className="mbn-label">Tasks</span>
        </button>

        {/* FAB center */}
        <button className="mbn-fab" onClick={onQuickTask} aria-label="Thêm task mới">
          <span className="mbn-fab-icon">+</span>
        </button>
        <div className="mbn-fab-placeholder" />

        <button
          className={`mbn-tab${isActive('/mel-entry') || isActive('/mel-dashboard') ? ' mbn-active' : ''}`}
          onClick={() => go('/mel-entry')}
        >
          <span className="mbn-icon">📊</span>
          <span className="mbn-label">MEL</span>
        </button>

        <button
          className={`mbn-tab${drawerOpen ? ' mbn-active' : ''}`}
          onClick={() => setDrawerOpen(true)}
        >
          <span className="mbn-icon">☰</span>
          <span className="mbn-label">Menu</span>
        </button>
      </nav>

      {/* ── Menu Drawer ────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="mbn-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
      )}
      <div className={`mbn-drawer${drawerOpen ? ' mbn-drawer-open' : ''}`}>
        {/* Drawer header */}
        <div className="mbn-drawer-header">
          <div className="mbn-drawer-logo">
            <span className="mbn-drawer-logo-text">i-LEAD</span>
          </div>
          <div className="mbn-drawer-user">
            <div className="mbn-drawer-avatar" style={{ background: '#2563eb' }}>{initials}</div>
            <div>
              <div className="mbn-drawer-name">{appUser?.display_name || '—'}</div>
              <div className="mbn-drawer-role">{appUser?.role || ''}</div>
            </div>
          </div>
          <button className="mbn-drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
        </div>

        {/* Drawer nav */}
        <nav className="mbn-drawer-nav">
          <button className={`mbn-drawer-item${isActive('/') ? ' mbn-drawer-active' : ''}`} onClick={() => go('/')}>
            🏠 <span>Dashboard</span>
          </button>
          <button className={`mbn-drawer-item${isActive('/tasks') ? ' mbn-drawer-active' : ''}`} onClick={() => go('/tasks')}>
            ✓ <span>All Tasks</span>
          </button>
          <button className={`mbn-drawer-item${isActive('/kanban') ? ' mbn-drawer-active' : ''}`} onClick={() => go('/kanban')}>
            ▦ <span>All Activities</span>
          </button>
          <button className={`mbn-drawer-item${isActive('/timeline') ? ' mbn-drawer-active' : ''}`} onClick={() => go('/timeline')}>
            ▬ <span>Timeline / Gantt</span>
          </button>
          <button className={`mbn-drawer-item${isActive('/calendar') ? ' mbn-drawer-active' : ''}`} onClick={() => go('/calendar')}>
            📅 <span>Master Calendar</span>
          </button>

          <div className="mbn-drawer-section-title">MEL MODULE</div>
          <button className={`mbn-drawer-item${isActive('/mel-dashboard') ? ' mbn-drawer-active' : ''}`} onClick={() => go('/mel-dashboard')}>
            📈 <span>MEL Dashboard</span>
          </button>
          <button className={`mbn-drawer-item${isActive('/mel-entry') ? ' mbn-drawer-active' : ''}`} onClick={() => go('/mel-entry')}>
            📋 <span>MEL Entries</span>
          </button>

          {partners.length > 0 && (
            <>
              <div className="mbn-drawer-section-title">ĐỐI TÁC</div>
              {partners.map(p => (
                <button
                  key={p.id}
                  className={`mbn-drawer-item${isActive(`/partner/${p.id}`) ? ' mbn-drawer-active' : ''}`}
                  onClick={() => go(`/partner/${p.id}`)}
                >
                  <span className="mbn-partner-dot" style={{ background: p.color }} />
                  <span>{p.name}</span>
                </button>
              ))}
            </>
          )}
        </nav>

        {/* Drawer footer */}
        <div className="mbn-drawer-footer">
          <button className="mbn-drawer-signout" onClick={signOut}>
            🚪 Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileBottomNav;
export { MOBILE_TEAM };
