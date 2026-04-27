import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { TASK_STATUS_LABELS, fmtDate, daysLeft, generateId, TEAM_MEMBERS } from '../utils/constants';
import './MasterCalendar.css';

const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_GRID_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const CHIP_COLORS = {
  done:        { bg: 'rgba(16,185,129,.15)', color: '#059669', border: '#10b981' },
  in_progress: { bg: 'rgba(37,99,235,.13)', color: '#2563eb', border: '#3b82f6' },
  todo:        { bg: 'rgba(156,163,175,.13)', color: '#6b7280', border: '#9ca3af' },
};

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
      pos: Date.now(),
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

export const MasterCalendar = () => {
  const nav = useNavigate();
  const { tasks, activities, partners, addTask } = useData();

  // View state
  const [view, setView]               = useState('month');
  const [weekOffset, setWeekOffset]   = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [quickAdd, setQuickAdd]       = useState(null);

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
  
  // Google API State
  const [clientId, setClientId] = useState(() => localStorage.getItem('ilead_gcal_client_id') || '');
  const [gcalAuthToken, setGcalAuthToken] = useState(null);
  const [gcalEvents, setGcalEvents] = useState([]);
  const [loadingGcal, setLoadingGcal] = useState(false);
  const [showGcalEvents, setShowGcalEvents] = useState(true);

  // Auth & Fetch Google Calendar
  const saveClientId = (id) => {
    setClientId(id);
    localStorage.setItem('ilead_gcal_client_id', id);
  };

  const handleAuthClick = () => {
    if (!clientId) {
      alert("Vui lòng nhập Google Client ID trước.");
      return;
    }
    if (!window.google) {
      alert("Google Identity Services script chưa được tải. Đang tải lại trang...");
      window.location.reload();
      return;
    }
    
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/calendar.events.readonly',
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          setGcalAuthToken(tokenResponse.access_token);
          fetchGoogleEvents(tokenResponse.access_token);
        }
      },
    });
    client.requestAccessToken();
  };

  const fetchGoogleEvents = async (token) => {
    setLoadingGcal(true);
    try {
      // Calculate start & end of current view window approx (just fetch a wide range, e.g. -1 month to +2 months)
      const timeMin = new Date(); timeMin.setMonth(timeMin.getMonth() - 2);
      const timeMax = new Date(); timeMax.setMonth(timeMax.getMonth() + 3);

      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.items) {
        setGcalEvents(data.items);
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi khi tải sự kiện Google Calendar.");
    }
    setLoadingGcal(false);
  };

  // Re-fetch if view changes significantly? For simplicity we fetched a 5 month window.

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

  // Combine unified events — Tasks + GCal only (no activities)
  const getUnifiedEventsForDay = (isoDate) => {
    // 1. iLEAD Tasks by deadline
    const dayTasks = filteredTasks
      .filter(t => t.dueDate === isoDate)
      .map(t => ({ type: 'task', data: t, sortTime: '00:00:00' }));

    // 2. Google Calendar Events
    let dayGcal = [];
    if (showGcalEvents) {
      dayGcal = gcalEvents
        .filter(ev => {
          if (ev.start?.date) return ev.start.date === isoDate;
          if (ev.start?.dateTime) return ev.start.dateTime.startsWith(isoDate);
          return false;
        })
        .map(ev => ({
          type: 'gcal',
          data: ev,
          sortTime: ev.start?.dateTime ? ev.start.dateTime.substring(11, 19) : '00:00:00'
        }));
    }

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
        onClick={(e) => { e.stopPropagation(); act && nav(`/activity/${act.id}`); }}
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
    const color = pa?.color || '#6366f1';
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
    // Format start time if available
    const timeStr = ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' }) : '';
    const color = ev.colorId ? '#4285F4' : '#039be5'; // simplified Gcal colors mapping
    return (
      <div 
        className={`uc-event uc-evt-gcal${compact ? ' compact' : ''}`}
        title={`GCal: ${ev.summary}`}
        onClick={(e) => { e.stopPropagation(); window.open(ev.htmlLink, '_blank'); }}
      >
        <div className="uc-evt-gcal-dot" style={{ background: color }}></div>
        {timeStr && !compact && <span className="uc-evt-time">{timeStr}</span>}
        <span className="uc-evt-name">{ev.summary || '(No title)'}</span>
      </div>
    );
  };
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
          {!gcalAuthToken ? (
            <div className="mc-sb-auth-card">
              <input 
                className="mc-sb-client-input" 
                placeholder="Nhập phần đầu GCal Client ID..."
                value={clientId.split('.apps.googleusercontent.com')[0]}
                onChange={e => saveClientId(e.target.value + '.apps.googleusercontent.com')}
                title="Chỉ cần nhập phần Client ID trước đuôi .apps.googleusercontent.com"
              />
              <button className="btn btn-sm" onClick={handleAuthClick} style={{ width:'100%', background:'#fff', border:'1px solid var(--border)', color:'#3b82f6', fontWeight:600 }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" style={{ width:12, marginRight:6 }}/>
                Kết nối GCal
              </button>
            </div>
          ) : (
            <>
              <label className="mc-sb-item">
                <input type="checkbox" checked={showGcalEvents} onChange={() => setShowGcalEvents(v=>!v)} />
                <span className="mc-sb-swatch" style={{ background: '#4285F4' }}></span>
                <span className="mc-sb-label">Primary Calendar</span>
                {loadingGcal && <span style={{fontSize:'10px', color:'var(--text3)'}}>⏳</span>}
              </label>
              <div className="mc-sb-auth-info">Đã kết nối Google ☑</div>
            </>
          )}
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

        {/* ── Mobile filter bar (hidden on desktop via CSS) ── */}
        <div className="mc-mobile-filters">
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
          {!gcalAuthToken ? (
            <button className="btn btn-sm" onClick={handleAuthClick} style={{ marginLeft:'auto', background:'#fff', border:'1px solid var(--border)', color:'#3b82f6' }}>
              📅 GCal
            </button>
          ) : (
            <label className="mc-sb-item" style={{ margin:0, marginLeft:'auto' }}>
              <input type="checkbox" checked={showGcalEvents} onChange={() => setShowGcalEvents(v=>!v)} />
              <span className="mc-sb-swatch" style={{ background:'#4285F4' }}></span>
              <span style={{ fontSize:'12px' }}>Google Cal ☑</span>
            </label>
          )}
        </div>

        {/* ── Quick Add Panel ── */}
        {quickAdd && (
          <div style={{ position:'absolute', zIndex:100, top:'60px', right:'20px' }}>
            <QuickAddTask defaultDate={quickAdd.date} activities={activities} addTask={addTask} onClose={() => setQuickAdd(null)} />
          </div>
        )}

        {/* ── UNIFIED GRID (Month & Week) ── */}
        <div className="mc-grid-container">
          
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
                        evt.type === 'task' ? <TaskChip key={`t_${evt.data.id}`} task={evt.data} compact />
                                            : <GCalChip key={`g_${evt.data.id}`} ev={evt.data} compact />
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
                            evt.type === 'task' ? <TaskChip key={`tw_${evt.data.id}`} task={evt.data} />
                                                : <GCalChip key={`gw_${evt.data.id}`} ev={evt.data} />
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

    </div>
  );
};

export default MasterCalendar;
