import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import {
  INDICATOR_GROUPS, STAGES, STAGE_LABELS, ACTIVITY_TYPE_MAP,
  STATUS_LABELS, fmtDate, fmtCad,
} from '../utils/constants';
import {
  computeTimeElapsed, computeRiskMatrix, computePartnerScorecard, computeForecasts,
  fmtElapsed,
} from '../utils/insights';
import { Printer } from 'lucide-react';

// ── Translations ───────────────────────────────────────────────────────────────
const T = {
  en: {
    title: 'iLEAD Project Overview Report',
    sub: 'Inclusive Business Development Project (i-LEAD)',
    project: 'P013770 | Canada–Vietnam | FY 2025–2026',
    generated: 'Generated',
    print: 'Print / PDF',
    // Section titles
    execSummary: 'Executive Summary',
    completedAct: 'Completed Activities',
    inProgressAct: 'In-Progress Activities',
    plannedAct: 'Planned Activities',
    melProgress: 'MEL Indicator Progress',
    budgetByPartner: 'Budget by Partner',
    // KPI labels
    totalActivities: 'Total Activities',
    done: 'Done',
    inProgress: 'In Progress',
    notStarted: 'Not Started',
    overdue: 'Overdue',
    melOverall: 'MEL Overall',
    actualReached: 'Actual Reached',
    targetVN: 'Target (VN)',
    budgetBurn: 'Budget Burn',
    spent: 'Spent',
    allocated: 'Allocated',
    reachGender: 'Reach & Gender',
    totalReached: 'Total Reached',
    femaleRatio: 'Female Ratio',
    // Table headers
    activity: 'Activity',
    type: 'Type',
    stage: 'Stage',
    dates: 'Dates',
    budget: 'Budget (CAD)',
    status: 'Status',
    ballOwner: 'Ball Owner',
    nextAction: 'Next Action',
    code: 'Code',
    indicator: 'Indicator',
    target: 'Target VN',
    actual: 'Actual',
    progress: 'Progress',
    femalePct: 'Female %',
    partner: 'Partner',
    remaining: 'Remaining',
    burnPct: 'Burn %',
    total: 'TOTAL',
    activities: 'activities',
    plannedBudget: 'Planned budget',
    spentBudget: 'Spent budget',
    noActivities: 'No activities',
    // New analytical sections
    riskMatrix: 'Indicator Risk Matrix',
    partnerScorecard: 'Partner Performance Scorecard',
    forecastAlerts: 'Forecast & Key Alerts',
    timeAdjPct: 'Time-Adj %',
    leadPartner: 'Lead Partner',
    onTrack: 'On Track',
    atRisk: 'At Risk',
    critical: 'Critical',
    health: 'Health',
    activities_ratio: 'Activities',
    indicators: 'Indicators',
    reached: 'Reached',
    healthy: 'Healthy',
    watch: 'Watch',
    notAllocated: 'Not Allocated',
    projectedEOY: 'Projected EOY Spend',
    ofAllocation: 'of allocation',
    spendVsTime: 'Spend progress vs FY elapsed',
    actualSpent: 'Actual spent',
    fyElapsed: 'FY elapsed',
    requiredPace: 'Required Pace to Hit 100% Target',
    neededPerQ: 'Needed/Q',
    feasibility: 'Feasibility',
    achievable: 'Achievable',
    tight: 'Tight',
    unrealistic: 'Unrealistic',
    keyAlerts: 'Key Alerts',
  },
  vi: {
    title: 'Bao cao Tong the Du an iLEAD',
    sub: 'Du an Phat trien Kinh doanh Bao trum (i-LEAD)',
    project: 'P013770 | Canada–Viet Nam | Nam tai chinh 2025–2026',
    generated: 'Ngay tao',
    print: 'In / Xuat PDF',
    execSummary: 'Tom tat Tong quan',
    completedAct: 'Hoat dong Da hoan thanh',
    inProgressAct: 'Hoat dong Dang thuc hien',
    plannedAct: 'Hoat dong Du kien',
    melProgress: 'Tien do Chi so MEL',
    budgetByPartner: 'Ngan sach theo Doi tac',
    totalActivities: 'Tong Hoat dong',
    done: 'Hoan thanh',
    inProgress: 'Dang lam',
    notStarted: 'Chua bat dau',
    overdue: 'Qua han',
    melOverall: 'MEL Tong the',
    actualReached: 'Thuc dat',
    targetVN: 'Muc tieu (VN)',
    budgetBurn: 'Ngan sach',
    spent: 'Da chi',
    allocated: 'Phan bo',
    reachGender: 'Tiep can & Gioi tinh',
    totalReached: 'Tong tiep can',
    femaleRatio: 'Ty le nu',
    activity: 'Hoat dong',
    type: 'Loai',
    stage: 'Giai doan',
    dates: 'Thoi gian',
    budget: 'Ngan sach (CAD)',
    status: 'Trang thai',
    ballOwner: 'Nguoi phu trach',
    nextAction: 'Buoc tiep theo',
    code: 'Ma',
    indicator: 'Chi so',
    target: 'Muc tieu VN',
    actual: 'Thuc dat',
    progress: 'Tien do',
    femalePct: '% Nu',
    partner: 'Doi tac',
    remaining: 'Con lai',
    burnPct: '% Da chi',
    total: 'TONG',
    activities: 'hoat dong',
    plannedBudget: 'Ngan sach du kien',
    spentBudget: 'Ngan sach da chi',
    noActivities: 'Khong co hoat dong',
    riskMatrix: 'Ma tran Rui ro Chi so',
    partnerScorecard: 'Bang diem Hieu suat Doi tac',
    forecastAlerts: 'Du bao & Canh bao',
    timeAdjPct: '% Dieu chinh',
    leadPartner: 'Doi tac chinh',
    onTrack: 'Dung tien do',
    atRisk: 'Co rui ro',
    critical: 'Nghiem trong',
    health: 'Suc khoe',
    activities_ratio: 'Hoat dong',
    indicators: 'Chi so',
    reached: 'Tiep can',
    healthy: 'Tot',
    watch: 'Theo doi',
    notAllocated: 'Chua phan bo',
    projectedEOY: 'Du kien chi cuoi nam',
    ofAllocation: 'phan bo',
    spendVsTime: 'Tien do chi vs thoi gian',
    actualSpent: 'Da chi',
    fyElapsed: 'Thoi gian da qua',
    requiredPace: 'Toc do can thiet de dat 100% Muc tieu',
    neededPerQ: 'Can/Quy',
    feasibility: 'Kha thi',
    achievable: 'Dat duoc',
    tight: 'Chat',
    unrealistic: 'Kho dat',
    keyAlerts: 'Canh bao Quan trong',
  },
};

