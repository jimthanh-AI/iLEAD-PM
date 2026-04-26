/**
 * insights.js — Layer 3 Rule Engine
 * Computed logic for Risk Matrix, Partner Scorecard, Forecast.
 * All functions are pure (no side effects). Feed data from DataContext.
 *
 * Project period: 2025-10-01 → 2026-09-30
 */

import { INDICATOR_GROUPS } from './constants';

const PROJECT_START = new Date('2025-10-01T00:00:00');
const PROJECT_END   = new Date('2026-09-30T23:59:59');

// ── Time helpers ──────────────────────────────────────────────────────────────

export function computeTimeElapsed(today = new Date()) {
  const total   = PROJECT_END - PROJECT_START;
  const elapsed = Math.max(0, Math.min(today - PROJECT_START, total));
  return elapsed / total;
}

/** Format timeElapsed as a human-readable string e.g. "57%" */
export function fmtElapsed(te) {
  return `${Math.round(te * 100)}%`;
}

// ── Module A — Indicator Risk Matrix ─────────────────────────────────────────

/**
 * Aggregate melEntries per INDICATOR_GROUP — consistent with MEL Entries page.
 * actual = sum of all quarterly (m + f) values.
 * femaleRatio = total_f / total (m+f).
 *
 * Returns array of group objects with computed fields.
 */
