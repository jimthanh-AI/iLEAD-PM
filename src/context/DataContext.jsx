import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';

const DataContext = createContext();
export const useData = () => useContext(DataContext);


// ─────────────────────────────────────────────────────────────────────────────
// SEED — fallback data if both Supabase and localStorage are empty
// ─────────────────────────────────────────────────────────────────────────────
const SEED = {
  partners: [
    { id:'p1', name:'VCCI MTTN',         color:'#2563eb', sector:'Association', region:'Đà Nẵng' },
    { id:'p2', name:'APED Ha Noi',        color:'#7c3aed', sector:'Government',  region:'Hà Nội'  },
    { id:'p3', name:'VNAH',               color:'#0891b2', sector:'NGO',         region:'Hà Nội'  },
    { id:'p4', name:'RED Communication',  color:'#dc2626', sector:'Media',       region:'TP.HCM'  },
    { id:'p5', name:'VCCI HCMC',          color:'#d97706', sector:'Association', region:'TP.HCM'  },
    { id:'p6', name:'VLA',                color:'#16a34a', sector:'Association', region:'TP.HCM'  },
    { id:'p7', name:'SHi',                color:'#6366f1', sector:'NGO',         region:'Đà Nẵng' },
  ],
  activities: [
    { id:'a1',  partnerId:'p1', activityTypeCode:'3',  iteration:1, name:'Làm baseline research với Tiến team về RPB',                 status:'done',        stage:'S7', ballOwner:'CR/Mnr', ca:'Steve', reachTotal:0,  reachWomen:0,  reachMen:0,  budget_planned:10000, budget_actual:8450, startDate:'2025-10-15', endDate:'2025-12-15', nextAction:'Hợp phần đã kết thúc', notes:'', pos:0 },
    { id:'a2',  partnerId:'p1', activityTypeCode:'1A', iteration:1, name:'Tổ chức 2 lớp TOT cho SMEs và CBCC tại Đà Nẵng',            status:'done',        stage:'S7', ballOwner:'Partner', ca:'Wayne', reachTotal:52, reachWomen:28, reachMen:24, budget_planned:10000, budget_actual:7800, startDate:'2026-01-10', endDate:'2026-01-20', nextAction:'', notes:'', pos:1 },
    { id:'a3',  partnerId:'p1', activityTypeCode:'1A', iteration:2, name:'ToT cán bộ công chức về RBP/ESG – VCCI MTTN (lần 2)',       status:'in_progress', stage:'S3', ballOwner:'CR/Mnr',  ca:'TBD',   reachTotal:0,  reachWomen:0,  reachMen:0,  budget_planned:10000, budget_actual:2000, startDate:'2026-03-01', endDate:'2026-06-30', nextAction:'Gửi TOR cho Jane approve và sàng lọc LSP', notes:'', pos:2 },
    { id:'a4',  partnerId:'p1', activityTypeCode:'4',  iteration:1, name:'Phát triển chỉ số ESG với VCCI MTTN (RBP Index)',            status:'not_started', stage:'S1', ballOwner:'Partner', ca:'',      reachTotal:0,  reachWomen:0,  reachMen:0,  budget_planned:15000, budget_actual:0,    startDate:'2026-04-15', endDate:'2026-08-30', nextAction:'Thiết kế framework và xác định bộ chỉ số', notes:'', pos:3 },
    { id:'a5',  partnerId:'p1', activityTypeCode:'8',  iteration:1, name:'Làm digital platform / ESG dashboard với VCCI MTTN',        status:'not_started', stage:'S2', ballOwner:'Partner', ca:'',      reachTotal:0,  reachWomen:0,  reachMen:0,  budget_planned:20000, budget_actual:0,    startDate:'2026-05-01', endDate:'2026-10-30', nextAction:'Phân tích yêu cầu và chọn công nghệ', notes:'', pos:4 },
    { id:'a6',  partnerId:'p2', activityTypeCode:'6',  iteration:1, name:'Hội nghị sáng kiến ESG tại Hà Nội (với APED/TAC)',          status:'done',        stage:'S7', ballOwner:'CR/Mnr',  ca:'',      reachTotal:85, reachWomen:40, reachMen:45, budget_planned:25000, budget_actual:0,    startDate:'2026-01-04', endDate:'2026-01-06', nextAction:'', notes:'', pos:0 },
    { id:'a7',  partnerId:'p2', activityTypeCode:'3',  iteration:1, name:'Research review về luật doanh nghiệp hiện hành (trụ cột G)',status:'in_progress', stage:'S2', ballOwner:'CR/Mnr',  ca:'',      reachTotal:0,  reachWomen:0,  reachMen:0,  budget_planned:10000, budget_actual:0,    startDate:'2026-01-15', endDate:'2026-06-30', nextAction:'Jim gửi TOR cho Jane duyệt', notes:'', pos:1 },
    { id:'a8',  partnerId:'p2', activityTypeCode:'2A', iteration:1, name:'Đào tạo RBP cho cán bộ công chức – APED/TAC',               status:'not_started', stage:'S1', ballOwner:'Partner', ca:'',      reachTotal:0,  reachWomen:0,  reachMen:0,  budget_planned:10000, budget_actual:0,    startDate:'2026-05-01', endDate:'2026-11-30', nextAction:'Xây dựng chương trình đào tạo', notes:'', pos:2 },
    { id:'a9',  partnerId:'p3', activityTypeCode:'7',  iteration:1, name:'Làm RBP guideline cho ngành hospitality (hòa nhập KT)',     status:'in_progress', stage:'S2', ballOwner:'CR/Mnr',  ca:'',      reachTotal:0,  reachWomen:0,  reachMen:0,  budget_planned:4000,  budget_actual:0,    startDate:'2025-12-15', endDate:'2026-06-30', nextAction:'Jane đã approve, gửi cho VNAH ký', notes:'', pos:0 },
    { id:'a10', partnerId:'p4', activityTypeCode:'8',  iteration:1, name:'Các hoạt động truyền thông RBP với RED Communication',      status:'not_started', stage:'S1', ballOwner:'CR/Mnr',  ca:'',      reachTotal:0,  reachWomen:0,  reachMen:0,  budget_planned:15000, budget_actual:0,    startDate:'2026-01-15', endDate:'2026-10-30', nextAction:'Đã gửi MOU cho Jane approve', notes:'', pos:0 },
    { id:'a11', partnerId:'p5', activityTypeCode:'3',  iteration:1, name:'Làm baseline research với VCCI HCMC',                       status:'not_started', stage:'S2', ballOwner:'Partner', ca:'',      reachTotal:0,  reachWomen:0,  reachMen:0,  budget_planned:10000, budget_actual:0,    startDate:'2025-12-20', endDate:'2026-06-30', nextAction:'Họp với VCCI sáng thứ 3', notes:'', pos:0 },
    { id:'a12', partnerId:'p5', activityTypeCode:'1A', iteration:1, name:'ToT cán bộ công chức về RBP/ESG – VCCI HCMC',              status:'not_started', stage:'S1', ballOwner:'CR/Mnr',  ca:'',      reachTotal:0,  reachWomen:0,  reachMen:0,  budget_planned:10000, budget_actual:0,    startDate:'2026-04-01', endDate:'2026-08-31', nextAction:'Sàng lọc LSP và confirm với partner', notes:'', pos:1 },
    { id:'a13', partnerId:'p7', activityTypeCode:'6',  iteration:1, name:'Tổ chức workshop ESG trong ngành hospitality (với SHi)',    status:'done',        stage:'S7', ballOwner:'CR/Mnr',  ca:'',      reachTotal:45, reachWomen:22, reachMen:23, budget_planned:8000,  budget_actual:0,    startDate:'2026-01-10', endDate:'2026-01-17', nextAction:'', notes:'', pos:0 },
  ],
  tasks: [
    { id:'t1',  activityId:'a3',  name:'Phát triển TOR chi tiết cho ToT',          status:'done',        assignee:'CR/Mnr',   dueDate:'2026-03-15', notes:'', pos:0 },
    { id:'t2',  activityId:'a3',  name:'Sàng lọc và đề xuất danh sách LSP',        status:'todo',        assignee:'CR/Mnr',   dueDate:'2026-04-30', notes:'', pos:1 },
    { id:'t3',  activityId:'a3',  name:'Viết AAF và upload lên QuickBase',          status:'todo',        assignee:'Jim',      dueDate:'2026-05-15', notes:'', pos:2 },
    { id:'t4',  activityId:'a7',  name:'Phân tích Luật Doanh nghiệp 2020',         status:'done',        assignee:'CR/Mnr',   dueDate:'2026-02-28', notes:'', pos:0 },
    { id:'t5',  activityId:'a7',  name:'Phỏng vấn chuyên gia pháp lý',             status:'todo',        assignee:'CR/Mnr',   dueDate:'2026-05-30', notes:'', pos:1 },
    { id:'t6',  activityId:'a7',  name:'Dự thảo báo cáo khuyến nghị chính sách',   status:'todo',        assignee:'Jim',      dueDate:'2026-07-30', notes:'', pos:2 },
    { id:'t7',  activityId:'a9',  name:'Nghiên cứu disability-inclusive practices', status:'done',        assignee:'CR/Mnr',   dueDate:'2026-01-31', notes:'', pos:0 },
    { id:'t8',  activityId:'a9',  name:'Soạn thảo guideline (bản nháp)',            status:'todo',        assignee:'Catalyste',dueDate:'2026-04-30', notes:'', pos:1 },
    { id:'t9',  activityId:'a9',  name:'VNAH review và ký kết',                    status:'todo',        assignee:'Partner',  dueDate:'2026-05-31', notes:'', pos:2 },
    { id:'t10', activityId:'a10', name:'Gửi MOU cho Jane approve',                  status:'todo',        assignee:'CR/Mnr',   dueDate:'2026-04-30', notes:'', pos:0 },
    { id:'t11', activityId:'a10', name:'Họp kick-off với RED',                      status:'todo',        assignee:'CR/Mnr',   dueDate:'2026-06-01', notes:'', pos:1 },
  ],
  partnerBudgets: [
    { partnerId:'p1', allocated:66450,  spent:46882.76 },
    { partnerId:'p2', allocated:132900, spent:14324.69 },
    { partnerId:'p3', allocated:26580,  spent:4096.86  },
    { partnerId:'p4', allocated:39870,  spent:0        },
    { partnerId:'p5', allocated:66450,  spent:0        },
  ],
  melEntries: [
    { id:'mel1',  indicatorGroup:'1111A', subCode:'1111.3', date:'2025-04-25', partnerId:'p2', activityId:'',    description:'APED/TAC – Enterprise Database Project presentation',             q1_m:3,  q1_f:5,  q2_m:0, q2_f:0, q3_m:0,  q3_f:0,   q4_m:0,  q4_f:0  },
    { id:'mel2',  indicatorGroup:'1111A', subCode:'1111.4', date:'2025-04-27', partnerId:'',   activityId:'',    description:'ILO – Productivity Ecosystems for Decent Works discussion',         q1_m:8,  q1_f:1,  q2_m:0, q2_f:0, q3_m:0,  q3_f:0,   q4_m:0,  q4_f:0  },
    { id:'mel3',  indicatorGroup:'1111A', subCode:'1111.3', date:'2025-07-11', partnerId:'p3', activityId:'',    description:'VNAH – RBP guideline for disabled groups discussion',               q1_m:0,  q1_f:0,  q2_m:0, q2_f:1, q3_m:0,  q3_f:0,   q4_m:0,  q4_f:0  },
    { id:'mel4',  indicatorGroup:'1111A', subCode:'1111.3', date:'2025-12-01', partnerId:'p1', activityId:'a1',  description:'VCCI MTTN – Baseline research RBP awareness in Da Nang',         q1_m:0,  q1_f:0,  q2_m:0, q2_f:0, q3_m:50, q3_f:59,  q4_m:0,  q4_f:0  },
    { id:'mel5',  indicatorGroup:'1111A', subCode:'1111.3', date:'2026-03-27', partnerId:'p1', activityId:'',    description:'VCCI MTTN – MOU discussion and signing with DAFO',                  q1_m:0,  q1_f:0,  q2_m:0, q2_f:0, q3_m:0,  q3_f:0,   q4_m:20, q4_f:20 },
    { id:'mel6',  indicatorGroup:'1111B', subCode:'1111.3', date:'2026-03-23', partnerId:'p1', activityId:'',    description:'VCCI MTTN – Technical meeting with DAFO on MOU content',            q1_m:0,  q1_f:0,  q2_m:0, q2_f:0, q3_m:0,  q3_f:0,   q4_m:6,  q4_f:4  },
    { id:'mel7',  indicatorGroup:'1112',  subCode:'1112.2', date:'2025-04-25', partnerId:'p2', activityId:'',    description:'APED/TAC – Data management systems for RBP presentation',           q1_m:3,  q1_f:5,  q2_m:0, q2_f:0, q3_m:0,  q3_f:0,   q4_m:0,  q4_f:0  },
    { id:'mel8',  indicatorGroup:'1112',  subCode:'1112.4', date:'2025-05-13', partnerId:'p1', activityId:'',    description:'VCCI MTTN – RBP policy monitoring information sharing',              q1_m:4,  q1_f:1,  q2_m:0, q2_f:0, q3_m:0,  q3_f:0,   q4_m:0,  q4_f:0  },
    { id:'mel9',  indicatorGroup:'1121A', subCode:'1121.1', date:'2026-01-28', partnerId:'',   activityId:'',    description:'DAFO – Interagency consultation meetings (multi-quarter)',            q1_m:5,  q1_f:0,  q2_m:6, q2_f:0, q3_m:0,  q3_f:0,   q4_m:4,  q4_f:0  },
    { id:'mel10', indicatorGroup:'1211',  subCode:'1211.3', date:'2025-06-11', partnerId:'p1', activityId:'a6',  description:'VCCI MTTN – International Conference RBP preparation session',    q1_m:3,  q1_f:4,  q2_m:0, q2_f:0, q3_m:0,  q3_f:0,   q4_m:0,  q4_f:0  },
    { id:'mel11', indicatorGroup:'1211',  subCode:'1211.3', date:'2025-10-24', partnerId:'p1', activityId:'a6',  description:'VCCI MTTN – International Conference RBP in the Global Economy',  q1_m:0,  q1_f:0,  q2_m:0, q2_f:0, q3_m:99, q3_f:130, q4_m:0,  q4_f:0  },
    { id:'mel12', indicatorGroup:'1211',  subCode:'1211.3', date:'2025-11-05', partnerId:'p1', activityId:'',    description:'VCCI MTTN – TOT preparation session',                               q1_m:0,  q1_f:0,  q2_m:0, q2_f:0, q3_m:3,  q3_f:2,   q4_m:0,  q4_f:0  },
    { id:'mel13', indicatorGroup:'1211',  subCode:'1211.3', date:'2026-01-27', partnerId:'p1', activityId:'a2',  description:'VCCI MTTN – TOT for SMEs (Jan 2026)',                             q1_m:0,  q1_f:0,  q2_m:0, q2_f:0, q3_m:0,  q3_f:0,   q4_m:9,  q4_f:14 },
    { id:'mel14', indicatorGroup:'1221A', subCode:'1221.2', date:'2025-06-11', partnerId:'p1', activityId:'',    description:'VCCI MTTN – RBP training framework development discussion',          q1_m:8,  q1_f:4,  q2_m:0, q2_f:0, q3_m:0,  q3_f:0,   q4_m:0,  q4_f:0  },
    { id:'mel15', indicatorGroup:'1221A', subCode:'1221.3', date:'2026-01-06', partnerId:'p2', activityId:'a6',  description:'APED/TAC – Conference on Sustainable Business New Value',          q1_m:0,  q1_f:0,  q2_m:0, q2_f:0, q3_m:0,  q3_f:0,   q4_m:35, q4_f:85 },
    { id:'mel16', indicatorGroup:'1221A', subCode:'1221.3', date:'2026-01-27', partnerId:'p1', activityId:'a2',  description:'VCCI MTTN – TOT SMEs (Jan 2026)',                                  q1_m:0,  q1_f:0,  q2_m:0, q2_f:0, q3_m:0,  q3_f:0,   q4_m:9,  q4_f:14 },
    { id:'mel17', indicatorGroup:'1221A', subCode:'1221.3', date:'2026-01-28', partnerId:'p1', activityId:'',    description:'VCCI MTTN – TOT civil servants (Jan 2026)',                          q1_m:0,  q1_f:0,  q2_m:0, q2_f:0, q3_m:0,  q3_f:0,   q4_m:9,  q4_f:14 },
    { id:'mel18', indicatorGroup:'1221B', subCode:'1221.3', date:'2025-11-06', partnerId:'p7', activityId:'a13', description:'SHi – Round table discussion (Nov 2025)',                        q1_m:0,  q1_f:0,  q2_m:0, q2_f:0, q3_m:5,  q3_f:13,  q4_m:0,  q4_f:0  },
    { id:'mel19', indicatorGroup:'1221B', subCode:'1221.5', date:'2026-01-17', partnerId:'p7', activityId:'a13', description:'SHi – Round table discussion (Jan 2026)',                        q1_m:0,  q1_f:0,  q2_m:0, q2_f:0, q3_m:0,  q3_f:0,   q4_m:5,  q4_f:15 },
  ],
  activityIndicators: [
    { id:'ai1', activityId:'a2',  indicatorCode:'1111.3', targetCount:25,  actualCount:25, femaleCount:0 },
    { id:'ai2', activityId:'a2',  indicatorCode:'1221.2', targetCount:25,  actualCount:25, femaleCount:0 },
    { id:'ai3', activityId:'a3',  indicatorCode:'1111.3', targetCount:25,  actualCount:0,  femaleCount:0 },
    { id:'ai4', activityId:'a3',  indicatorCode:'1221.3', targetCount:25,  actualCount:0,  femaleCount:0 },
    { id:'ai5', activityId:'a6',  indicatorCode:'1221.4', targetCount:80,  actualCount:80, femaleCount:0 },
    { id:'ai6', activityId:'a7',  indicatorCode:'1111.4', targetCount:100, actualCount:0,  femaleCount:0 },
    { id:'ai7', activityId:'a7',  indicatorCode:'1112.2', targetCount:100, actualCount:0,  femaleCount:0 },
    { id:'ai8', activityId:'a9',  indicatorCode:'1221.3', targetCount:100, actualCount:0,  femaleCount:0 },
    { id:'ai9', activityId:'a13', indicatorCode:'1221.4', targetCount:40,  actualCount:40, femaleCount:0 },
  ],
};


