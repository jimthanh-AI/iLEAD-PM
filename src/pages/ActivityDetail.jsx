import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
  STAGES, STAGE_LABELS, STAGE_COLORS, STATUS_LABELS, STATUS_CSS,
  ACTIVITY_TYPE_MAP, INDICATOR_CODES, INDICATOR_MAP, fmtDate, daysLeft, generateId,
} from '../utils/constants';
import { ActivityForm } from '../components/forms/ActivityForm';
import { TaskForm } from '../components/forms/TaskForm';
import { MelWizard } from '../components/forms/MelWizard';
import AuditLog from '../components/AuditLog';
import ActivityComments from '../components/ActivityComments';
import { useConfirm } from '../context/ConfirmContext';
import '../pages/Dashboard.css';
import '../pages/PartnerView.css';
import './ActivityDetail.css';

const ActivityDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const {
    activities, partners, tasks, activityIndicators,
    partnerMap,
    updateActivity, deleteActivity,
    updateTask, deleteTask,
    addActivityIndicator, updateActivityIndicator, deleteActivityIndicator,
    canEdit, canDelete,
  } = useData();

  const confirm = useConfirm();
  const [taskFormOpen,   setTaskFormOpen]   = useState(false);
  const [editingTask,    setEditingTask]     = useState(null);
  const [editActOpen,    setEditActOpen]     = useState(false);
  const [melWizOpen,     setMelWizOpen]     = useState(false);
  const [addIndCode,     setAddIndCode]      = useState('');
  const [addIndTarget,   setAddIndTarget]    = useState(0);

  useEffect(() => {
    const handler = () => { setEditingTask(null); setTaskFormOpen(true); };
    window.addEventListener('open-task-form', handler);
    return () => window.removeEventListener('open-task-form', handler);
  }, []);

  const act = activities.find(a => a.id === id);
  if (!act) return <div className="view-pad"><h1 className="page-title">Activity not found</h1></div>;

  const partner  = partnerMap[act.partnerId];
  const typeInfo = act.activityTypeCode ? ACTIVITY_TYPE_MAP[act.activityTypeCode] : null;
  const actTasks = tasks.filter(t => t.activityId === id).sort((a, b) => (a.pos||0) - (b.pos||0));
  const doneTasks = actTasks.filter(t => t.status === 'done').length;
  const stageIdx  = STAGES.indexOf(act.stage);
  const indicators = activityIndicators.filter(ai => ai.activityId === id);

  const fmtCad = (n) => !n && n !== 0 ? '—' : `$${Number(n).toLocaleString()} CAD`;

  // ── Stage workflow ────────────────────────────────────────────
  const handleStageChange = (newStage) => {
    const curIdx = STAGES.indexOf(act.stage);
    const newIdx = STAGES.indexOf(newStage);
    if (newIdx <= curIdx || newIdx === curIdx + 1) {
      updateActivity(id, { stage: newStage }); return;
    }
    const skipped = STAGES.slice(curIdx + 1, newIdx).map(s => `${s}: ${STAGE_LABELS[s]}`).join(', ');
    confirm(`Bỏ qua stage:\n"${skipped}"\n\nVẫn chuyển sang ${newStage}?`).then(ok => {
      if (ok) updateActivity(id, { stage: newStage });
    });
  };

  // ── Task helpers ──────────────────────────────────────────────
  const toggleTask = (tid) => {
    const t = tasks.find(x => x.id === tid);
    if (!t) return;
    updateTask(tid, { status: t.status === 'done' ? 'todo' : 'done' });
  };

  // ── Indicator helpers ─────────────────────────────────────────
  const usedCodes = new Set(indicators.map(ai => ai.indicatorCode));
  const availableCodes = INDICATOR_CODES.filter(ic => !usedCodes.has(ic.code));

  const handleAddIndicator = () => {
    if (!addIndCode) return;
    addActivityIndicator({
      id:            generateId('ai'),
      activityId:    id,
      indicatorCode: addIndCode,
      targetCount:   Number(addIndTarget) || 0,
      actualCount:   0,
    });
    setAddIndCode('');
    setAddIndTarget(0);
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDeleteAct = () => {
    confirm(`Xóa activity "${act.name}"?`).then(ok => {
      if (ok) { deleteActivity(id); nav(partner ? `/partner/${partner.id}` : '/'); }
    });
  };

  return (
    <div className="page-container animate-fade-in">

      {/* ── Header Card ── */}
      <div className="act-detail-header glass-card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span className={`cell-tag ${STATUS_CSS[act.status]}`}>{STATUS_LABELS[act.status]}</span>
            {typeInfo && (
              <span className="cell-tag s-not" style={{ fontFamily:'var(--font-mono)', fontSize:'11px' }}>
                {act.activityTypeCode} · {typeInfo.nameVi}
                {act.iteration > 1 && ` #${act.iteration}`}
              </span>
            )}
          </div>
          <div style={{ display:'flex', gap:'6px' }}>
            {act.status === 'done' && (
              <button className="btn btn-sm btn-primary" onClick={() => setMelWizOpen(true)}
                title="Tạo MEL entries từ activity này">
                Ghi nhận MEL
              </button>
            )}
            {canEdit   && <button className="task-action-btn" onClick={() => setEditActOpen(true)}>✏️ Sửa</button>}
            {canDelete && <button className="task-action-btn danger" onClick={handleDeleteAct}>🗑 Xóa</button>}
          </div>
        </div>

        {partner && (
          <div style={{ fontSize:'12px', color:partner.color, fontWeight:500, marginTop:'4px', cursor:'pointer' }}
            onClick={() => nav(`/partner/${partner.id}`)}>
            ← {partner.name}
          </div>
        )}

        <h1 className="act-detail-title">{act.name}</h1>

        {/* Stage Track */}
        <div className="stage-track">
          {STAGES.map((s, i) => (
            <div
              key={s}
              className={`stage-step ${i < stageIdx ? 'done-s' : ''} ${i === stageIdx ? 'cur-s' : ''}`}
              onClick={() => canEdit && handleStageChange(s)}
              style={i === stageIdx ? { color: STAGE_COLORS[s], cursor: canEdit ? 'pointer' : 'default' } : { cursor: canEdit ? 'pointer' : 'default' }}
              title={`${s}: ${STAGE_LABELS[s]}`}
            >
              {s}: {STAGE_LABELS[s]}
            </div>
          ))}
        </div>

        {/* Properties */}
        <div className="act-detail-props">
          {act.ballOwner && <div className="dp"><span className="dp-lbl">Ball Owner</span>{act.ballOwner}</div>}
          {act.ca        && <div className="dp"><span className="dp-lbl">CA</span>{act.ca}</div>}
          {act.type      && <div className="dp"><span className="dp-lbl">Type</span>{act.type}</div>}
          {act.startDate && (
            <div className="dp">
              <span className="dp-lbl">Thời gian</span>
              {fmtDate(act.startDate)}{act.endDate ? ' → ' + fmtDate(act.endDate) : ''}
            </div>
          )}
          {(act.budget_planned || act.budget_actual) && (
            <div className="dp">
              <span className="dp-lbl">Ngân sách</span>
              <span style={{ fontSize:'12px' }}>
                KH: <strong>{fmtCad(act.budget_planned)}</strong>
                {act.budget_actual >= 0 && act.budget_actual !== '' && (
                  <> · TT: <strong style={{ color: act.budget_actual > act.budget_planned ? 'var(--red)' : 'var(--green)' }}>
                    {fmtCad(act.budget_actual)}
                  </strong></>
                )}
              </span>
            </div>
          )}
        </div>

        {(() => {
          const nextTask = tasks
            .filter(t => t.activityId === act.id && t.status !== 'done' && t.dueDate)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
          if (nextTask) return (
            <div className="act-next-box">
              → <strong>Next task:</strong> {nextTask.name}
              <span style={{ marginLeft:8, fontFamily:'var(--font-mono)', fontSize:'11px', opacity:.7 }}>{fmtDate(nextTask.dueDate)}</span>
              {nextTask.assignee && <span style={{ marginLeft:6, fontSize:'11px', opacity:.7 }}>· {nextTask.assignee}</span>}
            </div>
          );
          return null;
        })()}
        {act.notes && (
          <div style={{ fontSize:'13px', color:'var(--orange)', lineHeight:1.6, marginTop:'6px' }}>⚠ {act.notes}</div>
        )}
      </div>

      {/* ── Reach Section ── */}
      <div className="glass-card" style={{ padding:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
          <h3 style={{ fontSize:'13px', fontWeight:600, margin:0 }}>👥 Số người tham gia (Reach)</h3>
          {canEdit && (
            <button className="btn btn-sm btn-primary" onClick={() => setEditActOpen(true)}>Cập nhật</button>
          )}
        </div>
        <div style={{ display:'flex', gap:'24px', flexWrap:'wrap' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'28px', fontWeight:700, color:'var(--accent)' }}>{act.reachTotal || 0}</div>
            <div style={{ fontSize:'11px', color:'var(--text3)' }}>Tổng</div>
            {typeInfo && <div style={{ fontSize:'10px', color:'var(--text3)' }}>target: {typeInfo.standardReach}</div>}
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'28px', fontWeight:700, color:'#db2777' }}>{act.reachWomen || 0}</div>
            <div style={{ fontSize:'11px', color:'var(--text3)' }}>Phụ nữ</div>
            {act.reachTotal > 0 && (
              <div style={{ fontSize:'10px', color: (act.reachWomen/act.reachTotal) >= 0.5 ? 'var(--green)' : 'var(--orange)' }}>
                {Math.round((act.reachWomen / act.reachTotal) * 100)}%
                {(act.reachWomen/act.reachTotal) >= 0.5 ? ' ✓' : ' ⚠️'}
              </div>
            )}
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'28px', fontWeight:700, color:'var(--text2)' }}>{act.reachMen || 0}</div>
            <div style={{ fontSize:'11px', color:'var(--text3)' }}>Nam</div>
          </div>
        </div>
        {act.reachTotal > 0 && (
          <div style={{ marginTop:'10px', height:'8px', background:'var(--bg2)', borderRadius:'4px', overflow:'hidden' }}>
            <div style={{ width:`${Math.round(((act.reachWomen||0)/act.reachTotal)*100)}%`, height:'100%', background:'#db2777', borderRadius:'4px', transition:'width 0.4s' }} />
          </div>
        )}
      </div>

      {/* ── Indicators Section ── */}
      <div className="glass-card" style={{ padding:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
          <h3 style={{ fontSize:'13px', fontWeight:600, margin:0 }}>📋 Output Indicators</h3>
        </div>

        {indicators.length > 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {indicators.map(ai => {
              const indInfo = INDICATOR_MAP[ai.indicatorCode];
              const progress = ai.targetCount > 0 ? Math.min(Math.round((ai.actualCount / ai.targetCount) * 100), 100) : 0;
              return (
                <div key={ai.id} style={{ background:'var(--bg2)', borderRadius:'var(--radius)', padding:'10px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
                    <div>
                      <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'12px', color:'var(--accent)' }}>
                        {ai.indicatorCode}
                      </span>
                      {indInfo && <span style={{ fontSize:'11px', color:'var(--text2)', marginLeft:'8px' }}>{indInfo.label}</span>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontSize:'11px', color:'var(--text3)' }}>
                        {ai.actualCount} / {ai.targetCount} người
                      </span>
                      {canEdit && (
                        <>
                          <input
                            type="number" min="0"
                            value={ai.actualCount}
                            onChange={e => updateActivityIndicator(ai.id, { actualCount: Number(e.target.value)||0 })}
                            style={{ width:'60px', fontSize:'11px', padding:'2px 6px', borderRadius:'4px', border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)' }}
                            title="Cập nhật actual count"
                          />
                          <button className="task-action-btn danger" style={{ fontSize:'11px' }}
                            onClick={() => deleteActivityIndicator(ai.id)} title="Xóa indicator">×</button>
                        </>
                      )}
                    </div>
                  </div>
                  {ai.targetCount > 0 && (
                    <div style={{ height:'4px', background:'var(--border)', borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ width:`${progress}%`, height:'100%', background: progress >= 100 ? 'var(--green)' : 'var(--accent)', transition:'width 0.4s' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize:'12px', color:'var(--text3)', marginBottom:'8px' }}>Chưa có indicator nào.</div>
        )}

        {/* Add indicator */}
        {canEdit && availableCodes.length > 0 && (
          <div style={{ display:'flex', gap:'6px', marginTop:'10px', alignItems:'flex-end' }}>
            <select
              className="form-select"
              style={{ flex:1, fontSize:'12px', padding:'6px 8px' }}
              value={addIndCode}
              onChange={e => setAddIndCode(e.target.value)}
            >
              <option value="">+ Thêm indicator...</option>
              {availableCodes.map(ic => (
                <option key={ic.code} value={ic.code}>{ic.code} · {ic.label}</option>
              ))}
            </select>
            <div className="form-group" style={{ margin:0, width:'80px' }}>
              <input className="form-input" type="number" min="0" placeholder="Target"
                value={addIndTarget || ''}
                onChange={e => setAddIndTarget(Number(e.target.value)||0)}
                style={{ fontSize:'12px', padding:'6px 8px' }}
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleAddIndicator} disabled={!addIndCode}>
              Thêm
            </button>
          </div>
        )}
      </div>

      {/* ── Tasks ── */}
      <div>
        <div className="task-header">
          <div className="task-header-title">
            ✓ Tasks
            <span style={{ fontWeight:400, color:'var(--text3)' }}> ({doneTasks}/{actTasks.length} done)</span>
          </div>
          {canEdit && <button className="btn btn-primary btn-sm" onClick={() => { setEditingTask(null); setTaskFormOpen(true); }}>+ Task</button>}
        </div>

        <div className="task-list">
          {actTasks.map(t => {
            const dl = daysLeft(t.dueDate);
            const isOverdue = t.status !== 'done' && dl !== null && dl < 0;
            const isSoon    = t.status !== 'done' && dl !== null && dl >= 0 && dl <= 7;
            return (
            <div key={t.id} className={`task-item${isOverdue ? ' task-overdue' : isSoon ? ' task-soon' : ''}`}>
              <div
                className={`task-check ${t.status === 'done' ? 'done' : 'todo'}`}
                onClick={() => canEdit && toggleTask(t.id)}
              />
              <div className="task-body">
                <div className={`task-name${t.status === 'done' ? ' done' : ''}`}>{t.name}</div>
                <div className="task-meta">
                  {t.assignee && <span>👤 {t.assignee}</span>}
                  {t.dueDate && (
                    <span style={{
                      color: isOverdue ? 'var(--red)' : isSoon ? 'var(--orange)' : undefined,
                      fontWeight: isOverdue || isSoon ? 600 : undefined,
                    }}>
                      📅 {fmtDate(t.dueDate)}
                      {isOverdue && ` · ⚠️ quá ${Math.abs(dl)} ngày`}
                      {isSoon && dl === 0 && ' · hôm nay!'}
                      {isSoon && dl > 0 && ` · còn ${dl} ngày`}
                    </span>
                  )}
                  {t.notes && <span style={{ color:'var(--text3)' }}>{t.notes}</span>}
                </div>
              </div>
              <div className="task-actions">
                {canEdit   && <button className="task-action-btn" onClick={e => { e.stopPropagation(); setEditingTask(t); setTaskFormOpen(true); }}>✏️</button>}
                {canDelete && <button className="task-action-btn danger" onClick={e => { e.stopPropagation(); confirm(`Xóa task "${t.name}"?`).then(ok => { if (ok) deleteTask(t.id); }); }}>🗑</button>}
              </div>
            </div>
            );
          })}
        </div>

        {canEdit && (
          <div className="task-add-row" onClick={() => { setEditingTask(null); setTaskFormOpen(true); }}>
            <span style={{ fontSize:'16px', lineHeight:1 }}>+</span> Thêm task...
          </div>
        )}
      </div>

      {/* ── Comments ── */}
      <ActivityComments activityId={id} />

      {/* ── Audit Log ── */}
      <AuditLog tableName="activities" recordId={id} />

      {/* Modals */}
      <ActivityForm
        isOpen={editActOpen}
        onClose={() => setEditActOpen(false)}
        partnerId={act.partnerId}
        editActivity={act}
      />
      <TaskForm
        isOpen={taskFormOpen}
        onClose={() => { setTaskFormOpen(false); setEditingTask(null); }}
        activityId={id}
        editTask={editingTask}
      />
      <MelWizard
        isOpen={melWizOpen}
        onClose={() => setMelWizOpen(false)}
        activity={act}
        partner={partner}
      />
    </div>
  );
};

export default ActivityDetail;
