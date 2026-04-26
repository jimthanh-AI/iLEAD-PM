import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Search, Download, Settings } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import './Topbar.css';

const Topbar = ({ onHamburger }) => {
  const location   = useLocation();
  const nav        = useNavigate();
  const { partners, activities, tasks } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const buildBreadcrumbs = () => {
    const segs = location.pathname.split('/').filter(Boolean);
    const base = [{ name:'Dashboard', path:'/' }];

    if (!segs.length) return base;
    if (segs[0] === 'tasks')         return [...base, { name:'All Tasks',       path:'/tasks' }];
    if (segs[0] === 'kanban')        return [...base, { name:'All Activities',   path:'/kanban' }];
    if (segs[0] === 'timeline')      return [...base, { name:'Timeline / Gantt', path:'/timeline' }];
    if (segs[0] === 'weekly')        return [...base, { name:'Kế hoạch tuần',    path:'/weekly' }];
    if (segs[0] === 'calendar')      return [...base, { name:'Master Calendar',  path:'/calendar' }];
    if (segs[0] === 'report')        return [...base, { name:'Báo cáo',          path:'/report' }];
    if (segs[0] === 'mel-dashboard') return [...base, { name:'MEL Dashboard',    path:'/mel-dashboard' }];
    if (segs[0] === 'mel-entry')     return [...base, { name:'MEL Entries',      path:'/mel-entry' }];
    if (segs[0] === 'settings')      return [...base, { name:'Cài đặt',          path:'/settings' }];

    if (segs[0] === 'partner') {
      const p = partners.find(x => x.id === segs[1]);
      return [...base, { name: p?.name || 'Partner', path: location.pathname }];
    }
    if (segs[0] === 'activity') {
      const a  = activities.find(x => x.id === segs[1]);
      const pa = partners.find(x => x.id === a?.partnerId);
      return [
        ...base,
        { name: pa?.name || 'Partner',  path: `/partner/${pa?.id}` },
        { name: a?.name  || 'Activity', path: location.pathname },
      ];
    }
    return base;
  };

  const executeSearch = () => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results = [];

    partners.filter(p => p.name.toLowerCase().includes(q)).forEach(p => results.push({ type: 'Partner', name: p.name, path: `/partner/${p.id}`, color: p.color }));
    activities.filter(a => a.name.toLowerCase().includes(q)).forEach(a => results.push({ type: 'Activity', name: a.name, path: `/activity/${a.id}`, color: '#10b981' }));
    
    // Tìm task thì navigate tới activity chứa nó
    tasks.filter(t => t.name.toLowerCase().includes(q)).forEach(t => {
      const act = activities.find(a => a.id === t.activityId);
      if (act) {
        results.push({ type: 'Task', name: t.name, path: `/activity/${act.id}`, color: '#f59e0b' });
      }
    });

    return results;
  };

  const crumbs = buildBreadcrumbs();
  const searchResults = executeSearch();

  const exportTasksToCSV = () => {
    const rows = [
      ['Task ID', 'Partner', 'Activity', 'Task Name', 'Status', 'Assignee', 'Deadline', 'Người Tạo']
    ];

    tasks.forEach(t => {
      const a  = activities.find(act => act.id === t.activityId);
      const pa = a ? partners.find(p => p.id === a.partnerId) : null;

      rows.push([
        t.id,
        pa ? `"${pa.name}"` : '',
        a ? `"${a.name}"` : '',
        `"${t.name}"`,
        t.status,
        `"${t.assignee || ''}"`,
        t.dueDate || '',
        `"${t.author || ''}"`
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `iLEAD_Tasks_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger" onClick={onHamburger} aria-label="Mở menu">☰</button>
        <nav className="breadcrumb">
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <React.Fragment key={i}>
                {i > 0 && <span className="bc-sep">/</span>}
                {isLast
                  ? <span className="bc bc-cur">{c.name}</span>
                  : <button className="bc bc-link" onClick={() => nav(c.path)}>{c.name}</button>
                }
              </React.Fragment>
            );
          })}
        </nav>
      </div>
      <div className="topbar-right">
        
        {/* Global Search */}
        <div className="search-container" onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setSearchFocused(false);
          }
        }}>
          <Search size={14} className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Tìm kiếm mọi thứ..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
          />
          
          {searchFocused && searchQuery.length > 1 && (
            <div className="search-dropdown">
              {searchResults.length === 0 ? (
                <div className="search-empty">Không tìm thấy "{searchQuery}"</div>
              ) : (
                searchResults.map((res, i) => (
                  <button 
                    key={i} 
                    className="search-result-item" 
                    onClick={() => {
                      nav(res.path);
                      setSearchFocused(false);
                      setSearchQuery('');
                    }}
                  >
                    <span className="search-res-type" style={{background: res.color}}>{res.type}</span>
                    <span className="search-res-name">{res.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button className="btn btn-secondary" onClick={exportTasksToCSV} title="Xuất dữ liệu Excel (CSV)">
          <Download size={15} /> Export
        </button>
        <NotificationCenter />
        <button
          className={`btn btn-icon${location.pathname === '/settings' ? ' active' : ''}`}
          onClick={() => nav('/settings')}
          title="Cài đặt"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
