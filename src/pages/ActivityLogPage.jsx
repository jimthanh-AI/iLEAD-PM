import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const ACTION_LABEL = { created: 'tạo mới', updated: 'cập nhật', deleted: 'xóa' };
const ACTION_COLOR = { created: '#16a34a', updated: '#2563eb', deleted: '#dc2626' };
const ACTION_BG    = { created: '#f0fdf4', updated: '#eff6ff', deleted: '#fef2f2' };
const TBL_LABEL    = {
  activities  : 'Activity',
  tasks       : 'Task',
  mel_entries : 'MEL Entry',
  partners    : 'Partner',
};

const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const initials = (name) => {
  if (!name) return '?';
  const parts = name.split(/[@.\s]+/).filter(Boolean);
  return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('');
};

const avatarColor = (name) => {
  const colors = ['#2563eb','#7c3aed','#0891b2','#16a34a','#d97706','#dc2626','#db2777'];
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
  return colors[h];
};

export default function ActivityLogPage() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    setLoading(true);
    supabase
      .from('audit_logs')
      .select('*')
      .not('changed_by', 'is', null)
      .order('changed_at', { ascending: false })
      .limit(200)
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else {
          // Deduplicate: one entry per (changed_at rounded to sec, changed_by, action, tbl, record_id)
          const seen = new Set();
          const deduped = (data || []).filter(row => {
            const key = `${row.changed_at?.substring(0,19)}_${row.changed_by}_${row.action}_${row.tbl}_${row.record_id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setLogs(deduped);
        }
        setLoading(false);
      });
  }, []);

  const filtered = filter === 'all' ? logs : logs.filter(l => l.tbl === filter);

  const users = [...new Set(logs.map(l => l.changed_by).filter(Boolean))];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Lich su hoat dong
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
          Tat ca thao tac cua nguoi dung tren he thong
        </p>
      </div>

      {/* Active users today */}
      {users.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {users.map(u => (
            <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 10px 4px 6px', fontSize: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: avatarColor(u), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                {initials(u)}
              </div>
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>{u}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['all','Tat ca'],['activities','Activity'],['tasks','Task'],['mel_entries','MEL'],['partners','Partner']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            style={{
              padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)',
              background: filter === val ? 'var(--accent)' : 'var(--surface)',
              color: filter === val ? '#fff' : 'var(--text2)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading && <div style={{ color: 'var(--text2)', fontSize: 14, padding: 24, textAlign: 'center' }}>Dang tai...</div>}
      {error && <div style={{ color: '#dc2626', fontSize: 13, padding: 16, background: '#fef2f2', borderRadius: 8 }}>Loi: {error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ color: 'var(--text2)', fontSize: 14, padding: 40, textAlign: 'center' }}>
          Chua co hoat dong nao duoc ghi nhan.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((log, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '12px 14px',
          }}>
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: avatarColor(log.changed_by),
              color: '#fff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              {initials(log.changed_by)}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                  {log.changed_by}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 4,
                  background: ACTION_BG[log.action], color: ACTION_COLOR[log.action],
                }}>
                  {ACTION_LABEL[log.action] || log.action}
                </span>
                <span style={{
                  fontSize: 11, padding: '1px 7px', borderRadius: 4,
                  background: 'var(--bg)', color: 'var(--text2)', border: '1px solid var(--border)',
                }}>
                  {TBL_LABEL[log.tbl] || log.tbl}
                </span>
              </div>

              {log.new_val && (
                <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 3, fontStyle: 'italic' }}>
                  "{log.new_val}"
                </div>
              )}

              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
                {fmtTime(log.changed_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
