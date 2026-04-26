// ── Colors ───────────────────────────────────────────────────
export const COLORS = ['#2563eb','#7c3aed','#16a34a','#ea580c','#dc2626','#0891b2','#d97706','#db2777','#059669','#6366f1'];

// ── Stages (S1–S7) ────────────────────────────────────────────
export const STAGES = ['S1','S2','S3','S4','S5','S6','S7'];
export const STAGE_LABELS = {
  S1:'Phát triển Partner', S2:'Thiết kế AAF', S3:'Tìm Advisor',
  S4:'Virtual Assignment', S5:'In-Country Prep', S6:'In-Country Impl.', S7:'Monitoring'
};
export const STAGE_COLORS = {
  S1:'#818cf8', S2:'#60a5fa', S3:'#34d399',
  S4:'#fbbf24', S5:'#fb923c', S6:'#f472b6', S7:'#a78bfa'
};

// ── Activity Status ───────────────────────────────────────────
export const STATUSES      = ['not_started','in_progress','done','not_completed'];
export const STATUS_LABELS = { not_started:'Not Started', in_progress:'In Progress', done:'Done', not_completed:'Not Completed' };
export const STATUS_CSS    = { not_started:'s-not', in_progress:'s-prog', done:'s-done', not_completed:'s-blocked' };
export const STATUS_COLORS = { not_started:'#9ca3af', in_progress:'#2563eb', done:'#10b981', not_completed:'#ef4444' };

// ── Team Members ─────────────────────────────────────────────
export const TEAM_MEMBERS = ['Jim Thanh', 'Yen Ton', 'Hieu Phung', 'Truc Nguyen'];

// ── Ball Owner options ────────────────────────────────────────
export const BALL_OWNERS = ['ICT team', 'Catalyste Advisor', 'Headquarter', 'Partner', 'VSO'];

// ── Task Status ───────────────────────────────────────────────
export const TASK_STATUSES      = ['todo','done'];
export const TASK_STATUS_LABELS = { todo:'Todo', in_progress:'Todo', done:'Done' };
export const TASK_STATUS_CSS    = { todo:'s-not', in_progress:'s-not', done:'s-done' };

// ── Activity Types Catalog (10 types, iLEAD program) ─────────
export const ACTIVITY_TYPES = [
  { code:'1A', nameVi:'ToT cán bộ công chức về RBP/ESG',           nameEn:'ToT – Civil servants on RBP/ESG',        standardReach:25,  standardBudgetCad:10000 },
  { code:'1B', nameVi:'ToT doanh nghiệp SME về RBP/ESG',           nameEn:'ToT – SMEs on RBP/ESG',                  standardReach:25,  standardBudgetCad:10000 },
  { code:'2A', nameVi:'Đào tạo RBP cho cán bộ công chức',          nameEn:'Training RBP – Civil servants',           standardReach:50,  standardBudgetCad:10000 },
  { code:'2B', nameVi:'Đào tạo RBP cho SME',                       nameEn:'Training RBP – SMEs',                     standardReach:50,  standardBudgetCad:10000 },
  { code:'3',  nameVi:'Rà soát pháp lý & khuyến nghị chính sách',  nameEn:'Legal review & policy recommendations',   standardReach:100, standardBudgetCad:10000 },
  { code:'4',  nameVi:'Chỉ số RBP Đà Nẵng & ESG dashboard',        nameEn:'Da Nang RBP Index & ESG dashboard',       standardReach:100, standardBudgetCad:15000 },
  { code:'5',  nameVi:'Nền tảng tự đánh giá RBP số cho SME',       nameEn:'Digital RBP self-assessment platform',    standardReach:300, standardBudgetCad:20000 },
  { code:'6',  nameVi:'Diễn đàn / Hội thảo RBP',                   nameEn:'RBP Forum / Conference',                  standardReach:230, standardBudgetCad:25000 },
  { code:'7',  nameVi:'Hướng dẫn RBP hòa nhập người khuyết tật',   nameEn:'Disability-inclusive RBP guideline',      standardReach:100, standardBudgetCad:4000  },
  { code:'8',  nameVi:'Chiến dịch truyền thông RBP quốc gia',       nameEn:'National RBP marketing campaign',         standardReach:300, standardBudgetCad:15000 },
  { code:'X',  nameVi:'Hoạt động phát sinh khác',                   nameEn:'Other / Ad-hoc activity',                 standardReach:0,   standardBudgetCad:0 },
];
export const ACTIVITY_TYPE_MAP = Object.fromEntries(ACTIVITY_TYPES.map(t => [t.code, t]));