// ─────────────────────────────────────────────────────────────────────────────
// Supabase helpers
// ─────────────────────────────────────────────────────────────────────────────
const fetchAll = async () => {
  const [p, a, t, m, ai, pb] = await Promise.all([
    supabase.from('partners').select('*'),
    supabase.from('activities').select('*').order('pos'),
    supabase.from('tasks').select('*').order('pos'),
    supabase.from('mel_entries').select('*').order('id'),
    supabase.from('activity_indicators').select('*').order('id'),
    supabase.from('partner_budgets').select('*'),
  ]);
  // Check ALL responses — partial errors must not silently return [] and overwrite local
  const errs = [p, a, t, m, ai, pb].map((r, i) => r.error && `${['partners','activities','tasks','mel_entries','activity_indicators','partner_budgets'][i]}: ${r.error.message}`).filter(Boolean);
  if (errs.length) throw new Error('Supabase fetch failed → ' + errs.join('; '));
  return {
    partners:           p.data  || [],
    activities:         a.data  || [],
    tasks:              t.data  || [],
    melEntries:         m.data  || [],
    activityIndicators: ai.data || [],
    partnerBudgets:     pb.data || [],
  };
};

// Guard empty arrays — Supabase upsert([]) can error/no-op inconsistently
const safeUpsert = (table, rows) =>
  rows && rows.length ? supabase.from(table).upsert(rows) : Promise.resolve({ error: null });

