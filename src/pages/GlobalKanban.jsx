import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Download } from 'lucide-react';
import { useData } from '../context/DataContext';
import { STAGE_COLORS, STATUS_CSS, STATUS_LABELS, fmtDate, daysLeft, generateId } from '../utils/constants';
import { ActivityForm } from '../components/forms/ActivityForm';
import '../pages/Dashboard.css';
import '../pages/PartnerView.css';
import './GlobalKanban.css';

const COLS = [
  { key:'not_started',   label:'Not Started',    color:'#9ca3af', isComputed: false },
  { key:'in_progress',   label:'In Progress',    color:'#2563eb', isComputed: false },
  { key:'done',          label:'Done',            color:'#10b981', isComputed: false },
  { key:'overdue',       label:'Overdue ⚠️',      color:'#ef4444', isComputed: true  },
];

const GlobalKanban = () => {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const urlFilter = searchParams.get('filter'); // 'done'|'in_progress'|'not_started'|'overdue'|null
  const { activities, partners, partnerMap, tasks, updateActivity, deleteActivity, addActivity } = useData();

  const getNextTask = (actId) => tasks
    .filter(t => t.activityId === actId && t.status !== 'done' && t.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] || null;
  const [partnerFilter, setPartnerFilter] = useState('');
  const [actFormOpen, setActFormOpen] = useState(false);
  const [editingAct, setEditingAct] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('not_started');
  const colRefs = useRef({});

  // On mount / filter change: scroll highlighted column into view
  useEffect(() => {
    if (!urlFilter) return;
    const colKey = urlFilter === 'overdue' ? 'overdue' : urlFilter;
    const el = colRefs.current[colKey];
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [urlFilter]);

  let acts = activities;
  if (partnerFilter) {
    acts = acts.filter(a => a.partnerId === partnerFilter);
  }

  // Build byStatus — overdue is computed (separated from their original col)
  const byStatus = {};
  COLS.filter(c => !c.isComputed).forEach(c => byStatus[c.key] = []);
  byStatus.overdue = [];
  acts.forEach(a => {
    const dl = daysLeft(a.endDate);
    const isOverdue = dl !== null && dl < 0 && a.status !== 'done';
    if (isOverdue) {
      byStatus.overdue.push(a);
    } else if (byStatus[a.status]) {
      byStatus[a.status].push(a);
    } else {
      byStatus.not_started.push(a);
    }
  });

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    // Cannot drop INTO overdue (it's computed), but can drag FROM it
    if (newStatus === 'overdue') return;
    updateActivity(draggableId, { status: newStatus });
  };

  const openAdd = (status) => {
    setDefaultStatus(status);
    setEditingAct(null);
    setActFormOpen(true);
  };

  const openEdit = (e, a) => {
    e.stopPropagation();
    setEditingAct(a);
    setActFormOpen(true);
  };

  const handleDelete = (e, a) => {
    e.stopPropagation();
    if (window.confirm(`Xóa "${a.name}"?`)) deleteActivity(a.id);
  };

  const getPartner = (a) => partnerMap[a.partnerId];

  const exportCSV = () => {
    const rows = [['#','Partner','Tên Hoạt Động','Loại','Stage','Status','Ngày bắt đầu','Ngày kết thúc','Budget Planned (CAD)','Budget Actual (CAD)','Ball Owner','CA','Reach Total','Reach Women','Reach Men','Next Action']];
    acts.forEach((a, i) => {
      const p = partnerMap[a.partnerId];
      rows.push([
        i + 1,
        p ? `"${p.name}"` : '',
        `"${a.name}"`,
        a.activityTypeCode || '',
        a.stage || '',
        a.status || '',
        a.startDate || '',
        a.endDate || '',
        a.budget_planned || 0,
        a.budget_actual || 0,
        `"${a.ballOwner || ''}"`,
        `"${a.ca || ''}"`,
        a.reachTotal || 0,
        a.reachWomen || 0,
        a.reachMen || 0,
        `"${(a.nextAction || '').replace(/"/g, "'")}"`,
      ]);
    });
    const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `iLEAD_Activities_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="page-container animate-fade-in" style={{ display:'flex', flexDirection:'column', minHeight: 0 }}>
      {/* Controls */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px', flexShrink:0 }}>
        <h1 className="page-title" style={{ flex:1, fontSize:'20px' }}>Kanban — Activities</h1>
        <select className="filter-sel" value={partnerFilter} onChange={e => setPartnerFilter(e.target.value)}>
          <option value="">Tất cả Partner</option>
          {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={exportCSV} title="Export Activities (CSV)"><Download size={14} /> Export</button>
        <button className="btn btn-primary" onClick={() => openAdd('not_started')}>+ Activity</button>
      </div>

      {/* DnD Board — kanban-board is the ONLY scroll container */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board" style={{ flex:1, overflowX:'auto', overflowY:'auto', alignItems:'flex-start' }}>
          {COLS.map(col => {
            // Determine if this col is highlighted by URL filter
            const isHighlighted = urlFilter
              ? (urlFilter === 'overdue' ? col.key === 'in_progress' : col.key === urlFilter)
              : false;
            return (
            <div
              key={col.key}
              className={`k-col${isHighlighted ? ' k-col-highlighted' : ''}`}
              style={{ maxHeight:'none' }}
              ref={el => colRefs.current[col.key] = el}
            >
              <div className="k-col-hdr">
                <div className="k-col-dot" style={{ background: col.color }}></div>
                <span className="k-col-title">{col.label}</span>
                <span className="k-col-cnt">{(byStatus[col.key] || []).length}</span>
              </div>

              <Droppable droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    className={`k-cards${snapshot.isDraggingOver ? ' dragging-over' : ''}`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ minHeight: '80px' }}
                  >
                    {(byStatus[col.key] || []).map((a, index) => {
                      const pa = getPartner(a);
                      const sc = STAGE_COLORS[a.stage] || '#888';
                      const cardDl = daysLeft(a.endDate);
                      const overdue = cardDl !== null && cardDl < 0 && a.status !== 'done';
                      return (
                        <Draggable key={a.id} draggableId={a.id} index={index}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={`proj-card glass-card act-kanban-card${a.status === 'done' ? ' act-kanban-card--done' : ''}`}
                              style={{
                                ...prov.draggableProps.style,
                                boxShadow: snap.isDragging ? 'var(--shadow-lg)' : undefined,
                                opacity: snap.isDragging ? .9 : (a.status === 'done' ? undefined : 1),
                              }}
                              onClick={() => nav(`/activity/${a.id}`)}
                            >
                              <div style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'4px' }}>
                                <span className={`cell-tag stage-${a.stage}`} style={{ fontSize:'9px' }}>{a.stage}</span>
                                {pa && <span style={{ fontSize:'10px', color:pa.color, fontWeight:500 }}>{pa.name}</span>}
                              </div>
                              <div className="proj-card-name">{a.name}</div>
                              {(() => {
                                const nt = getNextTask(a.id);
                                if (nt) return (
                                  <div className="act-kanban-next">
                                    → {nt.name}
                                    <span style={{ marginLeft:4, opacity:.7 }}>{fmtDate(nt.dueDate)}</span>
                                  </div>
                                );
                                if (a.notes) return <div className="act-kanban-next" style={{ color:'var(--orange)' }}>⚠ {a.notes}</div>;
                                return null;
                              })()}
                              <div className="proj-card-foot">
                                <span>{a.ballOwner ? '👤 '+a.ballOwner : ''}</span>
                                <span style={{ color: overdue ? 'var(--red)' : undefined }}>
                                  {a.endDate ? fmtDate(a.endDate) : ''}
                                </span>
                              </div>
                              {a.author && (
                                <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'right', marginTop: '6px' }}>
                                  Tạo bởi: {a.author}
                                </div>
                              )}
                              <div className="proj-card-actions">
                                <button className="task-action-btn" onClick={e => openEdit(e, a)}>✏️</button>
                                <button className="task-action-btn danger" onClick={e => handleDelete(e, a)}>🗑</button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <div className="k-add">
                <button className="k-add-btn" onClick={() => openAdd(col.key)}>＋ New activity</button>
              </div>
            </div>
          );
          })}
        </div>
      </DragDropContext>

      <ActivityForm
        isOpen={actFormOpen}
        onClose={() => { setActFormOpen(false); setEditingAct(null); }}
        partnerId={partnerFilter || partners[0]?.id}
        editActivity={editingAct}
      />
    </div>
  );
};

export default GlobalKanban;
