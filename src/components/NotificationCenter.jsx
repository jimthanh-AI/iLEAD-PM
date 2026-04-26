import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { daysLeft } from '../utils/constants';
import './NotificationCenter.css';

// ─── Notification generators ──────────────────────────────────

const buildNotifications = (activities, tasks, partnerMap) => {
  const notifs = [];

  activities.forEach(a => {
    if (a.status === 'done' || a.status === 'not_completed') return;
    const dl = daysLeft(a.endDate);
    if (dl === null) return;

    const partner = partnerMap[a.partnerId];
    const ctx     = partner?.name ? `[${partner.name}]` : '';

    if (dl < 0) {
      notifs.push({
        id       : `ov_act_${a.id}`,
        type     : 'overdue',
        icon     : '🔴',
        title    : `Activity quá hạn ${-dl} ngày`,
        desc     : `${a.name} ${ctx}`,
        path     : `/activity/${a.id}`,
        priority : 1,
        date     : a.endDate,
      });
    } else if (dl === 0) {
      notifs.push({
        id       : `dl0_act_${a.id}`,
        type     : 'deadline',
        icon     : '🟠',
        title    : 'Deadline HÔM NAY',
        desc     : `${a.name} ${ctx}`,
        path     : `/activity/${a.id}`,
        priority : 2,
        date     : a.endDate,
      });
    } else if (dl <= 3) {
      notifs.push({
        id       : `dl3_act_${a.id}`,
        type     : 'deadline',
        icon     : '🟡',
        title    : `Deadline trong ${dl} ngày`,
        desc     : `${a.name} ${ctx}`,
        path     : `/activity/${a.id}`,
        priority : 3,
        date     : a.endDate,
      });
    }
  });

  tasks.forEach(t => {
    if (t.status === 'done') return;
    const dl = daysLeft(t.dueDate);
    if (dl === null || dl >= 0) return;

    notifs.push({
      id       : `ov_task_${t.id}`,
      type     : 'overdue',
      icon     : '🔴',
      title    : `Task quá hạn ${-dl} ngày`,
      desc     : `${t.name}${t.assignee ? ' — ' + t.assignee : ''}`,
      path     : `/activity/${t.activityId}`,
      priority : 4,
      date     : t.dueDate,
    });
  });

  // Sort: priority asc (1=most urgent), then date asc
  notifs.sort((a, b) => a.priority - b.priority || (a.date > b.date ? 1 : -1));
  return notifs;
};

// ─── Component ────────────────────────────────────────────────

const STORAGE_KEY = 'ilead_notif_read_v1';

const NotificationCenter = () => {
  const nav = useNavigate();
  const { activities, tasks, partnerMap } = useData();
  const [open, setOpen]   = useState(false);
  const panelRef          = useRef(null);
  const btnRef            = useRef(null);

  // Set of notification IDs the user has dismissed/read
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []); }
    catch { return new Set(); }
  });

  // Persist read state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...readIds]));
  }, [readIds]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          btnRef.current   && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const notifications = useMemo(
    () => buildNotifications(activities, tasks, partnerMap),
    [activities, tasks, partnerMap]
  );

  const unread = notifications.filter(n => !readIds.has(n.id));

  const markRead  = (id) => setReadIds(s => new Set([...s, id]));
  const markAll   = ()   => setReadIds(new Set(notifications.map(n => n.id)));

  const handleClick = (n) => {
    markRead(n.id);
    setOpen(false);
    nav(n.path);
  };

  const TYPE_CSS = {
    overdue  : 'nc-tag-red',
    deadline : 'nc-tag-orange',
  };

  return (
    <div className="nc-root">
      {/* Bell button */}
      <button
        ref={btnRef}
        className={`nc-bell-btn${open ? ' active' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Thông báo"
        aria-label={`${unread.length} thông báo chưa đọc`}
      >
        🔔
        {unread.length > 0 && (
          <span className="nc-badge">{unread.length > 9 ? '9+' : unread.length}</span>
        )}
      </button>

      {/* Notification panel */}
      {open && (
        <div ref={panelRef} className="nc-panel glass-card">
          {/* Panel header */}
          <div className="nc-panel-hdr">
            <span className="nc-panel-title">Thông báo</span>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              {unread.length > 0 && (
                <button className="nc-clear-btn" onClick={markAll}>
                  Đánh dấu tất cả đã đọc
                </button>
              )}
              <button className="nc-close-btn" onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          {/* Notification list */}
          <div className="nc-list">
            {notifications.length === 0 && (
              <div className="nc-empty">
                <div style={{ fontSize:'28px', marginBottom:'6px' }}>✅</div>
                Không có thông báo nào. Tất cả đều đúng hạn!
              </div>
            )}

            {notifications.map(n => {
              const isRead = readIds.has(n.id);
              return (
                <button
                  key={n.id}
                  className={`nc-item${isRead ? ' nc-item-read' : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <span className="nc-item-icon">{n.icon}</span>
                  <div className="nc-item-body">
                    <div className="nc-item-title">{n.title}</div>
                    <div className="nc-item-desc">{n.desc}</div>
                  </div>
                  <span className={`nc-tag ${TYPE_CSS[n.type] || ''}`}>
                    {n.type === 'overdue' ? 'Quá hạn' : 'Deadline'}
                  </span>
                  {!isRead && <span className="nc-dot" />}
                </button>
              );
            })}
          </div>

          {notifications.length > 0 && (
            <div className="nc-footer">
              {notifications.length} thông báo · {unread.length} chưa đọc
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
