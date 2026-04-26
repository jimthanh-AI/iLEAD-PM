import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import {
  STAGES, STAGE_LABELS, STAGE_COLORS,
  STATUS_LABELS, STATUS_CSS,
  fmtDate, daysLeft,
} from '../utils/constants';
import './ReportPage.css';

const fmtBudget = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' tỷ';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(0) + ' triệu';
  return new Intl.NumberFormat('vi-VN').format(n);
};

const fmtDateFull = (d) => {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ReportPage = () => {
  const {
    partners, activities, tasks,
    partnerMap,
  } = useData();

  const [partnerFilter, setPartnerFilter] = useState('');
  const [fromDate,      setFromDate]      = useState('');
  const [toDate,        setToDate]        = useState('');
  const printRef = useRef();

  /* ── Filtered data based on filters ────────────────────── */
  const filteredPartners = useMemo(() =>
    partnerFilter ? partners.filter(p => p.id === partnerFilter) : partners,
    [partners, partnerFilter]
  );

  const filteredActivities = useMemo(() => {
    let acts = partnerFilter
      ? activities.filter(a => a.partnerId === partnerFilter)
      : activities;
    if (fromDate) acts = acts.filter(a => !a.endDate || a.endDate >= fromDate);
    if (toDate)   acts = acts.filter(a => !a.startDate || a.startDate <= toDate);
    return acts;
  }, [activities, partnerFilter, fromDate, toDate]);

  const filteredActivityIds = useMemo(() => new Set(filteredActivities.map(a => a.id)), [filteredActivities]);

  const filteredTasks = useMemo(() =>
    tasks.filter(t => filteredActivityIds.has(t.activityId)),
    [tasks, filteredActivityIds]
  );

  /* ── Executive summary numbers ──────────────────────────── */
  const summary = useMemo(() => {
    const totalPlanned = filteredActivities.reduce((s, a) => s + (a.budget_planned || 0), 0);
    const totalActual  = filteredActivities.reduce((s, a) => s + (a.budget_actual  || 0), 0);
    const actByStatus  = { not_started: 0, in_progress: 0, done: 0, not_completed: 0 };
    filteredActivities.forEach(a => { actByStatus[a.status] = (actByStatus[a.status] || 0) + 1; });
    const tasksDone    = filteredTasks.filter(t => t.status === 'done').length;
    const overdue      = filteredActivities.filter(a =>
      a.endDate && daysLeft(a.endDate) < 0 && a.status !== 'done'
    ).length;
    const stageCount   = {};
    STAGES.forEach(s => { stageCount[s] = 0; });
    filteredActivities.forEach(a => { if (a.stage) stageCount[a.stage] = (stageCount[a.stage] || 0) + 1; });
    return { totalPlanned, totalActual, actByStatus, tasksDone, overdue, stageCount };
  }, [filteredActivities, filteredTasks]);

  /* ── Upcoming deadlines (next 14 days) ──────────────────── */
  const upcoming = useMemo(() =>
    filteredActivities
      .filter(a => {
        const dl = daysLeft(a.endDate);
        return dl !== null && dl >= 0 && dl <= 14 && a.status !== 'done';
      })
      .sort((a, b) => (a.endDate || '').localeCompare(b.endDate || '')),
    [filteredActivities]
  );

  /* ── Print ──────────────────────────────────────────────── */
  const handlePrint = () => window.print();

  const reportDate = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const maxStage = Math.max(...Object.values(summary.stageCount), 1);

  return (
    <div className="report-page">
      {/* ── Filter Bar (no-print) ────────────────────────── */}
      <div className="report-toolbar no-print">
        <div className="report-toolbar-left">
          <h1 className="report-title-screen">Báo cáo Tiến độ</h1>
          <select value={partnerFilter} onChange={e => setPartnerFilter(e.target.value)}>
            <option value="">Tất cả Partner</option>
            {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title="Từ ngày" />
          <span style={{ color: 'var(--text3)', fontSize: '12px' }}>→</span>
          <input type="date" value={toDate}   onChange={e => setToDate(e.target.value)}   title="Đến ngày" />
        </div>
        <button className="btn btn-primary" onClick={handlePrint}>🖨 In / Xuất PDF</button>
      </div>

      {/* ══════════════════════════════════════════════════
          PRINT AREA
      ══════════════════════════════════════════════════ */}
      <div ref={printRef} className="report-body">

        {/* Cover / Title */}
        <div className="rpt-cover">
          <div className="rpt-cover-logo">i-LEAD</div>
          <h1 className="rpt-cover-title">Báo cáo Tiến độ Dự án</h1>
          <p className="rpt-cover-meta">
            {partnerFilter ? partnerMap[partnerFilter]?.name : 'Tất cả Partner'}
            {(fromDate || toDate) && (
              <span> · {fromDate ? fmtDateFull(fromDate) : '...'} — {toDate ? fmtDateFull(toDate) : '...'}</span>
            )}
          </p>
          <p className="rpt-cover-date">Ngày in: {reportDate}</p>
        </div>

        {/* 1. Executive Summary */}
        <section className="rpt-section">
          <h2 className="rpt-h2">1. Tổng quan</h2>
          <div className="rpt-kpi-row">
            <div className="rpt-kpi">
              <div className="rpt-kpi-val">{filteredPartners.length}</div>
              <div className="rpt-kpi-lbl">Partner</div>
            </div>
            <div className="rpt-kpi">
              <div className="rpt-kpi-val">{filteredActivities.length}</div>
              <div className="rpt-kpi-lbl">Activity</div>
            </div>
            <div className="rpt-kpi">
              <div className="rpt-kpi-val">{filteredTasks.length}</div>
              <div className="rpt-kpi-lbl">Task</div>
            </div>
            <div className="rpt-kpi" style={{ color: 'var(--green)' }}>
              <div className="rpt-kpi-val">{summary.actByStatus.done}</div>
              <div className="rpt-kpi-lbl">Act. Done</div>
            </div>
            <div className="rpt-kpi" style={{ color: summary.overdue > 0 ? 'var(--red)' : undefined }}>
              <div className="rpt-kpi-val">{summary.overdue}</div>
              <div className="rpt-kpi-lbl">Quá hạn</div>
            </div>
            <div className="rpt-kpi">
              <div className="rpt-kpi-val">{summary.tasksDone}/{filteredTasks.length}</div>
              <div className="rpt-kpi-lbl">Tasks xong</div>
            </div>
          </div>

          {/* Budget summary */}
          {(summary.totalPlanned > 0 || summary.totalActual > 0) && (
            <div className="rpt-budget-row">
              <div className="rpt-budget-item">
                <span className="rpt-budget-lbl">Ngân sách kế hoạch</span>
                <span className="rpt-budget-val">{fmtBudget(summary.totalPlanned)}</span>
              </div>
              <div className="rpt-budget-item">
                <span className="rpt-budget-lbl">Đã thực chi</span>
                <span className="rpt-budget-val" style={{ color: summary.totalActual > summary.totalPlanned ? 'var(--red)' : 'var(--green)' }}>
                  {fmtBudget(summary.totalActual)}
                </span>
              </div>
              {summary.totalPlanned > 0 && (
                <div className="rpt-budget-item">
                  <span className="rpt-budget-lbl">Burn rate</span>
                  <span className="rpt-budget-val" style={{ color: summary.totalActual / summary.totalPlanned > 1 ? 'var(--red)' : summary.totalActual / summary.totalPlanned > 0.8 ? 'var(--orange)' : 'var(--green)' }}>
                    {Math.round((summary.totalActual / summary.totalPlanned) * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 2. Stage Distribution */}
        <section className="rpt-section">
          <h2 className="rpt-h2">2. Phân bổ Stage</h2>
          <div className="rpt-stage-chart">
            {STAGES.map(s => {
              const count = summary.stageCount[s] || 0;
              const pct   = Math.round((count / maxStage) * 100);
              return (
                <div key={s} className="rpt-stage-row">
                  <div className="rpt-stage-label">{s}: {STAGE_LABELS[s]}</div>
                  <div className="rpt-stage-bar-wrap">
                    <div
                      className="rpt-stage-bar"
                      style={{ width: `${pct}%`, background: STAGE_COLORS[s] }}
                    />
                  </div>
                  <div className="rpt-stage-count">{count}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Per-Partner Breakdown */}
        <section className="rpt-section">
          <h2 className="rpt-h2">3. Chi tiết theo Partner</h2>
          {filteredPartners.map(partner => {
            const pActivities  = filteredActivities.filter(a => a.partnerId === partner.id);
            const pActIds      = new Set(pActivities.map(a => a.id));
            const pTasks       = filteredTasks.filter(t => pActIds.has(t.activityId));

            return (
              <div key={partner.id} className="rpt-partner-block">
                <div className="rpt-partner-hdr" style={{ borderLeftColor: partner.color }}>
                  <span className="rpt-partner-name">{partner.name}</span>
                  <span className="rpt-partner-meta">
                    {partner.sector} · {partner.region} · {pActivities.length} activity · {pTasks.filter(t => t.status === 'done').length}/{pTasks.length} task
                  </span>
                </div>

                {pActivities.length > 0 && (
                  <table className="rpt-act-table">
                    <thead>
                      <tr>
                        <th>Activity</th>
                        <th>Stage</th>
                        <th>Status</th>
                        <th>Ball Owner</th>
                        <th>Deadline</th>
                        <th>Next Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pActivities.map(a => {
                        const dl       = daysLeft(a.endDate);
                        const overdue  = dl !== null && dl < 0 && a.status !== 'done';
                        const actTasks = filteredTasks.filter(t => t.activityId === a.id);
                        const doneCnt  = actTasks.filter(t => t.status === 'done').length;
                        return (
                          <tr key={a.id} className={overdue ? 'rpt-row-overdue' : ''}>
                            <td>
                              <div className="rpt-act-name">{a.name}</div>
                              {actTasks.length > 0 && (
                                <div className="rpt-task-progress">
                                  <div className="rpt-task-bar-wrap">
                                    <div
                                      className="rpt-task-bar"
                                      style={{ width: `${Math.round((doneCnt / actTasks.length) * 100)}%` }}
                                    />
                                  </div>
                                  <span>{doneCnt}/{actTasks.length}</span>
                                </div>
                              )}
                            </td>
                            <td>
                              <span className="rpt-stage-pill" style={{ background: STAGE_COLORS[a.stage] + '22', color: STAGE_COLORS[a.stage] }}>
                                {a.stage}
                              </span>
                            </td>
                            <td><span className={`cell-tag ${STATUS_CSS[a.status]}`}>{STATUS_LABELS[a.status]}</span></td>
                            <td style={{ fontSize: '11px' }}>{a.ballOwner || '—'}</td>
                            <td style={{ fontSize: '11px', color: overdue ? 'var(--red)' : undefined, whiteSpace: 'nowrap' }}>
                              {fmtDateFull(a.endDate)}
                              {overdue && <span className="rpt-overdue-badge"> !</span>}
                            </td>
                            <td style={{ fontSize: '11px', color: 'var(--text2)' }}>{a.nextAction || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </section>

        {/* 4. Upcoming Deadlines */}
        {upcoming.length > 0 && (
          <section className="rpt-section">
            <h2 className="rpt-h2">4. Deadline sắp tới (14 ngày)</h2>
            <table className="rpt-act-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Partner</th>
                  <th>Deadline</th>
                  <th>Còn lại</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map(a => {
                  const pa   = partnerMap[a.partnerId];
                  const dl   = daysLeft(a.endDate);
                  return (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td style={{ color: pa?.color, fontSize: '11px' }}>{pa?.name || '—'}</td>
                      <td style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{fmtDateFull(a.endDate)}</td>
                      <td style={{ fontSize: '11px', color: dl === 0 ? 'var(--red)' : dl <= 3 ? 'var(--orange)' : 'var(--text2)' }}>
                        {dl === 0 ? 'Hôm nay' : `${dl} ngày`}
                      </td>
                      <td><span className={`cell-tag ${STATUS_CSS[a.status]}`}>{STATUS_LABELS[a.status]}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {/* Footer */}
        <div className="rpt-footer">
          <span>i-LEAD Project Management · In ngày {reportDate}</span>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
