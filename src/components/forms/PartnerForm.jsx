import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { generateId } from '../../utils/store';
import { Modal } from '../Modal';

const COLORS = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#0891b2', '#d97706', '#db2777', '#059669', '#6366f1'];

export const PartnerForm = ({ isOpen, onClose, partnerId = null }) => {
  const { partners, addPartner, updatePartner } = useData();
  const existing = partnerId ? partners.find((p) => p.id === partnerId) : null;

  const [formData, setFormData] = useState({
    name: existing?.name || '',
    sector: existing?.sector || '',
    region: existing?.region || '',
    color: existing?.color || COLORS[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (existing) {
      updatePartner(existing.id, formData);
    } else {
      addPartner({ id: generateId('p'), ...formData });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existing ? 'Sửa Đối Tác' : 'Thêm Đối Tác'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Tên đối tác</label>
          <input
            autoFocus
            required
            className="form-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ví dụ: VCCI MMTN"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Lĩnh vực</label>
            <input
              className="form-input"
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
              placeholder="Association, NGO..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Khu vực</label>
            <input
              className="form-input"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              placeholder="Hà Nội, Đà Nẵng..."
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Màu sắc</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <div
                key={c}
                onClick={() => setFormData({ ...formData, color: c })}
                style={{
                  width: '24px', height: '24px', borderRadius: '50%', background: c,
                  cursor: 'pointer',
                  border: formData.color === c ? '2px solid var(--text)' : '2px solid transparent',
                  transform: formData.color === c ? 'scale(1.1)' : 'none',
                  transition: 'all var(--transition)'
                }}
              ></div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary">{existing ? 'Cập nhật' : 'Thêm mới'}</button>
        </div>
      </form>
    </Modal>
  );
};
