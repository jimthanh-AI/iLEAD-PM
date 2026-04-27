import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useData } from '../context/DataContext';
import { Download } from 'lucide-react';
import { INDICATOR_GROUPS, INDICATOR_GROUP_MAP, fmtCad } from '../utils/constants';
import {
  computeTimeElapsed, computeRiskMatrix, computePartnerScorecard, computeForecasts,
  fmtElapsed,
} from '../utils/insights';
import './MELDashboard.css';

const PARTNER_COLORS = ['#2563eb','#7c3aed','#0891b2','#dc2626','#d97706','#16a34a','#6366f1'];

// ── KPI Card ─────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, color }) => (
  <div className="mel-kpi-card" style={{ borderTopColor: color }}>
    <div className="mel-kpi-value" style={{ color }}>{value}</div>
    <div className="mel-kpi-label">{label}</div>
    {sub && <div className="mel-kpi-sub">{sub}</div>}
  </div>
);

// ── Custom Tooltip ───────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="mel-tooltip">
      <strong>{label}</strong>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString()}</div>
      ))}
    </div>
  );
};

// ── Status helpers ───────────────────────────────────────────────
const STATUS_COLOR = { 'on-track': '#16a34a', 'at-risk': '#d97706', 'critical': '#dc2626' };
const STATUS_BG    = { 'on-track': '#dcfce7', 'at-risk': '#fef3c7', 'critical': '#fee2e2' };
const STATUS_LABEL = { 'on-track': 'On track', 'at-risk': 'At risk', 'critical': 'Critical' };

const StatusBadge = ({ status }) => (
  <span className="l3-badge" style={{ background: STATUS_BG[status], color: STATUS_COLOR[status] }}>
    {STATUS_LABEL[status]}
  </span>
);

const HEALTH_COLOR = { healthy: '#16a34a', watch: '#d97706', 'at-risk': '#dc2626', 'not-allocated': '#9ca3af' };
const HEALTH_BG    = { healthy: '#dcfce7', watch: '#fef3c7', 'at-risk': '#fee2e2', 'not-allocated': '#f3f4f6' };
const HEALTH_LABEL = { healthy: 'Healthy', watch: 'Watch', 'at-risk': 'At risk', 'not-allocated': 'Not allocated' };

const HealthBadge = ({ label }) => (
  <span className="l3-badge" style={{ background: HEALTH_BG[label], color: HEALTH_COLOR[label] }}>
    {HEALTH_LABEL[label]}
  </span>
);

const ALERT_STYLE = {
  critical: { border: '#dc2626', bg: '#fee2e2', text: '#7f1d1d', icon: '🔴' },
  warning:  { border: '#d97706', bg: '#fef3c7', text: '#78350f', icon: '⚠️'  },
  info:     { border: '#2563eb', bg: '#dbeafe', text: '#1e3a8a', icon: '💡' },
};

