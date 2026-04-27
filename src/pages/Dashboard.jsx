import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
  STATUS_LABELS, STATUS_CSS, STAGES, STAGE_LABELS, STAGE_COLORS,
  ACTIVITY_TYPES, ACTIVITY_TYPE_MAP, INDICATOR_GROUPS, daysLeft, fmtDate, guessPrio,
} from '../utils/constants';
import './Dashboard.css';

const PRIO_CLASS = { urgent:'pU', high:'pH', medium:'pM', low:'pL' };

const Dashboard = () => {
  const nav = useNavigate();
  const { activities, partners, tasks, partnerMap, melEntries, partnerBudgets } = useData();

  // ── KPI totals ────────────────────────────────────────────────
  const total  = activities.length;
  const done   = activities.filter(a => a.status === 'done').length;
  const inp    = activities.filter(a => a.status === 'in_progress').length;
  const notst  = activities.filter(a => a.status === 'not_started').length;
  const over   = activities.filter(a => a.endDate && daysLeft(a.endDate) < 0 && a.status !== 'done').length;
  const pct    = total ? Math.round(done / total * 100) : 0;

  const totalReach  = activities.reduce((s, a) => s + (Number(a.reachTotal)  || 0), 0);
  const totalWomen  = activities.reduce((s, a) => s + (Number(a.reachWomen) || 0), 0);
  const pctWomen    = totalReach > 0 ? Math.round((totalWomen / totalReach) * 100) : 0;

  // ── Budget ────────────────────────────────────────────────────
  // Source of truth: partnerBudgets (high-level GAC allocation per partner).
  // Falls back to summing activity-level budgets if partnerBudgets is empty.
  const partnerBudgetKH = (partnerBudgets || []).reduce((s, b) => s + (Number(b.allocated) || 0), 0);
  const partnerBudgetTT = (partnerBudgets || []).reduce((s, b) => s + (Number(b.spent)     || 0), 0);
  const actBudgetKH     = activities.reduce((s, a) => s + (Number(a.budget_planned) || 0), 0);
  const actBudgetTT     = activities.reduce((s, a) => s + (Number(a.budget_actual)  || 0), 0);
  const totalBudgetKH   = partnerBudgetKH > 0 ? partnerBudgetKH : actBudgetKH;
  const totalBudgetTT   = partnerBudgetKH > 0 ? partnerBudgetTT : actBudgetTT;
  const burnRate        = totalBudgetKH > 0 ? Math.round((totalBudgetTT / totalBudgetKH) * 100) : 0;
  const hasBudget       = totalBudgetKH > 0;
  const fmtCad          = (n) => n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n}`;

  // ── Stage distribution ────────────────────────────────────────
  const stageCount = {};
  STAGES.forEach(s => { stageCount[s] = 0; });
  activities.forEach(a => { if (a.stage) stageCount[a.stage] = (stageCount[a.stage] || 0) + 1; });
  const maxStageCount = Math.max(...Object.values(stageCount), 1);
  const stagedTotal = Object.values(stageCount).reduce((s, n) => s + n, 0);
  const unstagedTotal = total - stagedTotal;

  // ── Reach by partner ──────────────────────────────────────────
  const reachByPartner = partners.map(p => {
    const acts  = activities.filter(a => a.partnerId === p.id);
    const reach = acts.reduce((s, a) => s + (Number(a.reachTotal) || 0), 0);
    const women = acts.reduce((s, a) => s + (Number(a.reachWomen) || 0), 0);
    return { p, acts, reach, women };
  }).filter(x => x.acts.length);

  // ── Reach by activity type ────────────────────────────────────
  const reachByType = ACTIVITY_TYPES.map(t => {
    const acts  = activities.filter(a => a.activityTypeCode === t.code);
    const reach = acts.reduce((s, a) => s + (Number(a.reachTotal) || 0), 0);
    const count = acts.length;
    return { t, count, reach };
  }).filter(x => x.count > 0);

  const maxReachPartner = Math.max(...reachByPartner.map(x => x.reach), 1);
  const maxReachType    = Math.max(...reachByType.map(x => x.reach), 1);

  // ── Partner summary ───────────────────────────────────────────
  const partnerSummary = partners.map(p => {
    const acts   = activities.filter(a => a.partnerId === p.id);
    const pdone  = acts.filter(a => a.status === 'done').length;
    const ppct   = acts.length ? Math.round(pdone / acts.length * 100) : 0;
    const reach  = acts.reduce((s, a) => s + (Number(a.reachTotal) || 0), 0);
    const budget = acts.reduce((s, a) => s + (Number(a.budget_planned) || 0), 0);
    const stageCounts = {};
    STAGES.forEach(s => { stageCounts[s] = 0; });
    acts.forEach(a => { if (a.stage) stageCounts[a.stage]++; });
    const topStage = STAGES.slice().reverse().find(s => stageCounts[s] > 0) || '—';
    return { p, acts, pdone, ppct, reach, budget, topStage };
  }).filter(x => x.acts.length);

  // ── Follow-up (merged) ────────────────────────────────────────
  // Non-done activities that have at least one open task with a dueDate.
  // Sorted by nearest open task deadline ascending.
  const followUp = activities
    .filter(a => a.status !== 'done')
    .map(a => {
      const openTasks = tasks
        .filter(t => t.activityId === a.id && t.status !== 'done' && t.dueDate)
        .sort((x, y) => x.dueDate.localeCompare(y.dueDate));
      if (!openTasks.length) return null;
      return { ...a, _nearestTask: openTasks[0] };
    })
    .filter(Boolean)
    .sort((a, b) => a._nearestTask.dueDate.localeCompare(b._nearestTask.dueDate))
    .slice(0, 8);

  const dlStr = (endDate) => {
    const dl = daysLeft(endDate);
    if (dl === null) return '—';
    if (dl < 0)  return <span style={{color:'var(--red)'}}>+{-dl}d</span>;
    if (dl === 0) return <span style={{color:'var(--orange)'}}>Hôm nay</span>;
    if (dl <= 3)  return <span style={{color:'var(--orange)'}}>{dl}d</span>;
    return fmtDate(endDate);
  };

  const ActRow = ({ a }) => {
    const pa = partnerMap[a.partnerId];
    const taskDue = a._nearestTask?.dueDate;
    const taskName = a._nearestTask?.name;
    const deadlineDate = taskDue || a.endDate;
    return (
      <div className="tbl-row act-tbl-row" onClick={() => nav(`/activity/${a.id}`)}>
        <div className={`prio-dot ${PRIO_CLASS[guessPrio(deadlineDate)]}`}></div>
        <div>
          <div className="cell-name">{a.name}</div>
          {taskName && <div className="cell-next">→ {taskName}</div>}
        </div>
        <span className="cell-tag" style={{color: pa?.color}}>{pa?.name || '—'}</span>
        <span className={`cell-tag stage-${a.stage}`}>{a.stage}</span>
        <span className="cell-small">{a.ballOwner || '—'}</span>
        <span className="cell-mono">{dlStr(deadlineDate)}</span>
      </div>
    );
  };

  // ── MEL Summary ───────────────────────────────────────────────
  const melTotalTarget  = INDICATOR_GROUPS.reduce((s, g) => s + g.targetVietnam, 0);
  const melTotalActual  = melEntries.reduce((s, e) => {
    const m = (e.q1_m||0)+(e.q2_m||0)+(e.q3_m||0)+(e.q4_m||0);
    const f = (e.q1_f||0)+(e.q2_f||0)+(e.q3_f||0)+(e.q4_f||0);
    return s + m + f;
  }, 0);
  const melPct = melTotalTarget > 0 ? Math.round(melTotalActual / melTotalTarget * 100) : 0;
  const melTotalAllocated = partnerBudgets.reduce((s, b) => s + (b.allocated || 0), 0);
  const melTotalSpent     = partnerBudgets.reduce((s, b) => s + (b.spent    || 0), 0);
  const melRemainPct = melTotalAllocated > 0 ? Math.round((melTotalAllocated - melTotalSpent) / melTotalAllocated * 100) : 0;

  const today = new Date().toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });

  // ── Project Timeline ──────────────────────────────────────────
  const PROJECT_START  = new Date('2025-04-30');
  const PROJECT_END    = new Date('2027-12-31');
  const now            = new Date();
  const totalDays      = (PROJECT_END - PROJECT_START) / 86400000;
  const elapsedDays    = Math.max(0, Math.min(totalDays, (now - PROJECT_START) / 86400000));
  const timeElapsedPct = Math.round(elapsedDays / totalDays * 100);
  const totalMonths    = Math.round(totalDays / 30.44); // ≈32
  const monthsElapsed  = Math.min(totalMonths, Math.floor(elapsedDays / 30.44) + 1);
  const daysRemaining  = Math.max(0, Math.ceil((PROJECT_END - now) / 86400000));

  // ── Reach Projection ─────────────────────────────────────────
  const doneActivities   = activities.filter(a => a.status === 'done');
  const doneReach        = doneActivities.reduce((s, a) => s + (Number(a.reachTotal) || 0), 0);
  const avgReachPerDone  = doneActivities.length > 0 ? doneReach / doneActivities.length : 0;
  const projectedReach   = total > 0 ? Math.round(avgReachPerDone * total) : 0;
  const reachGapPct      = melTotalTarget > 0 ? Math.round(projectedReach / melTotalTarget * 100) : 0;

  // ── RAG status helpers ────────────────────────────────────────
  // Timeline health: activities done % vs time elapsed %
  const actDonePct   = total > 0 ? Math.round(done / total * 100) : 0;
  const timelineRag  = actDonePct >= timeElapsedPct - 10 ? 'green' : actDonePct >= timeElapsedPct - 25 ? 'orange' : 'red';
  // Budget health: burn rate vs time elapsed (underspend risk for GAC)
  const budgetRag    = burnRate > timeElapsedPct + 20 ? 'red' : burnRate < timeElapsedPct - 30 ? 'orange' : 'green';
  // Reach health: projected vs target
  const reachRag     = reachGapPct >= 80 ? 'green' : reachGapPct >= 50 ? 'orange' : 'red';
  // Gender health
  const genderRag    = pctWomen >= 50 ? 'green' : pctWomen >= 40 ? 'orange' : 'red';

  return (
    <div className="dashboard animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">iLEAD Dashboard</h1>
        <p className="page-meta">{today}</p>
      </div>

      {/* ── Project Health Bar ── */}
      <div className="proj-health-bar">
        {/* Timeline */}
        <div className="proj-health-item">
          <div className="phb-label">Tiến độ dự án</div>
          <div className="phb-main">
            <span className="phb-val">Tháng {monthsElapsed}/{totalMonths}</span>
            <span className="phb-badge" style={{ background: `var(--${timelineRag}-bg,var(--bg2))`, color: `var(--${timelineRag})` }}>
              {timelineRag === 'green' ? 'Đúng tiến độ' : timelineRag === 'orange' ? 'Hơi chậm' : 'Chậm'}
            </span>
          </div>
          <div className="phb-track">
            <div className="phb-fill" style={{ width:`${timeElapsedPct}%`, background:'var(--text3)', opacity:0.3 }} />
            <div className="phb-fill phb-fill-acts" style={{ width:`${actDonePct}%`, background:`var(--${timelineRag})` }} />
          </div>
          <div className="phb-sub">{timeElapsedPct}% thời gian · {actDonePct}% HĐ xong · còn {daysRemaining} ngày</div>
        </div>

        {/* Reach projection */}
        <div className="proj-health-item">
          <div className="phb-label">Dự báo Reach</div>
          <div className="phb-main">
            <span className="phb-val">{projectedReach > 0 ? projectedReach.toLocaleString() : '—'}</span>
            <span className="phb-badge" style={{ background:`var(--${reachRag}-bg,var(--bg2))`, color:`var(--${reachRag})` }}>
              {reachGapPct}% target
            </span>
          </div>
          <div className="phb-track">
            <div className="phb-fill" style={{ width:`${Math.min(reachGapPct,100)}%`, background:`var(--${reachRag})` }} />
          </div>
          <div className="phb-sub">Target GAC: {melTotalTarget.toLocaleString()} · avg {Math.round(avgReachPerDone)} người/HĐ</div>
        </div>

        {/* Budget */}
        {hasBudget && (
          <div className="proj-health-item">
            <div className="phb-label">Ngân sách</div>
            <div className="phb-main">
              <span className="phb-val">{burnRate}% đã dùng</span>
              <span className="phb-badge" style={{ background:`var(--${budgetRag}-bg,var(--bg2))`, color:`var(--${budgetRag})` }}>
                {burnRate < timeElapsedPct - 30 ? 'Underspend' : burnRate > timeElapsedPct + 20 ? 'Overspend' : 'OK'}
              </span>
            </div>
            <div className="phb-track">
              <div className="phb-fill" style={{ width:`${timeElapsedPct}%`, background:'var(--text3)', opacity:0.25 }} />
              <div className="phb-fill" style={{ width:`${Math.min(burnRate,100)}%`, background:`var(--${budgetRag})`, opacity:0.8 }} />
            </div>
            <div className="phb-sub">{fmtCad(totalBudgetTT)} / {fmtCad(totalBudgetKH)} · {timeElapsedPct}% thời gian đã qua</div>
          </div>
        )}

        {/* Gender */}
        <div className="proj-health-item">
          <div className="phb-label">Tỷ lệ phụ nữ</div>
          <div className="phb-main">
            <span className="phb-val">{pctWomen}%</span>
            <span className="phb-badge" style={{ background:`var(--${genderRag}-bg,var(--bg2))`, color:`var(--${genderRag})` }}>
              {genderRag === 'green' ? 'Đạt 50%' : genderRag === 'orange' ? 'Gần 50%' : 'Dưới 40%'}
            </span>
          </div>
          <div className="phb-track">
            <div className="phb-fill" style={{ width:'50%', background:'var(--text3)', opacity:0.2 }} />
            <div className="phb-fill" style={{ width:`${Math.min(pctWomen,100)}%`, background:`var(--${genderRag})` }} />
          </div>
          <div className="phb-sub">{totalWomen.toLocaleString()} / {totalReach.toLocaleString()} người · Target: ≥50%</div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="kpi-grid">
        <div className="kpi-card glass-card kpi-clickable" style={{'--kc':'var(--accent)'}} onClick={() => nav('/kanban')}>
          <div className="kpi-label">Tổng hoạt động</div>
          <div className="kpi-val">{total}</div>
          <div className="kpi-sub">iLEAD 2025–2028</div>
        </div>
        <div className="kpi-card glass-card kpi-clickable" style={{'--kc':'var(--green)'}} onClick={() => nav('/kanban')}>
          <div className="kpi-label">Hoàn thành</div>
          <div className="kpi-val">{done}</div>
          <div className="prog"><div className="prog-fill" style={{width:`${pct}%`, background:'var(--green)'}}></div></div>
        </div>
        <div className="kpi-card glass-card kpi-clickable" style={{'--kc':'var(--accent)'}} onClick={() => nav('/kanban')}>
          <div className="kpi-label">Đang triển khai</div>
          <div className="kpi-val">{inp}</div>
        </div>
        <div className="kpi-card glass-card kpi-clickable" style={{'--kc':'var(--red)'}} onClick={() => nav('/kanban')}>
          <div className="kpi-label">Quá hạn</div>
          <div className="kpi-val">{over}</div>
        </div>
        <div className="kpi-card glass-card" style={{'--kc':'var(--orange)'}}>
          <div className="kpi-label">Tổng Reach</div>
          <div className="kpi-val">{totalReach.toLocaleString()}</div>
          <div className="kpi-sub">người tham gia</div>
        </div>
        <div className="kpi-card glass-card" style={{'--kc': pctWomen >= 50 ? 'var(--green)' : 'var(--orange)'}}>
          <div className="kpi-label">Tỷ lệ phụ nữ</div>
          <div className="kpi-val">{pctWomen}%</div>
          <div className="kpi-sub">{totalWomen.toLocaleString()} / {totalReach.toLocaleString()} người{pctWomen >= 50 ? ' ✓' : ' ⚠️'}</div>
        </div>
      </div>

      {/* ── Stage Pipeline ── */}
      {total > 0 && (
        <div className="dash-section">
          <div className="dash-section-hdr">
            <h2 className="dash-section-title">Pipeline hoạt động</h2>
            <span className="dash-section-count">
              {stagedTotal}/{total} activities có stage
              {unstagedTotal > 0 && (
                <span style={{ marginLeft: '8px', color: 'var(--text3)', fontSize: '12px' }}>
                  · {unstagedTotal} chưa gán stage
                </span>
              )}
            </span>
          </div>
          <div className="stage-pipeline">
            {STAGES.map((s, i) => {
              const count   = stageCount[s] || 0;
              const isLast  = i === STAGES.length - 1;
              const hasActs = count > 0;
              const stuck   = count > 0 && i > 0 && i < STAGES.length - 1;
              return (
                <React.Fragment key={s}>
                  <div
                    className={`pipeline-node ${hasActs ? 'pipeline-node--active' : 'pipeline-node--empty'} ${stuck ? 'pipeline-node--stuck' : ''}`}
                    style={{ '--stage-color': STAGE_COLORS[s] }}
                    onClick={() => nav('/kanban')}
                    title={`${s}: ${STAGE_LABELS[s]} — ${count} activities`}
                  >
                    <div className="pipeline-node-label">{s}</div>
                    <div className="pipeline-node-name">{STAGE_LABELS[s]}</div>
                    <div className="pipeline-node-count" style={{ color: hasActs ? STAGE_COLORS[s] : 'var(--text3)' }}>{count}</div>
                    {stuck && <div className="pipeline-node-stuck-dot" />}
                  </div>
                  {!isLast && <div className={`pipeline-arrow ${hasActs ? 'pipeline-arrow--active' : ''}`}>›</div>}
                </React.Fragment>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:'16px', marginTop:'10px', fontSize:'11px', color:'var(--text3)' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><span style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)', display:'inline-block' }}></span>Có activities</span>
            <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><span style={{ width:8, height:8, borderRadius:'50%', background:'var(--orange)', display:'inline-block' }}></span>Đang chờ xử lý</span>
            <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><span style={{ width:8, height:8, borderRadius:'50%', background:'var(--bg2)', border:'1px solid var(--border)', display:'inline-block' }}></span>Chưa có</span>
          </div>
        </div>
      )}

      {/* ── Follow-up (tasks with nearest deadlines) ── */}
      {followUp.length > 0 && (
        <div className="dash-section">
          <div className="dash-section-hdr">
            <h2 className="dash-section-title">📌 Cần follow-up ngay</h2>
            <span className="dash-section-count">{followUp.length} activities</span>
          </div>
          <div className="tbl-wrap">
            <div className="tbl-hdr act-tbl-row">
              <span></span><span>Activity</span><span>Partner</span><span>Stage</span><span>Owner</span><span>Deadline</span>
            </div>
            {followUp.map(a => <ActRow key={a.id} a={a} />)}
          </div>
        </div>
      )}

      {/* ── Budget Overview ── */}
      {hasBudget && (
        <div className="dash-section">
          <div className="dash-section-hdr">
            <h2 className="dash-section-title">💰 Ngân sách (CAD)</h2>
            <span className="dash-section-count">{burnRate}% đã sử dụng</span>
          </div>
          <div className="kpi-grid" style={{ gridTemplateColumns:'repeat(4,1fr)' }}>
            <div className="kpi-card glass-card" style={{'--kc':'var(--accent)'}}>
              <div className="kpi-label">Tổng KH</div>
              <div className="kpi-val" style={{ fontSize:'22px' }}>{fmtCad(totalBudgetKH)}</div>
            </div>
            <div className="kpi-card glass-card" style={{'--kc':'var(--orange)'}}>
              <div className="kpi-label">Đã sử dụng</div>
              <div className="kpi-val" style={{ fontSize:'22px' }}>{fmtCad(totalBudgetTT)}</div>
              <div className="prog"><div className="prog-fill" style={{ width:`${Math.min(burnRate,100)}%`, background: burnRate > 100 ? 'var(--red)' : burnRate > 80 ? 'var(--orange)' : 'var(--green)' }}></div></div>
            </div>
            <div className="kpi-card glass-card" style={{'--kc': burnRate > 100 ? 'var(--red)' : burnRate > 80 ? 'var(--orange)' : 'var(--green)'}}>
              <div className="kpi-label">Burn Rate</div>
              <div className="kpi-val" style={{ fontSize:'28px' }}>{burnRate}%</div>
              <div className="kpi-sub">{burnRate > 100 ? '⚠️ Vượt' : burnRate > 80 ? '⚡ Gần hết' : '✓ OK'}</div>
            </div>
            <div className="kpi-card glass-card" style={{'--kc':'var(--green)'}}>
              <div className="kpi-label">Còn lại</div>
              <div className="kpi-val" style={{ fontSize:'22px' }}>{fmtCad(totalBudgetKH - totalBudgetTT)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── MEL Summary ── */}
      <div className="dash-section mel-overview-section">
        <div className="dash-section-hdr">
          <h2 className="dash-section-title">📊 MEL Overview — GAC Logic Model</h2>
          <button className="btn btn-sm" onClick={() => nav('/mel-dashboard')}>Xem MEL Dashboard →</button>
        </div>
        <div className="mel-stat-row">
          <div className="mel-stat-cell">
            <div className="mel-stat-label">MEL Progress</div>
            <div className="mel-stat-val" style={{ color: melPct >= 80 ? 'var(--green)' : melPct >= 40 ? 'var(--orange)' : 'var(--red)' }}>{melPct}%</div>
            <div className="mel-stat-bar"><div className="mel-stat-bar-fill" style={{ width:`${Math.min(melPct,100)}%`, background: melPct >= 80 ? 'var(--green)' : melPct >= 40 ? 'var(--orange)' : 'var(--red)' }} /></div>
            <div className="mel-stat-sub">{melPct >= 80 ? '✓ Đạt mục tiêu' : melPct >= 40 ? 'Đang tiến hành' : '⚠ Cần đẩy mạnh'}</div>
          </div>
          <div className="mel-stat-cell">
            <div className="mel-stat-label">Target (VN)</div>
            <div className="mel-stat-val" style={{ color:'var(--accent)' }}>{melTotalTarget.toLocaleString()}</div>
            <div className="mel-stat-sub">người / năm · GAC target</div>
          </div>
          <div className="mel-stat-cell">
            <div className="mel-stat-label">Actual Reach</div>
            <div className="mel-stat-val" style={{ color:'var(--green)' }}>{melTotalActual.toLocaleString()}</div>
            <div className="mel-stat-bar"><div className="mel-stat-bar-fill" style={{ width:`${Math.min(melPct,100)}%`, background:'var(--green)' }} /></div>
            <div className="mel-stat-sub">{melEntries.length} MEL entries đã ghi nhận</div>
          </div>
          <div className="mel-stat-cell">
            <div className="mel-stat-label">Budget Còn lại</div>
            <div className="mel-stat-val" style={{ color: melRemainPct > 30 ? 'var(--green)' : 'var(--orange)' }}>{melRemainPct}%</div>
            <div className="mel-stat-bar"><div className="mel-stat-bar-fill" style={{ width:`${melRemainPct}%`, background: melRemainPct > 30 ? 'var(--green)' : 'var(--orange)' }} /></div>
            <div className="mel-stat-sub">{fmtCad(melTotalAllocated - melTotalSpent)} / {fmtCad(melTotalAllocated)} · theo đối tác</div>
          </div>
        </div>
      </div>

      {/* ── Partner Summary Table ── */}
      <div className="dash-section">
        <div className="dash-section-hdr">
          <h2 className="dash-section-title">🏢 Tổng quan theo Đối tác</h2>
          <span className="dash-section-count">{partners.length} partners</span>
        </div>
        <div className="tbl-wrap">
          <div className="tbl-hdr" style={{ gridTemplateColumns:'180px 90px 60px 80px 90px 90px 1fr' }}>
            <span>Partner</span><span>Activities</span><span>Stage</span><span>Reach</span><span>Budget KH</span><span>% Done</span><span></span>
          </div>
          {partnerSummary.map(({ p, acts, pdone, ppct, reach, budget, topStage }) => (
            <div key={p.id} className="tbl-row"
              style={{ gridTemplateColumns:'180px 90px 60px 80px 90px 90px 1fr', cursor:'pointer' }}
              onClick={() => nav(`/partner/${p.id}`)}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:p.color, flexShrink:0 }}></div>
                <span className="cell-name" style={{ color:p.color }}>{p.name}</span>
              </div>
              <span className="cell-small">{acts.length} HĐ</span>
              <span className={`cell-tag stage-${topStage}`} style={{ fontSize:'11px' }}>{topStage}</span>
              <span className="cell-small">{reach > 0 ? reach.toLocaleString() : '—'}</span>
              <span className="cell-small">{budget > 0 ? fmtCad(budget) : '—'}</span>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <div className="prog" style={{ flex:1, maxWidth:'60px' }}>
                  <div className="prog-fill" style={{ width:`${ppct}%`, background:p.color }}></div>
                </div>
                <span className="cell-mono" style={{ color:p.color, fontWeight:700, minWidth:'32px' }}>{ppct}%</span>
              </div>
              <span style={{ color:'var(--text3)', fontSize:'12px' }}>→</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reach Breakdown ── */}
      {totalReach > 0 && (
        <div className="dash-section">
          <div className="dash-section-hdr">
            <h2 className="dash-section-title">👥 Phân bổ Reach</h2>
            <span className="dash-section-count">{totalReach.toLocaleString()} người tổng</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
            <div>
              <div style={{ fontSize:'12px', fontWeight:600, color:'var(--text2)', marginBottom:'10px' }}>Theo đối tác</div>
              {reachByPartner.map(({ p, reach }) => (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                  <div style={{ width:'100px', fontSize:'12px', color:p.color, fontWeight:500, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                  <div style={{ flex:1, height:'8px', background:'var(--bg2)', borderRadius:'4px', overflow:'hidden' }}>
                    <div style={{ width:`${Math.round((reach/maxReachPartner)*100)}%`, height:'100%', background:p.color, borderRadius:'4px' }}></div>
                  </div>
                  <span style={{ fontSize:'11px', color:'var(--text3)', minWidth:'40px', textAlign:'right' }}>{reach.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:'12px', fontWeight:600, color:'var(--text2)', marginBottom:'10px' }}>Theo loại hoạt động</div>
              {reachByType.map(({ t, count, reach }) => (
                <div key={t.code} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                  <div style={{ width:'100px', fontSize:'12px', color:'var(--text)', flexShrink:0 }}>
                    <span style={{ fontWeight:600, fontFamily:'var(--font-mono)' }}>{t.code}</span>
                    <span style={{ color:'var(--text3)', marginLeft:'4px', fontSize:'10px' }}>({count}x)</span>
                  </div>
                  <div style={{ flex:1, height:'8px', background:'var(--bg2)', borderRadius:'4px', overflow:'hidden' }}>
                    <div style={{ width:`${Math.round((reach/maxReachType)*100)}%`, height:'100%', background:'var(--accent)', borderRadius:'4px' }}></div>
                  </div>
                  <span style={{ fontSize:'11px', color:'var(--text3)', minWidth:'40px', textAlign:'right' }}>{reach > 0 ? reach.toLocaleString() : '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
