import React, { createContext, useContext, useRef, useState } from 'react';

const ConfirmContext = createContext(null);

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState({ open: false, message: '' });
  const resolveRef = useRef(null);

  const confirm = (message) => new Promise((resolve) => {
    resolveRef.current = resolve;
    setState({ open: true, message });
  });

  const handleOk = () => {
    setState({ open: false, message: '' });
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setState({ open: false, message: '' });
    resolveRef.current?.(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div className="modal-overlay" onClick={handleCancel} style={{ zIndex: 9999 }}>
          <div
            className="modal-content glass-card"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 380, padding: '24px 28px' }}
          >
            <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-line' }}>
              {state.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn" onClick={handleCancel}>Hủy</button>
              <button className="btn btn-danger" onClick={handleOk}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
