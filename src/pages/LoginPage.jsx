import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email,   setEmail]   = useState('');
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
    // On success, AuthGuard will automatically render the app
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

        <h2 className="login-heading">Chào mừng trở lại</h2>
        <p className="login-sub">Nhập email để đăng nhập</p>

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
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="login-note">
          Lần đầu đăng nhập sẽ tự động được thêm vào với quyền Viewer.
        </p>
      </div>
    </div>
  );
}
