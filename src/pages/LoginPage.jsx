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

        <h2 className="login-heading">Welcome back</h2>
        <p className="login-sub">Enter your email to sign in</p>

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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="login-note">
          First-time login will automatically be added as a Viewer.
        </p>
      </div>
    </div>
  );
}