// ── Indicator Groups (13 groups, MEL_Master parent rows) ──────
export const INDICATOR_GROUPS = [
  { code:'1111A', label:'Gov employees trained: inclusive governance (50% women)',       targetVietnam:756,  targetGlobal:1800, baseline:0, responsible:'Catalyste+ MEL and PO', subCodes:['1111.3','1111.4'] },
  { code:'1111B', label:'Gov employees trained: RBP/ESG policy awareness (50% women)',  targetVietnam:168,  targetGlobal:400,  baseline:0, responsible:'Catalyste+ MEL and PO', subCodes:['1111.3'] },
  { code:'1112',  label:'Gov employees trained: gender-sensitive M&E',                  targetVietnam:504,  targetGlobal:1200, baseline:0, responsible:'Catalyste+ MEL and PO', subCodes:['1112.2','1112.3','1112.4'] },
  { code:'1121A', label:'Meetings/events: interagency consultation (count)',             targetVietnam:11,   targetGlobal:27,   baseline:0, responsible:'Catalyste+ PM',          subCodes:['1121.1','1121.2'] },
  { code:'1121B', label:'Individuals trained: knowledge sharing platforms',              targetVietnam:462,  targetGlobal:1100, baseline:0, responsible:'',                        subCodes:['1121.2'] },
  { code:'1121C', label:'Participants in inclusive decision-making meetings',            targetVietnam:147,  targetGlobal:350,  baseline:0, responsible:'Catalyste+ PM',          subCodes:['1121.2'] },
  { code:'1122',  label:'Gov employees trained: inclusive communications strategies',   targetVietnam:630,  targetGlobal:1500, baseline:0, responsible:'Catalyste+ MEL and PO', subCodes:['1122.2'] },
  { code:'1211',  label:'Gov employees trained: public consultations techniques',       targetVietnam:756,  targetGlobal:1800, baseline:0, responsible:'Catalyste+ MEL and PO', subCodes:['1211.2','1211.3'] },
  { code:'1212',  label:'Gov employees trained: innovative civic engagement tools',     targetVietnam:504,  targetGlobal:1200, baseline:0, responsible:'Catalyste+ MEL and PO', subCodes:['1212.2'] },
  { code:'1221A', label:'Community members & non-state actors trained: civic education',targetVietnam:1050, targetGlobal:2500, baseline:0, responsible:'Catalyste+ MEL and PO', subCodes:['1221.2','1221.3'] },
  { code:'1221B', label:'Civic education & engagement events delivered (count)',         targetVietnam:5,    targetGlobal:12,   baseline:0, responsible:'',                        subCodes:['1221.3','1221.5'] },
  { code:'1221C', label:'Civic education events delivered (number)',                    targetVietnam:5,    targetGlobal:12,   baseline:0, responsible:'Catalyste+ PM',          subCodes:['1221.3','1221.4'] },
  { code:'1222',  label:'Community members trained: access to government services',     targetVietnam:924,  targetGlobal:2200, baseline:0, responsible:'Catalyste+ MEL and PO', subCodes:['1222.2'] },
];
export const INDICATOR_GROUP_MAP = Object.fromEntries(INDICATOR_GROUPS.map(g => [g.code, g]));

