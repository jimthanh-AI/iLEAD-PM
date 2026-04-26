import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { generateId, TEAM_MEMBERS } from '../../utils/constants';
import { Modal } from '../Modal';

const defaultForm = (activityId) => ({ name: '', status: 'todo', assignee: '', dueDate: '', activityId: activityId || '' });

const fromTask = (t, fallbackActivityId) => ({
  name:       t.name       || '',
  status:     t.status === 'in_progress' ? 'todo' : (t.status || 'todo'),
  assignee:   t.assignee   || '',
  dueDate:    t.dueDate    || '',
  activityId: t.activityId || fallbackActivityId || '',
});

export const TaskForm = ({ isOpen, onClose, activityId, editTask }) => {
  const { addTask, updateTask, activities } = useData();
  const [form, setForm] = useState(editTask ? fromTask(editTask, activityId) : defaultForm(activityId));
  const [error, setError] = useState('');

  // Re-sync form whenever the modal opens or switches to a different task
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setForm(editTask ? fromTask(editTask, activityId) : defaultForm(activityId));
  }, [isOpen, editTask]); // eslint-disable-line

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim()) { setError('Nhập tên task'); return; }
    try {
      if (editTask) {
        updateTask(editTask.id, { ...form, notes: editTask.notes || '' });
      } else {
        addTask({ id: generateId('t'), notes: '', pos: Date.now(), ...form });
      }
      setForm(defaultForm(activityId));
      setError('');
      onClose();
    } catch (e) {
      setError('Lỗi: ' + e.message);
    }
  };

  const handleClose = () => { setForm(defaultForm(activityId)); setError(''); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}
      title={editTask ? 'Sửa task' : 'Thêm task mới'}
      onSubmit={handleSubmit}
      submitLabel={editTask ? 'Cập nhật' : 'Thêm task'}
    >
      <div className="form-group">
        <label className="form-label">Tên Task *</label>
        <input autoFocus className="form-input" value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Viết TOR và gửi Jane duyệt" />
      </div>

      <div className="form-group">
        <label className="form-label">Thuộc hoạt động</label>
        <select className="form-select" value={form.activityId} onChange={e => set('activityId', e.target.value)}>
          <option value="">— Hoạt động khác —</option>
          {(activities || []).map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Deadline</label>
          <input className="form-input" type="date" value={form.dueDate}
            onChange={e => set('dueDate', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Giao cho</label>
          <select className="form-select" value={form.assignee} onChange={e => set('assignee', e.target.value)}>
            <option value="">— Chọn thành viên —</option>
            {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {editTask && (
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="todo">Todo</option>
            <option value="done">Done</option>
          </select>
        </div>
      )}

      {error && <p style={{ color: 'var(--red)', fontSize: '12px' }}>{error}</p>}
    </Modal>
  );
};
