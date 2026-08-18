import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const CardView = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/.netlify/functions/card-get?username=${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(d => {
        if (d.card) setCard(d.card);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  /* Update page title */
  useEffect(() => {
    if (card) document.title = `${card.name} — Digital Card | NCard`;
    else document.title = 'NCard';
    return () => { document.title = 'NCard'; };
  }, [card]);

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="center-screen">
        <div style={{ fontSize: 56 }}>🔍</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Card Not Found</div>
        <div style={{ color: 'var(--text-2)', fontSize: 15 }}>No card exists for @{username}</div>
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => navigate('/signup')}>
          Create Your Own Card
        </button>
      </div>
    );
  }

  const initial   = card.name ? card.name.trim()[0].toUpperCase() : '?';
  const roleText  = [card.title, card.company].filter(Boolean).join(' · ');

  const actions = [
    card.email    && { emoji: '📧', label: 'Email',    bg: '#3b82f6', href: `mailto:${card.email}` },
    card.phone    && { emoji: '📞', label: 'Call',     bg: '#10b981', href: `tel:${card.phone}` },
    card.whatsapp && { emoji: '💬', label: 'WhatsApp', bg: '#25d366', href: `https://wa.me/${card.whatsapp.replace(/\D/g, '')}` },
    card.linkedin && { emoji: '💼', label: 'LinkedIn', bg: '#0077b5', href: card.linkedin.startsWith('http') ? card.linkedin : `https://${card.linkedin}` },
    card.website  && { emoji: '🌐', label: 'Website',  bg: '#6366f1', href: card.website.startsWith('http') ? card.website : `https://${card.website}` },
  ].filter(Boolean);

  return (
    <div className="card-page">
      <div className="digital-card glass">
        {/* Cover banner */}
        <div className="pub-card-cover" />

        {/* Card body */}
        <div className="pub-card-body">
          {/* Avatar */}
          <div className="pub-avatar">
            {card.photo ? (
              <img
                src={card.photo}
                alt={card.name}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.textContent = initial;
                }}
              />
            ) : initial}
          </div>

          <div className="pub-name">{card.name}</div>
          {roleText  && <div className="pub-role">{roleText}</div>}
          {card.location && (
            <div className="pub-location">
              <span>📍</span>{card.location}
            </div>
          )}

          {actions.length > 0 && (
            <>
              <div className="pub-divider" />
              <div className="pub-actions">
                {actions.map((a) => (
                  <a
                    key={a.label}
                    id={`action-${a.label.toLowerCase()}`}
                    className="pub-action"
                    href={a.href}
                    target={a.href.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                  >
                    <div className="pub-action-icon" style={{ background: `${a.bg}22` }}>
                      {a.emoji}
                    </div>
                    {a.label}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pub-card-footer">
          <span>Powered by</span>
          <span
            className="pub-card-footer-brand gradient-text"
            onClick={() => navigate('/')}
          >
            NCard
          </span>
        </div>
      </div>

      <div className="card-page-cta">
        <button
          className="btn btn-ghost"
          id="create-own-card-btn"
          style={{ fontSize: 13 }}
          onClick={() => navigate('/signup')}
        >
          Create your own card →
        </button>
      </div>
    </div>
  );
};

export default CardView;