// ── Progress Bar ─────────────────────────────────────────────────
const ProgressBar = ({ pct, color }) => {
  const w = Math.min(100, Math.max(0, Math.round(pct * 100)));
  return (
    <div className="l3-bar-wrap">
      <div className="l3-bar-fill" style={{ width: `${w}%`, background: color }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE A — Risk Matrix
// ─────────────────────────────────────────────────────────────────────────────
function ModuleRiskMatrix({ riskMatrix, activities, partnerMap }) {
  const [drill, setDrill] = useState(null); // expanded group code

  const sorted = [...riskMatrix].sort((a, b) => {
    const order = { critical: 0, 'at-risk': 1, 'on-track': 2 };
    return order[a.status] - order[b.status];
  });

  const counts = riskMatrix.reduce((acc, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="l3-module">
      <div className="l3-module-head">
        <div>
          <div className="l3-module-title">Module A — Indicator Risk Matrix</div>
          <div className="l3-module-desc">
            Sort theo risk · click row để drill-down activities · female% &lt; 50% flag
          </div>
        </div>
        <div className="l3-badge-row">
          {counts['on-track'] > 0 && <span className="l3-badge" style={{ background: '#dcfce7', color: '#16a34a' }}>{counts['on-track']} On track</span>}
          {counts['at-risk']  > 0 && <span className="l3-badge" style={{ background: '#fef3c7', color: '#d97706' }}>{counts['at-risk']} At risk</span>}
          {counts['critical'] > 0 && <span className="l3-badge" style={{ background: '#fee2e2', color: '#dc2626' }}>{counts['critical']} Critical</span>}
        </div>
      </div>

      <div className="l3-table-wrap">
        <table className="l3-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Indicator</th>
              <th className="num">Target</th>
              <th className="num">Actual</th>
              <th style={{ width: 160 }}>Progress</th>
              <th className="num">Time-adj %</th>
              <th>Female %</th>
              <th>Lead Partner</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(g => {
              const adjPct     = Math.round(g.timeAdjustedPct * 100);
              const progColor  = STATUS_COLOR[g.status];
              const femaleDisp = g.femaleRatio !== null
                ? `${Math.round(g.femaleRatio * 100)}%`
                : '—';

              return (
                <React.Fragment key={g.code}>
                  <tr
                    className="l3-row clickable"
                    onClick={() => setDrill(drill === g.code ? null : g.code)}
                  >
                    <td><StatusBadge status={g.status} /></td>
                    <td>
                      <strong>{g.code}</strong>
                      <div className="l3-sub-label">{g.label}</div>
                    </td>
                    <td className="num">{g.targetVietnam.toLocaleString()}</td>
                    <td className="num">{g.actual.toLocaleString()}</td>
                    <td>
                      <ProgressBar pct={g.progressPct} color={progColor} />
                      <div className="l3-sub-label">{Math.round(g.progressPct * 100)}% raw</div>
                    </td>
                    <td className="num" style={{ color: progColor, fontWeight: 600 }}>
                      {adjPct}%
                      {g.timeAdjustedPct >= 1.5 && ' ↑'}
                    </td>
                    <td>
                      {g.femaleRatio !== null ? (
                        <span style={{ color: g.femaleFlag ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                          {femaleDisp} {g.femaleFlag ? '🔴' : '✓'}
                        </span>
                      ) : (
                        <span className="l3-muted">—</span>
                      )}
                    </td>
                    <td>{g.leadPartner}</td>
                  </tr>

                  {drill === g.code && (
                    <tr className="l3-drill-row">
                      <td colSpan={8}>
                        <div className="l3-drill-box">
                          <strong>Contributing activities for {g.code}</strong>
                          {g.activityIds.length === 0 ? (
                            <div className="l3-muted" style={{ marginTop: 6 }}>
                              Chưa có activity nào liên kết indicator này trong activityIndicators.
                            </div>
                          ) : (
                            <table className="l3-drill-table">
                              <thead>
                                <tr><th>Activity</th><th>Partner</th><th>Status</th><th className="num">Reach Total</th><th className="num">Women</th></tr>
                              </thead>
                              <tbody>
                                {g.activityIds.map(aId => {
                                  const act = activities.find(a => a.id === aId);
                                  if (!act) return null;
                                  const partner = partnerMap[act.partnerId];
                                  return (
                                    <tr key={aId}>
                                      <td>{act.name}</td>
                                      <td>
                                        <span className="partner-dot-sm" style={{ background: partner?.color }} />
                                        {partner?.name ?? '—'}
                                      </td>
                                      <td>{act.status}</td>
                                      <td className="num">{(act.reachTotal || 0).toLocaleString()}</td>
                                      <td className="num">{(act.reachWomen || 0).toLocaleString()}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="l3-note">
        Time elapsed: {fmtElapsed(riskMatrix[0]?.timeElapsed ?? computeTimeElapsed())} of FY 2025-2026 ·
        Time-adjusted % = (actual/target) / timeElapsed — 100% = exactly on pace
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE B — Partner Scorecard
// ─────────────────────────────────────────────────────────────────────────────
function ModulePartnerScorecard({ partnerScorecard }) {
  return (
    <div className="l3-module">
      <div className="l3-module-head">
        <div>
          <div className="l3-module-title">Module B — Partner Performance Scorecard</div>
          <div className="l3-module-desc">
            Health score = composite (burn rate + delivery pace + female ≥ 50%)
          </div>
        </div>
        <span className="l3-badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
          FY 2025-2026
        </span>
      </div>

      <div className="l3-table-wrap">
        <table className="l3-table">
          <thead>
            <tr>
              <th>Partner</th>
              <th className="num">Budget (CAD)</th>
              <th>Burn rate</th>
              <th className="num">Activities</th>
              <th className="num">Indicators</th>
              <th className="num">Reached</th>
              <th>Female %</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody>
            {partnerScorecard.map(p => {
              const burnPct  = Math.round(p.burnRate * 100);
              const burnColor =
                p.burnRate > 1.2 ? '#dc2626' :
                p.burnRate < 0.2 && p.allocated > 0 && p.timeElapsed > 0.3 ? '#d97706' :
                '#16a34a';
              const femalePct = p.femaleRatio !== null ? Math.round(p.femaleRatio * 100) : null;

              return (
                <tr key={p.id}>
                  <td>
                    <span className="partner-dot-sm" style={{ background: p.color }} />
                    <strong>{p.name}</strong>
                    <div className="l3-sub-label">{p.sector}</div>
                  </td>
                  <td className="num">{p.allocated > 0 ? p.allocated.toLocaleString() : '—'}</td>
                  <td>
                    {p.allocated > 0 ? (
                      <>
                        <div className="l3-burn-wrap">
                          <div
                            className="l3-burn-fill"
                            style={{
                              width: `${Math.min(100, Math.round((p.spent / p.allocated) * 100))}%`,
                              background: burnColor,
                            }}
                          />
                        </div>
                        <div className="l3-sub-label" style={{ color: burnColor }}>
                          {Math.round((p.spent / p.allocated) * 100)}% spent ·{' '}
                          {burnPct > 120 ? 'over-burn' : burnPct < 20 && p.timeElapsed > 0.3 ? 'slow start' : 'on pace'}
                        </div>
                      </>
                    ) : (
                      <span className="l3-muted">Not allocated</span>
                    )}
                  </td>
                  <td className="num">{p.doneCount} / {p.activityCount}</td>
                  <td className="num">{p.indCount}</td>
                  <td className="num">{p.totalReach > 0 ? p.totalReach.toLocaleString() : '—'}</td>
                  <td>
                    {femalePct !== null ? (
                      <div>
                        <div className="l3-stack-bar">
                          <div style={{ width: `${femalePct}%`, background: '#db2777' }} />
                          <div style={{ width: `${100 - femalePct}%`, background: '#2563eb' }} />
                        </div>
                        <div className="l3-sub-label" style={{ color: p.femaleFlag ? '#dc2626' : '#16a34a' }}>
                          {femalePct}% nữ {p.femaleFlag ? '🔴' : '✓'}
                        </div>
                      </div>
                    ) : (
                      <span className="l3-muted">—</span>
                    )}
                  </td>
                  <td><HealthBadge label={p.healthLabel} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE C — Forecast & Alerts
// ─────────────────────────────────────────────────────────────────────────────
function ModuleForecast({ forecasts }) {
  const {
    timeElapsed, totalAllocated, totalSpent, projectedSpend, projectedBurnPct,
    indicatorForecasts, alerts,
  } = forecasts;

  // Top indicators to show in "Required pace" table (non-on-track or those with data)
  const forecastRows = indicatorForecasts
    .filter(g => g.status !== 'on-track' || g.actual > 0)
    .slice(0, 8);

  const feasColor = { achievable: '#16a34a', tight: '#d97706', unrealistic: '#dc2626' };
  const feasBg    = { achievable: '#dcfce7', tight: '#fef3c7', unrealistic: '#fee2e2' };

  return (
    <div className="l3-module">
      <div className="l3-module-head">
        <div>
          <div className="l3-module-title">Module C — Forecast &amp; Alerts</div>
          <div className="l3-module-desc">
            Projection cuối FY · rule-based insights · As of{' '}
            {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        </div>
        <span className="l3-badge" style={{ background: '#f3f4f6', color: '#6b7280' }}>
          {fmtElapsed(timeElapsed)} FY elapsed
        </span>
      </div>

      {/* Alerts */}
      <div className="l3-alerts">
        {alerts.length === 0 ? (
          <div className="l3-alert l3-alert-info">
            <span>💡</span>
            <div><strong>No alerts at this time.</strong> All indicators and partners are within normal thresholds.</div>
          </div>
        ) : alerts.map((a, i) => {
          const s = ALERT_STYLE[a.severity];
          return (
            <div key={i} className={`l3-alert l3-alert-${a.severity}`}>
              <span>{s.icon}</span>
              <div>
                <strong>{a.title}</strong>
                <div style={{ marginTop: 2, fontSize: '0.82rem' }}>{a.detail}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="l3-forecast-grid">
        {/* Budget Summary */}
        <div className="l3-forecast-card">
          <div className="l3-forecast-card-title">Budget projection</div>
          <div className="l3-forecast-stats">
            <div className="l3-fstat">
              <div className="l3-fstat-label">Total allocated</div>
              <div className="l3-fstat-value">{fmtCad(totalAllocated)}</div>
            </div>
            <div className="l3-fstat">
              <div className="l3-fstat-label">Spent to date</div>
              <div className="l3-fstat-value" style={{ color: '#ef4444' }}>{fmtCad(totalSpent)}</div>
            </div>
            <div className="l3-fstat">
              <div className="l3-fstat-label">Projected EOY spend</div>
              <div className="l3-fstat-value" style={{ color: projectedBurnPct > 1.05 ? '#dc2626' : '#16a34a' }}>
                {fmtCad(projectedSpend)}
              </div>
              <div className="l3-sub-label">{Math.round(projectedBurnPct * 100)}% of allocation</div>
            </div>
          </div>
          {/* Simple burn bar */}
          <div style={{ marginTop: 12 }}>
            <div className="l3-sub-label" style={{ marginBottom: 4 }}>Spend progress vs FY elapsed</div>
            <div className="l3-bar-compare">
              <div
                className="l3-bar-compare-fill l3-bar-actual"
                style={{ width: `${Math.min(100, Math.round(totalSpent / totalAllocated * 100))}%` }}
              />
            </div>
            <div className="l3-bar-compare">
              <div
                className="l3-bar-compare-fill l3-bar-pace"
                style={{ width: `${Math.min(100, Math.round(timeElapsed * 100))}%` }}
              />
            </div>
            <div className="l3-legend">
              <span><i style={{ background: '#10b981' }} />Actual spent ({Math.round(totalSpent / totalAllocated * 100)}%)</span>
              <span><i style={{ background: '#2563eb' }} />FY elapsed ({fmtElapsed(timeElapsed)})</span>
            </div>
          </div>
        </div>

        {/* Required pace table */}
        <div className="l3-forecast-card">
          <div className="l3-forecast-card-title">Required pace to hit 100% target</div>
          <table className="l3-table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Indicator</th>
                <th className="num">Remaining</th>
                <th className="num">Needed/Q</th>
                <th>Feasibility</th>
              </tr>
            </thead>
            <tbody>
              {forecastRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.82rem' }}>
                    No data — add activity indicators to see projections
                  </td>
                </tr>
              ) : forecastRows.map(g => (
                <tr key={g.code}>
                  <td><strong>{g.code}</strong></td>
                  <td className="num">{g.remaining.toLocaleString()}</td>
                  <td className="num">{g.neededPerQ.toLocaleString()}</td>
                  <td>
                    <span className="l3-badge" style={{ background: feasBg[g.feasibility], color: feasColor[g.feasibility] }}>
                      {g.feasibility}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — MELDashboard
// ─────────────────────────────────────────────────────────────────────────────
export default function MELDashboard() {
  const {
    melEntries, partnerBudgets, partners, partnerMap, activityMap,
    activities, activityIndicators,
    updatePartnerBudget, canEdit,
  } = useData();

  const [activeTab, setActiveTab] = useState('overview');
  const [editBudget, setEditBudget] = useState(null);

  // ── Layer 3 computed data ─────────────────────────────────────
  const riskMatrix = useMemo(
    () => computeRiskMatrix({ melEntries, partnerMap }),
    [melEntries, partnerMap],
  );

  const partnerScorecard = useMemo(
    () => computePartnerScorecard({ partners, partnerBudgets, activities, activityIndicators }),
    [partners, partnerBudgets, activities, activityIndicators],
  );

  const forecasts = useMemo(
    () => computeForecasts({ riskMatrix, partnerScorecard, partnerBudgets }),
    [riskMatrix, partnerScorecard, partnerBudgets],
  );

  // ── Overview: Aggregate MEL entries per indicator group ───────
  const indicatorStats = useMemo(() => {
    const map = {};
    INDICATOR_GROUPS.forEach(g => { map[g.code] = { ...g, actual: 0, male: 0, female: 0 }; });
    melEntries.forEach(e => {
      if (!map[e.indicatorGroup]) return;
      const m = (e.q1_m||0)+(e.q2_m||0)+(e.q3_m||0)+(e.q4_m||0);
      const f = (e.q1_f||0)+(e.q2_f||0)+(e.q3_f||0)+(e.q4_f||0);
      map[e.indicatorGroup].actual  += m + f;
      map[e.indicatorGroup].male    += m;
      map[e.indicatorGroup].female  += f;
    });
    return Object.values(map);
  }, [melEntries]);

  const totalTarget  = INDICATOR_GROUPS.reduce((s, g) => s + g.targetVietnam, 0);
  const totalActual  = indicatorStats.reduce((s, g) => s + g.actual, 0);
  const totalMale    = indicatorStats.reduce((s, g) => s + g.male, 0);
  const totalFemale  = indicatorStats.reduce((s, g) => s + g.female, 0);
  const femaleRatio  = totalActual > 0 ? (totalFemale / totalActual * 100).toFixed(2) : 0;
  const overallPct   = totalTarget > 0 ? (totalActual / totalTarget * 100).toFixed(2) : 0;

  const targetActualData = indicatorStats.map(g => ({
    name: g.code, Target: g.targetVietnam, Actual: g.actual,
    Gap:  Math.max(0, g.targetVietnam - g.actual),
  }));

  const femaleData = indicatorStats.map(g => ({
    name: g.code, Nam: g.male, 'Nữ': g.female,
    pct:  g.actual > 0 ? Math.round(g.female / g.actual * 100) : 0,
  }));

  const budgetWithPartner = useMemo(() => {
    return partners.map(p => {
      const b = partnerBudgets.find(pb => pb.partnerId === p.id) || { allocated: 0, spent: 0 };
      return {
        ...b, partnerId: p.id, name: p.name, color: p.color,
        remaining: (b.allocated || 0) - (b.spent || 0),
        pct: b.allocated > 0 ? Math.round(((b.allocated - b.spent) / b.allocated) * 100) : 100,
      };
    }).filter(b => b.allocated > 0);
  }, [partners, partnerBudgets]);

  const totalAllocated  = budgetWithPartner.reduce((s, b) => s + (b.allocated || 0), 0);
  const totalSpent      = budgetWithPartner.reduce((s, b) => s + (b.spent    || 0), 0);
  const totalRemaining  = totalAllocated - totalSpent;
  const remainPct       = totalAllocated > 0 ? ((totalRemaining / totalAllocated) * 100).toFixed(1) : 0;

  const handleBudgetEdit = (partnerId, field, rawVal) => {
    const val = parseFloat(rawVal) || 0;
    updatePartnerBudget(partnerId, { [field]: val });
    setEditBudget(null);
  };

  const TABS = [
    { id: 'overview',     label: 'Overview' },
    { id: 'risk-matrix',  label: 'A — Risk Matrix' },
    { id: 'scorecard',    label: 'B — Partner Scorecard' },
    { id: 'forecast',     label: 'C — Forecast' },
  ];

  const exportCSV = () => {
    const rows = [['#','Sub Code','Indicator Group','Partner','Activity','Date','Q1_M','Q1_F','Q1_T','Q2_M','Q2_F','Q2_T','Q3_M','Q3_F','Q3_T','Q4_M','Q4_F','Q4_T','Total']];
    melEntries.forEach((e, i) => {
      const p = partnerMap[e.partnerId];
      const a = activityMap[e.activityId];
      const q1t = (e.q1_m||0)+(e.q1_f||0), q2t = (e.q2_m||0)+(e.q2_f||0);
      const q3t = (e.q3_m||0)+(e.q3_f||0), q4t = (e.q4_m||0)+(e.q4_f||0);
      rows.push([
        i + 1,
        e.subCode || '',
        e.indicatorGroup || '',
        p ? `"${p.name}"` : '',
        a ? `"${a.name}"` : '',
        e.date || '',
        e.q1_m||0, e.q1_f||0, q1t,
        e.q2_m||0, e.q2_f||0, q2t,
        e.q3_m||0, e.q3_f||0, q3t,
        e.q4_m||0, e.q4_f||0, q4t,
        q1t + q2t + q3t + q4t,
      ]);
    });
    const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
    const el = document.createElement('a');
    el.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    el.download = `iLEAD_MEL_${new Date().toISOString().split('T')[0]}.csv`;
    el.click();
    URL.revokeObjectURL(el.href);
  };

  return (
    <div className="mel-dashboard">
      <div className="mel-header">
        <h1>i-LEAD MEL Dashboard</h1>
        <span className="mel-subtitle">Fiscal Year 2025–2026 · Vietnam</span>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV} title="Export MEL Entries (CSV)" style={{ marginLeft:'auto' }}><Download size={14} /> Export MEL</button>
      </div>

      {/* Tab bar */}
      <div className="l3-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`l3-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <>
          <div className="mel-kpi-row">
            <KPICard label="Overall Progress"  value={`${overallPct}%`}             color="#16a34a" />
            <KPICard label="Total Target (VN)" value={totalTarget.toLocaleString()} color="#ea580c" />
            <KPICard label="Total Actual"      value={totalActual.toLocaleString()} color="#2563eb" />
            <KPICard label="Total Male"        value={totalMale.toLocaleString()}   color="#d97706" />
            <KPICard label="Total Female"      value={totalFemale.toLocaleString()} color="#db2777" />
            <KPICard label="Female Ratio"      value={`${femaleRatio}%`}            color="#16a34a" sub={`${totalFemale} / ${totalActual}`} />
          </div>

          <div className="mel-charts-row">
            <div className="mel-chart-card">
              <h3>Target vs Actual by Indicator</h3>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={targetActualData} layout="vertical" margin={{ left: 10, right: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Bar dataKey="Target" fill="#2563eb" radius={[0,3,3,0]} />
                  <Bar dataKey="Actual" fill="#10b981" radius={[0,3,3,0]} />
                  <Bar dataKey="Gap"    fill="#fbbf24" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mel-chart-card">
              <h3>Female / Male Breakdown</h3>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={femaleData} layout="vertical" margin={{ left: 10, right: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Bar dataKey="Nữ"  stackId="a" fill="#db2777" radius={[0,0,0,0]} />
                  <Bar dataKey="Nam" stackId="a" fill="#2563eb" radius={[0,3,3,0]}
                    label={{ position:'right', fontSize:11, formatter:(_v, e) => e?.['Nữ'] > 0 ? `${Math.round(e['Nữ']/(e['Nữ']+(e['Nam']||0))*100)}%` : '' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mel-budget-section">
            <div className="mel-budget-header">
              <h2>Ngân sách dự án</h2>
              <div className="mel-budget-summary">
                <span className="bsum-item"><label>Total</label><strong>{fmtCad(totalAllocated)}</strong></span>
                <span className="bsum-item spent"><label>Spent</label><strong>{fmtCad(totalSpent)}</strong></span>
                <span className="bsum-item remain"><label>Remain</label><strong>{fmtCad(totalRemaining)}</strong><em>{remainPct}%</em></span>
              </div>
            </div>

            <div className="mel-budget-charts">
              <div className="mel-chart-card donut-card">
                <h3>Phân bổ theo Đối tác</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={budgetWithPartner} dataKey="allocated" nameKey="name"
                         cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                         label={({ name, percent }) => `${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`}
                         labelLine={false}>
                      {budgetWithPartner.map((b, i) => (
                        <Cell key={b.partnerId} fill={b.color || PARTNER_COLORS[i % PARTNER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmtCad(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mel-chart-card">
                <h3>Spent &amp; Remaining per Partner</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={budgetWithPartner} margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }}
                           tickFormatter={n => n.length > 8 ? n.slice(0,8)+'…' : n} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => fmtCad(v)} />
                    <Legend />
                    <Bar dataKey="remaining" name="Remaining" fill="#10b981" radius={[4,4,0,0]} />
                    <Bar dataKey="spent"     name="Spent"     fill="#ef4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mel-budget-table-wrap">
              <h3>Chi tiết ngân sách <span className="hint">— click ô để chỉnh sửa</span></h3>
              <table className="mel-budget-table">
                <thead>
                  <tr><th>Partner</th><th>Allocated (CAD)</th><th>Spent (CAD)</th><th>Remaining</th><th>Remain %</th></tr>
                </thead>
                <tbody>
                  {partners.map((p) => {
                    const b = partnerBudgets.find(pb => pb.partnerId === p.id) || { allocated:0, spent:0 };
                    const rem = (b.allocated||0) - (b.spent||0);
                    const pct = b.allocated > 0 ? ((rem / b.allocated)*100).toFixed(0) : '—';
                    return (
                      <tr key={p.id}>
                        <td><span className="partner-dot-sm" style={{ background: p.color }} />{p.name}</td>
                        <td className="editable" onClick={() => canEdit && setEditBudget({ partnerId:p.id, field:'allocated', value: b.allocated||0 })}>
                          {editBudget?.partnerId===p.id && editBudget.field==='allocated'
                            ? <input autoFocus type="number" defaultValue={b.allocated||0}
                                onBlur={e => handleBudgetEdit(p.id,'allocated',e.target.value)}
                                onKeyDown={e => e.key==='Enter' && handleBudgetEdit(p.id,'allocated',e.target.value)} />
                            : (b.allocated||0).toLocaleString()}
                        </td>
                        <td className="editable" onClick={() => canEdit && setEditBudget({ partnerId:p.id, field:'spent', value: b.spent||0 })}>
                          {editBudget?.partnerId===p.id && editBudget.field==='spent'
                            ? <input autoFocus type="number" defaultValue={b.spent||0}
                                onBlur={e => handleBudgetEdit(p.id,'spent',e.target.value)}
                                onKeyDown={e => e.key==='Enter' && handleBudgetEdit(p.id,'spent',e.target.value)} />
                            : (b.spent||0).toLocaleString()}
                        </td>
                        <td className={rem < 0 ? 'negative' : ''}>{rem.toLocaleString()}</td>
                        <td className={rem < 0 ? 'negative' : ''}>{pct}%</td>
                      </tr>
                    );
                  })}
                  <tr className="total-row">
                    <td><strong>TOTAL</strong></td>
                    <td><strong>{totalAllocated.toLocaleString()}</strong></td>
                    <td><strong>{totalSpent.toLocaleString()}</strong></td>
                    <td><strong>{totalRemaining.toLocaleString()}</strong></td>
                    <td><strong>{remainPct}%</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── TAB: RISK MATRIX ── */}
      {activeTab === 'risk-matrix' && (
        <ModuleRiskMatrix
          riskMatrix={riskMatrix}
          activities={activities}
          partnerMap={partnerMap}
        />
      )}

      {/* ── TAB: PARTNER SCORECARD ── */}
      {activeTab === 'scorecard' && (
        <ModulePartnerScorecard partnerScorecard={partnerScorecard} />
      )}

      {/* ── TAB: FORECAST ── */}
      {activeTab === 'forecast' && (
        <ModuleForecast forecasts={forecasts} />
      )}
    </div>
  );
}
