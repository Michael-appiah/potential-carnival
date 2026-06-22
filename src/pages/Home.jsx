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
                    <span className="logo-icon">✨</span>
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="hero-features">
                        <div className="feature">
                            <span className="feature-icon">⚡</span> Instant Delivery
                        </div>
                        <div className="feature">
                            <span className="feature-icon">🔒</span> Secure Payments
                        </div>
                        <div className="feature">
                            <span className="feature-icon">♾️</span> No Expiration
                        </div>
                    </div>
                    
                    <div className="security-notice" style={{ marginTop: '30px', padding: '16px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569', lineHeight: '1.5', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <strong>🔒 Enhanced Security:</strong> In compliance with the U.S. Bank Secrecy Act (BSA) and anti-money laundering (AML) regulations, we have implemented advanced security measures. All gift card purchases are now subject to <strong>manual clearance</strong> to prevent fraudulent activities and ensure a safe gifting experience.
                    </div>
                </div>

                {/* Animated Cards Showcase */}
                <div className="hero-visual">
                    <div className="cards-wrapper">
                        {/* Apple Card */}
                        <div className="showcase-card card-1 hologram-apple float-animation">
                            <div className="hologram-logo">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.04C14.054 2.153 16.023 3.326 17 5.5c-1.92.955-2.88 2.664-2.58 4.717.3 2.053 1.98 3.515 3.96 3.955-1.127 2.946-3.32 6.55-5.996 6.55-1.42 0-2.812-.916-4.23-.916-1.417 0-2.776.916-4.23.916-2.556 0-4.996-3.856-6.196-6.726C-4.303 8.847 4.298 5.75 6.84 5.75c1.455 0 2.77.828 4.092.828 1.134 0 2.274-.828 3.654-.828-.276-2.025-1.503-3.66-3.11-4.572-.093-.053-.188-.103-.284-.15-.472.63-1.09.77-1.748.77-1.155 0-2.268-.785-2.268-2.268C7.176.51 8.844-.06 10.372.004 11.026.03 11.536.572 12 2.04z"/>
                                </svg>
                                Apple
                            </div>
                            <div className="hologram-amount">$100.00</div>
                        </div>

                        {/* PlayStation Card */}
                        <div className="showcase-card card-2 hologram-playstation float-animation-delayed">
                            <div className="hologram-logo">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-3.5l5.5-4.5-5.5-4.5v9z"/>
                                </svg>
                                PlayStation
                            </div>
                            <div className="hologram-amount">$50.00</div>
                        </div>

                        {/* Steam Card */}
                        <div className="showcase-card card-3 hologram-steam float-animation-slow">
                            <div className="hologram-logo">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.373 0 0 5.373 0 12c0 6.628 5.373 12 12 12s12-5.372 12-12C24 5.373 18.627 0 12 0zm5.105 16.57c-1.32.723-2.905.773-4.148.067-.534-.303-1.027-.725-1.46-1.22l-2.88 1.157c-.66.264-1.353-.178-1.46-.88-.1-6.52 6.13-9.56 10.35-4.32 1.48 1.83 1.13 3.65-.4 5.2zm-2.73-6.28c-1.05-.58-2.31-.62-3.3-.06-1.57.9-1.92 2.87-1.02 4.44.57 1.05 1.55 1.63 2.68 1.63.2 0 .42-.02.62-.06 1.57-.3 2.5-1.85 2.18-3.4-.1-.4-.36-.78-.7-1.12-1.34-1.32-3.8-1.5-5.23-.2z"/>
                                </svg>
                                Steam
                            </div>
                            <div className="hologram-amount">$25.00</div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer style={{ width: '100%', textAlign: 'center', padding: '32px 24px', color: '#94a3b8', fontSize: '13px', marginTop: 'auto' }}>
                Copyright &copy; 2018 to 2026 Denver Colorado U.S
            </footer>
        </div>
    );
};

export default Home;