// ── Styles (inline for print compatibility) ────────────────────────────────────
const S = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter', system-ui, sans-serif", color: '#1a1a1a', fontSize: '14px', lineHeight: 1.5 },
  header: { marginBottom: 32, borderBottom: '3px solid #1e3a5f', paddingBottom: 16 },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
  brand: { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' },
  title: { fontSize: 26, fontWeight: 800, margin: '4px 0', color: '#1e3a5f' },
  sub: { fontSize: 13, color: '#64748b' },
  controls: { display: 'flex', gap: 8, alignItems: 'center' },
  langBtn: (active) => ({
    padding: '4px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #cbd5e1',
    borderRadius: 4, cursor: 'pointer',
    background: active ? '#1e3a5f' : '#fff', color: active ? '#fff' : '#64748b',
  }),
  printBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', fontSize: 12, fontWeight: 600, background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  section: { marginTop: 36 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#1e3a5f', borderBottom: '2px solid #e2e8f0', paddingBottom: 6, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 },
  kpiCard: (accent) => ({ border: '1px solid #e2e8f0', borderTop: `4px solid ${accent}`, borderRadius: 8, padding: '16px 20px', background: '#fff' }),
  kpiValue: (accent) => ({ fontSize: 28, fontWeight: 800, color: accent }),
  kpiLabel: { fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginTop: 2 },
  kpiSub: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  partnerGroup: { marginBottom: 20 },
  partnerName: { fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 },
  partnerDot: (color) => ({ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }),
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #cbd5e1', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', whiteSpace: 'nowrap' },
  thR: { textAlign: 'right', padding: '8px 10px', borderBottom: '2px solid #cbd5e1', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', whiteSpace: 'nowrap' },
  td: { padding: '7px 10px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' },
  tdR: { padding: '7px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', verticalAlign: 'top' },
  totalRow: { fontWeight: 700, background: '#f8fafc' },
  badge: (bg, color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: bg, color }),
  progressWrap: { width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  progressFill: (pct, color) => ({ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }),
  summaryLine: { fontSize: 12, color: '#64748b', marginTop: 8, fontStyle: 'italic' },
};

