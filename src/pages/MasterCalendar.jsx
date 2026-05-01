import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { TASK_STATUS_LABELS, fmtDate, daysLeft, generateId, TEAM_MEMBERS, STAGE_COLORS } from '../utils/constants';
import './MasterCalendar.css';

const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_GRID_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const CHIP_COLORS = {
  done:        { bg: 'rgba(16,185,129,.15)', color: '#059669', border: '#10b981' },
  in_progress: { bg: 'rgba(37,99,235,.13)', color: '#2563eb', border: '#3b82f6' },
  todo:        { bg: 'rgba(156,163,175,.13)', color: '#6b7280', border: '#9ca3af' },
};

// ── ICS helpers ──
function getIcsUrlFromEmbedUrl(embedUrl) {
  try {
    const u = new URL(embedUrl);
    const src = u.searchParams.get('src');
    if (src) return `https://calendar.google.com/calendar/ical/${encodeURIComponent(src)}/public/full.ics`;
  } catch (e) { /* ignore */ }
  // If it already looks like an ICS URL, return as-is
  if (embedUrl.includes('/ical/')) return embedUrl;
  return null;
}

function parseICS(icsText) {
  const events = [];
  const unfolded = icsText.replace(/\r\n[ \t]/g, '').replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
  const lines = unfolded.split('\n');
  let ev = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === 'BEGIN:VEVENT') { ev = {}; continue; }
    if (line === 'END:VEVENT') {
      if (ev?.dtstart) events.push(ev);
      ev = null; continue;
    }
    if (!ev) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const keyFull = line.slice(0, colon).toUpperCase();
    const val = line.slice(colon + 1).replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
    const key = keyFull.split(';')[0]; // strip params like TZID
    if (key === 'SUMMARY')      ev.summary = val;
    else if (key === 'DTSTART') { ev.dtstart = val; ev.allDay = !val.includes('T'); }
    else if (key === 'DTEND')   ev.dtend = val;
    else if (key === 'UID')     ev.uid = val;
    else if (key === 'URL')     ev.url = val;
    else if (key === 'RRULE')   ev.rrule = val;
    else if (key === 'DURATION') ev.duration = val;
  }
  return events;
}

// Parse ICS datetime string to JS Date (treats local time as Vietnam UTC+7)
function icsToDate(val) {
  if (!val) return null;
  const v = val.replace(/[^0-9T]/g, ''); // strip non-numeric except T
  const y = +v.slice(0,4), mo = +v.slice(4,6)-1, d = +v.slice(6,8);
  if (!v.includes('T')) return new Date(y, mo, d);
  const h = +v.slice(9,11), m = +v.slice(11,13);
  // Z suffix = UTC, else treat as local Vietnam time (UTC+7)
  if (val.endsWith('Z')) return new Date(Date.UTC(y,mo,d,h,m));
  return new Date(y, mo, d, h, m);
}

function dateToIcsDt(date, allDay) {
  const p = (n,l=2) => String(n).padStart(l,'0');
  if (allDay) return `${date.getFullYear()}${p(date.getMonth()+1)}${p(date.getDate())}`;
  return `${date.getFullYear()}${p(date.getMonth()+1)}${p(date.getDate())}T${p(date.getHours())}${p(date.getMinutes())}00`;
}

