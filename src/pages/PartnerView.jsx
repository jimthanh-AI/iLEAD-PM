import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
  STAGES, STAGE_LABELS, STAGE_COLORS,
  STATUS_LABELS, STATUS_CSS, ACTIVITY_TYPE_MAP,
  INDICATOR_GROUP_MAP, fmtDate, daysLeft, fmtCad,
} from '../utils/constants';
import { ActivityForm } from '../components/forms/ActivityForm';
import { PartnerForm } from '../components/forms/PartnerForm';
import { useConfirm } from '../context/ConfirmContext';
import '../pages/Dashboard.css';
import './PartnerView.css';

const PartnerView = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { partners, activities, tasks, melEntries, partnerBudgets, canEdit, canDelete, deleteActivity, updatePartnerBudget, deletePartner } = useData();

  const confirm = useConfirm();
  const [actFormOpen, setActFormOpen]   = useState(false);
  const [editingAct, setEditingAct]     = useState(null);
  const [partnerFormOpen, setPartnerFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType]     = useState('all');
  const [filterStage, setFilterStage]   = useState('all');
  const [tab, setTab]                   = useState('list');
  const [editBudgetField, setEditBudgetField] = useState(null);

  const partner  = partners.find(p => p.id === id);
  const allActs  = activities.filter(a => a.partnerId === id).sort((a, b) => (a.pos||0) - (b.pos||0));

  if (!partner) return <div className="view-pad"><h1 className="page-title">Partner not found</h1></div>;

  // Active types used by this partner
  const usedTypes = [...new Set(allActs.map(a => a.activityTypeCode).filter(Boolean))];

  const STATUS_ORDER = { in_progress: 0, not_started: 1, done: 2 };
  const filtered = allActs
    .filter(a => {
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (filterType   !== 'all' && a.activityTypeCode !== filterType) return false;
      if (filterStage  !== 'all' && a.stage !== filterStage) return false;
      return true;
    })
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3));

  // Stats
  const totalReach  = allActs.reduce((s, a) => s + (Number(a.reachTotal) || 0), 0);
  const totalWomen  = allActs.reduce((s, a) => s + (Number(a.reachWomen) || 0), 0);
  const totalBudget = allActs.reduce((s, a) => s + (Number(a.budget_planned) || 0), 0);
  const doneCount   = allActs.filter(a => a.status === 'done').length;
  const pct         = allActs.length ? Math.round(doneCount / allActs.length * 100) : 0;
  const pctWomen    = totalReach > 0 ? Math.round((totalWomen / totalReach) * 100) : 0;

  const openAdd  = () => { setEditingAct(null); setActFormOpen(true); };
  const openEdit = (e, a) => { e.stopPropagation(); setEditingAct(a); setActFormOpen(true); };
  const handleDelete = (e, a) => {
    e.stopPropagation();
    confirm(`Xóa activity "${a.name}"?`).then(ok => { if (ok) deleteActivity(a.id); });
  };

  const handleDeletePartner = () => {
    confirm(
      `Xóa đối tác "${partner.name}"?\n\nThao tác này sẽ xóa toàn bộ ${allActs.length} hoạt động, tasks và indicators liên quan. Không thể hoàn tác.`
    ).then(ok => {
      if (ok) {
        deletePartner(partner.id);
        nav('/');
      }
    });
  };

  // Stage Tracker component (per activity)
  const StageTracker = ({ stage }) => {
    const curIdx = STAGES.indexOf(stage);
    return (
      <div className="pv-stage-track">
        {STAGES.map((s, i) => (
          <div
            key={s}
            className={`pv-stage-dot ${i < curIdx ? 'past' : ''} ${i === curIdx ? 'current' : ''}`}
            title={`${s}: ${STAGE_LABELS[s]}`}
          >
            <div
              className="pv-stage-dot-circle"
              style={i === curIdx ? { background: STAGE_COLORS[s], borderColor: STAGE_COLORS[s] } : {}}
            />
            <span className="pv-stage-label">{s}</span>
          </div>
        ))}
      </div>
    );
  };

  const dlBadge = (endDate, status) => {
    const dl = daysLeft(endDate);
    if (status === 'done') return null;
    if (dl === null) return null;
    if (dl < 0)  return <span className="dl-badge overdue">+{-dl}d</span>;
    if (dl <= 3) return <span className="dl-badge soon">{dl}d</span>;
    if (dl <= 14) return <span className="dl-badge warn">{fmtDate(endDate)}</span>;
    return <span style={{ fontSize:'11px', color:'var(--text3)' }}>{fmtDate(endDate)}</span>;
  };

  return (
    <div className="page-container animate-fade-in">

      {/* ── Header ── */}
      <div className="page-header-row">
        <div>
          <div className="page-header-inner">
            <div className="p-dot" style={{ background:partner.color, width:14, height:14 }}></div>
            <h1 className="page-title">{partner.name}</h1>
          </div>
          <p className="page-meta">
            {[partner.sector, partner.region].filter(Boolean).join(' · ')} · {allActs.length} hoạt động
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {canEdit && (
            <button
              className="btn"
              onClick={() => setPartnerFormOpen(true)}
              title="Sửa thông tin đối tác"
            >
              ✏️ Sửa Partner
            </button>
          )}
          {canDelete && (
            <button
              className="btn"
              onClick={handleDeletePartner}
              style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
              title="Xóa đối tác và toàn bộ dữ liệu liên quan"
            >
              🗑 Xóa Partner
            </button>
          )}
          {canEdit && <button className="btn btn-primary" onClick={openAdd}>+ Thêm hoạt động</button>}
        </div>
      </div>

      {/* ── Partner Stats ── */}
      <div className="kpi-grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', marginBottom:'24px' }}>
        <div className="kpi-card glass-card" style={{'--kc':partner.color}}>
          <div className="kpi-label">Hoàn thành</div>
          <div className="kpi-val">{doneCount}/{allActs.length}</div>
          <div className="prog"><div className="prog-fill" style={{width:`${pct}%`, background:partner.color}}></div></div>
        </div>
        <div className="kpi-card glass-card" style={{'--kc':'var(--accent)'}}>
          <div className="kpi-label">Đang triển khai</div>
          <div className="kpi-val">{allActs.filter(a => a.status === 'in_progress').length}</div>
        </div>
        <div className="kpi-card glass-card" style={{'--kc':'var(--orange)'}}>
          <div className="kpi-label">Tổng Reach</div>
          <div className="kpi-val">{totalReach > 0 ? totalReach.toLocaleString() : '—'}</div>
          <div className="kpi-sub">người tham gia</div>
        </div>
        <div className="kpi-card glass-card" style={{'--kc': pctWomen >= 50 ? 'var(--green)' : 'var(--text3)'}}>
          <div className="kpi-label">Tỷ lệ phụ nữ</div>
          <div className="kpi-val">{pctWomen > 0 ? pctWomen + '%' : '—'}</div>
          <div className="kpi-sub">{totalWomen > 0 ? totalWomen + ' người' : 'chưa có dữ liệu'}</div>
        </div>
        <div className="kpi-card glass-card" style={{'--kc':'var(--text3)'}}>
          <div className="kpi-label">Ngân sách KH</div>
          <div className="kpi-val" style={{ fontSize:'18px' }}>{totalBudget > 0 ? `$${(totalBudget/1000).toFixed(0)}K` : '—'}</div>
          <div className="kpi-sub">CAD</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:'6px', marginBottom:'16px', borderBottom:'2px solid var(--border)', paddingBottom:'0' }}>
        {[['list','📋 Activities'],['mel','📊 MEL & Budget']].map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'8px 16px', fontWeight:600, fontSize:'13px', border:'none', background:'none', cursor:'pointer',
            color: tab===t ? 'var(--accent)' : 'var(--text3)',
            borderBottom: tab===t ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom:'-2px',
          }}>{l}</button>
        ))}
      </div>

      {/* ── Filters + Activity List (tab=list only) ── */}
      {tab === 'list' && (
      <>
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px', alignItems:'center' }}>
        <select className="form-select" style={{ maxWidth:'130px', fontSize:'12px', padding:'6px 8px' }}
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Tất cả status</option>
          {['not_started','in_progress','done','not_completed'].map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select className="form-select" style={{ maxWidth:'130px', fontSize:'12px', padding:'6px 8px' }}
          value={filterStage} onChange={e => setFilterStage(e.target.value)}>
          <option value="all">Tất cả stage</option>
          {STAGES.map(s => <option key={s} value={s}>{s}: {STAGE_LABELS[s]}</option>)}
        </select>
        {usedTypes.length > 1 && (
          <select className="form-select" style={{ maxWidth:'160px', fontSize:'12px', padding:'6px 8px' }}
            value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">Tất cả loại</option>
            {usedTypes.map(code => (
              <option key={code} value={code}>{code} · {ACTIVITY_TYPE_MAP[code]?.nameVi}</option>
            ))}
          </select>
        )}
        <span style={{ fontSize:'12px', color:'var(--text3)', marginLeft:'4px' }}>
          {filtered.length} / {allActs.length} hoạt động
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding:'40px' }}>
          {allActs.length === 0
            ? <span>Chưa có hoạt động nào. <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Thêm ngay</button></span>
            : 'Không có kết quả phù hợp với bộ lọc.'
          }
        </div>
      ) : (
        <div className="pv-act-list">
          {filtered.map(a => {
            const actTasks  = tasks.filter(t => t.activityId === a.id);
            const doneTasks = actTasks.filter(t => t.status === 'done').length;
            const typeInfo  = a.activityTypeCode ? ACTIVITY_TYPE_MAP[a.activityTypeCode] : null;
            return (
              <div key={a.id} className={`pv-act-card glass-card${a.status === 'done' ? ' pv-act-card--done' : ''}`} onClick={() => nav(`/activity/${a.id}`)}>

                {/* Card header */}
                <div className="pv-act-card-top">
                  <div className="pv-act-card-left">
                    {typeInfo && (
                      <span className="pv-type-badge" style={{ background: partner.color + '22', color: partner.color }}>
                        {a.activityTypeCode} · {typeInfo.nameVi}
                        {a.iteration > 1 && <span style={{ opacity:.6 }}> #{a.iteration}</span>}
                      </span>
                    )}
                    <div className="pv-act-name">{a.name}</div>
                    {(() => {
                      const nt = tasks
                        .filter(t => t.activityId === a.id && t.status !== 'done' && t.dueDate)
                        .sort((x, y) => x.dueDate.localeCompare(y.dueDate))[0];
                      if (nt) return <div className="pv-next-action">→ {nt.name} <span style={{ opacity:.6 }}>{fmtDate(nt.dueDate)}</span></div>;
                      if (a.notes) return <div className="pv-next-action" style={{ color:'var(--orange)' }}>⚠ {a.notes}</div>;
                      return null;
                    })()}
                  </div>
                  <div className="pv-act-card-right" onClick={e => e.stopPropagation()}>
                    <span className={`cell-tag ${STATUS_CSS[a.status]}`}>{STATUS_LABELS[a.status]}</span>
                    {canEdit && <button className="task-action-btn" onClick={e => openEdit(e, a)}>✏️</button>}
                    {canDelete && <button className="task-action-btn danger" onClick={e => handleDelete(e, a)}>🗑</button>}
                  </div>
                </div>

                {/* Stage Tracker */}
                <StageTracker stage={a.stage} />

                {/* Meta row */}
                <div className="pv-act-meta">
                  {a.ballOwner && <span>👤 {a.ballOwner}</span>}
                  {a.ca        && <span>🎓 CA: {a.ca}</span>}
                  {actTasks.length > 0 && (
                    <span>✓ {doneTasks}/{actTasks.length} tasks</span>
                  )}
                  {(a.reachTotal > 0) && (
                    <span>👥 {a.reachTotal.toLocaleString()} người
                      {a.reachWomen > 0 && ` · ${Math.round((a.reachWomen/a.reachTotal)*100)}% PN`}
                    </span>
                  )}
                  {a.budget_planned > 0 && (
                    <span>💰 ${(a.budget_planned/1000).toFixed(0)}K CAD</span>
                  )}
                  <span>{dlBadge(a.endDate, a.status) || (a.endDate ? fmtDate(a.endDate) : '')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* ── MEL Tab ── */}
      {tab === 'mel' && (() => {
        const pMel    = melEntries.filter(e => e.partnerId === id);
        const budget  = partnerBudgets.find(b => b.partnerId === id) || { allocated:0, spent:0 };
        const remain  = (budget.allocated||0) - (budget.spent||0);
        const remPct  = budget.allocated > 0 ? Math.round(remain / budget.allocated * 100) : 0;

        const totalM = pMel.reduce((s,e)=>(e.q1_m||0)+(e.q2_m||0)+(e.q3_m||0)+(e.q4_m||0)+s, 0);
        const totalF = pMel.reduce((s,e)=>(e.q1_f||0)+(e.q2_f||0)+(e.q3_f||0)+(e.q4_f||0)+s, 0);
        const total  = totalM + totalF;
        const femPct = total > 0 ? Math.round(totalF/total*100) : 0;

        return (
          <div>
            {/* Budget card */}
            <div className="kpi-grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', marginBottom:'20px' }}>
              <div className="kpi-card glass-card" style={{'--kc':'var(--accent)'}}>
                <div className="kpi-label">Allocated</div>
                <div className="kpi-val" style={{fontSize:'18px'}}>{fmtCad(budget.allocated)}</div>
                {canEdit && (
                  editBudgetField === 'allocated'
                    ? <input autoFocus type="number" defaultValue={budget.allocated||0} style={{fontSize:'12px',padding:'4px',border:'1px solid var(--accent)',borderRadius:'4px',width:'100%',marginTop:'4px'}}
                        onBlur={e => { updatePartnerBudget(id,{allocated:parseFloat(e.target.value)||0}); setEditBudgetField(null); }}
                        onKeyDown={e => e.key==='Enter' && e.target.blur()} />
                    : <div style={{fontSize:'11px',color:'var(--accent)',cursor:'pointer',marginTop:'4px'}} onClick={()=>setEditBudgetField('allocated')}>✏ Chỉnh sửa</div>
                )}
              </div>
              <div className="kpi-card glass-card" style={{'--kc':'var(--red)'}}>
                <div className="kpi-label">Spent</div>
                <div className="kpi-val" style={{fontSize:'18px'}}>{fmtCad(budget.spent)}</div>
                {canEdit && (
                  editBudgetField === 'spent'
                    ? <input autoFocus type="number" defaultValue={budget.spent||0} style={{fontSize:'12px',padding:'4px',border:'1px solid var(--accent)',borderRadius:'4px',width:'100%',marginTop:'4px'}}
                        onBlur={e => { updatePartnerBudget(id,{spent:parseFloat(e.target.value)||0}); setEditBudgetField(null); }}
                        onKeyDown={e => e.key==='Enter' && e.target.blur()} />
                    : <div style={{fontSize:'11px',color:'var(--accent)',cursor:'pointer',marginTop:'4px'}} onClick={()=>setEditBudgetField('spent')}>✏ Chỉnh sửa</div>
                )}
              </div>
              <div className="kpi-card glass-card" style={{'--kc': remain >= 0 ? 'var(--green)' : 'var(--red)'}}>
                <div className="kpi-label">Remaining</div>
                <div className="kpi-val" style={{fontSize:'18px'}}>{fmtCad(remain)}</div>
                <div className="kpi-sub">{remPct}% còn lại</div>
              </div>
              <div className="kpi-card glass-card" style={{'--kc': femPct >= 50 ? 'var(--green)' : 'var(--orange)'}}>
                <div className="kpi-label">Female Ratio (MEL)</div>
                <div className="kpi-val">{femPct}%</div>
                <div className="kpi-sub">{totalF}/{total} người</div>
              </div>
            </div>

            {/* MEL entry table */}
            <div className="tbl-wrap">
              <div style={{padding:'12px 16px',fontWeight:700,fontSize:'13px',borderBottom:'1px solid var(--border)'}}>
                MEL Entries ({pMel.length})
              </div>
              {pMel.length === 0
                ? <div style={{padding:'32px',textAlign:'center',color:'var(--text3)'}}>Chưa có MEL entry nào cho partner này.</div>
                : pMel.map(e => {
                  const m = (e.q1_m||0)+(e.q2_m||0)+(e.q3_m||0)+(e.q4_m||0);
                  const f = (e.q1_f||0)+(e.q2_f||0)+(e.q3_f||0)+(e.q4_f||0);
                  const grp = INDICATOR_GROUP_MAP[e.indicatorGroup];
                  return (
                    <div key={e.id} className="tbl-row" style={{gridTemplateColumns:'80px 80px 1fr 80px 60px 60px 60px'}}>
                      <span style={{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:'11px',color:'var(--accent)'}}>{e.indicatorGroup}</span>
                      <span style={{fontFamily:'var(--font-mono)',fontSize:'11px',color:'var(--text3)'}}>{e.subCode}</span>
                      <span style={{fontSize:'12px'}}>{e.description}</span>
                      <span style={{fontSize:'11px',color:'var(--text3)'}}>{e.date}</span>
                      <span style={{textAlign:'right',color:'#db2777',fontWeight:600}}>{f}</span>
                      <span style={{textAlign:'right',color:'#2563eb',fontWeight:600}}>{m}</span>
                      <span style={{textAlign:'right',fontWeight:700}}>{m+f}</span>
                    </div>
                  );
                })
              }
            </div>
          </div>
        );
      })()}

      {/* ActivityForm */}
      <ActivityForm
        isOpen={actFormOpen}
        onClose={() => { setActFormOpen(false); setEditingAct(null); }}
        partnerId={id}
        editActivity={editingAct}
      />

      {/* PartnerForm (edit mode) — keyed so state resets when reopening */}
      <PartnerForm
        key={`pf-${id}-${partnerFormOpen}`}
        isOpen={partnerFormOpen}
        onClose={() => setPartnerFormOpen(false)}
        partnerId={id}
      />
    </div>
  );
};

export default PartnerView;
