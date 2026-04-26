import React, { useState } from 'react';
import { Modal } from '../Modal';
import { useToast } from '../../context/ToastContext';

export const ContactForm = ({ isOpen, onClose }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({ name: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setTimeout(() => {
      addToast('Message sent successfully!', 'success');
      onClose();
      setFormData({ name: '', message: '' });
    }, 400); // Simulate network delay
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact Us / Feedback">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            autoFocus
            className="form-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea
            required
            className="form-input"
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="How can we help?"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" id="submit-btn" className="btn btn-primary">Gửi</button>
        </div>
      </form>
    </Modal>
  );
};
