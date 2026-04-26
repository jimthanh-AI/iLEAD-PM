import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Layout, BarChart3, CalendarCheck, Plus, TrendingUp, ClipboardList } from 'lucide-react';
import { useData } from '../context/DataContext';
import { PartnerForm } from './forms/PartnerForm';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { partners, activities } = useData();
  const navigate = useNavigate();
  const [isPartnerModalOpen, setPartnerModalOpen] = React.useState(false);

  return (
    <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo" onClick={() => { navigate('/'); onClose?.(); }}>
          <span className="official-logo-text">
            <span className="i-lower">i</span>-LEAD
          </span>
        </div>
        <button className="sidebar-close" onClick={onClose} aria-label="Đóng menu">✕</button>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <LayoutDashboard size={16} /><span>Dashboard</span>
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <CheckSquare size={16} /><span>All Tasks</span>
        </NavLink>
        <NavLink to="/kanban" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <Layout size={16} /><span>All Activities</span>
        </NavLink>
        <NavLink to="/timeline" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <BarChart3 size={16} /><span>Timeline / Gantt</span>
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <CalendarCheck size={16} /><span>Master Calendar</span>
        </NavLink>
        <div className="nav-section-title">MEL Module</div>
        <NavLink to="/mel-dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <TrendingUp size={16} /><span>MEL Dashboard</span>
        </NavLink>
        <NavLink to="/mel-entry" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
          <ClipboardList size={16} /><span>MEL Entries</span>
        </NavLink>

      </nav>

      <div className="sidebar-section">
        <h3 className="section-title">Đối tác</h3>
        <div className="partners-list">
          {partners.map(p => {
            const cnt = activities.filter(a => {
              if (a.partnerId) return a.partnerId === p.id;
              if (a.name && p.name && a.name.includes(p.name)) return true;
              return false;
            }).length;
            return (
              <NavLink
                key={p.id}
                to={`/partner/${p.id}`}
                className={({ isActive }) => `partner-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="partner-dot" style={{ backgroundColor: p.color }}></span>
                <span className="partner-name">{p.name}</span>
                <span className="partner-cnt">{cnt}</span>
              </NavLink>
            );
          })}
        </div>
        <button className="btn-add-partner" onClick={() => setPartnerModalOpen(true)}>
          <Plus size={15} /> Thêm đối tác
        </button>
      </div>

      <PartnerForm
        isOpen={isPartnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
      />
    </aside>
  );
};

export default Sidebar;