export function computeRiskMatrix({ melEntries, partnerMap }) {
  const timeElapsed = computeTimeElapsed();

  return INDICATOR_GROUPS.map(group => {
    // MEL entries for this group
    const entries = melEntries.filter(e => e.indicatorGroup === group.code);

    // actual = total people (male + female), same as MEL Entries page
    const actual = entries.reduce((s, e) =>
      s + (e.q1_m||0) + (e.q1_f||0) + (e.q2_m||0) + (e.q2_f||0)
        + (e.q3_m||0) + (e.q3_f||0) + (e.q4_m||0) + (e.q4_f||0), 0);

    const totalWomen = entries.reduce((s, e) =>
      s + (e.q1_f||0) + (e.q2_f||0) + (e.q3_f||0) + (e.q4_f||0), 0);

    const femaleRatio = actual > 0 ? totalWomen / actual : null;

    // Contributing activity IDs (from entries that link to an activity)
    const activityIds = [...new Set(entries.map(e => e.activityId).filter(Boolean))];

    // Lead partner: partner with most entries
    const partnerCount = {};
    entries.forEach(e => {
      if (e.partnerId) partnerCount[e.partnerId] = (partnerCount[e.partnerId] || 0) + 1;
    });
    const leadPartnerId = Object.entries(partnerCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    const leadPartner = leadPartnerId
      ? (partnerMap[leadPartnerId]?.name ?? '—')
      : '—';

    // Progress
    const progressPct = group.targetVietnam > 0
      ? actual / group.targetVietnam
      : 0;

    // Time-adjusted %: if progressPct === timeElapsed → exactly on pace → 100%
    const timeAdjustedPct = timeElapsed > 0
      ? progressPct / timeElapsed
      : progressPct;

    // Status thresholds
    const status =
      timeAdjustedPct >= 0.8 ? 'on-track' :
      timeAdjustedPct >= 0.5 ? 'at-risk'  : 'critical';

    return {
      ...group,
      actual,
      progressPct,
      timeAdjustedPct,
      status,
      femaleRatio,
      femaleFlag: femaleRatio !== null && femaleRatio < 0.5,
      leadPartner,
      leadPartnerId,
      activityIds,
      timeElapsed,
    };
  });
}

// ── Module B — Partner Scorecard ─────────────────────────────────────────────

/**
 * Health score components:
 *   burnScore    — burn rate vs pace (1 = on pace, >1.2 = over-burn)
 *   paceScore    — (doneActivities/total) / timeElapsed
 *   genderScore  — femaleRatio >= 0.5 → 100, else proportional
 */
export function computePartnerScorecard({
  partners, partnerBudgets, activities, activityIndicators,
}) {
  const timeElapsed = computeTimeElapsed();

  return partners.map(p => {
    const budget    = partnerBudgets.find(b => b.partnerId === p.id) ?? { allocated: 0, spent: 0 };
    const allocated = budget.allocated || 0;
    const spent     = budget.spent     || 0;

    // Burn rate: (spent/allocated) relative to timeElapsed
    // 1.0 = perfectly on pace, >1 = ahead of pace (may over-burn)
    const burnRate = allocated > 0 && timeElapsed > 0
      ? (spent / allocated) / timeElapsed
      : 0;

    const partnerActs = activities.filter(a => a.partnerId === p.id);
    const doneActs    = partnerActs.filter(a => a.status === 'done');

    // Delivery pace (same idea as burnRate but for activities)
    const deliveryPace = partnerActs.length > 0 && timeElapsed > 0
      ? (doneActs.length / partnerActs.length) / timeElapsed
      : 0;

    // People reached from completed activities
    const totalReach = doneActs.reduce((s, a) => s + (a.reachTotal  || 0), 0);
    const totalWomen = doneActs.reduce((s, a) => s + (a.reachWomen  || 0), 0);
    const femaleRatio = totalReach > 0 ? totalWomen / totalReach : null;

    // Linked indicator count
    const actIds   = new Set(partnerActs.map(a => a.id));
    const indCount = activityIndicators.filter(ai => actIds.has(ai.activityId)).length;

    // Sub-scores (0–100)
    const burnScore = allocated === 0 ? 50
      : burnRate === 0 ? 40
      : burnRate >= 0.5 && burnRate <= 1.2 ? 100
      : burnRate < 0.5
        ? Math.round(burnRate / 0.5 * 80)          // slow but not alarming
        : Math.round(Math.max(0, 1 - (burnRate - 1.2) / 0.8) * 100); // over-burn penalty

    const paceScore = partnerActs.length === 0 ? 50
      : Math.round(Math.min(deliveryPace, 1.5) / 1.5 * 100);

    const genderScore = femaleRatio === null ? 50
      : femaleRatio >= 0.5 ? 100
      : Math.round(femaleRatio / 0.5 * 100);

    const healthScore = Math.round((burnScore + paceScore + genderScore) / 3);

    const healthLabel = allocated === 0 ? 'not-allocated'
      : healthScore >= 70 ? 'healthy'
      : healthScore >= 45 ? 'watch'
      : 'at-risk';

    return {
      ...p,
      allocated, spent,
      burnRate,
      deliveryPace,
      totalReach, totalWomen,
      femaleRatio,
      femaleFlag: femaleRatio !== null && femaleRatio < 0.5,
      activityCount: partnerActs.length,
      doneCount: doneActs.length,
      indCount,
      healthScore,
      healthLabel,
      timeElapsed,
    };
  });
}

// ── Module C — Forecast & Alerts ─────────────────────────────────────────────

/**
 * Accepts pre-computed riskMatrix + partnerScorecard to avoid re-running heavy loops.
 */
export function computeForecasts({ riskMatrix, partnerScorecard, partnerBudgets }) {
  const timeElapsed = computeTimeElapsed();

  // Budget totals
  const totalAllocated = partnerBudgets.reduce((s, b) => s + (b.allocated || 0), 0);
  const totalSpent     = partnerBudgets.reduce((s, b) => s + (b.spent     || 0), 0);
  const projectedSpend = timeElapsed > 0
    ? Math.round(totalSpent / timeElapsed)
    : totalSpent;
  const projectedBurnPct = totalAllocated > 0 ? projectedSpend / totalAllocated : 0;

  // Indicator forecasts
  const indicatorForecasts = riskMatrix.map(g => {
    const projectedActual = timeElapsed > 0
      ? Math.round(g.actual / timeElapsed)
      : g.actual;
    const remaining   = Math.max(0, g.targetVietnam - g.actual);
    const quartersLeft = Math.max(0.25, 4 * (1 - timeElapsed)); // approx
    const neededPerQ  = Math.round(remaining / quartersLeft);

    const feasibility =
      g.status === 'on-track' ? 'achievable' :
      g.status === 'at-risk'  ? 'tight'       : 'unrealistic';

    return { ...g, projectedActual, remaining, neededPerQ, feasibility };
  });

  // ── Rule-based alerts ────────────────────────────────────────────────────
  const alerts = [];

  // 1. Critical indicators (projected EOY < 50% target)
  indicatorForecasts
    .filter(g => g.status === 'critical' && g.actual >= 0)
    .forEach(g => {
      const projPct = g.targetVietnam > 0
        ? Math.round(g.projectedActual / g.targetVietnam * 100)
        : 0;
      alerts.push({
        severity: 'critical',
        title: `Critical: ${g.code} projected EOY = ${g.projectedActual.toLocaleString()} / ${g.targetVietnam.toLocaleString()} (${projPct}%)`,
        detail: `Tại tốc độ hiện tại sẽ thiếu ${100 - projPct}% target. Cần escalate hoặc reallocate.`,
      });
    });

  // 2. Over-burn partners (burnRate > 1.2)
  partnerScorecard
    .filter(p => p.burnRate > 1.2 && p.allocated > 0)
    .forEach(p => {
      const projTotal  = timeElapsed > 0 ? Math.round(p.spent / timeElapsed) : p.spent;
      const projPct    = Math.round(projTotal / p.allocated * 100);
      alerts.push({
        severity: 'warning',
        title: `${p.name}: budget burn projection ${projPct}% by EOY`,
        detail: `Burn rate ${Math.round(p.burnRate * 100)}% vs pace. Đề xuất review cost norm hoặc adjust scope.`,
      });
    });

  // 3. Indicators ahead of pace (opportunity)
  indicatorForecasts
    .filter(g => g.timeAdjustedPct >= 1.5 && g.actual > 0)
    .forEach(g => {
      alerts.push({
        severity: 'info',
        title: `Opportunity: ${g.code} vượt pace (${Math.round(g.timeAdjustedPct * 100)}% time-adjusted)`,
        detail: `Có thể stretch target hoặc reallocate effort sang indicators đang yếu.`,
      });
    });

  // 4. Partners with slow start (allocated but <20% burn pace, >30% FY elapsed)
  partnerScorecard
    .filter(p => p.allocated > 0 && p.burnRate < 0.2 && timeElapsed > 0.3)
    .forEach(p => {
      alerts.push({
        severity: 'info',
        title: `${p.name}: slow start — ${Math.round(p.burnRate * 100)}% burn pace`,
        detail: `${p.doneCount}/${p.activityCount} activities completed, ${Math.round(timeElapsed * 100)}% FY elapsed.`,
      });
    });

  // 5. Female ratio flag
  partnerScorecard
    .filter(p => p.femaleFlag && p.totalReach > 0)
    .forEach(p => {
      alerts.push({
        severity: 'warning',
        title: `${p.name}: female ratio ${Math.round((p.femaleRatio ?? 0) * 100)}% < 50% target`,
        detail: `${p.totalWomen} women / ${p.totalReach} total reached. Cần review activity design.`,
      });
    });

  return {
    timeElapsed,
    totalAllocated,
    totalSpent,
    projectedSpend,
    projectedBurnPct,
    indicatorForecasts,
    alerts,
  };
}
