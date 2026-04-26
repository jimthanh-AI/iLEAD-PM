import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { STAGE_COLORS, STATUS_CSS, STATUS_LABELS, daysLeft, fmtDate } from '../utils/constants';
import './WeeklyPlan.css';

const DAY_NAMES = ['T2','T3','T4','T5','T6','T7','CN'];
const DAY_FULL  = ['Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy','Chủ Nhật'];

const WeeklyPlan = () => {
  const nav = useNavigate();
  const { activities, tasks, partners, partnerMap } = useData();
  const [weekOffset, setWeekOffset] = useState(0);

  const today   = new Date();
  const dow     = today.getDay();
  const monday  = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i); return d;
  });

  const todayIso  = today.toISOString().split('T')[0];
  const weekStart = days[0].toISOString().split('T')[0];
  const weekEnd   = days[6].toISOString().split('T')[0];

  // Activities overlapping this week
  const weekActivities = useMemo(() => activities.filter(a => {
    const s = a.startDate || a.endDate;
    const e = a.endDate   || a.startDate;
    return s && e && s <= weekEnd && e >= weekStart;
  }), [activities, weekStart, weekEnd]);

  // Tasks due this week (not done)
  const weekTasks = useMemo(() => tasks.filter(t =>
    t.dueDate && t.dueDate >= weekStart && t.dueDate <= weekEnd && t.status !== 'done'
  ), [tasks, weekStart, weekEnd]);

  const activitiesOnDay = (iso) => weekActivities.filter(a => {
    const s = a.startDate || iso;
    const e = a.endDate   || iso;
    return s <= iso && e >= iso;
  });

  const tasksOnDay = (iso) => weekTasks.filter(t => t.dueDate === iso);

  // Alerts
  const overdue = activities.filter(a => a.status !== 'done' && daysLeft(a.endDate) < 0).length;
  const dueSoon = activities.filter(a => a.status !== 'done' && daysLeft(a.endDate) !== null && daysLeft(a.endDate) >= 0 && daysLeft(a.endDate) <= 7).length;

  const weekLabel = `${fmtDate(weekStart)} – ${fmtDate(weekEnd)}`;

  return (
    <div className="weekly-page animate-fade-in">
      {/* Header */}
      <div className="weekly-header">
        <div>
          <h1 className="page-title">Kế hoạch tuần</h1>
          <p className="weekly-range">{weekLabel}{weekOffset === 0 ? ' · Tuần hiện tại' : ''}</p>
        </div>
        <div className="weekly-nav">
          <button className="btn btn-sm" onClick={() => setWeekOffset(o => o - 1)}>‹ Tuần trước</button>
          <button className="btn btn-sm" onClick={() => setWeekOffset(0)}>Tuần này</button>
          <button className="btn btn-sm" onClick={() => setWeekOffset(o => o + 1)}>Tuần sau ›</button>
        </div>
      </div>

      {/* Alert banners */}
      {(overdue > 0 || dueSoon > 0 || weekTasks.length > 0) && (
        <div className="weekly-alerts">
          {overdue > 0    && <div className="alert-pill danger">⚠ {overdue} hoạt động quá hạn</div>}
          {dueSoon > 0    && <div className="alert-pill warn">⏰ {dueSoon} hoạt động đến hạn trong 7 ngày</div>}
          {weekTasks.length > 0 && <div className="alert-pill info">✓ {weekTasks.length} task cần hoàn thành tuần này</div>}
        </div>
      )}

      {/* Week Grid */}
      <div className="week-grid-scroll">
      <div className="week-grid">
        {days.map((d, i) => {
          const iso     = d.toISOString().split('T')[0];
          const isToday = iso === todayIso;
          const isWknd  = i >= 5;
          const acts    = activitiesOnDay(iso);
          const tks     = tasksOnDay(iso);

          return (
            <div key={i} className={`week-day-col${isToday ? ' today' : ''}${isWknd ? ' weekend' : ''}`}>
              <div className="week-day-hdr">
                <div className="week-day-name">{DAY_NAMES[i]}</div>
                <div className={`week-day-num${isToday ? ' today' : ''}`}>{d.getDate()}</div>
              </div>
              <div className="week-day-body">
                {acts.map(a => {
                  const col = STAGE_COLORS[a.stage] || '#888';
                  const isDeadline = a.endDate === iso;
                  return (
                    <div key={a.id} className={`week-chip${isDeadline ? ' deadline' : ''}`}
                      style={{ background:`${col}18`, color:col, borderLeftColor:col }}
                      onClick={() => nav(`/activity/${a.id}`)} title={a.name}>
                      {isDeadline && <span className="chip-dl">⏰</span>}
                      {a.name.length > 22 ? a.name.slice(0,22)+'…' : a.name}
                    </div>
                  );
                })}
                {tks.map(t => (
                  <div key={t.id} className="week-task-chip" title={t.name}>
                    ✓ {t.name.length > 20 ? t.name.slice(0,20)+'…' : t.name}
                  </div>
                ))}
                {acts.length === 0 && tks.length === 0 && <div className="week-empty">—</div>}
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* Activity list */}
      <div className="weekly-list-section">
        <h2 className="wlist-title">Hoạt động trong tuần ({weekActivities.length})</h2>
        {weekActivities.length === 0
          ? <p className="wlist-empty">Không có hoạt động nào trong tuần này.</p>
          : weekActivities.map(a => {
              const p  = partnerMap[a.partnerId];
              const dl = daysLeft(a.endDate);
              const isOverdue = dl !== null && dl < 0;
              return (
                <div key={a.id} className="wlist-row" onClick={() => nav(`/activity/${a.id}`)}>
                  <span className="wlist-dot" style={{ background: p?.color || '#ccc' }}></span>
                  <div className="wlist-info">
                    <span className="wlist-name">{a.name}</span>
                    <span className="wlist-partner">{p?.name || '—'}</span>
                  </div>
                  <span className={`cell-tag ${STATUS_CSS[a.status]}`}>{STATUS_LABELS[a.status]}</span>
                  <span className={`wlist-date${isOverdue ? ' overdue' : ''}`}>
                    {a.endDate ? fmtDate(a.endDate) : '—'}
                    {isOverdue && <span className="overdue-tag"> +{-dl}d</span>}
                  </span>
                </div>
              );
            })
        }
      </div>

      {/* Tasks due this week */}
      {weekTasks.length > 0 && (
        <div className="weekly-list-section">
          <h2 className="wlist-title">Tasks đến hạn tuần này ({weekTasks.length})</h2>
          {weekTasks.map(t => {
            const act = activities.find(a => a.id === t.activityId);
            const p   = act ? partnerMap[act.partnerId] : null;
            return (
              <div key={t.id} className="wlist-row task-row">
                <span className="wlist-dot" style={{ background: p?.color || '#6366f1' }}></span>
                <div className="wlist-info">
                  <span className="wlist-name">✓ {t.name}</span>
                  <span className="wlist-partner">{act?.name || '—'}</span>
                </div>
                <span className="wlist-date">{t.dueDate ? fmtDate(t.dueDate) : '—'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeeklyPlan;
