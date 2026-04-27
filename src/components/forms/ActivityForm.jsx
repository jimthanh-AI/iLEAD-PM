import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { STAGES, STAGE_LABELS, STATUS_LABELS, ACTIVITY_TYPES, ACTIVITY_TYPE_MAP, generateId, BALL_OWNERS } from '../../utils/constants';
import { Modal } from '../Modal';

const defaultForm = {
  name:'', status:'not_started', stage:'S1',
  activityTypeCode:'', iteration:1,
  ballOwner:'', ca:'',
  reachTotal:0, reachWomen:0, reachMen:0,
  budget_planned:'', budget_actual:'',
  startDate:'', endDate:'', nextAction:'', notes:'',
};

const fromActivity = (a) => ({
  name:             a.name             || '',
  status:           a.status           || 'not_started',
  stage:            a.stage            || 'S1',
  activityTypeCode: a.activityTypeCode || '',
  iteration:        a.iteration        || 1,
  ballOwner:        a.ballOwner        || '',
  ca:               a.ca               || '',
  reachTotal:       a.reachTotal       ?? 0,
  reachWomen:       a.reachWomen       ?? 0,
  reachMen:         a.reachMen         ?? 0,
  budget_planned:   a.budget_planned   ?? '',
  budget_actual:    a.budget_actual    ?? '',
  startDate:        a.startDate        || '',
  endDate:          a.endDate          || '',
  nextAction:       a.nextAction       || '',
  notes:            a.notes            || '',
});

