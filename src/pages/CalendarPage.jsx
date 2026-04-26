import React, { useState } from 'react';
import './CalendarPage.css';

const CalendarPage = () => {
  const [calUrl, setCalUrl] = useState(() => localStorage.getItem('ilead_cal_url') || '');
  const [inputUrl, setInputUrl] = useState(calUrl);
  const [showConfig, setShowConfig] = useState(!calUrl);

  const applyUrl = () => {
    const url = inputUrl.trim();
    setCalUrl(url);
    localStorage.setItem('ilead_cal_url', url);
    setShowConfig(false);
  };

  const loadJim = () => {
    const url = 'https://calendar.google.com/calendar/embed?src=thanhxpr%40gmail.com&ctz=Asia%2FHo_Chi_Minh';
    setInputUrl(url); setCalUrl(url);
    localStorage.setItem('ilead_cal_url', url);
    setShowConfig(false);
  };

  return (
    <div className="cal-outer animate-fade-in">
      {/* Topbar */}
      <div className="cal-top-actions">
        <button className="btn btn-sm" onClick={loadJim}>🔗 Load Jim's Calendar</button>
        <button className="btn btn-sm" onClick={() => setShowConfig(v => !v)}>⚙ Cài đặt</button>
      </div>

      {showConfig && (
        <div className="cal-setup glass-card">
          <div className="cal-setup-label">Google Calendar embed URL (Calendar Settings → Get embeddable link)</div>
          <div className="cal-setup-row">
            <input
              className="cal-setup-input"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/embed?src=..."
            />
            <button className="btn btn-primary btn-sm" onClick={applyUrl}>Load</button>
          </div>
        </div>
      )}

      {calUrl ? (
        <iframe
          className="cal-frame"
          src={calUrl}
          frameBorder="0"
          title="Google Calendar"
        />
      ) : (
        <div className="cal-placeholder">
          <div className="cal-placeholder-icon">🗓</div>
          <div style={{fontSize:'15px', fontWeight:600, marginBottom:'6px'}}>Google Calendar</div>
          <div style={{fontSize:'13px', color:'var(--text2)', marginBottom:'16px'}}>Nhập URL embed hoặc load lịch của Jim</div>
          <button className="btn btn-primary" onClick={loadJim}>Load Jim's Calendar</button>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
