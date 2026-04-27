// ── Shared HTML Report Generator ─────────────────────────────────────────────
// Opens a styled HTML page in a new tab — user can Ctrl+P → Save as PDF

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtCAD = (n) => {
  if (!n && n !== 0) return '—';
  return 'CAD ' + new Intl.NumberFormat('en-CA').format(n);
};

const isOverdue = (dueDate, status) =>
  dueDate && new Date(dueDate + 'T00:00:00') < new Date() && status !== 'done';

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.65;
  color: #111827;
  background: #fff;
}
.report {
  max-width: 820px;
  margin: 0 auto;
  padding: 56px 60px 72px;
}
.print-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 40px;
}
.print-btn {
  padding: 9px 22px;
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
}
.print-btn:hover { background: #374151; }
.print-btn.secondary {
  background: #fff;
  color: #374151;
  border: 1.5px solid #d1d5db;
}
.print-btn.secondary:hover { background: #f9fafb; }

.rpt-org {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 14px;
}
.rpt-rule-heavy {
  height: 2px;
  background: #111827;
  border: none;
  margin: 14px 0;
}
.rpt-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #111827;
  margin-bottom: 5px;
}
.rpt-subtitle {
  font-size: 12.5px;
  color: #6b7280;
  margin-bottom: 6px;
}
.rpt-meta {
  font-size: 11.5px;
  color: #9ca3af;
}

.rpt-summary {
  display: flex;
  gap: 0;
  margin: 32px 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}
.sum-cell {
  flex: 1;
  padding: 16px 20px;
  border-right: 1px solid #e5e7eb;
}
.sum-cell:last-child { border-right: none; }
.sum-val {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
}
.sum-label {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
  margin-top: 3px;
}

.rpt-section { margin-bottom: 36px; }
.rpt-section-hdr {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-top: 2px solid #111827;
  padding-top: 10px;
  margin-bottom: 0;
}
.rpt-section-name {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #111827;
}
.rpt-section-count {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 400;
}

.rpt-item {
  padding: 13px 0;
  border-bottom: 1px solid #f3f4f6;
}
.rpt-item:last-child { border-bottom: none; }
.rpt-item-row1 {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 4px;
}
.rpt-item-num {
  font-size: 11px;
  color: #d1d5db;
  min-width: 22px;
  flex-shrink: 0;
  font-weight: 600;
}
.rpt-item-name {
  font-size: 13.5px;
  font-weight: 600;
  flex: 1;
  color: #111827;
}
.rpt-badge {
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 20px;
  flex-shrink: 0;
  white-space: nowrap;
}
.badge-done     { background: #dcfce7; color: #15803d; }
.badge-progress { background: #dbeafe; color: #1d4ed8; }
.badge-overdue  { background: #fee2e2; color: #b91c1c; }
.badge-pending  { background: #f3f4f6; color: #6b7280; }
.badge-ns       { background: #f5f3ff; color: #7c3aed; }

.rpt-item-meta {
  font-size: 11.5px;
  color: #6b7280;
  padding-left: 32px;
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}
.rpt-item-sub {
  font-size: 11px;
  color: #9ca3af;
  padding-left: 32px;
  margin-top: 3px;
  font-style: italic;
}

.rpt-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  font-size: 12px;
}
.rpt-table th {
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ca3af;
  padding: 6px 8px;
  border-bottom: 1.5px solid #e5e7eb;
}
.rpt-table th.r { text-align: right; }
.rpt-table td {
  padding: 8px 8px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  vertical-align: top;
}
.rpt-table td.r { text-align: right; font-variant-numeric: tabular-nums; }
.rpt-table td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
.rpt-table tr:last-child td { border-bottom: none; }
.rpt-table .total-row td {
  font-weight: 700;
  border-top: 1.5px solid #e5e7eb;
  background: #f9fafb;
  padding: 8px;
}
.rpt-table .grp-hdr td {
  background: #f9fafb;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: #374151;
  padding: 7px 8px;
  border-top: 1px solid #e5e7eb;
}

.rpt-footer {
  margin-top: 56px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  color: #9ca3af;
}

@media print {
  .print-bar { display: none !important; }
  body { font-size: 11.5px; }
  .report { padding: 0; max-width: 100%; }
  .rpt-item { page-break-inside: avoid; }
  .rpt-section { page-break-inside: avoid; }
}
@page { margin: 18mm 20mm; size: A4; }
`;

function shell({ title, subtitle, period, summaryHtml, bodyHtml }) {
  const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>i-LEAD \u2014 ${title}</title>
  <style>${CSS}</style>
</head>
<body>
<div class="report">
  <div class="print-bar">
    <button class="print-btn" onclick="window.print()">&#8659; Print / Save as PDF</button>
    <button class="print-btn secondary" onclick="window.close()">Close</button>
  </div>

  <div class="rpt-org">i-LEAD Program Management &middot; Canada&ndash;Vietnam</div>
  <hr class="rpt-rule-heavy">
  <h1 class="rpt-title">${title}</h1>
  ${subtitle ? `<div class="rpt-subtitle">${subtitle}</div>` : ''}
  <div class="rpt-meta">${period ? period + '&nbsp;&nbsp;&middot;&nbsp;&nbsp;' : ''}Generated: ${genDate}</div>
  <hr class="rpt-rule-heavy">

  ${summaryHtml || ''}
  ${bodyHtml}

  <div class="rpt-footer">
    <span>i-LEAD &mdash; Canada-Vietnam Inclusive Business Development Project</span>
    <span>${genDate}</span>
  </div>
</div>
</body>
</html>`;
}

function openReport(html) {
  const w = window.open('', '_blank');
  if (!w) { alert('Pop-up bị chặn. Hãy cho phép pop-up từ trang này rồi thử lại.'); return; }
  w.document.write(html);
  w.document.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TASKS REPORT
// ─────────────────────────────────────────────────────────────────────────────
export function generateTasksReport(tasks, activities, partners) {
  const done    = tasks.filter(t => t.status === 'done').length;
  const overdue = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const pending = tasks.length - done;

  const groups = {};
  const noPartner = [];

  tasks.forEach(t => {
    const act    = activities.find(a => a.id === t.activityId);
    const partner = act ? partners.find(p => p.id === act.partnerId) : null;
    const item   = { task: t, activity: act };
    if (partner) {
      if (!groups[partner.id]) groups[partner.id] = { name: partner.name, items: [] };
      groups[partner.id].items.push(item);
    } else {
      noPartner.push(item);
    }
  });

  const sortItems = (arr) => [...arr].sort((a, b) => {
    const ao = isOverdue(a.task.dueDate, a.task.status) ? 0 : a.task.status === 'done' ? 2 : 1;
    const bo = isOverdue(b.task.dueDate, b.task.status) ? 0 : b.task.status === 'done' ? 2 : 1;
    if (ao !== bo) return ao - bo;
    return (a.task.dueDate || '').localeCompare(b.task.dueDate || '');
  });

  const renderItems = (items, startNum) => items.map((it, i) => {
    const { task: t, activity: act } = it;
    const over  = isOverdue(t.dueDate, t.status);
    const cls   = t.status === 'done' ? 'badge-done' : over ? 'badge-overdue' : 'badge-pending';
    const label = t.status === 'done' ? '&#10003; Completed' : over ? '&#9888; Overdue' : 'Pending';
    return `
      <div class="rpt-item">
        <div class="rpt-item-row1">
          <span class="rpt-item-num">${startNum + i}.</span>
          <span class="rpt-item-name">${t.name}</span>
          <span class="rpt-badge ${cls}">${label}</span>
        </div>
        <div class="rpt-item-meta">
          ${act ? `<span>&#128193; ${act.name}</span>` : '<span>&mdash; Ho&#7841;t &#273;&#7897;ng kh&aacute;c</span>'}
          ${t.assignee ? `<span>&#128100; ${t.assignee}</span>` : ''}
          ${t.dueDate  ? `<span>&#128197; ${fmt(t.dueDate)}</span>` : ''}
          ${t.author   ? `<span>&#9997; ${t.author}</span>` : ''}
        </div>
      </div>`;
  }).join('');

  let body = '';
  let counter = 1;

  Object.values(groups).forEach(({ name, items }) => {
    const sorted = sortItems(items);
    body += `
      <div class="rpt-section">
        <div class="rpt-section-hdr">
          <span class="rpt-section-name">${name}</span>
          <span class="rpt-section-count">${items.length} task${items.length !== 1 ? 's' : ''}</span>
        </div>
        ${renderItems(sorted, counter)}
      </div>`;
    counter += sorted.length;
  });

  if (noPartner.length) {
    const sorted = sortItems(noPartner);
    body += `
      <div class="rpt-section">
        <div class="rpt-section-hdr">
          <span class="rpt-section-name">Ho&#7841;t &#273;&#7897;ng kh&aacute;c / Ch&#432;a ph&acirc;n lo&#7841;i</span>
          <span class="rpt-section-count">${noPartner.length} task${noPartner.length !== 1 ? 's' : ''}</span>
        </div>
        ${renderItems(sorted, counter)}
      </div>`;
  }

  const summaryHtml = `
    <div class="rpt-summary">
      <div class="sum-cell"><div class="sum-val">${tasks.length}</div><div class="sum-label">Total Tasks</div></div>
      <div class="sum-cell"><div class="sum-val" style="color:#15803d">${done}</div><div class="sum-label">Completed</div></div>
      <div class="sum-cell"><div class="sum-val" style="color:#b91c1c">${overdue}</div><div class="sum-label">Overdue</div></div>
      <div class="sum-cell"><div class="sum-val" style="color:#6b7280">${pending}</div><div class="sum-label">Pending</div></div>
    </div>`;

  openReport(shell({
    title: 'Task Status Report',
    subtitle: 'Inclusive Business Development Project (i-LEAD)',
    period: 'FY 2025&ndash;2026',
    summaryHtml,
    bodyHtml: body,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ACTIVITIES REPORT
// ─────────────────────────────────────────────────────────────────────────────
export function generateActivitiesReport(acts, partnerMap, tasks) {
  const done       = acts.filter(a => a.status === 'done').length;
  const inProgress = acts.filter(a => a.status === 'in_progress').length;
  const overdue    = acts.filter(a => isOverdue(a.endDate, a.status)).length;

  const groups = {};
  const noPartner = [];

  acts.forEach(a => {
    const p = partnerMap[a.partnerId];
    if (p) {
      if (!groups[p.id]) groups[p.id] = { name: p.name, items: [] };
      groups[p.id].items.push(a);
    } else {
      noPartner.push(a);
    }
  });

  const renderItems = (items, startNum) => items.map((a, i) => {
    const over  = isOverdue(a.endDate, a.status);
    const cls   = a.status === 'done' ? 'badge-done'
                : over               ? 'badge-overdue'
                : a.status === 'in_progress' ? 'badge-progress'
                : 'badge-ns';
    const label = a.status === 'done'        ? '&#10003; Done'
                : over                       ? '&#9888; Overdue'
                : a.status === 'in_progress' ? 'In Progress'
                : 'Not Started';
    const actTasks = tasks.filter(t => t.activityId === a.id);
    const nextTask = actTasks
      .filter(t => t.status !== 'done' && t.dueDate)
      .sort((x, y) => x.dueDate.localeCompare(y.dueDate))[0];
    const doneCount = actTasks.filter(t => t.status === 'done').length;

    return `
      <div class="rpt-item">
        <div class="rpt-item-row1">
          <span class="rpt-item-num">${startNum + i}.</span>
          <span class="rpt-item-name">${a.name}</span>
          <span class="rpt-badge ${cls}">${label}</span>
        </div>
        <div class="rpt-item-meta">
          ${a.activityTypeCode ? `<span>Type ${a.activityTypeCode}</span>` : ''}
          ${a.stage ? `<span>Stage ${a.stage}</span>` : ''}
          ${a.startDate || a.endDate ? `<span>&#128197; ${fmt(a.startDate)} &rarr; ${fmt(a.endDate)}</span>` : ''}
          ${a.budget_planned ? `<span>${fmtCAD(a.budget_planned)} planned</span>` : ''}
          ${a.ballOwner ? `<span>&#128100; ${a.ballOwner}</span>` : ''}
          ${actTasks.length ? `<span>${doneCount}/${actTasks.length} tasks done</span>` : ''}
        </div>
        ${nextTask ? `<div class="rpt-item-sub">&rarr; Next: ${nextTask.name} (${fmt(nextTask.dueDate)})</div>` : ''}
        ${a.nextAction ? `<div class="rpt-item-sub">&#9873; ${a.nextAction}</div>` : ''}
      </div>`;
  }).join('');

  let body = '';
  let counter = 1;

  Object.values(groups).forEach(({ name, items }) => {
    body += `
      <div class="rpt-section">
        <div class="rpt-section-hdr">
          <span class="rpt-section-name">${name}</span>
          <span class="rpt-section-count">${items.length} activit${items.length !== 1 ? 'ies' : 'y'}</span>
        </div>
        ${renderItems(items, counter)}
      </div>`;
    counter += items.length;
  });

  if (noPartner.length) {
    body += `
      <div class="rpt-section">
        <div class="rpt-section-hdr">
          <span class="rpt-section-name">No Partner Assigned</span>
          <span class="rpt-section-count">${noPartner.length} activit${noPartner.length !== 1 ? 'ies' : 'y'}</span>
        </div>
        ${renderItems(noPartner, counter)}
      </div>`;
  }

  const summaryHtml = `
    <div class="rpt-summary">
      <div class="sum-cell"><div class="sum-val">${acts.length}</div><div class="sum-label">Total</div></div>
      <div class="sum-cell"><div class="sum-val" style="color:#15803d">${done}</div><div class="sum-label">Done</div></div>
      <div class="sum-cell"><div class="sum-val" style="color:#1d4ed8">${inProgress}</div><div class="sum-label">In Progress</div></div>
      <div class="sum-cell"><div class="sum-val" style="color:#b91c1c">${overdue}</div><div class="sum-label">Overdue</div></div>
    </div>`;

  openReport(shell({
    title: 'Activity Progress Report',
    subtitle: 'Inclusive Business Development Project (i-LEAD)',
    period: 'FY 2025&ndash;2026',
    summaryHtml,
    bodyHtml: body,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. TIMELINE REPORT
// ─────────────────────────────────────────────────────────────────────────────
export function generateTimelineReport(visible, partners, rangeLabel) {
  const sorted = [...visible].sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  const done       = sorted.filter(a => a.status === 'done').length;
  const inProgress = sorted.filter(a => a.status === 'in_progress').length;
  const overdue    = sorted.filter(a => isOverdue(a.endDate, a.status)).length;

  const items = sorted.map((a, i) => {
    const p    = partners.find(x => x.id === a.partnerId);
    const over = isOverdue(a.endDate, a.status);
    const cls  = a.status === 'done'        ? 'badge-done'
               : over                       ? 'badge-overdue'
               : a.status === 'in_progress' ? 'badge-progress'
               : 'badge-ns';
    const label = a.status === 'done'        ? '&#10003; Done'
                : over                       ? '&#9888; Overdue'
                : a.status === 'in_progress' ? 'In Progress'
                : 'Not Started';
    const s = a.startDate ? new Date(a.startDate + 'T00:00:00') : null;
    const e = a.endDate   ? new Date(a.endDate   + 'T00:00:00') : null;
    const days = s && e ? Math.round((e - s) / 86400000) + 1 : null;

    return `
      <div class="rpt-item">
        <div class="rpt-item-row1">
          <span class="rpt-item-num">${i + 1}.</span>
          <span class="rpt-item-name">${a.name}</span>
          <span class="rpt-badge ${cls}">${label}</span>
        </div>
        <div class="rpt-item-meta">
          ${p ? `<span>&#127962; ${p.name}</span>` : ''}
          ${a.activityTypeCode ? `<span>Type ${a.activityTypeCode}</span>` : ''}
          ${a.stage ? `<span>Stage ${a.stage}</span>` : ''}
          ${a.startDate || a.endDate ? `<span>&#128197; ${fmt(a.startDate)} &rarr; ${fmt(a.endDate)}${days ? ' (' + days + ' days)' : ''}</span>` : ''}
          ${a.ballOwner ? `<span>&#128100; ${a.ballOwner}</span>` : ''}
        </div>
      </div>`;
  }).join('');

  const summaryHtml = `
    <div class="rpt-summary">
      <div class="sum-cell"><div class="sum-val">${sorted.length}</div><div class="sum-label">Activities</div></div>
      <div class="sum-cell"><div class="sum-val" style="color:#15803d">${done}</div><div class="sum-label">Done</div></div>
      <div class="sum-cell"><div class="sum-val" style="color:#1d4ed8">${inProgress}</div><div class="sum-label">In Progress</div></div>
      <div class="sum-cell"><div class="sum-val" style="color:#b91c1c">${overdue}</div><div class="sum-label">Overdue</div></div>
    </div>`;

  openReport(shell({
    title: 'Timeline Report',
    subtitle: `Period: ${rangeLabel}`,
    period: 'FY 2025&ndash;2026',
    summaryHtml,
    bodyHtml: `
      <div class="rpt-section">
        <div class="rpt-section-hdr">
          <span class="rpt-section-name">Activities in View</span>
          <span class="rpt-section-count">${sorted.length} activities &middot; sorted by start date</span>
        </div>
        ${items}
      </div>`,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. MEL REPORT (Dashboard + Entries)
// ─────────────────────────────────────────────────────────────────────────────
export function generateMELReport({ indicatorStats, partners, partnerBudgets, melEntries, activityMap, partnerMap }) {
  const totalTarget = indicatorStats.reduce((s, g) => s + g.targetVietnam, 0);
  const totalActual = indicatorStats.reduce((s, g) => s + g.actual, 0);
  const totalFemale = indicatorStats.reduce((s, g) => s + g.female, 0);
  const overallPct  = totalTarget > 0 ? (totalActual / totalTarget * 100).toFixed(1) : 0;
  const femalePct   = totalActual > 0 ? (totalFemale / totalActual * 100).toFixed(1) : 0;

  const totalAllocated = partners.reduce((s, p) => {
    const b = partnerBudgets.find(pb => pb.partnerId === p.id);
    return s + (b?.allocated || 0);
  }, 0);
  const totalSpent = partners.reduce((s, p) => {
    const b = partnerBudgets.find(pb => pb.partnerId === p.id);
    return s + (b?.spent || 0);
  }, 0);

  // Indicator table rows
  const indRows = indicatorStats.map(g => {
    const pct   = g.targetVietnam > 0 ? (g.actual / g.targetVietnam * 100).toFixed(0) : 0;
    const fp    = g.actual > 0 ? (g.female / g.actual * 100).toFixed(0) + '%' : '&mdash;';
    const color = +pct >= 100 ? '#15803d' : +pct >= 50 ? '#1d4ed8' : '#b91c1c';
    return `<tr>
      <td><strong>${g.code}</strong></td>
      <td style="font-size:11px">${g.label}</td>
      <td class="r">${g.targetVietnam.toLocaleString()}</td>
      <td class="r">${g.actual.toLocaleString()}</td>
      <td class="r" style="color:${color};font-weight:700">${pct}%</td>
      <td class="r">${fp}</td>
    </tr>`;
  }).join('');

  // Budget table rows
  const budRows = partners.map(p => {
    const b   = partnerBudgets.find(pb => pb.partnerId === p.id) || { allocated: 0, spent: 0 };
    const rem = (b.allocated || 0) - (b.spent || 0);
    const pct = b.allocated > 0 ? ((b.spent / b.allocated) * 100).toFixed(0) + '%' : '&mdash;';
    return `<tr>
      <td>${p.name}</td>
      <td class="r">${fmtCAD(b.allocated || 0)}</td>
      <td class="r">${fmtCAD(b.spent || 0)}</td>
      <td class="r" style="color:${rem < 0 ? '#b91c1c' : '#374151'}">${fmtCAD(rem)}</td>
      <td class="r">${pct}</td>
    </tr>`;
  }).join('');

  // MEL entries grouped by indicator code
  const entryMap = {};
  melEntries.forEach(e => {
    if (!entryMap[e.indicatorGroup]) entryMap[e.indicatorGroup] = [];
    entryMap[e.indicatorGroup].push(e);
  });

  const entryRows = Object.entries(entryMap).map(([code, entries]) => {
    const grpRows = entries.map(e => {
      const p     = partnerMap[e.partnerId];
      const a     = activityMap[e.activityId];
      const total = (e.q1_m||0)+(e.q1_f||0)+(e.q2_m||0)+(e.q2_f||0)+(e.q3_m||0)+(e.q3_f||0)+(e.q4_m||0)+(e.q4_f||0);
      const f     = (e.q1_f||0)+(e.q2_f||0)+(e.q3_f||0)+(e.q4_f||0);
      const fp    = total > 0 ? (f / total * 100).toFixed(0) + '%' : '&mdash;';
      return `<tr>
        <td>${e.subCode}</td>
        <td>${p?.name || '&mdash;'}</td>
        <td style="font-size:11px">${a?.name || e.description || '&mdash;'}</td>
        <td class="r">${e.q1_f||0}/${e.q1_m||0}</td>
        <td class="r">${e.q2_f||0}/${e.q2_m||0}</td>
        <td class="r">${e.q3_f||0}/${e.q3_m||0}</td>
        <td class="r">${e.q4_f||0}/${e.q4_m||0}</td>
        <td class="num">${total.toLocaleString()}</td>
        <td class="r">${fp}</td>
      </tr>`;
    }).join('');
    const grpTotal = entries.reduce((s, e) =>
      s + (e.q1_m||0)+(e.q1_f||0)+(e.q2_m||0)+(e.q2_f||0)+(e.q3_m||0)+(e.q3_f||0)+(e.q4_m||0)+(e.q4_f||0), 0);
    return `
      <tr class="grp-hdr"><td colspan="9">${code}</td></tr>
      ${grpRows}
      <tr class="total-row">
        <td colspan="7" style="text-align:right;font-size:11px">Subtotal ${code}</td>
        <td class="num">${grpTotal.toLocaleString()}</td>
        <td></td>
      </tr>`;
  }).join('');

  const summaryHtml = `
    <div class="rpt-summary">
      <div class="sum-cell"><div class="sum-val">${overallPct}%</div><div class="sum-label">Overall Progress</div></div>
      <div class="sum-cell"><div class="sum-val">${totalActual.toLocaleString()}</div><div class="sum-label">Actual Reached</div></div>
      <div class="sum-cell"><div class="sum-val">${totalTarget.toLocaleString()}</div><div class="sum-label">Target (VN)</div></div>
      <div class="sum-cell"><div class="sum-val" style="color:#db2777">${femalePct}%</div><div class="sum-label">Female Ratio</div></div>
    </div>`;

  const body = `
    <div class="rpt-section">
      <div class="rpt-section-hdr">
        <span class="rpt-section-name">Indicator Progress</span>
      </div>
      <table class="rpt-table">
        <thead><tr>
          <th>Code</th><th>Indicator</th>
          <th class="r">Target VN</th><th class="r">Actual</th>
          <th class="r">Progress</th><th class="r">Female %</th>
        </tr></thead>
        <tbody>${indRows}</tbody>
        <tfoot><tr class="total-row">
          <td colspan="2"><strong>TOTAL</strong></td>
          <td class="r"><strong>${totalTarget.toLocaleString()}</strong></td>
          <td class="r"><strong>${totalActual.toLocaleString()}</strong></td>
          <td class="r"><strong>${overallPct}%</strong></td>
          <td class="r"><strong>${femalePct}%</strong></td>
        </tr></tfoot>
      </table>
    </div>

    <div class="rpt-section">
      <div class="rpt-section-hdr">
        <span class="rpt-section-name">Budget by Partner</span>
      </div>
      <table class="rpt-table">
        <thead><tr>
          <th>Partner</th><th class="r">Allocated</th>
          <th class="r">Spent</th><th class="r">Remaining</th><th class="r">Burn %</th>
        </tr></thead>
        <tbody>${budRows}</tbody>
        <tfoot><tr class="total-row">
          <td><strong>TOTAL</strong></td>
          <td class="r"><strong>${fmtCAD(totalAllocated)}</strong></td>
          <td class="r"><strong>${fmtCAD(totalSpent)}</strong></td>
          <td class="r"><strong>${fmtCAD(totalAllocated - totalSpent)}</strong></td>
          <td class="r"><strong>${totalAllocated > 0 ? (totalSpent / totalAllocated * 100).toFixed(0) + '%' : '&mdash;'}</strong></td>
        </tr></tfoot>
      </table>
    </div>

    <div class="rpt-section">
      <div class="rpt-section-hdr">
        <span class="rpt-section-name">MEL Entries Detail</span>
        <span class="rpt-section-count">Quarterly breakdown &middot; F = Female / M = Male</span>
      </div>
      <table class="rpt-table">
        <thead><tr>
          <th>Sub-code</th><th>Partner</th><th>Activity / Description</th>
          <th class="r">Q1 F/M</th><th class="r">Q2 F/M</th>
          <th class="r">Q3 F/M</th><th class="r">Q4 F/M</th>
          <th class="r">Total</th><th class="r">Female%</th>
        </tr></thead>
        <tbody>${entryRows || '<tr><td colspan="9" style="text-align:center;color:#9ca3af;padding:24px">No MEL entries recorded</td></tr>'}</tbody>
      </table>
    </div>`;

  openReport(shell({
    title: 'MEL Progress Report',
    subtitle: 'Monitoring, Evaluation &amp; Learning &mdash; i-LEAD Vietnam',
    period: 'FY 2025&ndash;2026',
    summaryHtml,
    bodyHtml: body,
  }));
}
