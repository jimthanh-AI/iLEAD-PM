import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { INDICATOR_GROUPS } from '../utils/constants';
import './SettingsPage.css';

const STORAGE_KEY = 'ilead_v5_data';

function storageSize() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '';
    return (new Blob([raw]).size / 1024).toFixed(1);
  } catch { return '?'; }
}

const ROLES = [
  { v: 'admin',       label: 'Admin',       desc: 'Toàn quyền' },
  { v: 'pm',          label: 'PM',          desc: 'Chỉnh sửa & xóa' },
  { v: 'coordinator', label: 'Coordinator', desc: 'Chỉnh sửa, không xóa' },
  { v: 'viewer',      label: 'Viewer',      desc: 'Chỉ xem' },
];

export default function SettingsPage() {
  const { setData, pushToSupabase, clearAndSeed, restoreFromBackup, userRole, isAdmin, partners, activities, tasks, melEntries, partnerBudgets, activityIndicators } = useData();
  const { fetchAllUsers, updateUserRole, removeUser, appUser } = useAuth();
  const [theme, setTheme]       = useState(() => localStorage.getItem('ilead_theme') || 'light');
  const [importErr, setImportErr] = useState('');
  const [importOk, setImportOk]   = useState('');
  const [resetConfirm, setResetConfirm] = useState(false);
  const fileRef = useRef();

  // User management (admin only)
  const [users,      setUsers]      = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userMsg,    setUserMsg]    = useState('');
  const [pendingRoles, setPendingRoles] = useState({});

  useEffect(() => {
    if (!isAdmin) return;
    setUsersLoading(true);
    fetchAllUsers().then(data => { setUsers(data); setUsersLoading(false); });
  }, [isAdmin]);

  // ── Theme ──────────────────────────────────────────────────────
  const applyTheme = (t) => {
    setTheme(t);
    localStorage.setItem('ilead_theme', t);
    document.documentElement.dataset.theme = t;
  };

  // ── User management ────────────────────────────────────────────
  const handleRoleChange = (email, newRole) => {
    setPendingRoles(p => ({ ...p, [email]: newRole }));
  };

  const handleSaveRole = async (email) => {
    const newRole = pendingRoles[email];
    if (!newRole) return;
    setUserMsg('');
    const { error } = await updateUserRole(email, newRole);
    if (error) { setUserMsg('Lỗi: ' + error.message); return; }
    setUsers(us => us.map(u => u.email === email ? { ...u, role: newRole } : u));
    setPendingRoles(p => { const n = { ...p }; delete n[email]; return n; });
    setUserMsg('Đã cập nhật quyền cho ' + email);
  };

  // ── Export JSON ────────────────────────────────────────────────
  const handleExport = () => {
    const snapshot = {
      __v: 4,
      partners, activities, tasks,
      activityIndicators: activityIndicators || [],
      melEntries, partnerBudgets,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ilead-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import JSON ────────────────────────────────────────────────
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportErr(''); setImportOk('');
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.partners || !parsed.activities) throw new Error('Không tìm thấy dữ liệu hợp lệ (thiếu partners/activities)');
        const restored = {
          __v:            parsed.__v            || 4,
          partners:       parsed.partners       || [],
          activities:     parsed.activities     || [],
          tasks:          parsed.tasks          || [],
          activityIndicators: parsed.activityIndicators || [],
          melEntries:     parsed.melEntries     || [],
          partnerBudgets: parsed.partnerBudgets || [],
        };
        setImportOk('Đang đồng bộ lên Supabase...');
        await restoreFromBackup(restored);
        setImportOk(`Khôi phục thành công: ${restored.partners.length} partners, ${restored.activities.length} activities, ${restored.melEntries.length} MEL entries.`);
      } catch (err) {
        setImportErr('Lỗi: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Reset to SEED ──────────────────────────────────────────────
  const handleReset = async () => {
    try {
      await clearAndSeed();
      setResetConfirm(false);
    } catch (err) {
      setImportErr('Lỗi reset: ' + err.message);
      setResetConfirm(false);
    }
  };

  const kbUsed = storageSize();

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Cài đặt</h1>
        <p className="settings-sub">Quản lý dữ liệu, giao diện và quyền truy cập</p>
      </div>

      <div className="settings-grid">

        {/* ── Data Overview ── */}
        <div className="settings-card">
          <h2>Tổng quan dữ liệu</h2>
          <div className="stats-grid">
            <div className="stat-item"><span className="stat-val">{partners.length}</span><span className="stat-label">Partners</span></div>
            <div className="stat-item"><span className="stat-val">{activities.length}</span><span className="stat-label">Activities</span></div>
            <div className="stat-item"><span className="stat-val">{tasks.length}</span><span className="stat-label">Tasks</span></div>
            <div className="stat-item"><span className="stat-val">{melEntries.length}</span><span className="stat-label">MEL Entries</span></div>
            <div className="stat-item"><span className="stat-val">{partnerBudgets.length}</span><span className="stat-label">Budgets</span></div>
            <div className="stat-item"><span className="stat-val">{INDICATOR_GROUPS.length}</span><span className="stat-label">Indicators</span></div>
          </div>
          <div className="storage-info">
            <span className="storage-bar-wrap">
              <span className="storage-bar" style={{ width: `${Math.min(parseFloat(kbUsed) / 50 * 100, 100)}%` }}></span>
            </span>
            <span className="storage-text">LocalStorage: {kbUsed} KB / ~5,000 KB</span>
          </div>
        </div>

        {/* ── Backup & Restore ── */}
        <div className="settings-card">
          <h2>Sao lưu & Khôi phục</h2>
          <p className="card-hint">Xuất toàn bộ dữ liệu thành file JSON để lưu trữ hoặc chuyển máy tính khác.</p>

          <div className="settings-actions">
            <button className="btn-settings primary" onClick={handleExport}>
              ⬇ Tải xuống JSON Backup
            </button>
            <button className="btn-settings secondary" onClick={() => fileRef.current?.click()}>
              ⬆ Khôi phục từ JSON
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display:'none' }} onChange={handleImportFile} />
          </div>

          {importErr && <div className="msg-error">{importErr}</div>}
          {importOk  && <div className="msg-ok">{importOk}</div>}
        </div>

        {/* ── Appearance ── */}
        <div className="settings-card">
          <h2>Giao diện</h2>
          <p className="card-hint">Chọn chế độ sáng / tối cho ứng dụng.</p>
          <div className="theme-switcher">
            {['light', 'dark'].map(t => (
              <button key={t}
                className={`theme-btn ${theme === t ? 'active' : ''}`}
                onClick={() => applyTheme(t)}>
                {t === 'light' ? '☀ Sáng' : '🌙 Tối'}
              </button>
            ))}
          </div>
        </div>

        {/* ── My Role ── */}
        <div className="settings-card">
          <h2>Quyền của bạn</h2>
          <p className="card-hint">Role được gán bởi Admin. Liên hệ Jim Thanh để thay đổi.</p>
          <div className="role-switcher">
            {ROLES.map(r => (
              <div key={r.v} className={`role-btn ${userRole === r.v ? 'active' : ''}`} style={{ cursor: 'default' }}>
                <strong>{r.label}</strong>
                <span>{r.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── User Management (Admin only) ── */}
        {isAdmin && (
          <div className="settings-card">
            <h2>Quản lý người dùng</h2>
            <p className="card-hint">Ai đăng nhập lần đầu sẽ tự động thành Viewer. Admin có thể đổi role ở đây.</p>
            {userMsg && <div className="msg-ok" style={{ marginBottom: 12 }}>{userMsg}</div>}
            {usersLoading ? (
              <div style={{ color: 'var(--text2)', fontSize: 13 }}>Đang tải...</div>
            ) : (
              <div className="user-mgmt-list">
                {users.map(u => (
                  <div key={u.email} className="user-mgmt-row">
                    <div className="user-mgmt-info">
                      <strong>{u.display_name || u.email}</strong>
                      <span>{u.email}</span>
                    </div>
                    <select
                      className="user-role-select"
                      value={pendingRoles[u.email] ?? u.role}
                      onChange={e => handleRoleChange(u.email, e.target.value)}
                    >
                      {ROLES.map(r => (
                        <option key={r.v} value={r.v}>{r.label}</option>
                      ))}
                    </select>
                    {pendingRoles[u.email] && (
                      <button className="btn-save-role" onClick={() => handleSaveRole(u.email)}>
                        Lưu
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Danger Zone ── */}
        <div className="settings-card danger-zone">
          <h2>Vùng nguy hiểm</h2>
          <p className="card-hint">Xóa toàn bộ dữ liệu và nạp lại dữ liệu mẫu (SEED). Thao tác này không thể hoàn tác.</p>
          {!resetConfirm ? (
            <button className="btn-settings danger" onClick={() => setResetConfirm(true)}>
              🗑 Reset về dữ liệu mẫu
            </button>
          ) : (
            <div className="confirm-row">
              <span className="confirm-txt">Bạn chắc chắn? Toàn bộ dữ liệu sẽ mất.</span>
              <button className="btn-settings danger" onClick={handleReset}>Xác nhận Reset</button>
              <button className="btn-settings secondary" onClick={() => setResetConfirm(false)}>Hủy</button>
            </div>
          )}
        </div>

        {/* ── App Info ── */}
        <div className="settings-card">
          <h2>Thông tin ứng dụng</h2>
          <div className="app-info-list">
            <div className="info-row"><span>Tên</span><strong>i-LEAD Dashboard</strong></div>
            <div className="info-row"><span>Schema version</span><strong>v4</strong></div>
            <div className="info-row"><span>Chương trình</span><strong>iLEAD 2025–2028</strong></div>
            <div className="info-row"><span>Quốc gia</span><strong>Vietnam</strong></div>
            <div className="info-row"><span>Fiscal Year</span><strong>Q1 Apr–Jun · Q4 ends 31 Mar</strong></div>
            <div className="info-row"><span>Storage</span><strong>Supabase (cloud)</strong></div>
          </div>
        </div>

      </div>
    </div>
  );
}
