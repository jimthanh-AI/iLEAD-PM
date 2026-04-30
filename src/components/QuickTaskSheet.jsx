import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { generateId } from '../utils/constants';
import './QuickTaskSheet.css';

const MOBILE_TEAM = [
  { id: 'jthanh',  name: 'Jim Thanh',   initials: 'JT', color: '#2563eb' },
  { id: 'hphung',  name: 'Hieu Phung',  initials: 'HP', color: '#7c3aed' },
  { id: 'yton',    name: 'Yen Ton',     initials: 'YT', color: '#16a34a' },
  { id: 'tnguyen', name: 'Truc Nguyen', initials: 'TN', color: '#d97706' },
];

const today     = () => new Date().toISOString().slice(0, 10);
const tomorrow  = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
const nextWeek  = () => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); };

const fmtLabel = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'numeric' });
};

const QuickTaskSheet = ({ isOpen, onClose }) => {
  const { activities, addTask } = useData();
  const { addToast } = useToast();

  const [name,        setName]        = useState('');
  const [dueDate,     setDueDate]     = useState(tomorrow());
  const [customDate,  setCustomDate]  = useState('');
  const [deadlineTab, setDeadlineTab] = useState('tomorrow'); // today|tomorrow|next|custom
  const [assignees,   setAssignees]   = useState([]);
  const [activityId,  setActivityId]  = useState('');
  const [actSearch,   setActSearch]   = useState('');
  const [actDropOpen, setActDropOpen] = useState(false);
  const nameRef = useRef(null);
  const actDropRef = useRef(null);

  // Auto-focus name when sheet opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameRef.current?.focus(), 350);
    } else {
      // Reset form on close
      setName('');
      setDueDate(tomorrow());
      setDeadlineTab('tomorrow');
      setCustomDate('');
      setAssignees([]);
      setActivityId('');
      setActSearch('');
      setActDropOpen(false);
    }
  }, [isOpen]);

  // Close activity dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (actDropRef.current && !actDropRef.current.contains(e.target)) {
        setActDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectDeadline = (tab) => {
    setDeadlineTab(tab);
    if (tab === 'today')    setDueDate(today());
    if (tab === 'tomorrow') setDueDate(tomorrow());
    if (tab === 'next')     setDueDate(nextWeek());
    if (tab === 'custom')   setDueDate(customDate || '');
  };

  const toggleAssignee = (id) => {
    setAssignees(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredActivities = activities.filter(a =>
    !actSearch || a.name.toLowerCase().includes(actSearch.toLowerCase())
  );

  const selectedActivity = activities.find(a => a.id === activityId);

  const handleSubmit = () => {
    if (!name.trim()) { nameRef.current?.focus(); return; }

    const assigneeNames = assignees
      .map(id => MOBILE_TEAM.find(m => m.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    addTask({
      id: generateId(),
      name: name.trim(),
      dueDate: dueDate || null,
      assignee: assigneeNames || '',
      activityId: activityId || null,
      status: 'todo',
      notes: '',
    });

    addToast('Da them task', 'success');
    onClose();
  };

  // Drag-to-close: simple touch swipe down
  const startY = useRef(null);
  const onTouchStart = (e) => { startY.current = e.touches[0].clientY; };
  const onTouchEnd   = (e) => {
    if (startY.current !== null && e.changedTouches[0].clientY - startY.current > 80) {
      onClose();
    }
    startY.current = null;
  };

  return (
    <>
      {isOpen && <div className="qts-backdrop" onClick={onClose} />}
      <div className={`qts-sheet${isOpen ? ' qts-sheet-open' : ''}`}>
        {/* Drag handle */}
        <div className="qts-handle-area" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="qts-handle" />
        </div>

        {/* Header */}
        <div className="qts-header">
          <span className="qts-title">Task moi</span>
          <button className="qts-close" onClick={onClose}>×</button>
        </div>

        <div className="qts-body">
          {/* Task name */}
          <div className="qts-field">
            <label className="qts-label">TEN CONG VIEC</label>
            <input
              ref={nameRef}
              className="qts-input"
              placeholder="Nhap ten task..."
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {/* Deadline */}
          <div className="qts-field">
            <label className="qts-label">DEADLINE</label>
            <div className="qts-deadline-pills">
              <button
                className={`qts-pill${deadlineTab === 'today' ? ' qts-pill-active' : ''}`}
                onClick={() => selectDeadline('today')}
              >
                Hom nay {fmtLabel(today())}
              </button>
              <button
                className={`qts-pill${deadlineTab === 'tomorrow' ? ' qts-pill-active' : ''}`}
                onClick={() => selectDeadline('tomorrow')}
              >
                Ngay mai {fmtLabel(tomorrow())}
              </button>
              <button
                className={`qts-pill${deadlineTab === 'next' ? ' qts-pill-active' : ''}`}
                onClick={() => selectDeadline('next')}
              >
                Tuan sau {fmtLabel(nextWeek())}
              </button>
              <button
                className={`qts-pill${deadlineTab === 'custom' ? ' qts-pill-active' : ''}`}
                onClick={() => selectDeadline('custom')}
              >
                Khac {deadlineTab === 'custom' && dueDate ? fmtLabel(dueDate) : '📅'}
              </button>
            </div>
            {deadlineTab === 'custom' && (
              <input
                type="date"
                className="qts-input"
                style={{ marginTop: '8px' }}
                value={customDate}
                onChange={e => { setCustomDate(e.target.value); setDueDate(e.target.value); }}
              />
            )}
          </div>

          {/* Assignees */}
          <div className="qts-field">
            <label className="qts-label">GIAO CHO</label>
            <div className="qts-assignees">
              {MOBILE_TEAM.map(m => {
                const selected = assignees.includes(m.id);
                return (
                  <button
                    key={m.id}
                    className={`qts-avatar-btn${selected ? ' qts-avatar-selected' : ''}`}
                    onClick={() => toggleAssignee(m.id)}
                  >
                    <div
                      className="qts-avatar"
                      style={{ background: m.color, outline: selected ? `2.5px solid ${m.color}` : 'none', outlineOffset: '2px' }}
                    >
                      {m.initials}
                    </div>
                    <span className="qts-avatar-name">{m.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity (optional) */}
          <div className="qts-field">
            <label className="qts-label">HOAT DONG (TUY CHON)</label>
            <div className="qts-activity-wrap" ref={actDropRef}>
              <button
                className="qts-activity-trigger"
                onClick={() => setActDropOpen(o => !o)}
              >
                <span className={selectedActivity ? 'qts-activity-selected' : 'qts-activity-placeholder'}>
                  {selectedActivity ? selectedActivity.name : 'Chon activity...'}
                </span>
                <span className="qts-activity-arrow">{actDropOpen ? '▲' : '▼'}</span>
              </button>
              {actDropOpen && (
                <div className="qts-activity-dropdown">
                  <input
                    className="qts-activity-search"
                    placeholder="Tim activity..."
                    value={actSearch}
                    onChange={e => setActSearch(e.target.value)}
                    autoFocus
                  />
                  <div className="qts-activity-list">
                    <button
                      className="qts-activity-option"
                      onClick={() => { setActivityId(''); setActDropOpen(false); setActSearch(''); }}
                    >
                      — Khong chon
                    </button>
                    {filteredActivities.map(a => (
                      <button
                        key={a.id}
                        className={`qts-activity-option${activityId === a.id ? ' qts-activity-option-active' : ''}`}
                        onClick={() => { setActivityId(a.id); setActDropOpen(false); setActSearch(''); }}
                      >
                        {a.name}
                      </button>
                    ))}
                    {filteredActivities.length === 0 && (
                      <div className="qts-activity-empty">Khong tim thay</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="qts-footer">
          <button className="qts-submit" onClick={handleSubmit}>
            + Them task
          </button>
        </div>
      </div>
    </>
  );
};

export default QuickTaskSheet;