// Expand recurring events (RRULE) within a date window
function expandEvents(rawEvents, windowStart, windowEnd) {
  const result = [];
  for (const ev of rawEvents) {
    if (!ev.rrule) { result.push(ev); continue; }
    // Parse RRULE
    const parts = {};
    ev.rrule.split(';').forEach(p => { const [k,v]=p.split('='); parts[k]=v; });
    const freq = parts.FREQ;
    const interval = parseInt(parts.INTERVAL||'1');
    const until = parts.UNTIL ? icsToDate(parts.UNTIL) : null;
    const count = parts.COUNT ? parseInt(parts.COUNT) : null;
    const byDay = parts.BYDAY ? parts.BYDAY.split(',').map(d => d.slice(-2)) : null;
    const DAY_MAP = { SU:0, MO:1, TU:2, WE:3, TH:4, FR:5, SA:6 };

    let cur = icsToDate(ev.dtstart);
    if (!cur) continue;
    const endLimit = until || windowEnd;
    let n = 0, maxN = count || 500;

    while (cur <= endLimit && n < maxN) {
      if (cur >= windowStart) {
        result.push({ ...ev, dtstart: dateToIcsDt(cur, ev.allDay), _expanded: true });
      }
      // Advance
      if (freq === 'DAILY')        cur = new Date(cur.getTime() + interval*86400000);
      else if (freq === 'WEEKLY')  cur = new Date(cur.getTime() + interval*7*86400000);
      else if (freq === 'MONTHLY') { cur = new Date(cur); cur.setMonth(cur.getMonth() + interval); }
      else if (freq === 'YEARLY')  { cur = new Date(cur); cur.setFullYear(cur.getFullYear() + interval); }
      else break;
      n++;
    }
  }
  return result;
}

function icsValToIso(val) {
  if (!val) return null;
  const v = val.replace(/[^0-9T]/g, '');
  return `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`;
}

// Extract HH:MM display string from ICS datetime value
function icsValToTime(val) {
  if (!val || !val.includes('T')) return '';
  const v = val.replace(/[^0-9T]/g, '');
  const h = v.slice(9,11), m = v.slice(11,13);
  if (!h) return '';
  // If ends with Z (UTC), convert to UTC+7
  if (val.endsWith('Z')) {
    const utcH = parseInt(h);
    const localH = (utcH + 7) % 24;
    return `${String(localH).padStart(2,'0')}:${m}`;
  }
  return `${h}:${m}`;
}

// Use local date parts to avoid UTC timezone shift (Vietnam = UTC+7)
const toLocalIso = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/* ── Quick-Add Task Mini Form ── */
const QuickAddTask = ({ defaultDate, activities, addTask, onClose }) => {
  const [name, setName]         = useState('');
  const [dueDate, setDueDate]   = useState(defaultDate || '');
  const [activityId, setActId]  = useState('');
  const [status, setStatus]     = useState('todo');
  const [assignee, setAssignee] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    addTask({
      id: generateId('t'),
      activityId: activityId || '',
      name: name.trim(),
      status,
      assignee,
      dueDate,
      notes: '',
    });
    onClose();
  };

  return (
    <div className="qa-panel" onClick={e => e.stopPropagation()}>
      <div className="qa-header">
        <span>✚ Quick Add Task</span>
        <button className="btn-icon" onClick={onClose} style={{ fontSize: '14px' }}>✕</button>
      </div>
      <div className="qa-body">
        <input
          className="qa-input"
          placeholder="Tên task *"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose(); }}
          autoFocus
        />
        <div className="qa-row">
          <input className="qa-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ flex: 1 }} />
          <select className="qa-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="todo">Todo</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div className="qa-row">
          <select className="qa-select" value={activityId} onChange={e => setActId(e.target.value)} style={{ flex: 1 }}>
            <option value="">— Hoạt động khác —</option>
            {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select className="qa-select" value={assignee} onChange={e => setAssignee(e.target.value)} style={{ flex: 1 }}>
              <option value="">— Giao cho —</option>
              {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={submit} style={{ width: '100%', marginTop: '4px' }}>Thêm Task</button>
      </div>
    </div>
  );
};

