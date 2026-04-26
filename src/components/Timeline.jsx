import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import './Timeline.css';

const MOCK_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const Timeline = () => {
  const { projects, partners } = useData();
  const [viewMode, setViewMode] = useState('year'); // year, month, week
  const navigate = useNavigate();

  // Using a simplified version of the Gantt logic from vanilla HTML
  // Just to demonstrate the UI
  
  return (
    <div className="timeline-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Project Timeline</h1>
        <p className="page-meta">Gantt view of all projects</p>
      </div>

      <div className="timeline-controls glass-card">
        <div className="view-tabs" style={{ display: 'flex', gap: '4px', background: 'var(--surface2)', padding: '4px', borderRadius: 'var(--radius)', width: 'max-content' }}>
          {['week', 'month', 'year'].map(mode => (
            <button
              key={mode}
              className={`tab-btn ${viewMode === mode ? 'active' : ''}`}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius)',
                background: viewMode === mode ? 'var(--surface)' : 'transparent',
                color: viewMode === mode ? 'var(--text)' : 'var(--text2)',
                boxShadow: viewMode === mode ? 'var(--shadow-sm)' : 'none',
                textTransform: 'capitalize'
              }}
            >
              {mode}
            </button>
          ))}
        </div>
        <div style={{ fontWeight: 600 }}>2026</div>
      </div>

      <div className="gantt-wrap glass-card">
        <div className="gantt-hdr">
          <div className="gantt-lhdr">Project / Partner</div>
          <div className="gantt-thdr">
            {MOCK_MONTHS.map((m, i) => (
              <span key={m} className="gantt-lbl" style={{ left: `${(i / 12) * 100}%` }}>{m}</span>
            ))}
          </div>
        </div>

        <div className="gantt-body">
          {projects.map((p) => {
            const partner = partners.find(pt => pt.id === p.partnerId);
            
            // Mocking position data for demonstration
            // Real implementation would calculate based on startDate and endDate
            const startMonth = Math.floor(Math.random() * 4); 
            const duration = 2 + Math.floor(Math.random() * 5);
            
            const leftPct = (startMonth / 12) * 100;
            const widthPct = (duration / 12) * 100;

            const isDone = p.status === 'done';

            return (
              <div 
                key={p.id} 
                className="gantt-row"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/partner/${p.partnerId}`)}
              >
                <div className="gantt-left">
                  <div className="gantt-row-name" title={p.name}>{p.name}</div>
                  <div className="gantt-row-sub" style={{ color: partner?.color }}>{partner?.name}</div>
                </div>
                <div className="gantt-chart">
                  {MOCK_MONTHS.map((m, i) => (
                    <div key={`grid-${i}`} className="gantt-grid" style={{ left: `${(i / 12) * 100}%` }}></div>
                  ))}
                  
                  <div 
                    className="gantt-bar" 
                    style={{ 
                      left: `${leftPct}%`, 
                      width: `${widthPct}%`,
                      background: isDone ? 'var(--green)' : 'var(--accent)'
                    }}
                  >
                    {p.subCode}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
