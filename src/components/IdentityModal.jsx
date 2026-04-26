import React, { useState, useEffect } from 'react';
import './IdentityModal.css';

export const ROLES = {
  admin      : { label: 'Admin',       desc: 'Toàn quyền — xóa partner, project, activity, task' },
  pm         : { label: 'PM',          desc: 'Quản lý — chỉnh sửa & xóa project, activity, task' },
  coordinator: { label: 'Coordinator', desc: 'Thực thi — chỉnh sửa nhưng không xóa project' },
  viewer     : { label: 'Viewer',      desc: 'Chỉ xem — không được chỉnh sửa hay xóa' },
};

export const IdentityModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName]     = useState('');
  const [role, setRole]     = useState('coordinator');

  useEffect(() => {
    const savedName = localStorage.getItem('ilead_author_name');
    if (!savedName) setIsOpen(true);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    localStorage.setItem('ilead_author_name', name.trim());
    localStorage.setItem('ilead_user_role', role);
    setIsOpen(false);
    // Notify DataContext to re-read role
    window.dispatchEvent(new CustomEvent('ilead_role_changed'));
  };

  if (!isOpen) return null;

  return (
    <div className="identity-overlay">
      <div className="identity-modal">
        <div className="identity-header">
          <h2>👋 Chào bạn đến với i-LEAD!</h2>
          <p>Để bắt đầu làm việc, hãy cho mọi người biết tên và vai trò của bạn.</p>
        </div>
        <form onSubmit={handleSubmit} className="identity-body">
          <input
            type="text"
            placeholder="Tên của bạn (VD: Jim, CR/Mnr, Sơn...)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          {/* Role selector */}
          <div style={{ marginTop:'12px' }}>
            <div style={{ fontSize:'11px', fontWeight:600, color:'#6a6a66', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'.06em' }}>
              Vai trò
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {Object.entries(ROLES).map(([key, { label, desc }]) => (
                <label
                  key={key}
                  style={{
                    display:'flex', alignItems:'flex-start', gap:'10px',
                    padding:'8px 10px', borderRadius:'8px', cursor:'pointer',
                    background: role === key ? 'rgba(37,99,235,.08)' : 'transparent',
                    border: `1px solid ${role === key ? '#2563eb' : 'rgba(0,0,0,.08)'}`,
                    transition: 'all 150ms',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={key}
                    checked={role === key}
                    onChange={() => setRole(key)}
                    style={{ marginTop:'2px', accentColor:'#2563eb' }}
                  />
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:600 }}>{label}</div>
                    <div style={{ fontSize:'11px', color:'#6a6a66' }}>{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop:'16px', width:'100%' }}>
            Vào làm việc ngay →
          </button>
        </form>
      </div>
    </div>
  );
};
