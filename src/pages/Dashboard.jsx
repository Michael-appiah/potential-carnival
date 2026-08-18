import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '../AuthContext';
import CardPreview from '../components/CardPreview';

const EMPTY_CARD = {
  name: '', title: '', company: '', email: '',
  phone: '', whatsapp: '', website: '', linkedin: '',
  location: '', photo: '',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const [card, setCard] = useState({ ...EMPTY_CARD, name: user?.name || '', email: user?.email || '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const cardUrl = `${window.location.origin}/card/${user?.username}`;

  /* ── Load existing card ──────────────────────────────────── */
  useEffect(() => {
    if (!user?.username) return;
    fetch(`/.netlify/functions/card-get?username=${user.username}`)
      .then(r => r.json())
      .then(d => { if (d.card) setCard(d.card); })
      .catch(() => {});
  }, [user]);

  /* ── Generate QR code ────────────────────────────────────── */
  useEffect(() => {
    if (!user?.username) return;
    QRCode.toDataURL(cardUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#a5b4fc', light: '#0d1117' },
      errorCorrectionLevel: 'M',
    }).then(url => setQrDataUrl(url)).catch(() => {});
  }, [user, cardUrl]);

  /* ── Handlers ────────────────────────────────────────────── */
  const handle = (e) => setCard(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/.netlify/functions/card-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(card),
      });
      const data = await res.json();
      if (res.ok) showToast('Card saved! ✓');
      else showToast('Error: ' + (data.error || 'Failed to save'));
    } catch {
      showToast('Network error — check connection');
    } finally {
      setSaving(false);
    }
  };

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(cardUrl).then(() => showToast('Link copied! 🔗'));
  };

  const handleLogout = () => { logout(); navigate('/'); };

  /* ── Field definition ────────────────────────────────────── */
  const profileFields = [
    { name: 'name',     label: 'Full Name',    placeholder: 'Jane Doe',                type: 'text'  },
    { name: 'photo',    label: 'Photo URL',     placeholder: 'https://…/photo.jpg',     type: 'url'   },
    { name: 'location', label: 'Location',      placeholder: 'Accra, Ghana',            type: 'text'  },
  ];
  const jobFields = [
    { name: 'title',   label: 'Job Title', placeholder: 'CEO'       },
    { name: 'company', label: 'Company',   placeholder: 'Acme Corp' },
  ];
  const contactFields = [
    { name: 'email',    label: 'Email',    placeholder: 'you@example.com',    type: 'email' },
    { name: 'phone',    label: 'Phone',    placeholder: '+1 555 234 5678',    type: 'tel'   },
    { name: 'whatsapp', label: 'WhatsApp', placeholder: '+1 555 234 5678',    type: 'tel'   },
    { name: 'website',  label: 'Website',  placeholder: 'https://yoursite.com', type: 'url' },
    { name: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/you', type: 'url' },
  ];

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand gradient-text" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          NCard
        </div>
        <div className="navbar-actions">
          <button className="btn btn-ghost" onClick={() => window.open(cardUrl, '_blank', 'noopener')}>
            View Card ↗
          </button>
          <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
        </div>
      </nav>

      <div className="dashboard-page">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <div className="dashboard-title">My Business Card</div>
            <div className="dashboard-subtitle">
              Hi, {user?.name?.split(' ')[0]} 👋 — fill in your details and hit Save.
            </div>
          </div>
          <div className="dashboard-actions">
            <button className="btn btn-ghost" id="copy-link-btn" onClick={copyLink}>Copy Link 🔗</button>
            <button className="btn btn-primary" id="save-card-btn" onClick={save} disabled={saving}>
              {saving ? <><div className="spinner" /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* ── Form ─────────────────────────── */}
          <div className="glass dashboard-form">
            {/* Profile */}
            <div className="section-label">Profile</div>
            <div className="form-fields">
              {profileFields.map(f => (
                <div key={f.name} className="form-group">
                  <label className="form-label" htmlFor={`field-${f.name}`}>{f.label}</label>
                  <input
                    id={`field-${f.name}`}
                    className="form-input"
                    name={f.name}
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    value={card[f.name]}
                    onChange={handle}
                  />
                </div>
              ))}
              <div className="form-row">
                {jobFields.map(f => (
                  <div key={f.name} className="form-group">
                    <label className="form-label" htmlFor={`field-${f.name}`}>{f.label}</label>
                    <input
                      id={`field-${f.name}`}
                      className="form-input"
                      name={f.name}
                      type="text"
                      placeholder={f.placeholder}
                      value={card[f.name]}
                      onChange={handle}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="section-label" style={{ marginTop: 28 }}>Contact Info</div>
            <div className="form-fields">
              {contactFields.map(f => (
                <div key={f.name} className="form-group">
                  <label className="form-label" htmlFor={`field-${f.name}`}>{f.label}</label>
                  <input
                    id={`field-${f.name}`}
                    className="form-input"
                    name={f.name}
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    value={card[f.name]}
                    onChange={handle}
                  />
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 28, padding: 14 }}
              onClick={save}
              disabled={saving}
              id="save-card-btn-bottom"
            >
              {saving ? <><div className="spinner" /> Saving…</> : 'Save Changes'}
            </button>
          </div>

          {/* ── Preview panel ─────────────────── */}
          <div>
            <div className="glass preview-panel">
              <div className="preview-label">Live Preview</div>
              <CardPreview card={card} />

              {/* QR Code */}
              <div className="qr-box">
                <div className="qr-label">Your QR Code</div>
                {qrDataUrl
                  ? <img src={qrDataUrl} alt="QR Code" className="qr-image" width={200} height={200} />
                  : (
                    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                      Save your card to see QR code
                    </div>
                  )
                }
                <div className="qr-url">{cardUrl}</div>
                <button
                  className="btn btn-outline-accent"
                  style={{ width: '100%', marginTop: 12, fontSize: 13 }}
                  onClick={copyLink}
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
};

export default Dashboard;
