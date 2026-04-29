import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { signIn, verifyOtp } = useAuth();
  const [email,   setEmail]   = useState('');
  // step: 'email' | 'otp'
  const [step,    setStep]    = useState('email');
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  /* ── Step 1: gửi OTP ── */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    const { error } = await signIn(trimmed);
    setLoading(false);
    if (error) setError(error.message);
    else setStep('otp');
  };

  /* ── Step 2: xác nhận mã OTP ── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const token = code.trim();
    if (token.length < 4) return;
    setLoading(true);
    setError('');
    const { error } = await verifyOtp(email.trim().toLowerCase(), token);
    setLoading(false);
    if (error) {
      setError('Mã không đúng hoặc đã hết hạn. Vui lòng thử lại.');
      setCode('');
    }
    // nếu OK → AuthContext tự cập nhật session → App render
  };

  const resetAll = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setError('');
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

        {step === 'email' && (
          <>
            <h2 className="login-heading">Chào mừng trở lại</h2>
            <p className="login-sub">Nhập email để nhận mã đăng nhập 6 số</p>

            <form onSubmit={handleSendOtp} className="login-form">
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
                {loading ? 'Đang gửi...' : 'Gửi mã đăng nhập'}
              </button>
            </form>

            <p className="login-note">
              Chỉ email trong danh sách team mới được truy cập.
            </p>
          </>
        )}

        {step === 'otp' && (
          <div className="login-otp-step">
            <div className="login-sent-icon">📬</div>
            <h3>Nhập mã xác nhận</h3>
            <p>
              Chúng tôi đã gửi mã đến<br />
              <strong>{email}</strong>
            </p>

            <form onSubmit={handleVerifyOtp} className="login-form">
              <input
                type="text"
                inputMode="numeric"
                className="login-otp-input"
                placeholder="Nhập mã từ email"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
                autoComplete="one-time-code"
              />
              {error && <div className="login-error">{error}</div>}
              <button
                type="submit"
                className="login-btn"
                disabled={loading || code.trim().length < 4}
              >
                {loading ? 'Đang xác nhận...' : 'Xác nhận'}
              </button>
            </form>

            <p className="login-sent-note">
              Mã có hiệu lực trong <strong>60 phút</strong>.
            </p>
            <button className="login-retry" onClick={resetAll}>
              Dùng email khác / Gửi lại
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
