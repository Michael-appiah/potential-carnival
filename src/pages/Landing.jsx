import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const FEATURES = [
  { icon: '🔗', title: 'One Shareable Link', desc: 'Get your own URL you can drop anywhere — email, LinkedIn, WhatsApp, or your email signature.' },
  { icon: '⬛', title: 'Instant QR Code', desc: 'Every card auto-generates a QR code. Print it, share it, scan it — connections made effortless.' },
  { icon: '✏️', title: 'Always Current', desc: 'Update your phone, title, or company and everyone with your link sees the latest instantly.' },
  { icon: '📱', title: 'Mobile-First', desc: 'Looks stunning on every device. Your card, perfected on the screen it\'s most often seen on.' },
  { icon: '⚡', title: 'Up in 2 Minutes', desc: 'Sign up, fill in your details, and your card is live. No design skills, no setup headaches.' },
  { icon: '🔒', title: 'You\'re in Control', desc: 'Edit your card any time. Your information, your way — always updated, never outdated.' },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="landing-bg">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand gradient-text">NCard</div>
        <div className="navbar-actions">
          {user ? (
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              My Dashboard →
            </button>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => navigate('/login')}>Log in</button>
              <button className="btn btn-primary" onClick={() => navigate('/signup')}>Get Started Free</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div style={{ paddingTop: 64 }}>
        <div className="landing-hero">
          <div className="landing-badge">
            <span>✦</span> Digital Business Cards
          </div>
          <h1 className="landing-headline">
            Your Card.<br />
            <span className="gradient-text">Your Identity.</span><br />
            Everywhere.
          </h1>
          <p className="landing-subtitle">
            Create a beautiful digital business card in minutes.
            Share it with a link or QR code — no paper, no limits, no expiry.
          </p>
          <div className="landing-cta">
            <button
              className="btn btn-primary"
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
            >
              {user ? 'Go to Dashboard →' : 'Create My Card — Free'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/card/demo')}
            >
              See an Example ↗
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="landing-features">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="feature-card glass fade-up"
              style={{ animationDelay: `${0.05 + i * 0.07}s` }}
            >
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA strip */}
        <div style={{ textAlign: 'center', padding: '80px 24px 0' }}>
          <div style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 14 }}>
            Ready to go digital?
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: 16, marginBottom: 30 }}>
            Join thousands sharing their cards the smart way.
          </p>
          <button
            className="btn btn-primary"
            style={{ fontSize: 16, padding: '14px 36px' }}
            onClick={() => navigate(user ? '/dashboard' : '/signup')}
          >
            {user ? 'Open Dashboard →' : 'Create Your Card — It\'s Free'}
          </button>
        </div>

        <div className="landing-footer">© 2026 NCard — Share smarter.</div>
      </div>
    </div>
  );
};

export default Landing;
