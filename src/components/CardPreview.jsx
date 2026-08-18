import React from 'react';

/**
 * CardPreview — mini live preview of the digital card shown in the Dashboard.
 * Renders instantly from local form state (no network calls).
 */
const CardPreview = ({ card }) => {
  const initial = card.name ? card.name.trim()[0].toUpperCase() : '?';
  const role = [card.title, card.company].filter(Boolean).join(' · ');

  const chips = [
    card.email    && { emoji: '📧', label: 'Email' },
    card.phone    && { emoji: '📞', label: 'Call' },
    card.whatsapp && { emoji: '💬', label: 'WhatsApp' },
    card.linkedin && { emoji: '💼', label: 'LinkedIn' },
    card.website  && { emoji: '🌐', label: 'Website' },
  ].filter(Boolean);

  return (
    <div className="card-mini">
      {/* Cover */}
      <div className="card-mini-cover" />

      {/* Body */}
      <div className="card-mini-body">
        {/* Avatar */}
        <div className="card-mini-avatar">
          {card.photo ? (
            <img
              src={card.photo}
              alt={card.name}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : initial}
        </div>

        <div className="card-mini-name">{card.name || 'Your Name'}</div>
        {role && <div className="card-mini-role">{role}</div>}
        {card.location && <div className="card-mini-loc">📍 {card.location}</div>}

        {chips.length > 0 && (
          <div className="card-mini-chips">
            {chips.map((c) => (
              <span key={c.label} className="card-mini-chip">
                {c.emoji} {c.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardPreview;