/* ── Task Detail Popup ── */
const TaskDetailPopup = ({ task, act, pa, nav, onClose, updateTask }) => {
  const isOverdue = task.dueDate && daysLeft(task.dueDate) < 0 && task.status !== 'done';
  const dl = task.dueDate ? daysLeft(task.dueDate) : null;

  const toggleDone = () => {
    updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface-solid)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          width: '360px',
          maxWidth: '92vw',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '12px 14px',
          background: isOverdue ? 'rgba(239,68,68,0.08)' : task.status === 'done' ? 'rgba(16,185,129,0.08)' : 'var(--surface2)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'flex-start', gap: '8px',
        }}>
          <span style={{ fontSize: '16px', marginTop: '2px' }}>
            {task.status === 'done' ? '✅' : isOverdue ? '⚠️' : '🔲'}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: 700, fontSize: '14px', color: 'var(--text)',
              textDecoration: task.status === 'done' ? 'line-through' : 'none',
              opacity: task.status === 'done' ? 0.7 : 1,
            }}>{task.name}</div>
            {act && (
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
                {pa ? `${pa.name} · ` : ''}{act.name}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: 'var(--text3)', padding: '0 2px' }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {task.dueDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text3)', width: '70px', flexShrink: 0 }}>Deadline</span>
              <span style={{
                fontWeight: 600,
                color: isOverdue ? '#ef4444' : dl !== null && dl <= 3 ? '#f59e0b' : 'var(--text)',
              }}>
                {fmtDate(task.dueDate)}
                {dl !== null && task.status !== 'done' && (
                  <span style={{ fontWeight: 400, marginLeft: '6px', fontSize: '11px', color: isOverdue ? '#ef4444' : 'var(--text3)' }}>
                    {isOverdue ? `Quá hạn ${Math.abs(dl)} ngày` : dl === 0 ? 'Hôm nay' : `còn ${dl} ngày`}
                  </span>
                )}
              </span>
            </div>
          )}
          {task.assignee && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text3)', width: '70px', flexShrink: 0 }}>Giao cho</span>
              <span style={{ fontWeight: 500 }}>👤 {task.assignee}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text3)', width: '70px', flexShrink: 0 }}>Trạng thái</span>
            <span style={{
              padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
              background: isOverdue ? 'rgba(239,68,68,0.12)' : task.status === 'done' ? 'rgba(16,185,129,0.12)' : 'rgba(156,163,175,0.15)',
              color: isOverdue ? '#ef4444' : task.status === 'done' ? '#059669' : '#6b7280',
            }}>
              {isOverdue ? 'Quá hạn' : task.status === 'done' ? 'Hoàn thành' : 'Todo'}
            </span>
          </div>
          {task.notes && (
            <div style={{ fontSize: '12px', color: 'var(--text2)', background: 'var(--surface2)', borderRadius: '6px', padding: '8px 10px', marginTop: '2px' }}>
              {task.notes}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-sm"
            style={{
              flex: 1,
              background: task.status === 'done' ? 'rgba(156,163,175,0.15)' : 'rgba(16,185,129,0.12)',
              color: task.status === 'done' ? '#6b7280' : '#059669',
              border: `1px solid ${task.status === 'done' ? '#9ca3af' : '#10b981'}`,
              fontWeight: 600,
            }}
            onClick={toggleDone}
          >
            {task.status === 'done' ? '↩ Mở lại' : '✓ Đánh dấu Done'}
          </button>
          {act && (
            <button
              className="btn btn-sm"
              style={{ flex: 1, fontWeight: 500 }}
              onClick={() => { onClose(); nav(`/activity/${act.id}`); }}
            >
              Xem Activity →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const MasterCalendar = () => {
  const nav = useNavigate();
  const { tasks, activities, partners, addTask, updateTask } = useData();

  // View state
  const [view, setView]               = useState('month');
  const [weekOffset, setWeekOffset]   = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [quickAdd, setQuickAdd]       = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return; // ignore small movements
    if (dx < 0) {
      view === 'week' ? setWeekOffset(o => o + 1) : setMonthOffset(o => o + 1);
    } else {
      view === 'week' ? setWeekOffset(o => o - 1) : setMonthOffset(o => o - 1);
    }
  };

  // Toggles panel — tasks are either todo or done (no in_progress status)
  const [showTasks, setShowTasks] = useState({ todo: true, done: true, overdue: true });

  // Partner filter
  const [partnerFilter, setPartnerFilter] = useState('');

  const allChecked = showTasks.todo && showTasks.done && showTasks.overdue;
  const toggleAll = () => {
    const next = !allChecked;
    setShowTasks({ todo: next, done: next, overdue: next });
  };
  const toggleTaskFilter = (k) => setShowTasks(p => ({ ...p, [k]: !p[k] }));
  
  // Google Calendar — embed URL → ICS proxy → integrated grid events
  const [gcalEmbedUrl, setGcalEmbedUrl] = useState(() => localStorage.getItem('ilead_gcal_embed_url') || '');
  const [gcalInputVal, setGcalInputVal] = useState('');
  const [showGcalPanel, setShowGcalPanel] = useState(false);
  const [gcalEvents, setGcalEvents] = useState([]);
  const [gcalLoading, setGcalLoading] = useState(false);
  const [gcalError, setGcalError] = useState('');

  const saveGcalEmbedUrl = (url) => {
    setGcalEmbedUrl(url);
    localStorage.setItem('ilead_gcal_embed_url', url);
  };

  // Fetch ICS via server-side proxy whenever embed URL changes
  useEffect(() => {
    if (!gcalEmbedUrl) { setGcalEvents([]); return; }
    const icsUrl = getIcsUrlFromEmbedUrl(gcalEmbedUrl);
    if (!icsUrl) { setGcalError('Link không hợp lệ'); return; }
    setGcalLoading(true);
    setGcalError('');
    const winStart = new Date(); winStart.setMonth(winStart.getMonth() - 1);
    const winEnd   = new Date(); winEnd.setMonth(winEnd.getMonth() + 6);
    fetch(`/api/gcal-proxy?url=${encodeURIComponent(icsUrl)}`)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.text(); })
      .then(text => {
        const raw = parseICS(text);
        setGcalEvents(expandEvents(raw, winStart, winEnd));
        setGcalLoading(false);
      })
      .catch(() => { setGcalError('Lịch không công khai hoặc lỗi kết nối'); setGcalLoading(false); });
  }, [gcalEmbedUrl]);

  const today    = new Date();
  const todayIso = toLocalIso(today);

  const getContext = useCallback((task) => {
    const act = activities.find(a => a.id === task.activityId);
    const pa  = partners.find(p => p.id === act?.partnerId);
    return { act, pa };
  }, [activities, partners]);

  // Activity ids belonging to the current partner filter (empty filter = all)
  const partnerActivityIds = useMemo(() => {
    if (!partnerFilter) return null; // null = no filter
    return new Set(activities.filter(a => a.partnerId === partnerFilter).map(a => a.id));
  }, [partnerFilter, activities]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const isOverdue = t.dueDate && daysLeft(t.dueDate) < 0 && t.status !== 'done';
      if (isOverdue && !showTasks.overdue) return false;
      if (!isOverdue && t.status === 'todo' && !showTasks.todo) return false;
      if (t.status === 'done' && !showTasks.done) return false;
      if (partnerActivityIds && !partnerActivityIds.has(t.activityId)) return false;
      return true;
    });
  }, [tasks, showTasks, partnerActivityIds]);

  // Events per day — iLEAD Tasks + Google Calendar events
  const getUnifiedEventsForDay = (isoDate) => {
    const dayTasks = filteredTasks
      .filter(t => t.dueDate === isoDate)
      .map(t => ({ type: 'task', data: t }));
    const dayGcal = gcalEvents
      .filter(ev => icsValToIso(ev.dtstart) === isoDate)
      .map(ev => ({ type: 'gcal', data: ev }));
    return [...dayTasks, ...dayGcal];
  };

  // ── Grid Helpers ──
  const getWeekDays = () => {
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i); return d;
    });
  };
  const weekDays  = getWeekDays();
  const weekStart = toLocalIso(weekDays[0]);
  const weekEnd   = toLocalIso(weekDays[6]);

  const getMonthGrid = () => {
    const base     = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year     = base.getFullYear();
    const month    = base.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    let startDow   = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;
    const cells = [];
    for (let i = 0; i < startDow; i++) {
      const d = new Date(firstDay); d.setDate(firstDay.getDate() - startDow + i);
      cells.push({ date: d, inMonth: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push({ date: new Date(year, month, d), inMonth: true });
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last); d.setDate(last.getDate() + 1);
      cells.push({ date: d, inMonth: false });
    }
    return { cells, label: base.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) };
  };
  const { cells: monthCells, label: monthLabel } = getMonthGrid();

  const navLabel = view === 'week'
    ? `${fmtDate(weekStart)} — ${fmtDate(weekEnd)}`
    : monthLabel;

  // ── renderers ──
  const TaskChip = ({ task, compact }) => {
    const { act } = getContext(task);
    const isOverdue = task.dueDate && daysLeft(task.dueDate) < 0 && task.status !== 'done';
    const isDone    = task.status === 'done';

    const chipStyle = isOverdue
      ? { background: '#ef4444', color: '#fff', borderLeftColor: '#b91c1c' }
      : isDone
      ? { background: CHIP_COLORS.done.bg, color: CHIP_COLORS.done.color, borderLeftColor: CHIP_COLORS.done.border }
      : { background: CHIP_COLORS.todo.bg, color: CHIP_COLORS.todo.color, borderLeftColor: CHIP_COLORS.todo.border };

    return (
      <div
        className={`uc-event uc-evt-task${compact ? ' compact' : ''}`}
        style={chipStyle}
        onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
        title={`Task: ${task.name}${act ? ' · ' + act.name : ''}`}
      >
        <span className="uc-evt-icon">
          {isDone ? '✓' : isOverdue ? '!' : '○'}
        </span>
        <span className="uc-evt-name" style={isDone ? { textDecoration: 'line-through', opacity: 0.75 } : undefined}>
          {task.name}
        </span>
      </div>
    );
  };

  const ActivityChip = ({ act, compact }) => {
    const pa = partners.find(p => p.id === act.partnerId);
    const isOver = act.endDate && daysLeft(act.endDate) < 0 && act.status !== 'done';
    const color = act.status === 'done' ? '#10b981'
                : isOver ? '#ef4444'
                : act.status === 'in_progress' ? (STAGE_COLORS[act.stage] || pa?.color || '#6366f1')
                : '#9ca3af';
    return (
      <div
        className={`uc-event${compact ? ' compact' : ''}`}
        style={{ background: `${color}18`, color, borderLeftColor: color }}
        onClick={(e) => { e.stopPropagation(); nav(`/activity/${act.id}`); }}
        title={`${act.name}${pa ? ' · ' + pa.name : ''}`}
      >
        <span className="uc-evt-icon">◆</span>
        <span className="uc-evt-name">{act.name}</span>
      </div>
    );
  };

  const GCalChip = ({ ev, compact }) => {
    const timeStr = icsValToTime(ev.dtstart);
    const gcalLink = ev.url || `https://calendar.google.com/calendar/r`;
    return (
      <div
        className={`uc-event uc-evt-gcal${compact ? ' compact' : ''}`}
        title={`${timeStr ? timeStr + ' ' : ''}${ev.summary}`}
        onClick={(e) => { e.stopPropagation(); window.open(gcalLink, '_blank'); }}
        style={{ cursor: 'pointer' }}
      >
        <div className="uc-evt-gcal-dot" style={{ background: '#4285F4' }}></div>
        {timeStr && <span className="uc-evt-time" style={{ fontSize:'10px', opacity:0.8, marginRight:'2px' }}>{timeStr}</span>}
        <span className="uc-evt-name">{ev.summary || '(No title)'}</span>
      </div>
    );
  };
  const selectedTaskCtx = selectedTask ? getContext(selectedTask) : {};

  return (
    <div className="mc-root animate-fade-in" onClick={() => setQuickAdd(null)}>

      {/* ════════ LEFT SIDEBAR (Notion Style) ════════ */}
      <div className="mc-sidebar">
        
        {/* Workspace Tasks Group */}
        <div className="mc-sb-group">
          <div className="mc-sb-group-hdr">💼 iLEAD PM WORKSPACE</div>
          
          <label className="mc-sb-item" style={{ marginBottom: '4px' }}>
            <input type="checkbox" checked={allChecked} onChange={toggleAll} />
            <span className="mc-sb-swatch" style={{ background: '#e5e7eb', border: '1px solid #9ca3af' }}></span>
            <span className="mc-sb-label" style={{ fontWeight: 600 }}>All Tasks</span>
          </label>
          <label className="mc-sb-item" style={{ paddingLeft: '12px' }}>
            <input type="checkbox" checked={showTasks.todo} onChange={() => toggleTaskFilter('todo')} />
            <span className="mc-sb-swatch" style={{ background: '#9ca3af', border: '1px solid #6b7280' }}></span>
            <span className="mc-sb-label">Todo</span>
          </label>
          <label className="mc-sb-item" style={{ paddingLeft: '12px' }}>
            <input type="checkbox" checked={showTasks.done} onChange={() => toggleTaskFilter('done')} />
            <span className="mc-sb-swatch" style={{ background: CHIP_COLORS.done.bg, border: `1px solid ${CHIP_COLORS.done.border}` }}></span>
            <span className="mc-sb-label">Done</span>
          </label>
          <label className="mc-sb-item" style={{ paddingLeft: '12px' }}>
            <input type="checkbox" checked={showTasks.overdue} onChange={() => toggleTaskFilter('overdue')} />
            <span className="mc-sb-swatch" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444' }}></span>
            <span className="mc-sb-label" style={{ color:'var(--red)' }}>Quá hạn ⚠️</span>
          </label>
        </div>

        {/* Google Calendar Group */}
        <div className="mc-sb-group">
          <div className="mc-sb-group-hdr">📆 LỊCH GOOGLE</div>
          <div style={{ fontSize:'11px', color:'var(--text3)', padding:'4px 0' }}>Dùng nút GCal trên thanh lọc phía trên.</div>
        </div>

      </div>

      {/* ════════ MAIN CALENDAR PANE ════════ */}
      <div className="mc-main">

        {/* ── Header & Nav ── */}
        <div className="mc-header">
          <h1 className="page-title" style={{ fontSize: '20px', margin:0, flex:1 }}>
            Master Calendar <span style={{fontSize:'12px', fontWeight:500, color:'var(--text3)', marginLeft:'8px'}}>{navLabel}</span>
          </h1>
          
          <div className="mc-nav-controls">
            <button className="btn btn-sm" onClick={e => { e.stopPropagation(); setQuickAdd({ date: todayIso }); }}>
              ✚ Thêm Task
            </button>
            <div className="mc-view-tabs" style={{marginLeft:'8px'}}>
              {['week', 'month'].map(v => (
                <button key={v} className={`tab-pill${view === v ? ' active' : ''}`} onClick={() => setView(v)}>
                  {v === 'month' ? '⊞ Tháng' : '☰ Tuần'}
                </button>
              ))}
            </div>
            <div className="mc-nav-arrows">
              <button className="btn btn-sm" onClick={() => view === 'week' ? setWeekOffset(o => o - 1) : setMonthOffset(o => o - 1)}>‹</button>
              <button className="btn btn-sm" onClick={() => { setWeekOffset(0); setMonthOffset(0); }}>Hôm nay</button>
              <button className="btn btn-sm" onClick={() => view === 'week' ? setWeekOffset(o => o + 1) : setMonthOffset(o => o + 1)}>›</button>
            </div>
            <select
              className="qa-select"
              value={partnerFilter}
              onChange={e => setPartnerFilter(e.target.value)}
              style={{ marginLeft: '8px' }}
              title="Lọc theo Partner"
            >
              <option value="">Tất cả Partner</option>
              {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* ── Filter bar (all screens) ── */}
        <div className="mc-mobile-filters">
          {/* Nav row — only shown on mobile */}
          <div className="mc-nav-mobile-row">
            <button className="btn btn-sm" onClick={() => view === 'week' ? setWeekOffset(o => o - 1) : setMonthOffset(o => o - 1)}>‹</button>
            <span style={{ fontSize:'13px', fontWeight:600, flex:1, textAlign:'center' }}>{navLabel}</span>
            <button className="btn btn-sm" onClick={() => { setWeekOffset(0); setMonthOffset(0); }}>Hôm nay</button>
            <button className="btn btn-sm" onClick={() => view === 'week' ? setWeekOffset(o => o + 1) : setMonthOffset(o => o + 1)}>›</button>
          </div>
          {/* Filter chips row */}
          <div className="mc-filter-chips-row">
            <label className="mc-sb-item" style={{ margin:0 }}>
              <input type="checkbox" checked={showTasks.todo} onChange={() => toggleTaskFilter('todo')} />
              <span className="mc-sb-swatch" style={{ background:'#9ca3af', border:'1px solid #6b7280' }}></span>
              <span style={{ fontSize:'12px' }}>Todo</span>
            </label>
            <label className="mc-sb-item" style={{ margin:0 }}>
              <input type="checkbox" checked={showTasks.done} onChange={() => toggleTaskFilter('done')} />
              <span className="mc-sb-swatch" style={{ background: CHIP_COLORS.done.bg, border:`1px solid ${CHIP_COLORS.done.border}` }}></span>
              <span style={{ fontSize:'12px' }}>Done</span>
            </label>
            <label className="mc-sb-item" style={{ margin:0 }}>
              <input type="checkbox" checked={showTasks.overdue} onChange={() => toggleTaskFilter('overdue')} />
              <span className="mc-sb-swatch" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid #ef4444' }}></span>
              <span style={{ fontSize:'12px', color:'var(--red)' }}>Quá hạn</span>
            </label>
            {!gcalEmbedUrl ? (
              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
                <input
                  className="mc-sb-client-input"
                  style={{ width:220, fontSize:'12px' }}
                  placeholder="Dán link Google Calendar embed..."
                  value={gcalInputVal}
                  onChange={e => setGcalInputVal(e.target.value)}
                />
                <button className="btn btn-sm" onClick={() => { if (gcalInputVal.trim()) saveGcalEmbedUrl(gcalInputVal.trim()); }} style={{ background:'#fff', border:'1px solid var(--border)', color:'#3b82f6', whiteSpace:'nowrap' }}>
                  📅 Lưu
                </button>
              </div>
            ) : (
              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
                {gcalLoading && <span style={{ fontSize:'11px', color:'var(--text3)' }}>⏳</span>}
                {gcalError && <span style={{ fontSize:'11px', color:'#ef4444' }} title={gcalError}>⚠️</span>}
                {!gcalError && !gcalLoading && gcalEvents.length > 0 && <span style={{ fontSize:'11px', color:'#4285F4' }}>●</span>}
                <button className="btn btn-sm" onClick={() => setShowGcalPanel(v => !v)} style={{ background: showGcalPanel ? '#3b82f6' : '#fff', border:'1px solid var(--border)', color: showGcalPanel ? '#fff' : '#3b82f6', whiteSpace:'nowrap' }}>
                  📅 Google Cal
                </button>
                <button onClick={() => { saveGcalEmbedUrl(''); setGcalEvents([]); setShowGcalPanel(false); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:'14px' }} title="Xóa lịch Google">✕</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick Add Panel ── */}
        {quickAdd && (
          <div style={{ position:'absolute', zIndex:100, top:'60px', right:'20px' }}>
            <QuickAddTask defaultDate={quickAdd.date} activities={activities} addTask={addTask} onClose={() => setQuickAdd(null)} />
          </div>
        )}

        {/* ── UNIFIED GRID (Month & Week) ── */}
        <div className="mc-grid-container"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          
          {/* MONTH VIEW */}
          {view === 'month' && (
            <div className="uc-month-grid">
              {MONTH_GRID_DAYS.map(d => (
                <div key={d} className="uc-dow-hdr">{d}</div>
              ))}
              {monthCells.map((cell, i) => {
                const iso      = toLocalIso(cell.date);
                const events   = getUnifiedEventsForDay(iso);
                const isToday  = iso === todayIso;
                return (
                  <div
                    key={i}
                    className={`uc-cell${!cell.inMonth ? ' out-month' : ''}${isToday ? ' is-today' : ''}`}
                    onClick={e => { e.stopPropagation(); setQuickAdd({ date: iso }); }}
                  >
                    <div className="uc-cell-num">
                      <span className="uc-cell-add">+</span>
                      {isToday
                        ? <span className="today-num">{cell.date.getDate()}</span>
                        : cell.date.getDate()
                      }
                    </div>
                    <div className="uc-events-list">
                      {events.slice(0, 4).map((evt) =>
                        evt.type === 'task'
                          ? <TaskChip key={`t_${evt.data.id}`} task={evt.data} compact />
                          : <GCalChip key={`g_${evt.data.uid || evt.data.summary}`} ev={evt.data} compact />
                      )}
                      {events.length > 4 && <div className="uc-more">+{events.length - 4} nữa</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* WEEK VIEW (Time Block style, simpler version) */}
          {view === 'week' && (
            <div className="uc-week-grid">
              <div className="uc-week-scroll">
                <div className="uc-week-row hdr">
                  {weekDays.map((d, i) => {
                    const iso = toLocalIso(d);
                    const isToday = iso === todayIso;
                    return (
                      <div key={i} className={`uc-week-col-hdr${isToday?' is-today':''}`}>
                        <div className="uc-wdow">{DAY_NAMES[i]}</div>
                        <div className="uc-wnum">{d.getDate()}</div>
                        <button className="uc-wadd" onClick={e => { e.stopPropagation(); setQuickAdd({ date: iso }); }}>+</button>
                      </div>
                    );
                  })}
                </div>
                <div className="uc-week-row body">
                  {weekDays.map((d, i) => {
                    const iso = toLocalIso(d);
                    const events = getUnifiedEventsForDay(iso);
                    const isToday = iso === todayIso;
                    return (
                      <div key={i} className={`uc-week-col${isToday?' is-today':''}`}>
                        <div className="uc-events-list" style={{ marginTop:'8px' }}>
                          {events.map((evt) =>
                            evt.type === 'task'
                              ? <TaskChip key={`tw_${evt.data.id}`} task={evt.data} />
                              : <GCalChip key={`gw_${evt.data.uid || evt.data.summary}`} ev={evt.data} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {selectedTask && (
        <TaskDetailPopup
          task={selectedTask}
          act={selectedTaskCtx.act}
          pa={selectedTaskCtx.pa}
          nav={nav}
          onClose={() => setSelectedTask(null)}
          updateTask={updateTask}
        />
      )}

      {/* Google Calendar iframe panel */}
      {showGcalPanel && gcalEmbedUrl && (
        <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setShowGcalPanel(false)}>
          <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', width:'min(900px, 95vw)', height:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid #e5e7eb' }}>
              <span style={{ fontWeight:600, fontSize:'14px' }}>📅 Google Calendar</span>
              <button onClick={() => setShowGcalPanel(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'18px', color:'#6b7280' }}>✕</button>
            </div>
            <iframe
              src={gcalEmbedUrl}
              style={{ flex:1, border:'none', width:'100%' }}
              title="Google Calendar"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterCalendar;
