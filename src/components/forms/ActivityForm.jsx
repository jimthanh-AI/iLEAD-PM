import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { STAGES, STAGE_LABELS, STATUS_LABELS, generateId, BALL_OWNERS } from '../../utils/constants';
import { Modal } from '../Modal';

const defaultForm = {
  name:'', name_en:'', status:'not_started', stage:'S1',
  activityTypeCode:'', iteration:1,
  ballOwner:'', ca:'',
  reachTotal:0, reachWomen:0, reachMen:0,
  budget_planned:'', budget_actual:'',
  startDate:'', endDate:'', nextAction:'', notes:'',
};

const fromActivity = (a) => ({
  name:             a.name             || '',
  name_en:          a.name_en          || '',
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
  const { addActivity, updateActivity, activityTypes = [] } = useData();
  const activityTypeMap = Object.fromEntries(activityTypes.map(t => [t.code, t]));
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
      const t = activityTypeMap[code];
      if (t && !form.budget_planned) set('budget_planned', t.standardBudgetCad);
    }
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { setError('Enter activity name'); return; }
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      setError('Start date cannot be after end date'); return;
    }
    try {
      if (editActivity) {
        updateActivity(editActivity.id, { ...form });
      } else {
        addActivity({
          id: generateId('a'),
          partnerId,
          ...form,
        });
      }
      setForm(defaultForm);
      setError('');
      onClose();
    } catch (e) {
      setError('Error: ' + e.message);
    }
  };

  const handleClose = () => { setForm(defaultForm); setError(''); onClose(); };

  const selectedType = form.activityTypeCode ? activityTypeMap[form.activityTypeCode] : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editActivity ? 'Edit Activity' : 'Add New Activity'}
      onSubmit={handleSubmit}
      submitLabel={editActivity ? 'Update' : 'Add'}
    >
      {/* Activity Type */}
      <div className="form-group">
        <label className="form-label">Activity Type</label>
        <select className="form-select" value={form.activityTypeCode} onChange={e => handleTypeChange(e.target.value)}>
          <option value="">— Select type —</option>
          {activityTypes.map(t => (
            <option key={t.code} value={t.code}>
              {t.code} · {t.nameVi}
            </option>
          ))}
        </select>
        {selectedType && selectedType.code !== 'X' && (
          <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'4px' }}>
            📊 Standard reach: {selectedType.standardReach} people · 💰 Standard budget: ${selectedType.standardBudgetCad.toLocaleString()} CAD
          </div>
        )}
      </div>

      {/* Name */}
      <div className="form-group">
        <label className="form-label">Activity Name *</label>
        <input autoFocus className="form-input" value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. ToT for Civil Servants on RBP/ESG – VCCI MTTN" />
      </div>

      {/* Name EN */}
      <div className="form-group">
        <label className="form-label">Activity Name (English) <span style={{ fontWeight: 400, color: 'var(--text3)', fontSize: 11 }}>— used in English Project Report</span></label>
        <input className="form-input" value={form.name_en}
          onChange={e => set('name_en', e.target.value)}
          placeholder="e.g. VCCI MTTN - ToT for Civil Servants on RBP/ESG" />
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
          <label className="form-label">Current Stage</label>
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
              <option value="">— Select —</option>
              {BALL_OWNERS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">CA Advisor</label>
            <input className="form-input" value={form.ca}
              onChange={e => set('ca', e.target.value)} placeholder="CA name" />
          </div>
        </div>
      )}

      {/* Iteration — edit only */}
      {editActivity && (
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Iteration</label>
            <input className="form-input" type="number" min="1" value={form.iteration}
              onChange={e => set('iteration', Number(e.target.value) || 1)} />
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input className="form-input" type="date" value={form.startDate}
            max={form.endDate || undefined}
            onChange={e => set('startDate', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">End Date</label>
          <input className="form-input" type="date" value={form.endDate}
            min={form.startDate || undefined}
            onChange={e => set('endDate', e.target.value)} />
        </div>
      </div>

      {/* Reach — ước lượng khi tạo mới, thực tế khi Done */}
      {(
        <div style={{ background:'var(--bg2)', borderRadius:'var(--radius)', padding:'12px', marginBottom:'4px' }}>
          <div style={{ fontSize:'12px', fontWeight:600, color:'var(--text2)', marginBottom:'8px' }}>
            {editActivity ? 'Participants' : 'Estimated participants'} (Reach)
            {!editActivity && <span style={{ fontWeight:400, color:'var(--text3)', marginLeft:'6px' }}>· enter planned estimate, update actuals after Done</span>}
          </div>
          <div className="form-row" style={{ marginBottom:0 }}>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Total</label>
              <input className="form-input" type="number" min="0" value={form.reachTotal}
                onChange={e => set('reachTotal', Number(e.target.value) || 0)} />
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Women</label>
              <input className="form-input" type="number" min="0" value={form.reachWomen}
                onChange={e => set('reachWomen', Number(e.target.value) || 0)} />
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Men</label>
              <input className="form-input" type="number" min="0" value={form.reachMen}
                onChange={e => set('reachMen', Number(e.target.value) || 0)} />
            </div>
          </div>
          {form.reachTotal > 0 && (
            <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'6px' }}>
              % women: {Math.round((form.reachWomen / form.reachTotal) * 100)}%
              {selectedType && selectedType.code !== 'X' && ` · Target: ${selectedType.standardReach} people`}
            </div>
          )}
          {(Number(form.reachWomen) + Number(form.reachMen)) > Number(form.reachTotal) && Number(form.reachTotal) > 0 && (
            <div style={{ fontSize:'11px', color:'var(--red)', marginTop:'4px' }}>
              ⚠ Women + Men ({Number(form.reachWomen) + Number(form.reachMen)}) exceeds Total ({form.reachTotal}) — please check figures.
            </div>
          )}
          {Number(form.reachWomen) > Number(form.reachTotal) && Number(form.reachTotal) > 0 && (
            <div style={{ fontSize:'11px', color:'var(--red)', marginTop:'4px' }}>
              ⚠ Women count ({form.reachWomen}) cannot exceed Total ({form.reachTotal}).
            </div>
          )}
        </div>
      )}

      {/* Budget (CAD) */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Budget Planned (CAD)</label>
          <input className="form-input" type="number" min="0" step="500"
            value={form.budget_planned}
            onChange={e => set('budget_planned', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0" />
        </div>
        {/* Budget actual — edit only */}
        {editActivity && (
          <div className="form-group">
            <label className="form-label">Actual (CAD)</label>
            <input className="form-input" type="number" min="0" step="500"
              value={form.budget_actual}
              onChange={e => set('budget_actual', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0" />
          </div>
        )}
      </div>

      {/* Budget over-planned warning */}
      {editActivity && form.budget_actual > 0 && form.budget_planned > 0 && Number(form.budget_actual) > Number(form.budget_planned) && (
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'var(--radius)', padding:'8px 12px', fontSize:'12px', color:'#92400e', marginTop:'-4px', marginBottom:'4px' }}>
          ⚠ Actual (<strong>${Number(form.budget_actual).toLocaleString()}</strong>) exceeds planned (<strong>${Number(form.budget_planned).toLocaleString()}</strong>) — variance ${(Number(form.budget_actual) - Number(form.budget_planned)).toLocaleString()} CAD. Please report to PM.
        </div>
      )}

      {/* Ghi chú / Blocker */}
      <div className="form-group">
        <label className="form-label">Notes / Blocker</label>
        <input className="form-input" value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Waiting for Jane to approve, blocked by…" />
      </div>

      {/* Conflict banner */}
      {conflict && (
        <div style={{ background:'var(--orange-bg)', border:'1px solid var(--orange)', borderRadius:'var(--radius)', padding:'10px 12px', marginTop:'8px', fontSize:'12px' }}>
          ⚠️ <strong>Conflict:</strong> This record was just updated by someone else.
          <div style={{ marginTop:'6px', display:'flex', gap:'8px' }}>
            <button className="btn btn-sm" style={{ fontSize:'11px' }}
              onClick={() => { setConflict(false); openSignatureRef.current = getSignature(editActivity); }}>
              Overwrite (keep my version)
            </button>
            <button className="btn btn-sm btn-primary" style={{ fontSize:'11px' }} onClick={handleClose}>
              Reload latest version
            </button>
          </div>
        </div>
      )}
      {error && <p style={{ color:'var(--red)', fontSize:'12px', marginTop:'4px' }}>{error}</p>}
    </Modal>
  );
};
