import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            {/* Navigation Bar */}
            <nav className="home-nav">
                <div className="nav-logo">
                    <span className="logo-icon"><img src="https://cdn.jsdelivr.net/npm/lucide-static@0.344.0/icons/sparkles.svg" width="24" height="24" alt="Logo" /></span>
                    <span className="logo-text">Recharge Store</span>
                </div>
                <button 
                    onClick={() => navigate('/store')} 
                    className="nav-btn-buy"
                >
                    Buy a Card
                </button>
            </nav>

            {/* Hero Section */}
            <main className="hero-section">
                <div className="hero-content animate-fadeInUp">
                    <div className="badge">Instant Delivery Guaranteed</div>
                    <h1 className="hero-title">
                        The Smarter Way to Send <br/>
                        <span className="text-gradient">Digital Gift Cards</span>
                    </h1>
                    <p className="hero-subtitle">
                        Send premium digital gift cards to surprise your loved ones! Delivered securely to their inbox in seconds.
                    </p>
                    
                    <div className="hero-actions">
                        <button 
                            onClick={() => navigate('/store')} 
                            className="btn hero-btn-primary"
                        >
                            Buy a Card Now
                            <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.344.0/icons/arrow-right.svg" width="20" height="20" alt="Arrow" style={{ filter: 'invert(1)' }} />
                        </button>
                    </div>
                    
                    <div className="hero-features">
                        <div className="feature">
                            <span className="feature-icon"><img src="https://cdn.jsdelivr.net/npm/lucide-static@0.344.0/icons/zap.svg" width="16" height="16" alt="Zap" style={{ opacity: 0.7 }} /></span> Instant Delivery
                        </div>
                        <div className="feature">
                            <span className="feature-icon"><img src="https://cdn.jsdelivr.net/npm/lucide-static@0.344.0/icons/lock.svg" width="16" height="16" alt="Lock" style={{ opacity: 0.7 }} /></span> Secure Payments
                        </div>
                        <div className="feature">
                            <span className="feature-icon"><img src="https://cdn.jsdelivr.net/npm/lucide-static@0.344.0/icons/infinity.svg" width="16" height="16" alt="Infinity" style={{ opacity: 0.7 }} /></span> No Expiration
                        </div>
                    </div>
                    
                    <div className="security-notice" style={{ marginTop: '36px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ background: '#e2e8f0', padding: '8px', borderRadius: '50%', display: 'flex', flexShrink: 0 }}>
                            <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.344.0/icons/shield-check.svg" width="16" height="16" alt="Shield" />
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
                            <strong style={{ color: '#334155', fontWeight: '600' }}>Federal AML Compliance</strong><br />
                            To ensure a secure environment and comply with the U.S. Bank Secrecy Act, all transactions undergo mandatory <strong>manual clearance</strong> to prevent money laundering and protect our customers.
                        </div>
                    </div>
                </div>

                {/* Animated Cards Showcase */}
                <div className="hero-visual">
                    <div className="cards-wrapper">
                        {/* Apple Card */}
                        <div className="showcase-card card-1 hologram-apple float-animation">
                            <div className="hologram-logo">
                                <img src="https://cdn.simpleicons.org/apple/111827" width="24" height="24" alt="Apple" />
                                Apple
                            </div>
                            <div className="hologram-amount">$100.00</div>
                        </div>

                        {/* PlayStation Card */}
                        <div className="showcase-card card-2 hologram-playstation float-animation-delayed">
                            <div className="hologram-logo">
                                <img src="https://cdn.simpleicons.org/playstation/111827" width="24" height="24" alt="PlayStation" />
                                PlayStation
                            </div>
                            <div className="hologram-amount">$50.00</div>
                        </div>

                        {/* Steam Card */}
                        <div className="showcase-card card-3 hologram-steam float-animation-slow">
                            <div className="hologram-logo">
                                <img src="https://cdn.simpleicons.org/steam/111827" width="24" height="24" alt="Steam" />
                                Steam
                            </div>
                            <div className="hologram-amount">$25.00</div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer style={{ width: '100%', textAlign: 'center', padding: '32px 24px', color: '#94a3b8', fontSize: '13px', marginTop: 'auto' }}>
                Copyright &copy; 2018 - 2026 Denver Colorado U.S
            </footer>
        </div>
    );
};

export default Home;
