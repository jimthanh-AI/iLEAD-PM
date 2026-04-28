import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { daysLeft, fmtDate, TEAM_MEMBERS } from '../utils/constants';
import { TaskForm } from '../components/forms/TaskForm';
import { generateTasksReport } from '../utils/reportGenerator';
import { FileText } from 'lucide-react';
import './Dashboard.css';
import './PartnerView.css';

const FS = { padding:'5px 9px', border:'1px solid var(--border2)', borderRadius:'var(--radius)', background:'var(--surface-solid)', color:'var(--text)', fontSize:'12px', outline:'none', cursor:'pointer' };

const AllTasks = () => {
  const nav = useNavigate();
  const { tasks, activityMap, partnerMap, partners, updateTask, deleteTask, bulkDeleteTasks, userRole } = useData();

  const [search,          setSearch]          = useState('');
  const [statusFilter,    setStatusFilter]    = useState('active'); // default: active only
  const [partnerFilter,   setPartnerFilter]   = useState('');
  const [assigneeFilter,  setAssigneeFilter]  = useState('');
  const [selectedIds,     setSelectedIds]     = useState(new Set());
  const [taskFormOpen,    setTaskFormOpen]     = useState(false);
  const [editTask,        setEditTask]         = useState(null);
  const [doneCollapsed,   setDoneCollapsed]    = useState(false);
  const [isMobile,        setIsMobile]         = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const handler = () => setTaskFormOpen(true);
    window.addEventListener('open-task-form', handler);
    return () => window.removeEventListener('open-task-form', handler);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Stats ──────────────────────────────────────────────────
  const overdue = useMemo(() =>
    tasks.filter(t => t.status !== 'done' && daysLeft(t.dueDate) !== null && daysLeft(t.dueDate) < 0).length,
  [tasks]);
  const doneCount = tasks.filter(t => t.status === 'done').length;

  // ── Per-member counts (active only) ──────────────────────
  const memberStats = useMemo(() => {
    const active = tasks.filter(t => t.status !== 'done');
    return TEAM_MEMBERS.map(m => ({ name: m, count: active.filter(t => t.assignee === m).length }));
  }, [tasks]);

  // ── Filtered + sorted rows ─────────────────────────────────
  const { activeTasks, doneTasks } = useMemo(() => {
    const filtered = tasks.filter(t => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (partnerFilter) {
        const act = activityMap[t.activityId];
        if (act?.partnerId !== partnerFilter) return false;
      }
      if (assigneeFilter && t.assignee !== assigneeFilter) return false;
      return true;
    });

    const sortByDeadline = (a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    };

    const active = filtered
      .filter(t => t.status !== 'done')
      .sort((a, b) => {
        const aDl = daysLeft(a.dueDate);
        const bDl = daysLeft(b.dueDate);
        const aOverdue = aDl !== null && aDl < 0;
        const bOverdue = bDl !== null && bDl < 0;
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        return sortByDeadline(a, b);
      });

    const done = filtered
      .filter(t => t.status === 'done')
      .sort((a, b) => sortByDeadline(b, a)); // most recent first

    if (statusFilter === 'active') return { activeTasks: active, doneTasks: [] };
    if (statusFilter === 'done')   return { activeTasks: [], doneTasks: done };
    return { activeTasks: active, doneTasks: done };
  }, [tasks, search, partnerFilter, assigneeFilter, statusFilter, activityMap]);

  const allActiveSelected = activeTasks.length > 0 && activeTasks.every(t => selectedIds.has(t.id));
  const canDelete = !userRole || userRole !== 'viewer';

  // ── Helpers ────────────────────────────────────────────────
  const toggleOne = (e, id) => {
    e.stopPropagation();
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAllActive = () => {
    if (allActiveSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(activeTasks.map(t => t.id)));
  };
  const clearSel = () => setSelectedIds(new Set());

  const toggleDone = (e, tid) => {
    e.stopPropagation();
    const t = tasks.find(x => x.id === tid);
    updateTask(tid, { status: t.status === 'done' ? 'todo' : 'done' });
  };

  const bulkDone = () => { selectedIds.forEach(id => updateTask(id, { status: 'done' })); clearSel(); };
  const bulkTodo = () => { selectedIds.forEach(id => updateTask(id, { status: 'todo' })); clearSel(); };
  const bulkDelete = async () => {
    if (!window.confirm(`Xóa ${selectedIds.size} task đã chọn?`)) return;
    const ids = [...selectedIds];
    clearSel();
    await bulkDeleteTasks(ids);
  };

  const openEdit = (e, t) => { e.stopPropagation(); setEditTask(t); setTaskFormOpen(true); };
  const closeForm = () => { setTaskFormOpen(false); setEditTask(null); };

  // ── Row renderer ───────────────────────────────────────────
  const TaskRow = ({ t }) => {
    const act = activityMap[t.activityId];
    const pa  = partnerMap[act?.partnerId];
    const dl  = daysLeft(t.dueDate);
    const isOverdue = dl !== null && dl < 0 && t.status !== 'done';
    const isSoon    = dl !== null && dl >= 0 && dl <= 3 && t.status !== 'done';
    const dc  = isOverdue ? 'var(--red)' : isSoon ? 'var(--orange)' : 'var(--text2)';
    const isDone = t.status === 'done';
    const isSelected = selectedIds.has(t.id);

    const grid = isMobile
      ? '36px 36px 1fr 70px'
      : '36px 36px 2fr 1.5fr 100px 90px 75px';
    return (
      <div className="tbl-row"
        style={{ gridTemplateColumns: grid, background: isSelected ? 'var(--accent-bg)' : isOverdue ? 'rgba(239,68,68,.04)' : undefined }}
        onClick={e => { if (!e.defaultPrevented) act && nav(`/activity/${act.id}`); }}
      >
        {/* Select checkbox */}
        <div onClick={e => toggleOne(e, t.id)} style={{ width:'16px', height:'16px', border:`1.5px solid ${isSelected?'var(--accent)':'var(--border2)'}`, borderRadius:'4px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background: isSelected ? 'var(--accent)' : 'transparent', color:'#fff', fontSize:'10px' }}>
          {isSelected ? '✓' : ''}
        </div>

        {/* Done toggle circle */}
        <div onClick={e => toggleDone(e, t.id)}
          style={{ width:'18px', height:'18px', border:`2px solid ${isDone?'var(--green)':'var(--border2)'}`, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background: isDone ? 'var(--green)' : 'transparent', color:'#fff', fontSize:'11px' }}
          title={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu xong'}
        >
          {isDone ? '✓' : ''}
        </div>

        {/* Task name + sub-info on mobile */}
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:'2px', minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', minWidth:0 }}>
            <div style={{ fontSize:'13px', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text3)' : isOverdue ? 'var(--red)' : 'var(--text)' }}>
              {isOverdue && <span style={{ fontSize:'10px', marginRight:'4px' }}>⚠️</span>}
              {t.name}
            </div>
            <button onClick={e => openEdit(e, t)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:'11px', padding:'0 2px', flexShrink:0, opacity:0.6 }} title="Sửa">✏️</button>
          </div>
          {isMobile && (
            <div style={{ fontSize:'10px', color: pa?.color || 'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {pa?.name && <span style={{ fontWeight:600 }}>{pa.name}</span>}
              {pa?.name && act?.name && ' · '}
              {act?.name && <span style={{ color:'var(--text3)' }}>{act.name}</span>}
              {t.assignee && <span style={{ color:'var(--text2)', marginLeft:4 }}>· {t.assignee}</span>}
            </div>
          )}
        </div>

        {/* Activity — desktop only */}
        {!isMobile && (
          <span style={{ fontSize:'11px', color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={act?.name}>
            {act?.name || <span style={{ color:'var(--text3)' }}>Hoạt động khác</span>}
          </span>
        )}

        {/* Partner — desktop only */}
        {!isMobile && (
          <span style={{ fontSize:'11px', fontWeight:600, color: pa?.color || 'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {pa?.name || '—'}
          </span>
        )}

        {/* Assignee — desktop only */}
        {!isMobile && (
          <span style={{ fontSize:'11px', color:'var(--text2)' }}>{t.assignee || '—'}</span>
        )}

        {/* Due date */}
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:dc, fontWeight: isOverdue ? 700 : 400 }}>
          {t.dueDate ? fmtDate(t.dueDate) : '—'}
          {isOverdue && <span style={{ display:'block', fontSize:'9px' }}>QUÁ HẠN</span>}
          {isSoon    && <span style={{ display:'block', fontSize:'9px' }}>Còn {dl}d</span>}
        </span>
      </div>
    );
  };

  const openReport = () => generateTasksReport(tasks, activities, partners);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">All Tasks</h1>
          {/* Stats bar */}
          <div style={{ display:'flex', gap:'16px', marginTop:'6px', flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:'13px', color:'var(--text2)' }}>{tasks.length} tasks tổng</span>
            <span style={{ fontSize:'13px', color:'var(--green)', fontWeight:600 }}>✓ {doneCount} done</span>
            {overdue > 0 && (
              <span style={{ fontSize:'13px', color:'var(--red)', fontWeight:700 }}>⚠️ {overdue} quá hạn</span>
            )}
            <span style={{ width:'1px', height:'16px', background:'var(--border)', flexShrink:0 }} />
            {memberStats.map(m => (
              <span key={m.name} style={{ fontSize:'12px', color: m.count > 0 ? 'var(--text)' : 'var(--text3)' }}>
                <span style={{ fontWeight:600 }}>{m.name.split(' ')[0]}</span>: {m.count}
              </span>
            ))}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={openReport} title="Xuất báo cáo Tasks (PDF)"><FileText size={14} /> Report</button>
      </div>

      {/* ── Bulk toolbar ── */}
      {selectedIds.size > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', padding:'10px 14px', background:'var(--accent-bg)', border:'1px solid var(--accent)', borderRadius:'var(--radius)', fontSize:'12px', marginBottom:'8px' }}>
          <span style={{ fontWeight:600, color:'var(--accent)' }}>{selectedIds.size} task được chọn:</span>
          <button className="btn btn-sm" style={{ background:'var(--green-bg)', color:'var(--green)' }} onClick={bulkDone}>✓ Đánh dấu Done</button>
          <button className="btn btn-sm" onClick={bulkTodo}>○ Đánh dấu Todo</button>
          {canDelete && <button className="btn btn-sm" style={{ background:'var(--red-bg)', color:'var(--red)' }} onClick={bulkDelete}>🗑 Xóa</button>}
          <button className="btn btn-sm" style={{ marginLeft:'auto' }} onClick={clearSel}>✕ Bỏ chọn</button>
        </div>
      )}

      <div className="tbl-wrap">
        {/* Filter bar */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--surface2)', flexWrap:'wrap' }}>
          <div onClick={toggleAllActive} title="Chọn tất cả active"
            style={{ width:'16px', height:'16px', border:`1.5px solid ${allActiveSelected?'var(--accent)':'var(--border2)'}`, borderRadius:'4px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background: allActiveSelected ? 'var(--accent)' : 'transparent', color:'#fff', fontSize:'10px' }}>
            {allActiveSelected ? '✓' : selectedIds.size > 0 ? '–' : ''}
          </div>
          <input className="filter-input" placeholder="🔍 Tìm task..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex:1, minWidth:'120px', padding:'5px 10px', border:'1px solid var(--border2)', borderRadius:'var(--radius)', background:'var(--surface-solid)', color:'var(--text)', fontSize:'12px', outline:'none' }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={FS}>
            <option value="active">Chưa xong</option>
            <option value="done">Đã xong</option>
            <option value="">Tất cả</option>
          </select>
          <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} style={FS}>
            <option value="">Tất cả thành viên</option>
            {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={partnerFilter} onChange={e => setPartnerFilter(e.target.value)} style={FS}>
            <option value="">Tất cả Partner</option>
            {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Column headers */}
        <div className="tbl-hdr" style={{ gridTemplateColumns: isMobile ? '36px 36px 1fr 70px' : '36px 36px 2fr 1.5fr 100px 90px 75px' }}>
          <span />
          <span />
          <span>Task</span>
          {!isMobile && <span>Hoạt động</span>}
          {!isMobile && <span>Partner</span>}
          {!isMobile && <span>Giao cho</span>}
          <span>Deadline</span>
        </div>

        {/* Active tasks */}
        {activeTasks.map(t => <TaskRow key={t.id} t={t} />)}

        {/* Empty active */}
        {activeTasks.length === 0 && statusFilter !== 'done' && (
          <div style={{ padding:'24px', textAlign:'center', color:'var(--green)', fontSize:'13px' }}>
            ✓ Không có task nào đang chờ
          </div>
        )}

        {/* Done section */}
        {doneTasks.length > 0 && (
          <>
            <div
              onClick={() => setDoneCollapsed(c => !c)}
              style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 14px', background:'var(--surface2)', borderTop:'2px solid var(--border)', cursor:'pointer', userSelect:'none' }}
            >
              <span style={{ fontSize:'11px', color:'var(--text3)', fontWeight:600, letterSpacing:'.05em' }}>
                {doneCollapsed ? '▶' : '▼'} ĐÃ HOÀN THÀNH — {doneTasks.length} task
              </span>
            </div>
            {!doneCollapsed && doneTasks.map(t => <TaskRow key={t.id} t={t} />)}
          </>
        )}

        {activeTasks.length === 0 && doneTasks.length === 0 && (
          <div className="empty-state">Không có task nào</div>
        )}

        {/* Bottom add button */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" style={{ fontSize: '13px' }} onClick={() => setTaskFormOpen(true)}>+ Task</button>
        </div>
      </div>

      {taskFormOpen && (
        <TaskForm isOpen={taskFormOpen} onClose={closeForm} editTask={editTask} />
      )}
    </div>
  );
};

export default AllTasks;
