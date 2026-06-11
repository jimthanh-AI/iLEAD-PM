import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import {
  INDICATOR_GROUPS, STAGES, STAGE_LABELS, ACTIVITY_TYPE_MAP,
  STATUS_LABELS, fmtDate,
} from '../utils/constants';
import {
  computeTimeElapsed, computeRiskMatrix, computePartnerScorecard, computeForecasts,
} from '../utils/insights';
import { Printer } from 'lucide-react';

// ── Translations ───────────────────────────────────────────────────────────────
const T = {
  en: {
    title: 'iLEAD Project Overview Report',
    sub: 'Inclusive Business Development Project (i-LEAD)',
    project: 'P013770 | Canada\u2013Vietnam | FY 2025\u20132026',
    generated: 'Generated',
    print: 'Print / PDF',
    // Part A
    partA: 'Part A: Actual Progress \u2014 From MEL Entries',
    execSummary: 'Executive Summary: Actual Progress',
    melProgress: 'MEL Indicator Progress',
    budgetSpentLabel: 'Budget Spent',
    actualReach: 'Actual Reach (MEL)',
    femaleRatioMEL: 'Female Ratio (MEL)',
    melOverall: 'MEL Progress',
    ofTarget: 'of target',
    entries: 'entries',
    reached: 'reached',
    gacReq: 'GAC \u226550%',
    // Part B
    partB: 'Part B: Work Plan \u2014 Activities',
    actDashboard: 'Activities Overview',
    totalActivities: 'Total Activities',
    done: 'Done',
    inProgress: 'In Progress',
    notStarted: 'Not Started',
    overdue: 'Overdue',
    plannedBudgetLabel: 'Planned Budget',
    plannedReach: 'Planned Reach',
    completionRate: 'Completion Rate',
    fromActivities: 'from activities',
    women: 'women',
    timeline: 'Timeline \u2014 FY 2025\u20132026',
    today: 'Today',
    detailByPartner: 'Detailed Plan by Partner',
    completedAct: 'Completed',
    inProgressAct: 'In Progress',
    plannedAct: 'Planned',
    // Part C
    partC: 'Part C: Budget & Analytics',
    budgetByPartner: 'Budget by Partner',
    riskMatrix: 'Indicator Risk Matrix',
    partnerScorecard: 'Partner Performance Scorecard',
    forecastAlerts: 'Forecast & Key Alerts',
    // Table headers
    activity: 'Activity', type: 'Type', stage: 'Stage', dates: 'Dates',
    budget: 'Budget (CAD)', status: 'Status', nextAction: 'Next Action',
    code: 'Code', indicator: 'Indicator', target: 'Target VN', actual: 'Actual',
    progress: 'Progress', femalePct: 'Female %',
    partner: 'Partner', allocated: 'Allocated', spent: 'Spent',
    remaining: 'Remaining', burnPct: 'Burn %', total: 'TOTAL',
    activities: 'activities', noActivities: 'No activities',
    // Risk/Scorecard
    onTrack: 'On Track', atRisk: 'At Risk', critical: 'Critical',
    timeAdjPct: 'Time-Adj %', leadPartner: 'Lead Partner',
    health: 'Health', healthy: 'Healthy', watch: 'Watch', notAllocated: 'N/A',
    indicators: 'Indicators',
    // Forecast
    projectedEOY: 'Projected EOY Spend', ofAllocation: 'of allocation',
    spendVsTime: 'Spend progress vs FY elapsed',
    actualSpent: 'Actual spent', fyElapsed: 'FY elapsed',
    requiredPace: 'Required Pace to Hit 100% Target',
    neededPerQ: 'Needed/Q', feasibility: 'Feasibility',
    achievable: 'Achievable', tight: 'Tight', unrealistic: 'Unrealistic',
    keyAlerts: 'Key Alerts',
  },
  vi: {
    title: 'B\u00e1o c\u00e1o T\u1ed5ng th\u1ec3 D\u1ef1 \u00e1n iLEAD',
    sub: 'D\u1ef1 \u00e1n Ph\u00e1t tri\u1ec3n Kinh doanh Bao tr\u00f9m (i-LEAD)',
    project: 'P013770 | Canada\u2013Vi\u1ec7t Nam | N\u0103m t\u00e0i ch\u00ednh 2025\u20132026',
    generated: 'Ng\u00e0y t\u1ea1o',
    print: 'In / Xu\u1ea5t PDF',
    partA: 'Ph\u1ea7n A: Th\u1ef1c t\u1ebf \u2014 T\u1eeb MEL Entries',
    execSummary: 'T\u00f3m t\u1eaft: Ti\u1ebfn \u0111\u1ed9 Th\u1ef1c t\u1ebf',
    melProgress: 'Ti\u1ebfn \u0111\u1ed9 Ch\u1ec9 s\u1ed1 MEL',
    budgetSpentLabel: 'Ng\u00e2n s\u00e1ch \u0111\u00e3 d\u00f9ng',
    actualReach: 'Ti\u1ebfp c\u1eadn Th\u1ef1c t\u1ebf (MEL)',
    femaleRatioMEL: 'T\u1ef7 l\u1ec7 N\u1eef (MEL)',
    melOverall: 'Ti\u1ebfn \u0111\u1ed9 MEL',
    ofTarget: 'm\u1ee5c ti\u00eau',
    entries: 'entries',
    reached: 'ng\u01b0\u1eddi',
    gacReq: 'GAC \u226550%',
    partB: 'Ph\u1ea7n B: K\u1ebf ho\u1ea1ch \u2014 Ho\u1ea1t \u0111\u1ed9ng',
    actDashboard: 'T\u1ed5ng quan Ho\u1ea1t \u0111\u1ed9ng',
    totalActivities: 'T\u1ed5ng Ho\u1ea1t \u0111\u1ed9ng',
    done: 'Ho\u00e0n th\u00e0nh',
    inProgress: '\u0110ang l\u00e0m',
    notStarted: 'Ch\u01b0a b\u1eaft \u0111\u1ea7u',
    overdue: 'Qu\u00e1 h\u1ea1n',
    plannedBudgetLabel: 'Ng\u00e2n s\u00e1ch D\u1ef1 ki\u1ebfn',
    plannedReach: 'Ti\u1ebfp c\u1eadn D\u1ef1 ki\u1ebfn',
    completionRate: 'T\u1ef7 l\u1ec7 Ho\u00e0n th\u00e0nh',
    fromActivities: 't\u1eeb ho\u1ea1t \u0111\u1ed9ng',
    women: 'n\u1eef',
    timeline: 'D\u00f2ng th\u1eddi gian \u2014 NTC 2025\u20132026',
    today: 'H\u00f4m nay',
    detailByPartner: 'K\u1ebf ho\u1ea1ch Chi ti\u1ebft theo \u0110\u1ed1i t\u00e1c',
    completedAct: '\u0110\u00e3 ho\u00e0n th\u00e0nh',
    inProgressAct: '\u0110ang th\u1ef1c hi\u1ec7n',
    plannedAct: 'K\u1ebf ho\u1ea1ch',
    partC: 'Ph\u1ea7n C: Ng\u00e2n s\u00e1ch & Ph\u00e2n t\u00edch',
    budgetByPartner: 'Ng\u00e2n s\u00e1ch theo \u0110\u1ed1i t\u00e1c',
    riskMatrix: 'Ma tr\u1eadn R\u1ee7i ro Ch\u1ec9 s\u1ed1',
    partnerScorecard: 'B\u1ea3ng \u0111i\u1ec3m Hi\u1ec7u su\u1ea5t \u0110\u1ed1i t\u00e1c',
    forecastAlerts: 'D\u1ef1 b\u00e1o & C\u1ea3nh b\u00e1o',
    activity: 'Ho\u1ea1t \u0111\u1ed9ng', type: 'Lo\u1ea1i', stage: 'Giai \u0111o\u1ea1n', dates: 'Th\u1eddi gian',
    budget: 'Ng\u00e2n s\u00e1ch (CAD)', status: 'Tr\u1ea1ng th\u00e1i', nextAction: 'B\u01b0\u1edbc ti\u1ebfp theo',
    code: 'M\u00e3', indicator: 'Ch\u1ec9 s\u1ed1', target: 'M\u1ee5c ti\u00eau VN', actual: 'Th\u1ef1c \u0111\u1ea1t',
    progress: 'Ti\u1ebfn \u0111\u1ed9', femalePct: '% N\u1eef',
    partner: '\u0110\u1ed1i t\u00e1c', allocated: 'Ph\u00e2n b\u1ed5', spent: '\u0110\u00e3 chi',
    remaining: 'C\u00f2n l\u1ea1i', burnPct: '% \u0110\u00e3 chi', total: 'T\u1ed4NG',
    activities: 'ho\u1ea1t \u0111\u1ed9ng', noActivities: 'Kh\u00f4ng c\u00f3 ho\u1ea1t \u0111\u1ed9ng',
    onTrack: '\u0110\u00fang ti\u1ebfn \u0111\u1ed9', atRisk: 'C\u00f3 r\u1ee7i ro', critical: 'Nghi\u00eam tr\u1ecdng',
    timeAdjPct: '% \u0110i\u1ec1u ch\u1ec9nh', leadPartner: '\u0110\u1ed1i t\u00e1c ch\u00ednh',
    health: 'S\u1ee9c kh\u1ecfe', healthy: 'T\u1ed1t', watch: 'Theo d\u00f5i', notAllocated: 'Ch\u01b0a ph\u00e2n b\u1ed5',
    indicators: 'Ch\u1ec9 s\u1ed1',
    projectedEOY: 'D\u1ef1 ki\u1ebfn chi cu\u1ed1i n\u0103m', ofAllocation: 'ph\u00e2n b\u1ed5',
    spendVsTime: 'Ti\u1ebfn \u0111\u1ed9 chi vs th\u1eddi gian',
    actualSpent: '\u0110\u00e3 chi', fyElapsed: 'Th\u1eddi gian \u0111\u00e3 qua',
    requiredPace: 'T\u1ed1c \u0111\u1ed9 c\u1ea7n thi\u1ebft \u0111\u1ec3 \u0111\u1ea1t 100% M\u1ee5c ti\u00eau',
    neededPerQ: 'C\u1ea7n/Qu\u00fd', feasibility: 'Kh\u1ea3 thi',
    achievable: '\u0110\u1ea1t \u0111\u01b0\u1ee3c', tight: 'Ch\u1eb7t', unrealistic: 'Kh\u00f3 \u0111\u1ea1t',
    keyAlerts: 'C\u1ea3nh b\u00e1o Quan tr\u1ecdng',
  },
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px', fontFamily: "'Inter', system-ui, sans-serif", color: '#1a1a1a', fontSize: '14px', lineHeight: 1.5 },
  header: { marginBottom: 32, borderBottom: '3px solid #1e3a5f', paddingBottom: 16 },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
  brand: { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' },
  title: { fontSize: 26, fontWeight: 800, margin: '4px 0', color: '#1e3a5f' },
  subText: { fontSize: 13, color: '#64748b' },
  controls: { display: 'flex', gap: 8, alignItems: 'center' },
  langBtn: (active) => ({ padding: '4px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', background: active ? '#1e3a5f' : '#fff', color: active ? '#fff' : '#64748b' }),
  printBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', fontSize: 12, fontWeight: 600, background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  partDivider: (color) => ({ margin: '40px 0 20px', padding: '10px 16px', background: color, borderRadius: 6, fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.03em' }),
  section: { marginTop: 28 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#1e3a5f', borderBottom: '2px solid #e2e8f0', paddingBottom: 6, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 },
  kpiCard: (accent) => ({ border: '1px solid #e2e8f0', borderTop: `4px solid ${accent}`, borderRadius: 8, padding: '16px 20px', background: '#fff' }),
  kpiValue: (accent) => ({ fontSize: 28, fontWeight: 800, color: accent }),
  kpiLabel: { fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginTop: 2 },
  kpiSub: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #cbd5e1', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', whiteSpace: 'nowrap' },
  thR: { textAlign: 'right', padding: '8px 10px', borderBottom: '2px solid #cbd5e1', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', whiteSpace: 'nowrap' },
  td: { padding: '7px 10px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' },
  tdR: { padding: '7px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', verticalAlign: 'top' },
  totalRow: { fontWeight: 700, background: '#f8fafc' },
  badge: (bg, color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: bg, color }),
  progressWrap: { width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  progressFill: (pct, color) => ({ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', background: color, borderRadius: 4 }),
  partnerGroup: { marginBottom: 20 },
  partnerName: { fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 },
  partnerDot: (color) => ({ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }),
  summaryLine: { fontSize: 12, color: '#64748b', marginTop: 8, fontStyle: 'italic' },
};

const fmtNum = (n) => n != null ? n.toLocaleString('en-CA') : '\u2014';
const fmtCAD = (n) => n != null ? `CAD ${n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '\u2014';
const fmtDateRange = (s, e) => {
  const fmt = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  return [fmt(s), fmt(e)].filter(Boolean).join(' \u2013 ');
};
const burnColor = (pct) => pct >= 80 ? '#dc2626' : pct >= 50 ? '#d97706' : '#16a34a';
const progColor = (pct) => pct >= 80 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';

// ── Timeline constants ─────────────────────────────────────────────────────────
const FY_START = new Date('2025-10-01T00:00:00');
const FY_END = new Date('2026-09-30T23:59:59');
const FY_SPAN = FY_END - FY_START;
const MONTHS = ['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'];

export default function ProjectReportPage() {
  const {
    activities, partners, partnerMap, melEntries, partnerBudgets, budgetLineItems,
    activityIndicators,
  } = useData();

  const [lang, setLang] = useState('en');
  const t = T[lang];

  // ── Computed data ──────────────────────────────────────────────────────────

  // Activities by status
  const doneActs = useMemo(() => activities.filter(a => a.status === 'done'), [activities]);
  const ipActs = useMemo(() => activities.filter(a => a.status === 'in_progress'), [activities]);
  const nsActs = useMemo(() => activities.filter(a => a.status === 'not_started'), [activities]);
  const overdueCount = useMemo(() => activities.filter(a => {
    if (a.status === 'done') return false;
    if (!a.endDate) return false;
    return new Date(a.endDate + 'T00:00:00') < new Date();
  }).length, [activities]);

  // Reach from activities
  const totalReach = useMemo(() => activities.reduce((s, a) => s + (Number(a.reachTotal) || 0), 0), [activities]);
  const totalWomen = useMemo(() => activities.reduce((s, a) => s + (Number(a.reachWomen) || 0), 0), [activities]);
  const plannedBudget = useMemo(() => activities.reduce((s, a) => s + (Number(a.budget_planned) || 0), 0), [activities]);

  // Budget from partnerBudgets
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

  // Budget rows per partner
  const budgetRows = useMemo(() => {
    return (partnerBudgets || []).map(b => {
      const p = partnerMap?.[b.partnerId];
      const lines = (budgetLineItems || []).filter(li => li.partnerId === b.partnerId);
      const spent = lines.length > 0 ? lines.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0) : (Number(b.spent) || 0);
      const allocated = Number(b.allocated) || 0;
      return { name: p?.name || b.partnerId, color: p?.color || '#9ca3af', allocated, spent, remaining: allocated - spent, burn: allocated > 0 ? Math.round((spent / allocated) * 100) : 0 };
    }).filter(r => r.allocated > 0);
  }, [partnerBudgets, budgetLineItems, partnerMap]);

  // Analytics
  const riskMatrix = useMemo(() => computeRiskMatrix({ melEntries, partnerMap }), [melEntries, partnerMap]);
  const partnerScorecard = useMemo(() => computePartnerScorecard({ partners, partnerBudgets, activities, activityIndicators }), [partners, partnerBudgets, activities, activityIndicators]);
  const forecasts = useMemo(() => computeForecasts({ riskMatrix, partnerScorecard, partnerBudgets }), [riskMatrix, partnerScorecard, partnerBudgets]);
  const timeElapsed = computeTimeElapsed();

  const todayStr = new Date().toLocaleDateString('en-CA', { day: '2-digit', month: 'long', year: 'numeric' });
  const completionRate = activities.length > 0 ? Math.round(doneActs.length / activities.length * 100) : 0;

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

  // Timeline data grouped by partner
  const timelineData = useMemo(() => {
    return partners.map(p => {
      const acts = activities.filter(a => a.partnerId === p.id && a.startDate);
      return { partner: p, acts: acts.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || '')) };
    }).filter(g => g.acts.length > 0);
  }, [partners, activities]);

  const todayPct = Math.max(0, Math.min(100, ((new Date() - FY_START) / FY_SPAN) * 100));

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderActivityTable = (acts, showNextAction) => {
    if (acts.length === 0) return <p style={S.summaryLine}>{t.noActivities}</p>;
    return (
      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: '35%' }}>{t.activity}</th>
            <th style={S.th}>{t.type}</th>
            <th style={S.th}>{t.stage}</th>
            <th style={S.th}>{t.dates}</th>
            <th style={S.thR}>{t.budget}</th>
            {showNextAction && <th style={{ ...S.th, width: '20%' }}>{t.nextAction}</th>}
          </tr>
        </thead>
        <tbody>
          {acts.map(a => {
            const aType = ACTIVITY_TYPE_MAP[a.activityTypeCode];
            return (
              <tr key={a.id}>
                <td style={S.td}>{lang === 'en' ? (a.name_en || a.name) : a.name}</td>
                <td style={S.td}>{aType ? `Type ${aType.code}` : '\u2014'}</td>
                <td style={S.td}>{a.stage || '\u2014'}</td>
                <td style={{ ...S.td, whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDateRange(a.startDate, a.endDate)}</td>
                <td style={S.tdR}>{a.budget_planned ? fmtNum(a.budget_planned) : '\u2014'}</td>
                {showNextAction && <td style={{ ...S.td, fontSize: 12, color: '#64748b' }}>{a.nextAction || '\u2014'}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Print styles — multi-page support */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .sidebar, .topbar, .mobile-bottom-nav, .pr-no-print { display: none !important; }
          .main-content { margin: 0 !important; padding: 0 !important; }
          .view-area { padding: 0 !important; overflow: visible !important; }
          .pr-page { max-width: 100% !important; padding: 8px !important; }
          .pr-section { page-break-inside: auto; }
          .pr-page-break { page-break-before: always; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
        }
      `}</style>

      <div className="pr-page" style={S.page}>
        {/* ── Header ──────────────────────────────── */}
        <div style={S.header}>
          <div style={S.headerTop}>
            <div>
              <div style={S.brand}>i-LEAD Program Management {'\u00b7'} Canada{'\u2013'}Vietnam</div>
              <h1 style={S.title}>{t.title}</h1>
              <div style={S.subText}>{t.sub}</div>
              <div style={S.subText}>{t.project} {'\u00b7'} {t.generated}: {todayStr}</div>
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

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* PART A: ACTUAL PROGRESS — FROM MEL ENTRIES                         */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <div style={S.partDivider('#0f766e')}>{t.partA}</div>

        {/* Section 1 — Executive Summary: Actual */}
        <div className="pr-section" style={S.section}>
          <div style={S.sectionTitle}>{t.execSummary}</div>
          <div style={S.kpiRow}>
            <div style={S.kpiCard('#ea580c')}>
              <div style={S.kpiValue('#ea580c')}>{burnRate}%</div>
              <div style={S.kpiLabel}>{t.budgetSpentLabel}</div>
              <div style={S.kpiSub}>{fmtCAD(budgetSpent)} / {fmtCAD(budgetAllocated)}</div>
            </div>
            <div style={S.kpiCard('#2563eb')}>
              <div style={S.kpiValue('#2563eb')}>{fmtNum(melTotalActual)}</div>
              <div style={S.kpiLabel}>{t.actualReach}</div>
              <div style={S.kpiSub}>{fmtNum(melTotalTarget)} {t.ofTarget} {'\u00b7'} {melEntries.length} {t.entries}</div>
            </div>
            <div style={S.kpiCard('#db2777')}>
              <div style={S.kpiValue('#db2777')}>{melFemaleRatio}%</div>
              <div style={S.kpiLabel}>{t.femaleRatioMEL}</div>
              <div style={S.kpiSub}>{fmtNum(melTotalFemale)} / {fmtNum(melTotalActual)} {t.reached} {'\u00b7'} {t.gacReq}</div>
            </div>
            <div style={S.kpiCard('#16a34a')}>
              <div style={S.kpiValue('#16a34a')}>{melOverallPct}%</div>
              <div style={S.kpiLabel}>{t.melOverall}</div>
              <div style={S.kpiSub}>{fmtNum(melTotalActual)} / {fmtNum(melTotalTarget)}</div>
            </div>
          </div>
        </div>

        {/* Section 2 — MEL Indicator Progress */}
        <div className="pr-section" style={S.section}>
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
                      {femPct !== null ? `${femPct}%` : '\u2014'}
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

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* PART B: WORK PLAN — ACTIVITIES                                     */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <div className="pr-page-break" style={S.partDivider('#1e40af')}>{t.partB}</div>

        {/* Section 3 — Activities Dashboard */}
        <div className="pr-section" style={S.section}>
          <div style={S.sectionTitle}>{t.actDashboard}</div>
          <div style={S.kpiRow}>
            <div style={S.kpiCard('#2563eb')}>
              <div style={S.kpiValue('#2563eb')}>{activities.length}</div>
              <div style={S.kpiLabel}>{t.totalActivities}</div>
              <div style={S.kpiSub}>
                {doneActs.length} {t.done} {'\u00b7'} {ipActs.length} {t.inProgress} {'\u00b7'} {nsActs.length} {t.notStarted}
                {overdueCount > 0 && <span style={{ color: '#dc2626' }}> {'\u00b7'} {overdueCount} {t.overdue}</span>}
              </div>
            </div>
            <div style={S.kpiCard('#d97706')}>
              <div style={S.kpiValue('#d97706')}>{fmtCAD(plannedBudget)}</div>
              <div style={S.kpiLabel}>{t.plannedBudgetLabel}</div>
              <div style={S.kpiSub}>{t.fromActivities}</div>
            </div>
            <div style={S.kpiCard('#7c3aed')}>
              <div style={S.kpiValue('#7c3aed')}>{fmtNum(totalReach)}</div>
              <div style={S.kpiLabel}>{t.plannedReach}</div>
              <div style={S.kpiSub}>{fmtNum(totalWomen)} {t.women} ({totalReach > 0 ? Math.round(totalWomen / totalReach * 100) : 0}%)</div>
            </div>
            <div style={S.kpiCard('#16a34a')}>
              <div style={S.kpiValue('#16a34a')}>{completionRate}%</div>
              <div style={S.kpiLabel}>{t.completionRate}</div>
              <div style={S.kpiSub}>{doneActs.length} / {activities.length}</div>
            </div>
          </div>
        </div>

        {/* Section 4 — Timeline Dashboard */}
        <div className="pr-section" style={S.section}>
          <div style={S.sectionTitle}>{t.timeline}</div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 12px', background: '#fafbfc', overflowX: 'auto' }}>
            {/* Month headers */}
            <div style={{ display: 'flex', marginBottom: 8, marginLeft: 160, position: 'relative' }}>
              {MONTHS.map((m, i) => (
                <div key={m} style={{ flex: 1, fontSize: 10, fontWeight: 600, color: '#94a3b8', textAlign: 'center', borderLeft: '1px solid #e2e8f0', minWidth: 60 }}>{m}</div>
              ))}
            </div>
            {/* Activities */}
            {timelineData.map(({ partner: p, acts }) => (
              <div key={p.id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={S.partnerDot(p.color)} />{p.name}
                </div>
                {acts.map(a => {
                  const start = new Date(a.startDate + 'T00:00:00');
                  const end = a.endDate ? new Date(a.endDate + 'T00:00:00') : start;
                  const leftPct = Math.max(0, Math.min(100, ((start - FY_START) / FY_SPAN) * 100));
                  const widthPct = Math.max(1, Math.min(100 - leftPct, ((end - start) / FY_SPAN) * 100));
                  const statusColor = a.status === 'done' ? '#10b981' : a.status === 'in_progress' ? '#3b82f6' : '#9ca3af';
                  return (
                    <div key={a.id} style={{ position: 'relative', height: 22, marginLeft: 160, marginBottom: 2 }}>
                      <div style={{
                        position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`,
                        height: 16, top: 3, borderRadius: 3, background: statusColor, opacity: 0.85,
                        minWidth: 6,
                      }} title={`${lang === 'en' ? (a.name_en || a.name) : a.name} (${a.startDate} \u2192 ${a.endDate || '?'})`} />
                      <div style={{ position: 'absolute', left: 0, top: 2, marginLeft: -158, width: 150, fontSize: 10, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lang === 'en' ? (a.name_en || a.name) : a.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {/* Today line */}
            <div style={{
              position: 'absolute', left: `calc(160px + ${todayPct}%)`, top: 0, bottom: 0,
              width: 2, background: '#dc2626', zIndex: 10, pointerEvents: 'none',
            }}>
              <div style={{ position: 'absolute', top: -2, left: -14, fontSize: 9, color: '#dc2626', fontWeight: 700, whiteSpace: 'nowrap' }}>{t.today}</div>
            </div>
          </div>
        </div>

        {/* Section 5 — Detailed Plan by Partner */}
        <div className="pr-section pr-page-break" style={S.section}>
          <div style={S.sectionTitle}>{t.detailByPartner}</div>
          {partners.filter(p => activities.some(a => a.partnerId === p.id)).map(p => {
            const pActs = activities.filter(a => a.partnerId === p.id);
            const pDone = pActs.filter(a => a.status === 'done');
            const pIP = pActs.filter(a => a.status === 'in_progress');
            const pNS = pActs.filter(a => a.status === 'not_started');
            return (
              <div key={p.id} style={{ ...S.partnerGroup, marginBottom: 28 }}>
                <div style={{ ...S.partnerName, fontSize: 15, borderBottom: `2px solid ${p.color}`, paddingBottom: 4, marginBottom: 10 }}>
                  <span style={S.partnerDot(p.color)} />
                  {p.name}
                  <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12, marginLeft: 4 }}>{'\u2014'} {pActs.length} {t.activities}</span>
                </div>
                {pDone.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>{t.completedAct} ({pDone.length})</div>
                    {renderActivityTable(pDone, false)}
                  </div>
                )}
                {pIP.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', marginBottom: 4 }}>{t.inProgressAct} ({pIP.length})</div>
                    {renderActivityTable(pIP, true)}
                  </div>
                )}
                {pNS.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 4 }}>{t.plannedAct} ({pNS.length})</div>
                    {renderActivityTable(pNS, true)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* PART C: BUDGET & ANALYTICS                                         */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <div className="pr-page-break" style={S.partDivider('#7c2d12')}>{t.partC}</div>

        {/* Section 6 — Budget by Partner */}
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
                  <td style={S.td}><span style={{ ...S.partnerDot(r.color), marginRight: 8 }} />{r.name}</td>
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

        {/* Section 7 — Risk Matrix */}
        <div className="pr-section" style={S.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: 6, marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.riskMatrix}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { key: 'on-track', color: '#16a34a', bg: '#dcfce7', label: 'onTrack' },
                { key: 'at-risk', color: '#d97706', bg: '#fef3c7', label: 'atRisk' },
                { key: 'critical', color: '#dc2626', bg: '#fee2e2', label: 'critical' },
              ].map(s => (
                <span key={s.key} style={S.badge(s.bg, s.color)}>
                  {riskMatrix.filter(g => g.status === s.key).length} {t[s.label]}
                </span>
              ))}
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
                const sty = { 'on-track': { bg: '#dcfce7', color: '#16a34a' }, 'at-risk': { bg: '#fef3c7', color: '#d97706' }, 'critical': { bg: '#fee2e2', color: '#dc2626' } }[g.status];
                const sLabel = { 'on-track': t.onTrack, 'at-risk': t.atRisk, 'critical': t.critical }[g.status];
                const rawPct = Math.round(g.progressPct * 100);
                const timeAdj = Math.round(g.timeAdjustedPct * 100);
                const femPct = g.femaleRatio !== null ? Math.round(g.femaleRatio * 100) : null;
                return (
                  <tr key={g.code}>
                    <td style={S.td}><span style={S.badge(sty.bg, sty.color)}>{sLabel}</span></td>
                    <td style={S.td}><strong>{g.code}</strong><br /><span style={{ fontSize: 11, color: '#64748b' }}>{g.label}</span></td>
                    <td style={S.tdR}>{fmtNum(g.targetVietnam)}</td>
                    <td style={S.tdR}>{fmtNum(g.actual)}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ ...S.progressWrap, flex: 1 }}><div style={S.progressFill(rawPct, sty.color)} /></div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: sty.color }}>{rawPct}%</span>
                      </div>
                    </td>
                    <td style={{ ...S.tdR, fontWeight: 600 }}>{timeAdj}%</td>
                    <td style={{ ...S.tdR, fontWeight: 600, color: femPct !== null && femPct >= 50 ? '#16a34a' : femPct !== null ? '#dc2626' : '#94a3b8' }}>
                      {femPct !== null ? `${femPct}%` : '\u2014'}
                    </td>
                    <td style={S.td}>{g.leadPartner}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Section 8 — Partner Scorecard */}
        <div className="pr-section pr-page-break" style={S.section}>
          <div style={S.sectionTitle}>{t.partnerScorecard}</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>{t.partner}</th>
                <th style={S.thR}>{t.budget}</th>
                <th style={S.th}>{t.burnPct}</th>
                <th style={S.thR}>{t.activities}</th>
                <th style={S.thR}>{t.indicators}</th>
                <th style={S.thR}>{t.reached}</th>
                <th style={S.thR}>{t.femalePct}</th>
                <th style={S.th}>{t.health}</th>
              </tr>
            </thead>
            <tbody>
              {partnerScorecard.map(p => {
                const hStyle = { healthy: { bg: '#dcfce7', color: '#16a34a' }, watch: { bg: '#fef3c7', color: '#d97706' }, 'at-risk': { bg: '#fee2e2', color: '#dc2626' }, 'not-allocated': { bg: '#f3f4f6', color: '#9ca3af' } }[p.healthLabel];
                const hText = { healthy: t.healthy, watch: t.watch, 'at-risk': t.atRisk, 'not-allocated': t.notAllocated }[p.healthLabel];
                const femPct = p.femaleRatio !== null ? Math.round(p.femaleRatio * 100) : null;
                const bPct = p.allocated > 0 ? `${Math.round((p.spent / p.allocated) * 100)}%` : '\u2014';
                return (
                  <tr key={p.id}>
                    <td style={S.td}><span style={{ ...S.partnerDot(p.color), marginRight: 8 }} /><strong>{p.name}</strong></td>
                    <td style={S.tdR}>{p.allocated ? fmtNum(p.allocated) : '\u2014'}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ ...S.progressWrap, width: 60 }}><div style={S.progressFill(p.allocated > 0 ? (p.spent / p.allocated * 100) : 0, burnColor(p.allocated > 0 ? Math.round(p.spent / p.allocated * 100) : 0))} /></div>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{bPct}</span>
                      </div>
                    </td>
                    <td style={S.tdR}>{p.doneCount} / {p.activityCount}</td>
                    <td style={S.tdR}>{p.indCount}</td>
                    <td style={S.tdR}>{p.totalReach > 0 ? fmtNum(p.totalReach) : '\u2014'}</td>
                    <td style={{ ...S.tdR, fontWeight: 600, color: femPct !== null && femPct >= 50 ? '#16a34a' : femPct !== null ? '#dc2626' : '#94a3b8' }}>
                      {femPct !== null ? `${femPct}%` : '\u2014'}
                    </td>
                    <td style={S.td}><span style={S.badge(hStyle.bg, hStyle.color)}>{hText}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Section 9 — Forecast & Alerts */}
        <div className="pr-section pr-page-break" style={S.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: 6, marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.forecastAlerts}</div>
            <span style={S.badge('#dbeafe', '#2563eb')}>{Math.round(timeElapsed * 100)}% {t.fyElapsed}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* Budget projection */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>{t.projectedEOY}</div>
              <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
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

            {/* Required pace */}
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
                    const fStyle = { achievable: { bg: '#dcfce7', color: '#16a34a' }, tight: { bg: '#fef3c7', color: '#d97706' }, unrealistic: { bg: '#fee2e2', color: '#dc2626' } }[g.feasibility];
                    const fText = { achievable: t.achievable, tight: t.tight, unrealistic: t.unrealistic }[g.feasibility];
                    return (
                      <tr key={g.code}>
                        <td style={{ ...S.td, fontWeight: 600 }}>{g.code}</td>
                        <td style={S.tdR}>{fmtNum(g.remaining)}</td>
                        <td style={S.tdR}>{fmtNum(g.neededPerQ)}</td>
                        <td style={S.td}><span style={S.badge(fStyle.bg, fStyle.color)}>{fText}</span></td>
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
                  critical: { border: '#fca5a5', bg: '#fef2f2', icon: '\u25cf', color: '#dc2626' },
                  warning: { border: '#fcd34d', bg: '#fffbeb', icon: '\u25b2', color: '#d97706' },
                  info: { border: '#93c5fd', bg: '#eff6ff', icon: '\u25c6', color: '#2563eb' },
                }[alert.severity];
                return (
                  <div key={i} style={{ padding: '10px 14px', marginBottom: 8, borderRadius: 6, borderLeft: `4px solid ${aStyle.border}`, background: aStyle.bg }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: aStyle.color }}>
                      <span style={{ marginRight: 6 }}>{aStyle.icon}</span>{alert.title}
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