export const ActivityForm = ({ isOpen, onClose, partnerId, editActivity }) => {
  const { addActivity, updateActivity } = useData();
  const bodyRef = useRef(null);
  const openSignatureRef = useRef(null);

  const [form, setForm] = useState(editActivity ? fromActivity(editActivity) : defaultForm);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);

  const getSignature = (a) => a ? `${a.updated_at||''}_${a.status}_${a.stage}_${a.name}` : null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setConflict(false);
    openSignatureRef.current = getSignature(editActivity);
    setForm(editActivity ? fromActivity(editActivity) : defaultForm);
    setTimeout(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; }, 50);
  }, [isOpen, editActivity]);

  // Detect concurrent edit
  useEffect(() => {
    if (!isOpen || !editActivity || openSignatureRef.current === null) return;
    if (getSignature(editActivity) !== openSignatureRef.current) setConflict(true);
  }, [editActivity]); // eslint-disable-line

  // Auto-fill budget when activity type is selected (new activity only)
  const handleTypeChange = (code) => {
    set('activityTypeCode', code);
    if (!editActivity && code) {
      const t = ACTIVITY_TYPE_MAP[code];
      if (t && !form.budget_planned) set('budget_planned', t.standardBudgetCad);
    }
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { setError('Nhập tên activity'); return; }
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      setError('Ngày bắt đầu không được sau ngày kết thúc'); return;
    }
    try {
      if (editActivity) {
        updateActivity(editActivity.id, { ...form });
      } else {
        addActivity({
          id: generateId('a'),
          partnerId,
          ...form,
          pos: Date.now(),
        });
      }
      setForm(defaultForm);
      setError('');
      onClose();
    } catch (e) {
      setError('Lỗi: ' + e.message);
    }
  };

  const handleClose = () => { setForm(defaultForm); setError(''); onClose(); };

  const selectedType = form.activityTypeCode ? ACTIVITY_TYPE_MAP[form.activityTypeCode] : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editActivity ? 'Sửa activity' : 'Thêm activity mới'}
      onSubmit={handleSubmit}
      submitLabel={editActivity ? 'Cập nhật' : 'Thêm mới'}
    >
      {/* Activity Type */}
      <div className="form-group">
        <label className="form-label">Loại hoạt động (Activity Type)</label>
        <select className="form-select" value={form.activityTypeCode} onChange={e => handleTypeChange(e.target.value)}>
          <option value="">— Chọn loại —</option>
          {ACTIVITY_TYPES.map(t => (
            <option key={t.code} value={t.code}>
              {t.code} · {t.nameVi}
            </option>
          ))}
        </select>
        {selectedType && selectedType.code !== 'X' && (
          <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'4px' }}>
            📊 Reach chuẩn: {selectedType.standardReach} người · 💰 Ngân sách chuẩn: ${selectedType.standardBudgetCad.toLocaleString()} CAD
          </div>
        )}
      </div>

      {/* Name */}
      <div className="form-group">
        <label className="form-label">Tên hoạt động *</label>
        <input autoFocus className="form-input" value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="VD: ToT cán bộ công chức về RBP/ESG – VCCI MTTN" />
      </div>

      {/* Status + Stage */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            {['not_started','in_progress','done','not_completed'].map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Stage hiện tại</label>
          <select className="form-select" value={form.stage} onChange={e => set('stage', e.target.value)}>
            {STAGES.map(s => (
              <option key={s} value={s}>{s}: {STAGE_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ball Owner + CA — edit only */}
      {editActivity && (
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Ball Owner</label>
            <select className="form-select" value={form.ballOwner} onChange={e => set('ballOwner', e.target.value)}>
              <option value="">— Chọn —</option>
              {BALL_OWNERS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">CA Advisor</label>
            <input className="form-input" value={form.ca}
              onChange={e => set('ca', e.target.value)} placeholder="Tên CA" />
          </div>
        </div>
      )}

      {/* Iteration — edit only */}
      {editActivity && (
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Lần thứ</label>
            <input className="form-input" type="number" min="1" value={form.iteration}
              onChange={e => set('iteration', Number(e.target.value) || 1)} />
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Ngày bắt đầu</label>
          <input className="form-input" type="date" value={form.startDate}
            max={form.endDate || undefined}
            onChange={e => set('startDate', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Ngày kết thúc</label>
          <input className="form-input" type="date" value={form.endDate}
            min={form.startDate || undefined}
            onChange={e => set('endDate', e.target.value)} />
        </div>
      </div>

      {/* Reach — edit only (fill after activity is done) */}
      {editActivity && (
        <div style={{ background:'var(--bg2)', borderRadius:'var(--radius)', padding:'12px', marginBottom:'4px' }}>
          <div style={{ fontSize:'12px', fontWeight:600, color:'var(--text2)', marginBottom:'8px' }}>
            Số người tham gia (Reach)
          </div>
          <div className="form-row" style={{ marginBottom:0 }}>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Tổng</label>
              <input className="form-input" type="number" min="0" value={form.reachTotal}
                onChange={e => set('reachTotal', Number(e.target.value) || 0)} />
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Phụ nữ</label>
              <input className="form-input" type="number" min="0" value={form.reachWomen}
                onChange={e => set('reachWomen', Number(e.target.value) || 0)} />
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Nam</label>
              <input className="form-input" type="number" min="0" value={form.reachMen}
                onChange={e => set('reachMen', Number(e.target.value) || 0)} />
            </div>
          </div>
          {form.reachTotal > 0 && (
            <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'6px' }}>
              % phụ nữ: {Math.round((form.reachWomen / form.reachTotal) * 100)}%
              {selectedType && selectedType.code !== 'X' && ` · Target: ${selectedType.standardReach} người`}
            </div>
          )}
        </div>
      )}

      {/* Budget (CAD) */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Ngân sách KH (CAD)</label>
          <input className="form-input" type="number" min="0" step="500"
            value={form.budget_planned}
            onChange={e => set('budget_planned', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0" />
        </div>
        {/* Budget actual — edit only */}
        {editActivity && (
          <div className="form-group">
            <label className="form-label">Thực tế (CAD)</label>
            <input className="form-input" type="number" min="0" step="500"
              value={form.budget_actual}
              onChange={e => set('budget_actual', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0" />
          </div>
        )}
      </div>

      {/* Ghi chú / Blocker */}
      <div className="form-group">
        <label className="form-label">Ghi chú / Blocker</label>
        <input className="form-input" value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Đang chờ Jane approve, blocked by…" />
      </div>

      {/* Conflict banner */}
      {conflict && (
        <div style={{ background:'var(--orange-bg)', border:'1px solid var(--orange)', borderRadius:'var(--radius)', padding:'10px 12px', marginTop:'8px', fontSize:'12px' }}>
          ⚠️ <strong>Xung đột:</strong> Bản ghi này vừa được cập nhật bởi người khác.
          <div style={{ marginTop:'6px', display:'flex', gap:'8px' }}>
            <button className="btn btn-sm" style={{ fontSize:'11px' }}
              onClick={() => { setConflict(false); openSignatureRef.current = getSignature(editActivity); }}>
              Ghi đè (giữ bản của tôi)
            </button>
            <button className="btn btn-sm btn-primary" style={{ fontSize:'11px' }} onClick={handleClose}>
              Tải lại bản mới nhất
            </button>
          </div>
        </div>
      )}
      {error && <p style={{ color:'var(--red)', fontSize:'12px', marginTop:'4px' }}>{error}</p>}
    </Modal>
  );
};