// Numeric and date fields that must be null (not '') when empty
const ACTIVITY_NUMERIC  = ['budget_planned','budget_actual','reachTotal','reachWomen','reachMen','iteration','pos'];
const ACTIVITY_DATE     = ['startDate','endDate'];
const TASK_NUMERIC      = ['pos'];
const TASK_DATE         = ['dueDate'];

const sanitizeActivity = (a) => {
  const out = { ...a };
  ACTIVITY_NUMERIC.forEach(k => { if (out[k] === '' || out[k] === undefined) out[k] = null; });
  ACTIVITY_DATE.forEach(k =>   { if (out[k] === '' || out[k] === undefined) out[k] = null; });
  return out;
};

const sanitizeTask = (t) => {
  const out = { ...t };
  TASK_NUMERIC.forEach(k => { if (out[k] === '' || out[k] === undefined) out[k] = null; });
  TASK_DATE.forEach(k =>   { if (out[k] === '' || out[k] === undefined) out[k] = null; });
  return out;
};

const pushToSupabase = async (data) => {
  // Sequential: partners first (FK parent), then children in parallel
  await safeUpsert('partners', data.partners);
  await Promise.all([
    safeUpsert('activities', data.activities),
    safeUpsert('partner_budgets', data.partnerBudgets),
  ]);
  await Promise.all([
    safeUpsert('tasks', data.tasks),
    safeUpsert('mel_entries', data.melEntries),
    safeUpsert('activity_indicators', data.activityIndicators),
  ]);
};


// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export const DataProvider = ({ children }) => {
  const [data, setData] = useState(SEED);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);  // visible banner when Supabase fails

  // ── RBAC ──────────────────────────────────────────────────────
  const [userRole, setUserRole] = useState(
    () => localStorage.getItem('ilead_user_role') || 'coordinator'
  );
  useEffect(() => {
    const handler = () => setUserRole(localStorage.getItem('ilead_user_role') || 'coordinator');
    window.addEventListener('ilead_role_changed', handler);
    return () => window.removeEventListener('ilead_role_changed', handler);
  }, []);

  const isAdmin   = userRole === 'admin';
  const canEdit   = userRole !== 'viewer';
  const canDelete = userRole === 'admin' || userRole === 'pm';

// ── Boot: load from Supabase only ─────────────────────────────
  useEffect(() => {
    const boot = async () => {
      try {
        const remote = await fetchAll();
        if (remote.partners.length === 0) {
          // First time: seed Supabase with default data
          setData(SEED);
          await pushToSupabase(SEED);
        } else {
          setData(remote);
        }
      } catch (err) {
        setSyncError('Không kết nối được Supabase: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  // ── Supabase fire-and-forget helper ───────────────────────────
  // Supabase v2 query builders are thenable but not real Promises (no .catch),
  // so wrap with Promise.resolve(). Surface errors visibly via setSyncError so
  // the user is never silently disconnected.
  const sb = (fn, label = 'sync') => {
    Promise.resolve()
      .then(() => fn())
      .then((res) => {
        if (res && res.error) {
          const msg = res.error.message || res.error.details || JSON.stringify(res.error);
          console.error('Supabase[' + label + ']:', msg, res.error);
          setSyncError('[' + label + '] ' + msg);
        }
      })
      .catch((err) => {
        const msg = err?.message || String(err);
        console.error('Supabase[' + label + ']:', msg);
        setSyncError('[' + label + '] ' + msg);
      });
  };

  // ── Mutations: Partners ────────────────────────────────────────
  const addPartner = (p) => {
    setData(d => ({ ...d, partners: [...d.partners, p] }));
    sb(() => supabase.from('partners').upsert(p));
  };
  const updatePartner = (id, u) => {
    setData(d => ({ ...d, partners: d.partners.map(p => p.id === id ? { ...p, ...u } : p) }));
    sb(() => supabase.from('partners').update(u).eq('id', id));
  };
  const deletePartner = (id) => {
    setData(d => {
      const aIds = d.activities.filter(a => a.partnerId === id).map(a => a.id);
      return {
        ...d,
        partners:           d.partners.filter(p => p.id !== id),
        activities:         d.activities.filter(a => a.partnerId !== id),
        tasks:              d.tasks.filter(t => !aIds.includes(t.activityId)),
        activityIndicators: d.activityIndicators.filter(ai => !aIds.includes(ai.activityId)),
        melEntries:         d.melEntries.filter(e => e.partnerId !== id && !aIds.includes(e.activityId)),
        partnerBudgets:     d.partnerBudgets.filter(b => b.partnerId !== id),
      };
    });
    sb(async () => {
      const { data: acts } = await supabase.from('activities').select('id').eq('partnerId', id);
      const aIds = (acts || []).map(a => a.id);
      if (aIds.length > 0) {
        await Promise.all([
          supabase.from('tasks').delete().in('activityId', aIds),
          supabase.from('activity_indicators').delete().in('activityId', aIds),
          supabase.from('mel_entries').delete().in('activityId', aIds),
        ]);
        await supabase.from('activities').delete().eq('partnerId', id);
      }
      await Promise.all([
        supabase.from('mel_entries').delete().eq('partnerId', id),
        supabase.from('partner_budgets').delete().eq('partnerId', id),
        supabase.from('partners').delete().eq('id', id),
      ]);
    });
  };

  // ── Mutations: Activities ──────────────────────────────────────
  const addActivity = (a) => {
    const pos = data.activities.filter(x => x.partnerId === a.partnerId).length;
    const item = sanitizeActivity({ ...a, pos });
    setData(d => ({ ...d, activities: [...d.activities, item] }));
    sb(() => supabase.from('activities').upsert(item), 'addActivity');
  };
  const updateActivity = (id, u) => {
    setData(d => ({ ...d, activities: d.activities.map(a => a.id === id ? { ...a, ...u } : a) }));
    sb(() => supabase.from('activities').update(sanitizeActivity(u)).eq('id', id), 'updateActivity');
  };
  const deleteActivity = (id) => {
    setData(d => ({
      ...d,
      activities:         d.activities.filter(a => a.id !== id),
      tasks:              d.tasks.filter(t => t.activityId !== id),
      activityIndicators: d.activityIndicators.filter(ai => ai.activityId !== id),
      melEntries:         d.melEntries.filter(e => e.activityId !== id),
    }));
    sb(async () => {
      await Promise.all([
        supabase.from('tasks').delete().eq('activityId', id),
        supabase.from('activity_indicators').delete().eq('activityId', id),
        supabase.from('mel_entries').delete().eq('activityId', id),
      ]);
      await supabase.from('activities').delete().eq('id', id);
    });
  };

  // ── Mutations: Tasks ───────────────────────────────────────────
  const addTask = (t) => {
    const pos = data.tasks.filter(x => x.activityId === t.activityId).length;
    const item = sanitizeTask({ ...t, pos });
    setData(d => ({ ...d, tasks: [...d.tasks, item] }));
    sb(() => supabase.from('tasks').upsert(item), 'addTask');
  };
  const updateTask = (id, u) => {
    setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, ...u } : t) }));
    sb(() => supabase.from('tasks').update(sanitizeTask(u)).eq('id', id), 'updateTask');
  };
  const deleteTask = (id) => {
    setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }));
    sb(() => supabase.from('tasks').delete().eq('id', id));
  };

  // ── Mutations: MEL Entries ─────────────────────────────────────
  const addMelEntry = (e) => {
    setData(d => ({ ...d, melEntries: [...d.melEntries, e] }));
    sb(() => supabase.from('mel_entries').upsert(e));
  };
  const updateMelEntry = (id, u) => {
    setData(d => ({ ...d, melEntries: d.melEntries.map(e => e.id === id ? { ...e, ...u } : e) }));
    sb(() => supabase.from('mel_entries').update(u).eq('id', id));
  };
  const deleteMelEntry = (id) => {
    setData(d => ({ ...d, melEntries: d.melEntries.filter(e => e.id !== id) }));
    sb(() => supabase.from('mel_entries').delete().eq('id', id));
  };

  // ── Mutations: Partner Budgets ─────────────────────────────────
  const updatePartnerBudget = (partnerId, u) => {
    setData(d => ({
      ...d,
      partnerBudgets: d.partnerBudgets.some(b => b.partnerId === partnerId)
        ? d.partnerBudgets.map(b => b.partnerId === partnerId ? { ...b, ...u } : b)
        : [...d.partnerBudgets, { partnerId, allocated: 0, spent: 0, ...u }],
    }));
    sb(() => supabase.from('partner_budgets').upsert({ partnerId, ...u }));
  };

  // ── Mutations: Activity Indicators ────────────────────────────
  const addActivityIndicator = (ai) => {
    const item = { ...ai, id: ai.id || crypto.randomUUID() };
    setData(d => ({ ...d, activityIndicators: [...d.activityIndicators, item] }));
    sb(() => supabase.from('activity_indicators').upsert(item));
  };
  const updateActivityIndicator = (id, u) => {
    setData(d => ({ ...d, activityIndicators: d.activityIndicators.map(ai => ai.id === id ? { ...ai, ...u } : ai) }));
    sb(() => supabase.from('activity_indicators').update(u).eq('id', id));
  };
  const deleteActivityIndicator = (id) => {
    setData(d => ({ ...d, activityIndicators: d.activityIndicators.filter(ai => ai.id !== id) }));
    sb(() => supabase.from('activity_indicators').delete().eq('id', id));
  };

  // ── O(1) Lookup Maps ──────────────────────────────────────────
  const partnerMap  = useMemo(() => Object.fromEntries(data.partners.map(p  => [p.id,  p])),  [data.partners]);
  const activityMap = useMemo(() => Object.fromEntries(data.activities.map(a => [a.id, a])), [data.activities]);

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'12px', fontFamily:'sans-serif', color:'#6b7280' }}>
        <div style={{ width:'32px', height:'32px', border:'3px solid #e5e7eb', borderTop:'3px solid #2563eb', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <span style={{ fontSize:'14px' }}>Đang tải dữ liệu...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const downloadBackupJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iLEAD_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DataContext.Provider value={{
      ...data, setData,
      partnerMap, activityMap,
      userRole, isAdmin, canEdit, canDelete,
      syncError, setSyncError,
      addPartner, updatePartner, deletePartner,
      addActivity, updateActivity, deleteActivity,
      addTask, updateTask, deleteTask,
      addActivityIndicator, updateActivityIndicator, deleteActivityIndicator,
      addMelEntry, updateMelEntry, deleteMelEntry,
      updatePartnerBudget,
      downloadBackupJSON,
    }}>
      {syncError && (
        <div style={{
          position:'fixed', top:0, left:0, right:0, zIndex:9999,
          background:'#fef2f2', borderBottom:'1px solid #fecaca',
          color:'#991b1b', padding:'10px 16px', fontSize:'13px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          fontFamily:'system-ui, sans-serif',
          boxShadow:'0 1px 3px rgba(0,0,0,.06)',
        }}>
          <span>⚠️ {syncError}</span>
          <button onClick={() => setSyncError(null)}
            style={{ background:'transparent', border:'1px solid #fca5a5', color:'#991b1b', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontSize:'12px' }}>
            Đóng
          </button>
        </div>
      )}
      {children}
    </DataContext.Provider>
  );
};
