import React, { useState, useMemo } from 'react';
import { Plus, Download, Upload, Trash2, Edit2, X, Copy, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { generateMELReport } from '../utils/reportGenerator';
import { useData } from '../context/DataContext';
import {
  INDICATOR_GROUPS, INDICATOR_GROUP_MAP, INDICATOR_CODES, INDICATOR_MAP,
  getQuarter, QUARTER_LABELS, toMELDate, fromMELDate,
} from '../utils/constants';
import './MELEntry.css';

const EMPTY_FORM = {
  indicatorGroup:'', subCode:'', date:'', partnerId:'', activityId:'',
  description:'',
  q1_m:0, q1_f:0, q2_m:0, q2_f:0, q3_m:0, q3_f:0, q4_m:0, q4_f:0,
};

// quarter field keys
const QF = { Q1:['q1_m','q1_f'], Q2:['q2_m','q2_f'], Q3:['q3_m','q3_f'], Q4:['q4_m','q4_f'] };
const entryTotal = e => (e.q1_m||0)+(e.q1_f||0)+(e.q2_m||0)+(e.q2_f||0)+(e.q3_m||0)+(e.q3_f||0)+(e.q4_m||0)+(e.q4_f||0);

export default function MELEntry() {
  const { melEntries, partners, partnerMap, activities, activityMap, partnerBudgets,
          addMelEntry, updateMelEntry, deleteMelEntry, canEdit, canDelete } = useData();

  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [filterGroup, setFilterGroup] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [copied, setCopied]         = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(() =>
    Object.fromEntries(INDICATOR_GROUPS.map(g => [g.code, false]))
  );
  const toggleGroup = (code) => setExpandedGroups(prev => ({ ...prev, [code]: !prev[code] }));

  // ── Derived ───────────────────────────────────────────────────
  const autoQuarter  = useMemo(() => getQuarter(form.date), [form.date]);
  const validSubCodes = useMemo(() => {
    const g = INDICATOR_GROUP_MAP[form.indicatorGroup];
    if (!g) return INDICATOR_CODES;
    return INDICATOR_CODES.filter(c => g.subCodes.includes(c.code));
  }, [form.indicatorGroup]);

  const filtered = useMemo(() =>
    filterGroup ? melEntries.filter(e => e.indicatorGroup === filterGroup) : melEntries,
    [melEntries, filterGroup]);

  // Group for display — preserve MEL Master order (INDICATOR_GROUPS order)
  const grouped = useMemo(() => {
    const m = {};
    INDICATOR_GROUPS.forEach(g => { m[g.code] = { ...g, entries: [] }; });
    filtered.forEach(e => { if (m[e.indicatorGroup]) m[e.indicatorGroup].entries.push(e); });
    return INDICATOR_GROUPS
      .map(g => m[g.code])
      .filter(g => g.entries.length > 0 || !filterGroup);
  }, [filtered, filterGroup]);

  // ── Form helpers ──────────────────────────────────────────────
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  };
  const openNewForGroup = (groupCode) => {
    setForm({ ...EMPTY_FORM, indicatorGroup: groupCode });
    setEditId(null);
    setShowForm(true);
  };
  const openEdit = (e) => {
    setForm({ ...e });
    setEditId(e.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const submitForm = () => {
    if (!form.indicatorGroup || !form.subCode || !form.date) return;
    const entry = {
      ...form,
      q1_m: +form.q1_m||0, q1_f: +form.q1_f||0,
      q2_m: +form.q2_m||0, q2_f: +form.q2_f||0,
      q3_m: +form.q3_m||0, q3_f: +form.q3_f||0,
      q4_m: +form.q4_m||0, q4_f: +form.q4_f||0,
    };
    if (editId) {
      updateMelEntry(editId, entry);
    } else {
      addMelEntry({ ...entry, id: crypto.randomUUID() });
    }
    closeForm();
  };

  // ── Export CSV ────────────────────────────────────────────────
  const exportCSV = () => {
    const header = ',± Người,Code,Sub_Code,Date,Partner,Activities,Type,Indicator,Baseline,Target,Source of Data,Target Vietnam,Method,Frequency,Responsability,Actual,Q1_M,Q1_F,Q1_T,Q2_M,Q2_F,Q2_T,Q3_M,Q3_F,Q3_T,Q4_M,Q4_F,Q4_T';
    const rows = filtered.map(e => {
      const partner = partnerMap[e.partnerId];
      const q1t = (e.q1_m||0)+(e.q1_f||0), q2t = (e.q2_m||0)+(e.q2_f||0);
      const q3t = (e.q3_m||0)+(e.q3_f||0), q4t = (e.q4_m||0)+(e.q4_f||0);
      const total = q1t+q2t+q3t+q4t;
      return [
        '','', e.indicatorGroup, e.subCode, toMELDate(e.date),
        partner?.name || '', `"${(e.description||'').replace(/"/g,'""')}"`,
        '','','','','','','','','',
        total,
        e.q1_m||0, e.q1_f||0, q1t,
        e.q2_m||0, e.q2_f||0, q2t,
        e.q3_m||0, e.q3_f||0, q3t,
        e.q4_m||0, e.q4_f||0, q4t,
      ].join(',');
    });
    return [header, ...rows].join('\n');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportCSV()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadCSV = () => {
    const blob = new Blob([exportCSV()], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `MEL_entries_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import CSV ────────────────────────────────────────────────
  const parseImport = () => {
    setImportError('');
    const lines = importText.trim().split('\n').filter(l => l.trim());
    const parsed = [];
    let errors = 0;
    lines.forEach((line, i) => {
      const cols = line.split(',');
      const group   = cols[2]?.trim();
      const subCode = cols[3]?.trim();
      if (!group || !subCode || !INDICATOR_GROUP_MAP[group]) { errors++; return; }
      const partnerName = cols[5]?.trim();
      const partner = partners.find(p =>
        p.name === partnerName || p.name.toLowerCase().includes(partnerName?.toLowerCase()) );
      const n = (s) => parseInt(s?.trim() || '0') || 0;
      parsed.push({
        id: crypto.randomUUID(),
        indicatorGroup: group, subCode,
        date: fromMELDate(cols[4]?.trim()),
        partnerId: partner?.id || '',
        activityId: '',
        description: (cols[6]?.trim() || '').replace(/^"|"$/g,''),
        q1_m: n(cols[17]), q1_f: n(cols[18]),
        q2_m: n(cols[20]), q2_f: n(cols[21]),
        q3_m: n(cols[23]), q3_f: n(cols[24]),
        q4_m: n(cols[26]), q4_f: n(cols[27]),
      });
    });
    if (parsed.length === 0) {
      setImportError('Không tìm thấy dòng hợp lệ. Hãy kiểm tra lại định dạng.');
      return;
    }
    parsed.forEach(e => addMelEntry(e));
    setImportText('');
    setShowImport(false);
    if (errors > 0) setImportError(`Đã import ${parsed.length} dòng. ${errors} dòng bị bỏ qua.`);
  };

  // ── Group subtotals ───────────────────────────────────────────
  const groupTotal = (entries, field) => entries.reduce((s, e) => s + (e[field]||0), 0);

  // ── Report ────────────────────────────────────────────────────
  const indicatorStats = useMemo(() => {
    const map = {};
    INDICATOR_GROUPS.forEach(g => { map[g.code] = { ...g, actual: 0, male: 0, female: 0 }; });
    melEntries.forEach(e => {
      if (!map[e.indicatorGroup]) return;
      const m = (e.q1_m||0)+(e.q2_m||0)+(e.q3_m||0)+(e.q4_m||0);
      const f = (e.q1_f||0)+(e.q2_f||0)+(e.q3_f||0)+(e.q4_f||0);
      map[e.indicatorGroup].actual  += m + f;
      map[e.indicatorGroup].male    += m;
      map[e.indicatorGroup].female  += f;
    });
    return Object.values(map);
  }, [melEntries]);

  const openReport = () => generateMELReport({
    indicatorStats,
    partners,
    partnerBudgets,
    melEntries: filtered,
    activityMap,
    partnerMap,
  });

  return (
    <div className="mel-entry-page">
      {/* ── Page Header ── */}
      <div className="mel-entry-header">
        <div>
          <h1>MEL Entries</h1>
          <p className="mel-entry-sub">Nhập kết quả thực tế → export paste vào MEL_Master Excel</p>
        </div>
        <div className="mel-entry-actions">
          {canEdit && (
            <>
              <button className="btn-secondary" onClick={() => setShowImport(true)}>
                <Upload size={14} /> Import CSV
              </button>
              <button className="btn-primary" onClick={openNew}>
                <Plus size={14} /> Thêm Entry
              </button>
            </>
          )}
          <button className="btn-secondary" onClick={openReport}>
            <FileText size={14} /> Report
          </button>
          <button className="btn-secondary" onClick={copyToClipboard}>
            <Copy size={14} /> {copied ? 'Đã copy!' : 'Copy CSV'}
          </button>
          <button className="btn-secondary" onClick={downloadCSV}>
            <Download size={14} /> Tải CSV
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="mel-filter-bar">
        <label>Lọc theo nhóm:</label>
        <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
          <option value="">Tất cả ({melEntries.length} entries)</option>
          {INDICATOR_GROUPS.map(g => {
            const cnt = melEntries.filter(e => e.indicatorGroup === g.code).length;
            return <option key={g.code} value={g.code}>{g.code} ({cnt})</option>;
          })}
        </select>
        <span className="mel-filter-hint">Tổng: {filtered.length} entries · {filtered.reduce((s,e)=>s+entryTotal(e),0).toLocaleString()} người</span>
      </div>

      {/* ── Grouped Table ── */}
      {grouped.map(group => {
        const entries = group.entries;
        const gActual = entries.reduce((s,e) => s + entryTotal(e), 0);
        const gFemale = entries.reduce((s,e) => s+(e.q1_f||0)+(e.q2_f||0)+(e.q3_f||0)+(e.q4_f||0), 0);
        const gPct    = group.targetVietnam > 0 ? (gActual/group.targetVietnam*100).toFixed(0) : 0;
        const isExpanded = expandedGroups[group.code];
        return (
          <div key={group.code} className="mel-group">
            <div className="mel-group-header" style={{cursor:'pointer'}} onClick={() => toggleGroup(group.code)}>
              <span className="mel-group-chevron">{isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</span>
              <div className="mel-group-code">{group.code}</div>
              <div className="mel-group-desc">{group.label}</div>
              <div className="mel-group-stats">
                <span>Target VN: <strong>{group.targetVietnam.toLocaleString()}</strong></span>
                <span>Actual: <strong>{gActual.toLocaleString()}</strong></span>
                <span>Female: <strong>{gFemale.toLocaleString()}</strong></span>
                <span className={+gPct >= 100 ? 'pct done' : +gPct > 30 ? 'pct prog' : 'pct low'}>
                  {gPct}%
                </span>
              </div>
              {canEdit && (
                <button className="btn-add-group" onClick={e => { e.stopPropagation(); openNewForGroup(group.code); }}>
                  <Plus size={13}/> Thêm
                </button>
              )}
            </div>

            {isExpanded && entries.length === 0 && (
              <div style={{padding:'10px 16px',fontSize:'.78rem',color:'var(--text3)',fontStyle:'italic'}}>
                Chưa có entry — nhấn "+ Thêm" để bắt đầu nhập liệu cho nhóm <strong>{group.code}</strong>
              </div>
            )}
            {isExpanded && entries.length > 0 && (
              <table className="mel-table">
                <thead>
                  <tr>
                    <th>Sub-code</th><th>Date</th><th>Partner</th><th>Description</th>
                    <th>Q1 F/M</th><th>Q2 F/M</th><th>Q3 F/M</th><th>Q4 F/M</th>
                    <th>Total</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id}>
                      <td><span className="sub-badge">{e.subCode}</span></td>
                      <td>{toMELDate(e.date)}</td>
                      <td>{partnerMap[e.partnerId]?.name || <span className="ext-tag">ext</span>}</td>
                      <td className="desc-cell">{e.description}</td>
                      <td className="qcell">{e.q1_f||0} / {e.q1_m||0}</td>
                      <td className="qcell">{e.q2_f||0} / {e.q2_m||0}</td>
                      <td className="qcell">{e.q3_f||0} / {e.q3_m||0}</td>
                      <td className="qcell">{e.q4_f||0} / {e.q4_m||0}</td>
                      <td className="total-cell"><strong>{entryTotal(e)}</strong></td>
                      <td className="actions-cell">
                        {canEdit && <button className="icon-btn" onClick={() => openEdit(e)}><Edit2 size={13}/></button>}
                        {canEdit && <button className="icon-btn danger" onClick={() => deleteMelEntry(e.id)}><Trash2 size={13}/></button>}
                      </td>
                    </tr>
                  ))}
                  {/* Subtotal */}
                  <tr className="subtotal-row">
                    <td colSpan={4}><strong>Subtotal {group.code}</strong></td>
                    <td className="qcell"><strong>{groupTotal(entries,'q1_f')} / {groupTotal(entries,'q1_m')}</strong></td>
                    <td className="qcell"><strong>{groupTotal(entries,'q2_f')} / {groupTotal(entries,'q2_m')}</strong></td>
                    <td className="qcell"><strong>{groupTotal(entries,'q3_f')} / {groupTotal(entries,'q3_m')}</strong></td>
                    <td className="qcell"><strong>{groupTotal(entries,'q4_f')} / {groupTotal(entries,'q4_m')}</strong></td>
                    <td className="total-cell"><strong>{gActual}</strong></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        );
      })}

      {/* ── Entry Form Modal ── */}
      {showForm && (
        <div className="mel-modal-overlay" onClick={closeForm}>
          <div className="mel-modal" onClick={e => e.stopPropagation()}>
            <div className="mel-modal-header">
              <h2>{editId ? 'Chỉnh sửa Entry' : 'Thêm MEL Entry'}</h2>
              <button className="icon-btn" onClick={closeForm}><X size={16}/></button>
            </div>

            <div className="mel-form">
              {/* Row 1 */}
              <div className="form-row">
                <div className="form-group">
                  <label>Indicator Group *</label>
                  <select value={form.indicatorGroup} onChange={e => set('indicatorGroup', e.target.value)}>
                    <option value="">-- Chọn nhóm --</option>
                    {INDICATOR_GROUPS.map(g => <option key={g.code} value={g.code}>{g.code} — {g.label.slice(0,50)}…</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sub-code *</label>
                  <select value={form.subCode} onChange={e => set('subCode', e.target.value)}>
                    <option value="">-- Chọn sub-code --</option>
                    {validSubCodes.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="form-row">
                <div className="form-group">
                  <label>Ngày *</label>
                  <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                  {form.date && <span className="quarter-hint">→ {QUARTER_LABELS[autoQuarter]}</span>}
                </div>
                <div className="form-group">
                  <label>Partner</label>
                  <select value={form.partnerId} onChange={e => set('partnerId', e.target.value)}>
                    <option value="">-- External / không có --</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Activity (tuỳ chọn)</label>
                  <select value={form.activityId} onChange={e => set('activityId', e.target.value)}>
                    <option value="">-- Không link --</option>
                    {(form.partnerId
                      ? activities.filter(a => a.partnerId === form.partnerId)
                      : activities
                    ).map(a => <option key={a.id} value={a.id}>{a.name.slice(0,50)}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="form-group full-width">
                <label>Mô tả hoạt động</label>
                <input type="text" value={form.description} onChange={e => set('description', e.target.value)}
                       placeholder="Tên hoạt động / sự kiện cụ thể" />
              </div>

              {/* Quarter inputs */}
              <div className="form-group full-width">
                <label>Kết quả theo Quý (Nữ F / Nam M)</label>
                <div className="quarter-grid">
                  {['Q1','Q2','Q3','Q4'].map(q => {
                    const [km, kf] = QF[q];
                    const isAuto = autoQuarter === q && form.date;
                    return (
                      <div key={q} className={`quarter-block ${isAuto ? 'active-q' : ''}`}>
                        <div className="q-label">{QUARTER_LABELS[q]}{isAuto && <span className="auto-tag">auto</span>}</div>
                        <div className="q-inputs">
                          <div>
                            <span>Nữ</span>
                            <input type="number" min="0" value={form[kf]||0} onChange={e => set(kf, e.target.value)} />
                          </div>
                          <div>
                            <span>Nam</span>
                            <input type="number" min="0" value={form[km]||0} onChange={e => set(km, e.target.value)} />
                          </div>
                          <div className="q-total">
                            <span>Tổng</span>
                            <strong>{(+form[km]||0)+(+form[kf]||0)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="grand-total">
                  Grand total: <strong>
                    {['q1_m','q1_f','q2_m','q2_f','q3_m','q3_f','q4_m','q4_f']
                      .reduce((s,k) => s+(+form[k]||0), 0)}
                  </strong> người
                </div>
              </div>
            </div>

            <div className="mel-modal-footer">
              <button className="btn-secondary" onClick={closeForm}>Hủy</button>
              <button className="btn-primary"
                disabled={!form.indicatorGroup || !form.subCode || !form.date}
                onClick={submitForm}>
                {editId ? 'Cập nhật' : 'Thêm Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Modal ── */}
      {showImport && (
        <div className="mel-modal-overlay" onClick={() => setShowImport(false)}>
          <div className="mel-modal wide" onClick={e => e.stopPropagation()}>
            <div className="mel-modal-header">
              <h2>Import từ MEL_Master CSV</h2>
              <button className="icon-btn" onClick={() => setShowImport(false)}><X size={16}/></button>
            </div>
            <div className="import-instructions">
              <p>Paste các dòng detail từ MEL_Master (không paste dòng header / summary).</p>
              <p>Định dạng: <code>,,CODE,SUBCODE,DATE,PARTNER,DESCRIPTION,...,Q1M,Q1F,Q1T,Q2M,Q2F,Q2T,Q3M,Q3F,Q3T,Q4M,Q4F,Q4T</code></p>
            </div>
            <textarea
              className="import-textarea"
              placeholder="Paste rows từ MEL_Master Excel tại đây..."
              value={importText}
              onChange={e => setImportText(e.target.value)}
              rows={10}
            />
            {importError && <div className="import-error">{importError}</div>}
            <div className="mel-modal-footer">
              <button className="btn-secondary" onClick={() => setShowImport(false)}>Hủy</button>
              <button className="btn-primary" disabled={!importText.trim()} onClick={parseImport}>
                Import {importText.trim().split('\n').filter(Boolean).length} dòng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
