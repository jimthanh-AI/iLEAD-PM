import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
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
  const { setData, pushToSupabase, clearAndSeed, restoreFromBackup, userRole, isAdmin, canEdit, partners, activities, tasks, melEntries, partnerBudgets, activityIndicators, budgetLineItems, activityTypes = [], addActivityType, updateActivityType, deleteActivityType, partnerMap } = useData();
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

  // ── Activity Types CRUD ────────────────────────────────────────
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editTypeForm, setEditTypeForm]   = useState({});
  const [deleteTypeId, setDeleteTypeId]   = useState(null);
  const [showNewType, setShowNewType]     = useState(false);
  const [newTypeForm, setNewTypeForm]     = useState({ code:'', nameVi:'', nameEn:'', standardReach:0, standardBudgetCad:0, sort_order:99 });
  const [atMsg, setAtMsg] = useState('');

  const startEditType = (t) => {
    setEditingTypeId(t.id);
    setEditTypeForm({ code: t.code, nameVi: t.nameVi, nameEn: t.nameEn, standardReach: t.standardReach, standardBudgetCad: t.standardBudgetCad, sort_order: t.sort_order ?? 99 });
  };
  const saveEditType = async () => {
    if (!editTypeForm.code.trim()) { setAtMsg('Code không được trống'); return; }
    await updateActivityType(editingTypeId, editTypeForm);
    setEditingTypeId(null);
    setAtMsg('Đã cập nhật');
    setTimeout(() => setAtMsg(''), 2000);
  };
  const saveNewType = async () => {
    if (!newTypeForm.code.trim() || !newTypeForm.nameVi.trim()) { setAtMsg('Cần nhập Code và Tên VN'); return; }
    await addActivityType({ id: newTypeForm.code, ...newTypeForm });
    setShowNewType(false);
    setNewTypeForm({ code:'', nameVi:'', nameEn:'', standardReach:0, standardBudgetCad:0, sort_order:99 });
    setAtMsg('Đã thêm loại mới');
    setTimeout(() => setAtMsg(''), 2000);
  };
  const confirmDeleteType = async (id) => {
    await deleteActivityType(id);
    setDeleteTypeId(null);
    setAtMsg('Đã xóa');
    setTimeout(() => setAtMsg(''), 2000);
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
  const handleExport = async () => {
    // Fetch app_users + audit_logs from Supabase (not in React state)
    let appUsers = [], auditLogs = [];
    try {
      const [u, l] = await Promise.all([
        supabase.from('app_users').select('*'),
        supabase.from('audit_logs').select('*').order('changed_at', { ascending: false }).limit(5000),
      ]);
      appUsers  = u.data || [];
      auditLogs = l.data || [];
    } catch (e) {
      console.warn('Backup: không tải được app_users/audit_logs', e);
    }

    const snapshot = {
      __v: 5,
      partners, activities, tasks,
      activityIndicators: activityIndicators || [],
      budgetLineItems: budgetLineItems || [],
      melEntries, partnerBudgets,
      appUsers,
      auditLogs,
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
          __v:            parsed.__v            || 5,
          partners:       parsed.partners       || [],
          activities:     parsed.activities     || [],
          tasks:          parsed.tasks          || [],
          activityIndicators: parsed.activityIndicators || [],
          budgetLineItems: parsed.budgetLineItems || [],
          melEntries:     parsed.melEntries     || [],
          partnerBudgets: parsed.partnerBudgets || [],
        };
        setImportOk('Đang đồng bộ lên Supabase...');
        await restoreFromBackup(restored);

        // Restore app_users + audit_logs nếu có trong backup
        if (parsed.appUsers?.length) {
          await supabase.from('app_users').upsert(parsed.appUsers);
        }
        if (parsed.auditLogs?.length) {
          // Insert in batches of 500 to avoid payload limits
          for (let i = 0; i < parsed.auditLogs.length; i += 500) {
            await supabase.from('audit_logs').upsert(parsed.auditLogs.slice(i, i + 500));
          }
        }

        const extras = [];
        if (parsed.appUsers?.length)  extras.push(`${parsed.appUsers.length} users`);
        if (parsed.auditLogs?.length) extras.push(`${parsed.auditLogs.length} audit logs`);
        setImportOk(`Khôi phục thành công: ${restored.partners.length} partners, ${restored.activities.length} activities, ${restored.melEntries.length} MEL entries${extras.length ? ', ' + extras.join(', ') : ''}.`);
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

        {/* ── Activity Types CRUD ── */}
        <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <div>
              <h2 style={{ margin:0 }}>Loại Hoạt Động</h2>
              <p className="card-hint" style={{ margin:'4px 0 0' }}>Thêm, sửa, xóa các loại activity (dùng trong dropdown khi tạo activity).</p>
            </div>
            {canEdit && (
              <button className="btn-settings primary" style={{ whiteSpace:'nowrap' }} onClick={() => { setShowNewType(true); setEditingTypeId(null); }}>
                + Thêm loại mới
              </button>
            )}
          </div>
          {!canEdit && (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'8px 12px', marginBottom:'10px', fontSize:'12px', color:'var(--text2)' }}>
              🔒 Bạn đang ở chế độ chỉ xem (role: <strong>{userRole}</strong>). Liên hệ Admin để chỉnh sửa loại hoạt động.
            </div>
          )}
          {atMsg && <div className="msg-ok" style={{ marginBottom:10 }}>{atMsg}</div>}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead>
                <tr style={{ background:'var(--bg2)', textAlign:'left' }}>
                  <th style={{ padding:'8px 10px', fontWeight:600, color:'var(--text2)' }}>Code</th>
                  <th style={{ padding:'8px 10px', fontWeight:600, color:'var(--text2)' }}>Tên VN</th>
                  <th style={{ padding:'8px 10px', fontWeight:600, color:'var(--text2)' }}>Tên EN</th>
                  <th style={{ padding:'8px 10px', fontWeight:600, color:'var(--text2)', textAlign:'right' }}>Reach KH</th>
                  <th style={{ padding:'8px 10px', fontWeight:600, color:'var(--text2)', textAlign:'right' }}>Budget CAD</th>
                  <th style={{ padding:'8px 10px', fontWeight:600, color:'var(--text2)', textAlign:'right' }}>Thứ tự</th>
                  {canEdit && <th style={{ padding:'8px 10px', width:'100px' }}></th>}
                </tr>
              </thead>
              <tbody>
                {activityTypes.map((t, idx) => (
                  <tr key={t.id} style={{ borderTop:'1px solid var(--border)' }}>
                    {editingTypeId === t.id ? (
                      <>
                        <td style={{ padding:'6px 8px' }}><input className="form-input" style={{ width:'60px', padding:'4px 6px' }} value={editTypeForm.code} onChange={e => setEditTypeForm(f => ({...f, code: e.target.value}))} /></td>
                        <td style={{ padding:'6px 8px' }}><input className="form-input" style={{ width:'160px', padding:'4px 6px' }} value={editTypeForm.nameVi} onChange={e => setEditTypeForm(f => ({...f, nameVi: e.target.value}))} /></td>
                        <td style={{ padding:'6px 8px' }}><input className="form-input" style={{ width:'160px', padding:'4px 6px' }} value={editTypeForm.nameEn} onChange={e => setEditTypeForm(f => ({...f, nameEn: e.target.value}))} /></td>
                        <td style={{ padding:'6px 8px', textAlign:'right' }}><input className="form-input" type="number" style={{ width:'80px', padding:'4px 6px' }} value={editTypeForm.standardReach} onChange={e => setEditTypeForm(f => ({...f, standardReach: Number(e.target.value)||0}))} /></td>
                        <td style={{ padding:'6px 8px', textAlign:'right' }}><input className="form-input" type="number" style={{ width:'90px', padding:'4px 6px' }} value={editTypeForm.standardBudgetCad} onChange={e => setEditTypeForm(f => ({...f, standardBudgetCad: Number(e.target.value)||0}))} /></td>
                        <td style={{ padding:'6px 8px', textAlign:'right' }}><input className="form-input" type="number" style={{ width:'60px', padding:'4px 6px' }} value={editTypeForm.sort_order} onChange={e => setEditTypeForm(f => ({...f, sort_order: Number(e.target.value)||0}))} /></td>
                        <td style={{ padding:'6px 8px', textAlign:'right' }}>
                          <button className="btn-save-role" onClick={saveEditType}>Lưu</button>
                          <button className="btn-settings secondary" style={{ fontSize:'11px', padding:'3px 8px', marginLeft:'4px' }} onClick={() => setEditingTypeId(null)}>Hủy</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding:'8px 10px', fontWeight:600 }}>{t.code}</td>
                        <td style={{ padding:'8px 10px' }}>{t.nameVi}</td>
                        <td style={{ padding:'8px 10px', color:'var(--text2)' }}>{t.nameEn}</td>
                        <td style={{ padding:'8px 10px', textAlign:'right' }}>{(t.standardReach||0).toLocaleString()}</td>
                        <td style={{ padding:'8px 10px', textAlign:'right' }}>${(t.standardBudgetCad||0).toLocaleString()}</td>
                        <td style={{ padding:'8px 10px', textAlign:'right', color:'var(--text3)' }}>{t.sort_order ?? idx}</td>
                        {canEdit && (
                          <td style={{ padding:'8px 10px', textAlign:'right' }}>
                            {deleteTypeId === t.id ? (() => {
                              const used = activities.filter(a => a.activityTypeCode === t.code);
                              return (
                                <div style={{ textAlign:'right' }}>
                                  {used.length > 0 ? (
                                    <div style={{ fontSize:'11px', color:'var(--red)', marginBottom:'4px', maxWidth:'280px', marginLeft:'auto', lineHeight:'1.5' }}>
                                      ⚠ <strong>{used.length} activity đang dùng loại này</strong>:<br/>
                                      {used.slice(0,3).map((a,i) => (
                                        <span key={a.id}>{i>0 ? '; ' : ''}{partnerMap[a.partnerId]?.name ? `[${partnerMap[a.partnerId].name}] ` : ''}{a.name}</span>
                                      ))}
                                      {used.length > 3 && <span> và {used.length - 3} khác</span>}
                                      <br/>Xóa sẽ không mất activity, nhưng chúng sẽ mất liên kết loại.
                                    </div>
                                  ) : (
                                    <div style={{ fontSize:'11px', color:'var(--text3)', marginBottom:'4px' }}>Xác nhận xóa loại "{t.code}"?</div>
                                  )}
                                  <button className="btn-settings danger" style={{ fontSize:'11px', padding:'3px 8px' }} onClick={() => confirmDeleteType(t.id)}>
                                    {used.length > 0 ? 'Vẫn xóa' : 'Xóa'}
                                  </button>
                                  <button className="btn-settings secondary" style={{ fontSize:'11px', padding:'3px 8px', marginLeft:'4px' }} onClick={() => setDeleteTypeId(null)}>Hủy</button>
                                </div>
                              );
                            })() : (
                              <>
                                <button className="btn-settings secondary" style={{ fontSize:'11px', padding:'3px 8px' }} onClick={() => startEditType(t)}>Sửa</button>
                                <button className="btn-settings danger" style={{ fontSize:'11px', padding:'3px 8px', marginLeft:'4px' }} onClick={() => setDeleteTypeId(t.id)}>Xóa</button>
                              </>
                            )}
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                ))}
                {showNewType && (
                  <tr style={{ borderTop:'2px solid var(--accent)', background:'var(--bg2)' }}>
                    <td style={{ padding:'6px 8px' }}><input className="form-input" style={{ width:'60px', padding:'4px 6px' }} placeholder="Code" value={newTypeForm.code} onChange={e => setNewTypeForm(f => ({...f, code: e.target.value}))} /></td>
                    <td style={{ padding:'6px 8px' }}><input className="form-input" style={{ width:'160px', padding:'4px 6px' }} placeholder="Tên tiếng Việt" value={newTypeForm.nameVi} onChange={e => setNewTypeForm(f => ({...f, nameVi: e.target.value}))} /></td>
                    <td style={{ padding:'6px 8px' }}><input className="form-input" style={{ width:'160px', padding:'4px 6px' }} placeholder="English name" value={newTypeForm.nameEn} onChange={e => setNewTypeForm(f => ({...f, nameEn: e.target.value}))} /></td>
                    <td style={{ padding:'6px 8px', textAlign:'right' }}><input className="form-input" type="number" style={{ width:'80px', padding:'4px 6px' }} value={newTypeForm.standardReach} onChange={e => setNewTypeForm(f => ({...f, standardReach: Number(e.target.value)||0}))} /></td>
                    <td style={{ padding:'6px 8px', textAlign:'right' }}><input className="form-input" type="number" style={{ width:'90px', padding:'4px 6px' }} value={newTypeForm.standardBudgetCad} onChange={e => setNewTypeForm(f => ({...f, standardBudgetCad: Number(e.target.value)||0}))} /></td>
                    <td style={{ padding:'6px 8px', textAlign:'right' }}><input className="form-input" type="number" style={{ width:'60px', padding:'4px 6px' }} value={newTypeForm.sort_order} onChange={e => setNewTypeForm(f => ({...f, sort_order: Number(e.target.value)||0}))} /></td>
                    <td style={{ padding:'6px 8px', textAlign:'right' }}>
                      <button className="btn-save-role" onClick={saveNewType}>Thêm</button>
                      <button className="btn-settings secondary" style={{ fontSize:'11px', padding:'3px 8px', marginLeft:'4px' }} onClick={() => setShowNewType(false)}>Hủy</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

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
