export const initialData = {
  partners: [
    { id: 'p1', name: 'VCCI MTTN', color: '#2563eb', sector: 'Association', region: 'Da Nang' },
    { id: 'p2', name: 'APED Ha Noi', color: '#7c3aed', sector: 'Government', region: 'Ha Noi' },
  ],
  projects: [
    { id: 'pr1', partnerId: 'p1', name: 'Đào tạo RBP cơ bản 2026', status: 'in_progress', subCode: '1221.3', startDate: '2026-01-10', endDate: '2026-04-20', pos: 0 },
    { id: 'pr2', partnerId: 'p2', name: 'Research review luật doanh nghiệp', status: 'in_progress', subCode: '1212.2', startDate: '2026-01-15', endDate: '2026-06-30', pos: 0 },
  ],
  activities: [
    { id: 'a1', projectId: 'pr1', name: 'Tổ chức 2 lớp TOT cho SMEs', status: 'in_progress', stage: 'S7', ballOwner: 'Partner', type: 'in-country', startDate: '2026-01-10', endDate: '2026-04-20', nextAction: 'Link tài liệu backup', subCode: '1221.3', pos: 0 },
    { id: 'a2', projectId: 'pr2', name: 'Review luật DN hiện hành', status: 'not_started', stage: 'S2', ballOwner: 'CR/Mnr', type: 'local', startDate: '2026-01-15', endDate: '2026-06-30', nextAction: 'Gửi TOR cho Jane', subCode: '1212.2', pos: 0 },
  ],
  tasks: [
    { id: 't1', activityId: 'a1', name: 'Gửi link tài liệu backup', status: 'done', assignee: 'CR/Mnr', dueDate: '2026-04-10', pos: 0 },
    { id: 't2', activityId: 'a1', name: 'Yêu cầu VCCI ký consulting', status: 'in_progress', assignee: 'Partner', dueDate: '2026-04-18', pos: 1 },
  ]
};

const DB_KEY = 'ilead_v4_data';

export const loadData = () => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load DB', e);
  }
  return initialData;
};

export const saveData = (data) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save DB', e);
  }
};

export const generateId = (prefix = 'id') => {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
};