const fmtNum = (n) => n != null ? n.toLocaleString('en-CA') : '—';
const fmtCAD = (n) => n != null ? `CAD ${n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
const fmtDateRange = (s, e) => {
  const fmt = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  return [fmt(s), fmt(e)].filter(Boolean).join(' - ');
};

export default function ProjectReportPage() {
  const {
    activities, partners, partnerMap, melEntries, partnerBudgets, budgetLineItems,
    activityIndicators,
  } = useData();

  const [lang, setLang] = useState('en');
  const t = T[lang];

  // ── Derived data ─────────────────────────────────────────────────────────────

  // Activities by status
  const doneActs = useMemo(() => activities.filter(a => a.status === 'done'), [activities]);
  const ipActs = useMemo(() => activities.filter(a => a.status === 'in_progress'), [activities]);
  const nsActs = useMemo(() => activities.filter(a => a.status === 'not_started'), [activities]);
  const overdueCount = useMemo(() => activities.filter(a => {
    if (a.status === 'done') return false;
    if (!a.endDate) return false;
    return new Date(a.endDate + 'T00:00:00') < new Date();
  }).length, [activities]);

  // Reach
  const totalReach = useMemo(() => activities.reduce((s, a) => s + (Number(a.reachTotal) || 0), 0), [activities]);
  const totalWomen = useMemo(() => activities.reduce((s, a) => s + (Number(a.reachWomen) || 0), 0), [activities]);
  const pctWomen = totalReach > 0 ? Math.round((totalWomen / totalReach) * 100) : 0;

  // Budget
  const budgetAllocated = useMemo(() => (partnerBudgets || []).reduce((s, b) => s + (Number(b.allocated) || 0), 0), [partnerBudgets]);
  const budgetSpent = useMemo(() => (partnerBudgets || []).reduce((s, b) => {
    const lines = (budgetLineItems || []).filter(li => li.partnerId === b.partnerId);
    const lineSpent = lines.reduce((ls, li) => ls + (parseFloat(li.amount) || 0), 0);
    return s + (lines.length > 0 ? lineSpent : (Number(b.spent) || 0));
  }, 0), [partnerBudgets, budgetLineItems]);
  const burnRate = budgetAllocated > 0 ? Math.round((budgetSpent / budgetAllocated) * 100) : 0;

  // MEL indicator stats
  const indicatorStats = useMemo(() => {
    const map = {};
    INDICATOR_GROUPS.forEach(g => { map[g.code] = { ...g, actual: 0, male: 0, female: 0 }; });
    melEntries.forEach(e => {
      if (!map[e.indicatorGroup]) return;
      const m = (e.q1_m || 0) + (e.q2_m || 0) + (e.q3_m || 0) + (e.q4_m || 0);
      const f = (e.q1_f || 0) + (e.q2_f || 0) + (e.q3_f || 0) + (e.q4_f || 0);
      map[e.indicatorGroup].actual += m + f;
      map[e.indicatorGroup].male += m;
      map[e.indicatorGroup].female += f;
    });
    return Object.values(map);
  }, [melEntries]);

  const melTotalTarget = INDICATOR_GROUPS.reduce((s, g) => s + g.targetVietnam, 0);
  const melTotalActual = indicatorStats.reduce((s, g) => s + g.actual, 0);
  const melTotalFemale = indicatorStats.reduce((s, g) => s + g.female, 0);
  const melOverallPct = melTotalTarget > 0 ? (melTotalActual / melTotalTarget * 100).toFixed(1) : 0;
  const melFemaleRatio = melTotalActual > 0 ? (melTotalFemale / melTotalActual * 100).toFixed(1) : 0;

  // Group activities by partner
  const groupByPartner = (acts) => {
    const grouped = {};
    acts.forEach(a => {
      const pId = a.partnerId || '_none';
      if (!grouped[pId]) grouped[pId] = [];
      grouped[pId].push(a);
    });
    return Object.entries(grouped).map(([pId, items]) => ({
      partner: partnerMap?.[pId] || { name: 'Unassigned', color: '#9ca3af' },
      items: items.sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0)),
    }));
  };

  // Budget per partner
  const budgetRows = useMemo(() => {
    return (partnerBudgets || []).map(b => {
      const p = partnerMap?.[b.partnerId];
      const lines = (budgetLineItems || []).filter(li => li.partnerId === b.partnerId);
      const spent = lines.length > 0 ? lines.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0) : (Number(b.spent) || 0);
      const allocated = Number(b.allocated) || 0;
      return {
        name: p?.name || b.partnerId,
        color: p?.color || '#9ca3af',
        allocated,
        spent,
        remaining: allocated - spent,
        burn: allocated > 0 ? Math.round((spent / allocated) * 100) : 0,
      };
    }).filter(r => r.allocated > 0);
  }, [partnerBudgets, budgetLineItems, partnerMap]);

  // Analytics: Risk Matrix, Partner Scorecard, Forecasts
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
  const timeElapsed = computeTimeElapsed();

  const today = new Date().toLocaleDateString('en-CA', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── Render ───────────────────────────────────────────────────────────────────

  const renderActivityTable = (acts, showNextAction) => {
    const groups = groupByPartner(acts);
    if (groups.length === 0) return <p style={S.summaryLine}>{t.noActivities}</p>;
    return groups.map(({ partner: p, items }) => (
      <div key={p.name} style={S.partnerGroup}>
        <div style={S.partnerName}>
          <span style={S.partnerDot(p.color)} />
          {p.name}
          <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12 }}>— {items.length} {t.activities}</span>
        </div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: '35%' }}>{t.activity}</th>
              <th style={S.th}>{t.type}</th>
              <th style={S.th}>{t.stage}</th>
              <th style={S.th}>{t.dates}</th>
              <th style={S.thR}>{t.budget}</th>
              {showNextAction && <th style={{ ...S.th, width: '22%' }}>{t.nextAction}</th>}
            </tr>
          </thead>
          <tbody>
            {items.map(a => {
              const aType = ACTIVITY_TYPE_MAP[a.activityTypeCode];
              return (
                <tr key={a.id}>
                  <td style={S.td}>{a.name}</td>
                  <td style={S.td}>{aType ? `Type ${aType.code}` : '—'}</td>
                  <td style={S.td}>{a.stage || '—'}</td>
                  <td style={{ ...S.td, whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDateRange(a.startDate, a.endDate)}</td>
                  <td style={S.tdR}>{a.budget_planned ? fmtNum(a.budget_planned) : '—'}</td>
                  {showNextAction && <td style={{ ...S.td, fontSize: 12, color: '#64748b' }}>{a.nextAction || '—'}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ));
  };

  const burnColor = (pct) => pct >= 80 ? '#dc2626' : pct >= 50 ? '#d97706' : '#16a34a';
  const progColor = (pct) => pct >= 80 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .sidebar, .topbar, .mobile-bottom-nav, .pr-no-print { display: none !important; }
          .main-content { margin: 0 !important; padding: 0 !important; }
          .view-area { padding: 0 !important; }
          .pr-page { max-width: 100% !important; padding: 16px !important; }
          .pr-section { page-break-inside: avoid; }
          .pr-page-break { page-break-before: always; }
        }
      `}</style>

      <div className="pr-page" style={S.page}>
        {/* ── Header ─────────────────────────────── */}
        <div style={S.header}>
          <div style={S.headerTop}>
            <div>
              <div style={S.brand}>i-LEAD Program Management · Canada–Vietnam</div>
              <h1 style={S.title}>{t.title}</h1>
              <div style={S.sub}>{t.sub}</div>
              <div style={S.sub}>{t.project} · {t.generated}: {today}</div>
            </div>
            <div style={S.controls} className="pr-no-print">
              <button style={S.langBtn(lang === 'en')} onClick={() => setLang('en')}>EN</button>
              <button style={S.langBtn(lang === 'vi')} onClick={() => setLang('vi')}>VI</button>
              <button style={S.printBtn} onClick={() => window.print()}>
                <Printer size={14} /> {t.print}
              </button>
            </div>
          </div>
        </div>

        {/* ── Section 1: Executive Summary ───────── */}
        <div className="pr-section" style={S.section}>
          <div style={S.sectionTitle}>{t.execSummary}</div>
          <div style={S.kpiRow}>
            <div style={S.kpiCard('#2563eb')}>
              <div style={S.kpiValue('#2563eb')}>{activities.length}</div>
              <div style={S.kpiLabel}>{t.totalActivities}</div>
              <div style={S.kpiSub}>
                {doneActs.length} {t.done} · {ipActs.length} {t.inProgress} · {nsActs.length} {t.notStarted}
                {overdueCount > 0 && <span style={{ color: '#dc2626' }}> · {overdueCount} {t.overdue}</span>}
              </div>
            </div>
            <div style={S.kpiCard('#16a34a')}>
              <div style={S.kpiValue('#16a34a')}>{melOverallPct}%</div>
              <div style={S.kpiLabel}>{t.melOverall}</div>
              <div style={S.kpiSub}>{fmtNum(melTotalActual)} {t.actualReached} / {fmtNum(melTotalTarget)} {t.targetVN}</div>
            </div>
            <div style={S.kpiCard('#ea580c')}>
              <div style={S.kpiValue('#ea580c')}>{burnRate}%</div>
              <div style={S.kpiLabel}>{t.budgetBurn}</div>
              <div style={S.kpiSub}>{fmtCAD(budgetSpent)} {t.spent} / {fmtCAD(budgetAllocated)} {t.allocated}</div>
            </div>
            <div style={S.kpiCard('#db2777')}>
              <div style={S.kpiValue('#db2777')}>{pctWomen}%</div>
              <div style={S.kpiLabel}>{t.reachGender}</div>
              <div style={S.kpiSub}>{fmtNum(totalReach)} {t.totalReached} · {melFemaleRatio}% {t.femaleRatio} (MEL)</div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Completed Activities ────── */}
        <div className="pr-section" style={S.section}>
          <div style={S.sectionTitle}>{t.completedAct} ({doneActs.length})</div>
          {renderActivityTable(doneActs, false)}
          <div style={S.summaryLine}>
            {doneActs.length} {t.activities} · {t.spentBudget}: {fmtCAD(doneActs.reduce((s, a) => s + (Number(a.budget_actual) || 0), 0))}
          </div>
        </div>

        {/* ── Section 3: In-Progress Activities ──── */}
        <div className="pr-section" style={S.section}>
          <div style={S.sectionTitle}>{t.inProgressAct} ({ipActs.length})</div>
          {renderActivityTable(ipActs, true)}
        </div>

        {/* ── Section 4: Planned Activities ────── */}
        <div className="pr-section pr-page-break" style={S.section}>
          <div style={S.sectionTitle}>{t.plannedAct} ({nsActs.length})</div>
          {renderActivityTable(nsActs, true)}
          <div style={S.summaryLine}>
            {nsActs.length} {t.activities} · {t.plannedBudget}: {fmtCAD(nsActs.reduce((s, a) => s + (Number(a.budget_planned) || 0), 0))}
          </div>
        </div>

        {/* ── Section 5: MEL Indicator Progress ── */}
        <div className="pr-section pr-page-break" style={S.section}>
          <div style={S.sectionTitle}>{t.melProgress}</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>{t.code}</th>
                <th style={{ ...S.th, width: '35%' }}>{t.indicator}</th>
                <th style={S.thR}>{t.target}</th>
                <th style={S.thR}>{t.actual}</th>
                <th style={{ ...S.th, width: 160 }}>{t.progress}</th>
                <th style={S.thR}>{t.femalePct}</th>
              </tr>
            </thead>
            <tbody>
              {indicatorStats.map(g => {
                const pct = g.targetVietnam > 0 ? Math.round(g.actual / g.targetVietnam * 100) : 0;
                const femPct = g.actual > 0 ? Math.round(g.female / g.actual * 100) : null;
                const pColor = progColor(pct);
                return (
                  <tr key={g.code}>
                    <td style={{ ...S.td, fontWeight: 700 }}>{g.code}</td>
                    <td style={{ ...S.td, fontSize: 12 }}>{g.label}</td>
                    <td style={S.tdR}>{fmtNum(g.targetVietnam)}</td>
                    <td style={S.tdR}>{fmtNum(g.actual)}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ ...S.progressWrap, flex: 1 }}>
                          <div style={S.progressFill(pct, pColor)} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: pColor, minWidth: 40, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ ...S.tdR, color: femPct !== null && femPct < 50 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                      {femPct !== null ? `${femPct}%` : '—'}
                    </td>
                  </tr>
                );
              })}
              <tr style={S.totalRow}>
                <td style={S.td} colSpan={2}><strong>{t.total}</strong></td>
                <td style={S.tdR}><strong>{fmtNum(melTotalTarget)}</strong></td>
                <td style={S.tdR}><strong>{fmtNum(melTotalActual)}</strong></td>
                <td style={S.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ ...S.progressWrap, flex: 1 }}>
                      <div style={S.progressFill(parseFloat(melOverallPct), '#2563eb')} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', minWidth: 40, textAlign: 'right' }}>{melOverallPct}%</span>
                  </div>
                </td>
                <td style={{ ...S.tdR, fontWeight: 700, color: '#16a34a' }}>{melFemaleRatio}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Section 6: Budget by Partner ──────── */}
        <div className="pr-section" style={S.section}>
          <div style={S.sectionTitle}>{t.budgetByPartner}</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>{t.partner}</th>
                <th style={S.thR}>{t.allocated}</th>
                <th style={S.thR}>{t.spent}</th>
                <th style={S.thR}>{t.remaining}</th>
                <th style={{ ...S.thR, width: 100 }}>{t.burnPct}</th>
              </tr>
            </thead>
            <tbody>
              {budgetRows.map(r => (
                <tr key={r.name}>
                  <td style={S.td}>
                    <span style={{ ...S.partnerDot(r.color), marginRight: 8 }} />
                    {r.name}
                  </td>
                  <td style={S.tdR}>{fmtCAD(r.allocated)}</td>
                  <td style={S.tdR}>{fmtCAD(r.spent)}</td>
                  <td style={S.tdR}>{fmtCAD(r.remaining)}</td>
                  <td style={{ ...S.tdR, fontWeight: 700, color: burnColor(r.burn) }}>{r.burn}%</td>
                </tr>
              ))}
              <tr style={S.totalRow}>
                <td style={S.td}><strong>{t.total}</strong></td>
                <td style={S.tdR}><strong>{fmtCAD(budgetAllocated)}</strong></td>
                <td style={S.tdR}><strong>{fmtCAD(budgetSpent)}</strong></td>
                <td style={S.tdR}><strong>{fmtCAD(budgetAllocated - budgetSpent)}</strong></td>
                <td style={{ ...S.tdR, fontWeight: 700, color: burnColor(burnRate) }}><strong>{burnRate}%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Section 7: Risk Matrix ───────────── */}
        <div className="pr-section pr-page-break" style={S.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: 6, marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.riskMatrix}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { key: 'on-track', color: '#16a34a', bg: '#dcfce7' },
                { key: 'at-risk', color: '#d97706', bg: '#fef3c7' },
                { key: 'critical', color: '#dc2626', bg: '#fee2e2' },
              ].map(s => {
                const count = riskMatrix.filter(g => g.status === s.key).length;
                return (
                  <span key={s.key} style={S.badge(s.bg, s.color)}>
                    {count} {t[s.key === 'on-track' ? 'onTrack' : s.key === 'at-risk' ? 'atRisk' : 'critical']}
                  </span>
                );
              })}
            </div>
          </div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>{t.status}</th>
                <th style={S.th}>{t.indicator}</th>
                <th style={S.thR}>{t.target}</th>
                <th style={S.thR}>{t.actual}</th>
                <th style={{ ...S.th, width: 120 }}>{t.progress}</th>
                <th style={S.thR}>{t.timeAdjPct}</th>
                <th style={S.thR}>{t.femalePct}</th>
                <th style={S.th}>{t.leadPartner}</th>
              </tr>
            </thead>
            <tbody>
              {[...riskMatrix].sort((a, b) => {
                const order = { critical: 0, 'at-risk': 1, 'on-track': 2 };
                return order[a.status] - order[b.status];
              }).map(g => {
                const statusStyle = {
                  'on-track': { bg: '#dcfce7', color: '#16a34a' },
                  'at-risk': { bg: '#fef3c7', color: '#d97706' },
                  'critical': { bg: '#fee2e2', color: '#dc2626' },
                }[g.status];
                const statusLabel = { 'on-track': t.onTrack, 'at-risk': t.atRisk, 'critical': t.critical }[g.status];
                const rawPct = Math.round(g.progressPct * 100);
                const timeAdj = Math.round(g.timeAdjustedPct * 100);
                const femPct = g.femaleRatio !== null ? Math.round(g.femaleRatio * 100) : null;
                return (
                  <tr key={g.code}>
                    <td style={S.td}><span style={S.badge(statusStyle.bg, statusStyle.color)}>{statusLabel}</span></td>
                    <td style={S.td}><strong>{g.code}</strong><br /><span style={{ fontSize: 11, color: '#64748b' }}>{g.label}</span></td>
                    <td style={S.tdR}>{fmtNum(g.targetVietnam)}</td>
                    <td style={S.tdR}>{fmtNum(g.actual)}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ ...S.progressWrap, flex: 1 }}>
                          <div style={S.progressFill(rawPct, statusStyle.color)} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: statusStyle.color }}>{rawPct}%</span>
                      </div>
                    </td>
                    <td style={{ ...S.tdR, fontWeight: 600 }}>{timeAdj}%</td>
                    <td style={{ ...S.tdR, fontWeight: 600, color: femPct !== null && femPct >= 50 ? '#16a34a' : femPct !== null ? '#dc2626' : '#94a3b8' }}>
                      {femPct !== null ? `${femPct}%` : '—'}
                    </td>
                    <td style={S.td}>{g.leadPartner}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Section 8: Partner Scorecard ──────── */}
        <div className="pr-section pr-page-break" style={S.section}>
          <div style={S.sectionTitle}>{t.partnerScorecard}</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>{t.partner}</th>
                <th style={S.thR}>{t.budget}</th>
                <th style={S.th}>{t.burnPct}</th>
                <th style={S.thR}>{t.activities_ratio}</th>
                <th style={S.thR}>{t.indicators}</th>
                <th style={S.thR}>{t.reached}</th>
                <th style={S.thR}>{t.femalePct}</th>
                <th style={S.th}>{t.health}</th>
              </tr>
            </thead>
            <tbody>
              {partnerScorecard.map(p => {
                const healthStyle = {
                  healthy: { bg: '#dcfce7', color: '#16a34a' },
                  watch: { bg: '#fef3c7', color: '#d97706' },
                  'at-risk': { bg: '#fee2e2', color: '#dc2626' },
                  'not-allocated': { bg: '#f3f4f6', color: '#9ca3af' },
                }[p.healthLabel];
                const healthText = {
                  healthy: t.healthy, watch: t.watch, 'at-risk': t.atRisk, 'not-allocated': t.notAllocated,
                }[p.healthLabel];
                const femPct = p.femaleRatio !== null ? Math.round(p.femaleRatio * 100) : null;
                const burnPctDisplay = p.allocated > 0 ? `${Math.round((p.spent / p.allocated) * 100)}%` : '—';
                const burnPace = p.burnRate > 0
                  ? (p.burnRate <= 1.2 ? 'on pace' : p.burnRate > 1.2 ? 'over-burn' : 'slow')
                  : 'slow start';
                return (
                  <tr key={p.id}>
                    <td style={S.td}>
                      <span style={{ ...S.partnerDot(p.color), marginRight: 8 }} />
                      <strong>{p.name}</strong>
                    </td>
                    <td style={S.tdR}>{p.allocated ? fmtNum(p.allocated) : '—'}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ ...S.progressWrap, width: 60 }}>
                          <div style={S.progressFill(p.allocated > 0 ? (p.spent / p.allocated * 100) : 0, burnColor(p.allocated > 0 ? Math.round(p.spent / p.allocated * 100) : 0))} />
                        </div>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{burnPctDisplay} · {burnPace}</span>
                      </div>
                    </td>
                    <td style={S.tdR}>{p.doneCount} / {p.activityCount}</td>
                    <td style={S.tdR}>{p.indCount}</td>
                    <td style={S.tdR}>{p.totalReach > 0 ? fmtNum(p.totalReach) : '—'}</td>
                    <td style={{ ...S.tdR, fontWeight: 600, color: femPct !== null && femPct >= 50 ? '#16a34a' : femPct !== null ? '#dc2626' : '#94a3b8' }}>
                      {femPct !== null ? `${femPct}%` : '—'}
                    </td>
                    <td style={S.td}><span style={S.badge(healthStyle.bg, healthStyle.color)}>{healthText}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Section 9: Forecast & Alerts ──────── */}
        <div className="pr-section pr-page-break" style={S.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: 6, marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.forecastAlerts}</div>
            <span style={S.badge('#dbeafe', '#2563eb')}>{Math.round(timeElapsed * 100)}% {t.fyElapsed}</span>
          </div>

          {/* Budget projection + Required pace side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* Budget projection */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>{t.projectedEOY}</div>
              <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>{t.allocated}</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{fmtCAD(forecasts.totalAllocated)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>{t.spent}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#2563eb' }}>{fmtCAD(forecasts.totalSpent)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>{t.projectedEOY}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: forecasts.projectedBurnPct > 1 ? '#dc2626' : '#16a34a' }}>
                    {fmtCAD(forecasts.projectedSpend)}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{Math.round(forecasts.projectedBurnPct * 100)}% {t.ofAllocation}</div>
                </div>
              </div>
              {/* Spend vs time bar */}
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{t.spendVsTime}</div>
              <div style={{ position: 'relative', height: 20, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', height: '100%', width: `${Math.min(100, Math.round(timeElapsed * 100))}%`, background: '#93c5fd', borderRadius: 4 }} />
                <div style={{ position: 'absolute', height: '100%', width: `${Math.min(100, burnRate)}%`, background: '#16a34a', borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginTop: 4 }}>
                <span>{t.actualSpent} ({burnRate}%)</span>
                <span>{t.fyElapsed} ({Math.round(timeElapsed * 100)}%)</span>
              </div>
            </div>

            {/* Required pace table */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>{t.requiredPace}</div>
              <table style={{ ...S.table, fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, fontSize: 10 }}>{t.indicator}</th>
                    <th style={{ ...S.thR, fontSize: 10 }}>{t.remaining}</th>
                    <th style={{ ...S.thR, fontSize: 10 }}>{t.neededPerQ}</th>
                    <th style={{ ...S.th, fontSize: 10 }}>{t.feasibility}</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.indicatorForecasts.filter(g => g.remaining > 0).map(g => {
                    const feasStyle = {
                      achievable: { bg: '#dcfce7', color: '#16a34a' },
                      tight: { bg: '#fef3c7', color: '#d97706' },
                      unrealistic: { bg: '#fee2e2', color: '#dc2626' },
                    }[g.feasibility];
                    const feasText = { achievable: t.achievable, tight: t.tight, unrealistic: t.unrealistic }[g.feasibility];
                    return (
                      <tr key={g.code}>
                        <td style={{ ...S.td, fontWeight: 600 }}>{g.code}</td>
                        <td style={S.tdR}>{fmtNum(g.remaining)}</td>
                        <td style={S.tdR}>{fmtNum(g.neededPerQ)}</td>
                        <td style={S.td}><span style={S.badge(feasStyle.bg, feasStyle.color)}>{feasText}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Alerts */}
          {forecasts.alerts.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 10 }}>{t.keyAlerts}</div>
              {forecasts.alerts.map((alert, i) => {
                const aStyle = {
                  critical: { border: '#fca5a5', bg: '#fef2f2', icon: '●' , color: '#dc2626' },
                  warning: { border: '#fcd34d', bg: '#fffbeb', icon: '▲', color: '#d97706' },
                  info: { border: '#93c5fd', bg: '#eff6ff', icon: '◆', color: '#2563eb' },
                }[alert.severity];
                return (
                  <div key={i} style={{
                    padding: '10px 14px', marginBottom: 8, borderRadius: 6,
                    borderLeft: `4px solid ${aStyle.border}`, background: aStyle.bg,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: aStyle.color }}>
                      <span style={{ marginRight: 6 }}>{aStyle.icon}</span>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{alert.detail}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
