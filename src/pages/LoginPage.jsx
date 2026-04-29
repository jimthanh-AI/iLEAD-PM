import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    const { error } = await signIn(trimmed);
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <span className="login-logo-i">i</span>
          <span className="login-logo-lead">LEAD</span>
        </div>
        <p className="login-tagline">Project Management · Catalyste+ Vietnam</p>

        {sent ? (
          /* ── Sent state ── */
          <div className="login-sent">
            <div className="login-sent-icon">📬</div>
            <h3>Kiểm tra email của bạn</h3>
            <p>
              Chúng tôi đã gửi liên kết đăng nhập đến<br />
              <strong>{email}</strong>
            </p>
            <p className="login-sent-note">
              Click vào liên kết trong email để vào app.<br />
              Liên kết có hiệu lực trong <strong>60 phút</strong>.
            </p>
            <button className="login-retry" onClick={() => { setSent(false); setEmail(''); }}>
              Thử email khác
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <h2 className="login-heading">Chào mừng trở lại</h2>
            <p className="login-sub">Nhập email để nhận liên kết đăng nhập</p>

            <form onSubmit={handleSubmit} className="login-form">
              <input
                type="email"
                className="login-input"
                placeholder="email@catalysteplus.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                required
              />
              {error && <div className="login-error">{error}</div>}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Đang gửi...' : 'Gửi Magic Link'}
              </button>
            </form>

            <p className="login-note">
              Chỉ email trong danh sách team mới được truy cập.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