// ── Indicator Codes (15 codes, GAC Logic Model — Vietnam) ─────
export const INDICATOR_CODES = [
  { code:'1111.3', label:'TA chính phủ: nhận thức về chính sách/pháp luật RBP',     outputArea:'1111' },
  { code:'1111.4', label:'TA chính phủ: phát triển/áp dụng khung RBP',              outputArea:'1111' },
  { code:'1112.2', label:'TA chính phủ: thu thập & phân tích dữ liệu RBP',          outputArea:'1112' },
  { code:'1112.3', label:'TA chính phủ: nền tảng quản trị số',                      outputArea:'1112' },
  { code:'1112.4', label:'TA chính phủ: giám sát thực thi chính sách RBP',          outputArea:'1112' },
  { code:'1121.1', label:'Sự kiện/cuộc họp tham vấn liên cơ quan hoàn thành',        outputArea:'1121' },
  { code:'1121.2', label:'Kết nối cơ quan: ra quyết định hòa nhập',                 outputArea:'1121' },
  { code:'1122.2', label:'TA: chiến lược truyền thông RBP cho chính phủ',           outputArea:'1122' },
  { code:'1211.2', label:'TA: phương pháp tham gia cộng đồng',                      outputArea:'1211' },
  { code:'1211.3', label:'Tổ chức tham vấn cộng đồng về RBP',                       outputArea:'1211' },
  { code:'1212.2', label:'TA: thử nghiệm cơ chế hợp tác công-tư về RBP',           outputArea:'1212' },
  { code:'1221.2', label:'TA cộng đồng: nhận thức về quyền lợi/tác động RBP',      outputArea:'1221' },
  { code:'1221.3', label:'TA doanh nghiệp: triển khai & tuân thủ RBP',              outputArea:'1221' },
  { code:'1221.4', label:'Phát triển & triển khai chiến dịch nâng cao nhận thức',   outputArea:'1221' },
  { code:'1221.5', label:'TA: cơ chế tham vấn và phản hồi cộng đồng',              outputArea:'1221' },
  { code:'1222.2', label:'TA: nền tảng số cho cộng đồng tham gia về RBP',           outputArea:'1222' },
];
export const INDICATOR_MAP = Object.fromEntries(INDICATOR_CODES.map(i => [i.code, i]));

// ── Utilities ─────────────────────────────────────────────────
export const generateId = (_prefix) =>
  (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).substr(2,9)}-${Math.random().toString(36).substr(2,4)}`;

export const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d.includes('T') ? d : d + 'T00:00:00');
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' });
};

export const daysLeft = (d) => {
  if (!d) return null;
  const dt = new Date(d + 'T00:00:00');
  if (isNaN(dt.getTime())) return null;
  return Math.ceil((dt - new Date()) / 86400000);
};

export const guessPrio = (endDate) => {
  const dl = daysLeft(endDate);
  if (dl !== null && dl < 0)  return 'urgent';
  if (dl !== null && dl <= 7) return 'high';
  return 'medium';
};

// Quarter helpers (Fiscal Year: Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar)
export const getQuarter = (dateStr) => {
  if (!dateStr) return 'Q1';
  const m = new Date(dateStr + 'T00:00:00').getMonth() + 1;
  if (m >= 4 && m <= 6)  return 'Q1';
  if (m >= 7 && m <= 9)  return 'Q2';
  if (m >= 10 && m <= 12) return 'Q3';
  return 'Q4';
};
export const QUARTER_LABELS = { Q1:'Q1 (Apr–Jun)', Q2:'Q2 (Jul–Sep)', Q3:'Q3 (Oct–Dec)', Q4:'Q4 (Jan–Mar)' };

// MEL date format: "27-Jan-2026" ↔ "2026-01-27"
const MEL_MONTHS = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
const MEL_MONTHS_REV = Object.fromEntries(Object.entries(MEL_MONTHS).map(([k,v])=>[v,k]));
export const toMELDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${MEL_MONTHS_REV[m] || m}-${y}`;
};
export const fromMELDate = (s) => {
  if (!s) return '';
  const p = s.split('-');
  if (p.length !== 3) return s;
  return `${p[2]}-${MEL_MONTHS[p[1]] || '01'}-${p[0].padStart(2,'0')}`;
};

export const fmtCad = (n) => {
  if (!n && n !== 0) return '—';
  return '$' + new Intl.NumberFormat('en-CA').format(n) + ' CAD';
};
