import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { generateTimelineReport } from '../utils/reportGenerator';
import { useData } from '../context/DataContext';
import { STAGE_COLORS, daysLeft, fmtDate } from '../utils/constants';
import '../pages/Dashboard.css';
import '../pages/PartnerView.css';
import './GanttTimeline.css';

const MONTHS = ['1/','2/','3/','4/','5/','6/','7/','8/','9/','10/','11/','12/'];

export const GanttTimeline = () => {
  const nav = useNavigate();
  const { activities, partners } = useData();
  const [mode, setMode] = useState('year');
  const [offset, setOffset] = useState(0);
  const [partnerFilter, setPartnerFilter] = useState('');

  const today = new Date();

  let rs, re;
  if (mode === 'week') {
    const dow = today.getDay();
    rs = new Date(today); rs.setDate(today.getDate() - (dow===0?6:dow-1) + offset*7);
    re = new Date(rs); re.setDate(rs.getDate() + 6);
  } else if (mode === 'month') {
    rs = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    re = new Date(today.getFullYear(), today.getMonth() + offset + 1, 0);
  } else {
    rs = new Date(today.getFullYear() + offset, 0, 1);
    re = new Date(today.getFullYear() + offset, 11, 31);
  }
  const totalDays = (re - rs) / 86400000;
  const pct = (d) => Math.max(0, Math.min(100, (d - rs) / 86400000 / totalDays * 100));
  const todayPct = pct(today);

  // Labels
  const labels = [];
  if (mode === 'week') {
    const dns = ['CN','T2','T3','T4','T5','T6','T7'];
    for (let i = 0; i <= 6; i++) {
      const d = new Date(rs); d.setDate(rs.getDate() + i);
      labels.push({ label: dns[d.getDay()] + ' ' + d.getDate(), pct: i/7*100 });
    }
  } else if (mode === 'month') {
    const daysInMonth = re.getDate();
    for (let d = 1; d <= daysInMonth; d += Math.ceil(daysInMonth/10)) {
      labels.push({ label: d + '/' + (rs.getMonth()+1), pct: (d-1)/daysInMonth*100 });
    }
  } else {
    ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'].forEach((m,i) => {
      labels.push({ label: m, pct: i/12*100 });
    });
  }

  const rangeLabel = mode === 'week'
    ? fmtDate(rs.toISOString().split('T')[0]) + ' – ' + fmtDate(re.toISOString().split('T')[0])
    : mode === 'month'
      ? rs.toLocaleDateString('vi-VN', { month:'long', year:'numeric' })
      : 'Năm ' + rs.getFullYear();

  let acts = activities.filter(a => a.startDate);
  if (partnerFilter) {
    acts = acts.filter(a => a.partnerId === partnerFilter);
  }
  const visible = acts.filter(a => {
    const s = new Date(a.startDate + 'T00:00:00');
    const e = new Date((a.endDate || a.startDate) + 'T00:00:00');
    return s <= re && e >= rs;
  }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const openReport = () => generateTimelineReport(visible, partners, rangeLabel);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Timeline / Gantt</h1>
      </div>

      <div className="gantt-outer">
        <div className="gantt-controls">
          <div className="view-tabs-wrap">
            {['week','month','year'].map(m => (
              <button key={m} className={`tab-pill ${mode===m?'active':''}`}
                onClick={() => { setMode(m); setOffset(0); }}>
                {m==='week'?'Tuần':m==='month'?'Tháng':'Năm'}
              </button>
            ))}
          </div>
          <button className="btn btn-sm" onClick={() => setOffset(o=>o-1)}>‹</button>
          <button className="btn btn-sm" onClick={() => setOffset(0)}>Hôm nay</button>
          <button className="btn btn-sm" onClick={() => setOffset(o=>o+1)}>›</button>
          <select className="filter-sel"
            value={partnerFilter} onChange={e => setPartnerFilter(e.target.value)}>
            <option value="">Tất cả Partner</option>
            {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={openReport} title="Xuất báo cáo Timeline (PDF)"><FileText size={14} /> Report</button>
        </div>
        <div className="gantt-range-label">{rangeLabel} — {visible.length} activities</div>

        <div className="gantt-wrap">
          <div className="gantt-container">
            <div className="gantt-hdr">
              <div className="gantt-lhdr">Activity / Partner</div>
              <div className="gantt-thdr">
                {labels.map(l => <span key={l.pct} className="gantt-lbl" style={{left:`${l.pct}%`}}>{l.label}</span>)}
                {todayPct > 0 && todayPct < 100 && (
                  <span className="gantt-today-lbl" style={{left:`${todayPct}%`}}>Hôm nay</span>
                )}
              </div>
            </div>
            {visible.length ? visible.map(a => {
              const pa = partners.find(p => p.id === a.partnerId);
              const s  = new Date(a.startDate + 'T00:00:00');
              const e  = new Date((a.endDate || a.startDate) + 'T00:00:00');
              const bl = pct(s); const bw = Math.max(.5, pct(e) - bl);
              const sc = STAGE_COLORS[a.stage] || '#888';
              const isOver = a.endDate && daysLeft(a.endDate) < 0 && a.status !== 'done';
              const barColor = a.status === 'done' ? '#10b981'
                             : isOver ? 'var(--red)'
                             : a.status === 'in_progress' ? sc
                             : '#9ca3af';
              return (
                <div key={a.id} className="gantt-row" onClick={() => nav(`/activity/${a.id}`)}>
                  <div className="gantt-left">
                    <div className="gantt-row-name">{a.name}</div>
                    <div className="gantt-row-sub" style={{display:'flex',gap:'6px',alignItems:'center',marginTop:'2px'}}>
                      {pa && <span style={{fontSize:'9px',color:pa.color,fontWeight:600}}>{pa.name}</span>}
                      <span className={`cell-tag stage-${a.stage}`} style={{fontSize:'9px',padding:'1px 5px'}}>{a.stage}</span>
                    </div>
                  </div>
                  <div className="gantt-chart">
                    {labels.map(l => <div key={l.pct} className="gantt-grid" style={{left:`${l.pct}%`}}></div>)}
                    {todayPct > 0 && todayPct < 100 && (
                      <div className="gantt-today-wrap" style={{left:`${todayPct}%`}}>
                        <div className="gantt-today" />
                      </div>
                    )}
                    <div className="gantt-bar" style={{left:`${bl}%`,width:`${bw}%`,background:barColor}}>
                      {bw > 10 ? a.stage : ''}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="empty-state" style={{padding:'40px'}}>
                <div style={{fontSize:'32px',opacity:.3,marginBottom:'8px'}}>📅</div>
                <div>Không có activity nào trong kỳ này</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
