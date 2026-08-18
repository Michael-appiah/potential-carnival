import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => {
    let val = e.target.value;
    if (e.target.name === 'username') {
      val = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    }
    setForm(prev => ({ ...prev, [e.target.name]: val }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/auth-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Signup failed'); return; }
      login(data.token, data.user);
      navigate('/dashboard');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass auth-card fade-up">
        <div className="auth-logo gradient-text" onClick={() => navigate('/')}>NCard</div>
        <h1 className="auth-title">Create your card</h1>
        <p className="auth-subtitle">Free forever. No credit card needed.</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">Full Name</label>
            <input
              id="signup-name"
              className="form-input"
              name="name"
              type="text"
              placeholder="John Appleseed"
              value={form.name}
              onChange={handle}
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              className="form-input"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handle}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-username">
              Username <span style={{ color: 'var(--text-3)', textTransform: 'none', fontWeight: 400 }}>(your card URL)</span>
            </label>
            <input
              id="signup-username"
              className="form-input"
              name="username"
              type="text"
              placeholder="john-doe"
              value={form.username}
              onChange={handle}
              required
              minLength={3}
              maxLength={30}
              autoComplete="username"
            />
            {form.username.length >= 3 && (
              <span className="url-hint">
                ✦ rechargecard.store/card/{form.username}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              className="form-input"
              name="password"
              type="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={handle}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <button
            id="signup-submit"
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '14px', marginTop: 6 }}
          >
            {loading ? <div className="spinner" /> : 'Create My Card →'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <span className="auth-link" onClick={() => navigate('/login')}>Log in</span>
        </div>
      </div>
    </div>
  );
};

export default Signup;
