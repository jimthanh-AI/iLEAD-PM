import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import {
  INDICATOR_GROUPS, INDICATOR_CODES, getQuarter, QUARTER_LABELS, generateId, toMELDate,
} from '../../utils/constants';
import { Modal } from '../Modal';

// Activity Type → suggested Indicator Group codes
const TYPE_TO_GROUPS = {
  '1A': ['1111A','1111B','1211'],
  '1B': ['1221A','1222'],
  '2A': ['1111A','1111B','1112'],
  '2B': ['1221A','1222'],
  '3':  ['1111A','1111B'],
  '4':  ['1112','1111A'],
  '5':  ['1112','1222'],
  '6':  ['1121A','1121B','1121C','1211'],
  '7':  ['1221A','1221B'],
  '8':  ['1221A','1221B','1221C'],
};

const QUARTER_KEYS = ['Q1','Q2','Q3','Q4'];

const defaultRow = (groupCode, subCode, quarter) => {
  const row = { groupCode, subCode, m: 0, f: 0 };
  QUARTER_KEYS.forEach(q => { row[`${q}_active`] = (q === quarter); });
  return row;
};

export const MelWizard = ({ isOpen, onClose, activity, partner }) => {
  const { addMelEntry } = useData();

  const [step, setStep]         = useState(1);
  const [description, setDesc]  = useState('');
  const [date, setDate]         = useState('');
  const [quarter, setQuarter]   = useState('Q1');
  const [selected, setSelected] = useState({});   // groupCode → subCode
  const [rows, setRows]         = useState([]);   // [{groupCode,subCode,m,f}]
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!isOpen || !activity) return;
    const d = activity.endDate || activity.startDate || '';
    setDate(d);
    setQuarter(getQuarter(d));
    const partnerName = partner?.name || '';
    setDesc(`${partnerName}${partnerName ? ' – ' : ''}${activity.name}`);
    // Pre-select groups based on activity type
    const suggested = TYPE_TO_GROUPS[activity.activityTypeCode] || [];
    const init = {};
    suggested.forEach(gc => {
      const g = INDICATOR_GROUPS.find(x => x.code === gc);
      if (g) init[gc] = g.subCodes[0] || '';
    });
    setSelected(init);
    setRows([]);
    setStep(1);
    setError('');
  }, [isOpen, activity]);

  // Build subCode options for a group
  const subCodesFor = (groupCode) => {
    const g = INDICATOR_GROUPS.find(x => x.code === groupCode);
    if (!g) return [];
    return g.subCodes.map(sc => {
      const ic = INDICATOR_CODES.find(x => x.code === sc);
      return { code: sc, label: ic?.label || sc };
    });
  };

  const toggleGroup = (gc) => {
    setSelected(prev => {
      const next = { ...prev };
      if (next[gc] !== undefined) {
        delete next[gc];
      } else {
        const g = INDICATOR_GROUPS.find(x => x.code === gc);
        next[gc] = g?.subCodes[0] || '';
      }
      return next;
    });
  };

  const goToStep3 = () => {
    if (Object.keys(selected).length === 0) {
      setError('Chọn ít nhất 1 indicator group'); return;
    }
    setError('');
    const q = getQuarter(date);
    setQuarter(q);
    setRows(
      Object.entries(selected).map(([gc, sc]) => defaultRow(gc, sc, q))
    );
    setStep(3);
  };

  const setRow = (i, field, val) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const handleSubmit = () => {
    if (rows.some(r => r.m < 0 || r.f < 0)) {
      setError('Số người không được âm'); return;
    }
    const q = quarter;
    rows.forEach(r => {
      const entry = {
        id:             generateId('mel'),
        indicatorGroup: r.groupCode,
        subCode:        r.subCode,
        date:           date,
        partnerId:      activity.partnerId || '',
        activityId:     activity.id,
        description,
        q1_m: q==='Q1' ? Number(r.m)||0 : 0,
        q1_f: q==='Q1' ? Number(r.f)||0 : 0,
        q2_m: q==='Q2' ? Number(r.m)||0 : 0,
        q2_f: q==='Q2' ? Number(r.f)||0 : 0,
        q3_m: q==='Q3' ? Number(r.m)||0 : 0,
        q3_f: q==='Q3' ? Number(r.f)||0 : 0,
        q4_m: q==='Q4' ? Number(r.m)||0 : 0,
        q4_f: q==='Q4' ? Number(r.f)||0 : 0,
      };
      addMelEntry(entry);
    });
    onClose();
  };

  if (!activity) return null;

  const totalM = (activity.reachMen   || 0);
  const totalF = (activity.reachWomen || 0);
  const totalR = (activity.reachTotal || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ghi nhận MEL — ${step}/3`}
      onSubmit={step === 1 ? () => setStep(2) : step === 2 ? goToStep3 : handleSubmit}
      submitLabel={step === 3 ? `Tạo ${rows.length} MEL entry` : 'Tiếp theo →'}
      secondaryLabel={step > 1 ? '← Quay lại' : undefined}
      onSecondary={step > 1 ? () => setStep(s => s - 1) : undefined}
    >
      {/* ── Step 1: Confirm info ── */}
      {step === 1 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div style={{ background:'var(--bg2)', borderRadius:'var(--radius)', padding:'12px', fontSize:'13px', display:'flex', flexDirection:'column', gap:'6px' }}>
            <div><span style={{ color:'var(--text3)', minWidth:'80px', display:'inline-block' }}>Partner</span><strong>{partner?.name || '—'}</strong></div>
            <div style={{ display:'flex', gap:'16px' }}>
              <div><span style={{ color:'var(--text3)', minWidth:'80px', display:'inline-block' }}>Ngày</span>
                <input type="date" className="form-input" style={{ display:'inline-block', width:'140px', padding:'2px 6px', fontSize:'12px' }}
                  value={date} onChange={e => { setDate(e.target.value); setQuarter(getQuarter(e.target.value)); }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <span style={{ color:'var(--text3)' }}>Quarter</span>
                <span style={{ fontWeight:700, color:'var(--accent)' }}>{QUARTER_LABELS[quarter]}</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:'16px' }}>
              <div><span style={{ color:'var(--text3)' }}>Reach</span> {totalR} người ({totalM}M / {totalF}F)</div>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Description (sẽ ghi vào MEL entry)</label>
            <input className="form-input" value={description} onChange={e => setDesc(e.target.value)}
              placeholder="Mô tả hoạt động..." />
          </div>
          <div style={{ fontSize:'11px', color:'var(--text3)' }}>
            Wizard sẽ tạo MEL entries riêng cho từng indicator group bạn chọn ở bước tiếp theo.
          </div>
        </div>
      )}

      {/* ── Step 2: Select indicator groups ── */}
      {step === 2 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
          <div style={{ fontSize:'12px', color:'var(--text3)', marginBottom:'4px' }}>
            Đã đánh dấu sẵn dựa trên loại hoạt động. Chọn/bỏ chọn theo thực tế:
          </div>
          {INDICATOR_GROUPS.map(g => {
            const checked = selected[g.code] !== undefined;
            const subs = subCodesFor(g.code);
            return (
              <div key={g.code} style={{
                border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius:'var(--radius)', padding:'8px 10px',
                background: checked ? 'color-mix(in srgb, var(--accent) 6%, var(--card))' : 'var(--card)',
                cursor:'pointer',
              }}>
                <label style={{ display:'flex', alignItems:'flex-start', gap:'8px', cursor:'pointer' }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleGroup(g.code)}
                    style={{ marginTop:'2px', flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'12px', color:'var(--accent)' }}>{g.code}</span>
                      <span style={{ fontSize:'11px', color:'var(--text2)' }}>{g.label}</span>
                      <span style={{ fontSize:'10px', color:'var(--text3)', marginLeft:'auto' }}>Target: {g.targetVietnam.toLocaleString()}</span>
                    </div>
                    {checked && subs.length > 1 && (
                      <select className="form-select" style={{ marginTop:'6px', fontSize:'11px', padding:'3px 6px' }}
                        value={selected[g.code]}
                        onChange={e => setSelected(prev => ({ ...prev, [g.code]: e.target.value }))}
                        onClick={e => e.stopPropagation()}>
                        {subs.map(s => <option key={s.code} value={s.code}>{s.code} · {s.label}</option>)}
                      </select>
                    )}
                    {checked && subs.length === 1 && (
                      <div style={{ fontSize:'10px', color:'var(--text3)', marginTop:'3px' }}>Sub-code: {subs[0].code}</div>
                    )}
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Step 3: Enter M/F numbers ── */}
      {step === 3 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          <div style={{ fontSize:'12px', color:'var(--text3)', marginBottom:'2px' }}>
            Nhập số Nữ/Nam cho <strong>{QUARTER_LABELS[quarter]}</strong>. Các quarter khác tự động = 0.
          </div>
          <div style={{ fontSize:'11px', color:'var(--text2)', background:'var(--bg2)', borderRadius:'var(--radius)', padding:'8px 10px' }}>
            Reach hoạt động: <strong>{totalR}</strong> người ({totalF} Nữ / {totalM} Nam)
          </div>
          {rows.map((r, i) => {
            const g = INDICATOR_GROUPS.find(x => x.code === r.groupCode);
            const total = (Number(r.m)||0) + (Number(r.f)||0);
            return (
              <div key={i} style={{ background:'var(--bg2)', borderRadius:'var(--radius)', padding:'10px 12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'12px', color:'var(--accent)' }}>{r.groupCode}</span>
                  <span style={{ fontSize:'10px', color:'var(--text3)' }}>{r.subCode}</span>
                  <span style={{ fontSize:'11px', color:'var(--text2)', flex:1 }}>{g?.label}</span>
                  {total > 0 && <span style={{ fontSize:'11px', fontWeight:600 }}>{total} người</span>}
                </div>
                <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:'11px', color:'var(--text3)', display:'block', marginBottom:'2px' }}>Nữ</label>
                    <input className="form-input" type="number" min="0" value={r.f}
                      onChange={e => setRow(i, 'f', e.target.value)}
                      style={{ textAlign:'center' }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:'11px', color:'var(--text3)', display:'block', marginBottom:'2px' }}>Nam</label>
                    <input className="form-input" type="number" min="0" value={r.m}
                      onChange={e => setRow(i, 'm', e.target.value)}
                      style={{ textAlign:'center' }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:'11px', color:'var(--text3)', display:'block', marginBottom:'2px' }}>Sub-code</label>
                    <select className="form-select" style={{ fontSize:'11px' }}
                      value={r.subCode}
                      onChange={e => setRow(i, 'subCode', e.target.value)}>
                      {subCodesFor(r.groupCode).map(s => (
                        <option key={s.code} value={s.code}>{s.code}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p style={{ color:'var(--red)', fontSize:'12px', marginTop:'4px' }}>{error}</p>}
    </Modal>
  );
};
