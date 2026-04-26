import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export const Modal = ({ isOpen, onClose, title, children, onSubmit, submitLabel = 'Lưu', secondaryLabel, onSecondary }) => {
  const bodyRef = useRef(null);

  // Scroll body to top each time modal opens
  useEffect(() => {
    if (isOpen && bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // Global ESC key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" ref={bodyRef}>
          {children}
        </div>
        {onSubmit && (
          <div className="modal-footer">
            {secondaryLabel && onSecondary
              ? <button className="btn" onClick={onSecondary}>{secondaryLabel}</button>
              : <button className="btn" onClick={onClose}>Hủy</button>
            }
            <button className="btn btn-primary" onClick={onSubmit}>{submitLabel}</button>
          </div>
        )}
      </div>
    </div>
  );
};

