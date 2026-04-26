import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import './AuditLog.css';

// Human-readable Vietnamese labels for each field
const FIELD_LABELS = {
  name          : 'Tên',
  status        : 'Trạng thái',
  stage         : 'Stage',
  ballOwner     : 'Ball Owner',
  ca            : 'CA Advisor',
  type          : 'Loại',
  subCode       : 'Mã ngân sách',
  startDate     : 'Ngày bắt đầu',
  endDate       : 'Ngày kết thúc',
  nextAction    : 'Bước tiếp theo',
  notes         : 'Ghi chú',
  budget_planned: 'Ngân sách KH',
  budget_actual : 'Ngân sách TT',
  description   : 'Mô tả',
  partnerId     : 'Đối tác',
  assignee      : 'Giao cho',
  dueDate       : 'Deadline',
  color         : 'Màu sắc',
  sector        : 'Lĩnh vực',
  region        : 'Khu vực',
};

const STATUS_VI = {
  not_started  : 'Chưa bắt đầu',
  in_progress  : 'Đang thực hiện',
  done         : 'Hoàn thành',
  not_completed: 'Không hoàn thành',
  todo         : 'Todo',
};

// Format a raw value for display (translate status codes, format dates etc.)
const fmtVal = (val) => {
  if (val === null || val === undefined || val === '') return '—';
  return STATUS_VI[val] || val;
};

const fmtDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const ACTION_ICON  = { created: '✨', updated: '✏️', deleted: '🗑️' };
const ACTION_COLOR = { created: 'var(--green)', updated: 'var(--accent)', deleted: 'var(--red)' };
const ACTION_LABEL = { created: 'Tạo mới', updated: 'Cập nhật', deleted: 'Đã xóa' };

// ─────────────────────────────────────────────────
const AuditLog = ({ tableName, recordId }) => {
  const [open, setOpen]       = useState(false);
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!open || !recordId) return;
    setLoading(true);
    setError(null);
    supabase
      .from('audit_logs')
      .select('*')
      .eq('tbl', tableName)
      .eq('record_id', recordId)
      .order('changed_at', { ascending: false })
      .limit(60)
      .then(({ data, error: err }) => {
        if (err) setError('Không thể tải lịch sử. Hãy chạy schema_sprint2.sql trên Supabase.');
        else setLogs(data || []);
        setLoading(false);
      });
  }, [open, tableName, recordId]);

  // Group consecutive entries with the same changed_at (same save = same batch)
  const grouped = logs.reduce((acc, log) => {
    const key = log.changed_at + '_' + (log.changed_by || '');
    if (!acc[key]) acc[key] = { meta: log, entries: [] };
    acc[key].entries.push(log);
    return acc;
  }, {});

  return (
    <div className="alog-wrap glass-card">
      {/* Header — clickable to toggle */}
      <div className="alog-hdr" onClick={() => setOpen(o => !o)}>
        <span className="alog-hdr-title">🕐 Lịch sử thay đổi</span>
        <span className="alog-toggle">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="alog-body">
          {loading && <div className="alog-empty">Đang tải...</div>}
          {error   && <div className="alog-error">{error}</div>}

          {!loading && !error && Object.keys(grouped).length === 0 && (
            <div className="alog-empty">Chưa có lịch sử thay đổi nào.</div>
          )}

          {!loading && !error && Object.values(grouped).map(({ meta, entries }) => (
            <div key={meta.changed_at + meta.changed_by} className="alog-group">
              {/* Group header: who + when + action type */}
              <div className="alog-group-hdr">
                <span
                  className="alog-action-icon"
                  style={{ color: ACTION_COLOR[meta.action] }}
                  title={ACTION_LABEL[meta.action]}
                >
                  {ACTION_ICON[meta.action]}
                </span>
                <span className="alog-user">{meta.changed_by || 'Unknown'}</span>
                <span className="alog-action-lbl" style={{ color: ACTION_COLOR[meta.action] }}>
                  {ACTION_LABEL[meta.action]}
                </span>
                <span className="alog-time">{fmtDateTime(meta.changed_at)}</span>
              </div>

              {/* Field-level diff rows (only for 'updated') */}
              {meta.action === 'updated' && entries.map((e, i) => (
                <div key={i} className="alog-diff-row">
                  <span className="alog-field">{FIELD_LABELS[e.field] || e.field}</span>
                  <span className="alog-old">{fmtVal(e.old_val)}</span>
                  <span className="alog-arrow">→</span>
                  <span className="alog-new">{fmtVal(e.new_val)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLog;
