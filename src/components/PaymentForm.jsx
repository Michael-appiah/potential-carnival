import React, { useState, useEffect } from 'react';

const PaymentForm = ({ amount, email, type, onSuccess, onCancel }) => {
    // Form Inputs
    const [cardHolder, setCardHolder] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardPin, setCardPin] = useState('');

    // OTP/PIN Challenge States
    const [step, setStep] = useState('method_select'); // 'method_select' | 'card_input' | 'otp_challenge' | 'pin_challenge' | 'open_url_challenge'
    const [otp, setOtp] = useState('');
    const [reference, setReference] = useState('');
    const [openUrl, setOpenUrl] = useState('');
    
    // Payment Method State
    const [paymentMethod, setPaymentMethod] = useState(''); // Will be set after detection
    
    // Bank Transfer States
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    
    // Mobile Money States
    const [momoProvider, setMomoProvider] = useState('mtn');
    const [momoPhone, setMomoPhone] = useState('');

    // Location State
    const [isAfrica, setIsAfrica] = useState(null); // null = loading, true/false = detected
    const [userCountry, setUserCountry] = useState('');

    useEffect(() => {
        const checkLocation = async () => {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if (data.continent_code === 'AF') {
                    setIsAfrica(true);
                    setUserCountry(data.country_name || 'Africa');
                    // Africa users start at method_select — don't auto-pick a method yet
                    setStep('method_select');
                } else {
                    setIsAfrica(false);
                    setUserCountry(data.country_name || '');
                    // Non-Africa: skip straight to card_input with 'card' as the default
                    setPaymentMethod('card');
                    setStep('card_input');
                }
            } catch (err) {
                console.error('Failed to get location', err);
                // Default to non-Africa flow on error
                setIsAfrica(false);
                setPaymentMethod('card');
                setStep('card_input');
            }
        };
        checkLocation();
    }, []);
    
    // Status States
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const formattedAmountGhs = (amount * 15.0).toFixed(2); // Exchange rate: 1 USD = 15 GHS

    // Format card number with spaces every 4 digits
    const handleCardNumberChange = (e) => {
        let value = e.target.value.replace(/\D/g, '').substring(0, 16);
        let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
        setCardNumber(formatted);
    };

    // Format expiry date as MM/YY
    const handleExpiryChange = (e) => {
        let value = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }
        setExpiry(value);
    };

    // Handle Africa payment method selection
    const handleAfricaMethodSelect = (method) => {
        setPaymentMethod(method);
        setStep('card_input');
        setErrorMsg('');
    };

    // Initialize Card Charge
    const handleSubmitCard = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (cardNumber.replace(/\s+/g, '').length < 16) {
            setErrorMsg('Please enter a valid 16-digit card number.');
            return;
        }
        if (expiry.length < 5) {
            setErrorMsg('Please enter a valid expiry date (MM/YY).');
            return;
        }
        if (cvv.length < 3) {
            setErrorMsg('Please enter a valid 3 or 4 digit CVV.');
            return;
        }

        const [expiryMonth, expiryYear] = expiry.split('/');

        setIsLoading(true);
        setLoadingText('Processing payment securely...');

        try {
            const response = await fetch('/.netlify/functions/paystack-charge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cardHolder,
                    cardNumber,
                    expiryMonth,
                    expiryYear,
                    cvv,
                    cardPin,
                    email,
                    amountInUsd: amount,
                    type
                })
            });

            const data = await response.json();

            if (!data.status) {
                // If Paystack reports error
                setErrorMsg(data.message || 'Payment failed. Please verify your details.');
                setIsLoading(false);
                return;
            }

            const status = data.data.status;
            const ref = data.data.reference;
            setReference(ref);

            if (status === 'send_otp') {
                setStep('otp_challenge');
                setIsLoading(false);
            } else if (status === 'send_pin') {
                setStep('pin_challenge');
                setIsLoading(false);
            } else if (status === 'success') {
                setIsLoading(false);
                onSuccess(ref);
            } else if (status === 'open_url') {
                // 3D Secure - bank requires user to authenticate on their portal
                const authUrl = data.data.url;
                setOpenUrl(authUrl);
                setStep('open_url_challenge');
                setIsLoading(false);
                window.open(authUrl, '_blank', 'noopener,noreferrer');
            } else {
                setIsLoading(false);
                setErrorMsg(`Unexpected status: ${status}. Please try again.`);
            }
        } catch (err) {
            setIsLoading(false);
            setErrorMsg('Connection error. Failed to process transaction.');
        }
    };

    // Submit OTP Challenge
    const handleSubmitOtp = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!otp) {
            setErrorMsg('Please enter the OTP sent to your phone/email.');
            return;
        }

        setIsLoading(true);
        setLoadingText('Verifying OTP code...');

        try {
            const response = await fetch('/.netlify/functions/paystack-charge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'submit_otp',
                    reference,
                    otp
                })
            });

            const data = await response.json();

            if (data.status && data.data.status === 'success') {
                setIsLoading(false);
                onSuccess(reference);
            } else {
                setIsLoading(false);
                setErrorMsg(data.message || 'OTP verification failed. Please try again.');
            }
        } catch (err) {
            setIsLoading(false);
            setErrorMsg('Connection error. Failed to verify OTP.');
        }
    };

    // Submit PIN Challenge
    const handleSubmitPinChallenge = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!cardPin) {
            setErrorMsg('Please enter your card PIN.');
            return;
        }

        setIsLoading(true);
        setLoadingText('Verifying card PIN...');

        try {
            const response = await fetch('/.netlify/functions/paystack-charge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'submit_pin',
                    reference,
                    pin: cardPin
                })
            });

            const data = await response.json();

            if (data.status) {
                const status = data.data.status;
                if (status === 'send_otp') {
                    setStep('otp_challenge');
                    setIsLoading(false);
                } else if (status === 'success') {
                    setIsLoading(false);
                    onSuccess(reference);
                } else {
                    setIsLoading(false);
                    setErrorMsg(data.message || 'PIN verification failed. Try another card.');
                }
            } else {
                setIsLoading(false);
                setErrorMsg(data.message || 'Card authorization failed.');
            }
        } catch (err) {
            setIsLoading(false);
            setErrorMsg('Connection error. Failed to verify PIN.');
        }
    };

    // ─── Shared Styles ───────────────────────────────────────────────
    const methodBtnStyle = (isSelected) => ({
        flex: 1,
        padding: '8px',
        border: 'none',
        borderRadius: '6px',
        background: isSelected ? '#ffffff' : 'transparent',
        color: isSelected ? '#0f172a' : '#64748b',
        fontWeight: isSelected ? '600' : '500',
        boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
        cursor: 'pointer',
        fontSize: '13px',
        transition: 'all 0.2s'
    });

    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '28px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.02)',
            maxWidth: '460px',
            margin: '0 auto',
            position: 'relative'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Secure Payment</h3>
                <span style={{ fontSize: '13px', color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>
                    ${amount.toFixed(2)} USD
                </span>
            </div>

            {errorMsg && (
                <div style={{ color: '#b91c1c', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚠️</span> <span>{errorMsg}</span>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                LOCATION DETECTION LOADING
            ═══════════════════════════════════════════════════════════ */}
            {isAfrica === null && !isLoading && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        border: '3px solid #e2e8f0', borderTopColor: '#2563eb',
                        animation: 'spin 1s linear infinite', margin: '0 auto 16px auto'
                    }} />
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Detecting your location...</p>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                AFRICA FLOW — Payment Method Selection Page
            ═══════════════════════════════════════════════════════════ */}
            {isAfrica === true && step === 'method_select' && !isLoading && (
                <div>
                    {/* Location badge */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                        border: '1px solid #fbbf24',
                        borderRadius: '10px', padding: '12px 16px', marginBottom: '20px'
                    }}>
                        <span style={{ fontSize: '20px' }}>🌍</span>
                        <div>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#92400e' }}>
                                We detected you're in {userCountry}
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#a16207', marginTop: '2px' }}>
                                Choose your preferred payment method below
                            </p>
                        </div>
                    </div>

                    {/* Method Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                        {/* Mobile Money Option */}
                        <button
                            type="button"
                            onClick={() => handleAfricaMethodSelect('mobile_money')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '14px',
                                padding: '18px 20px',
                                background: '#ffffff',
                                border: '2px solid #e2e8f0',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.25s ease',
                                textAlign: 'left',
                                width: '100%'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#fbbf24';
                                e.currentTarget.style.background = '#fffbeb';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(251,191,36,0.15)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '24px', flexShrink: 0
                            }}>
                                📱
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                                    Mobile Money
                                </p>
                                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                                    Pay with MTN MoMo, Vodafone Cash, or AirtelTigo
                                </p>
                            </div>
                            <span style={{ fontSize: '18px', color: '#94a3b8' }}>→</span>
                        </button>

                        {/* Card Option */}
                        <button
                            type="button"
                            onClick={() => handleAfricaMethodSelect('card')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '14px',
                                padding: '18px 20px',
                                background: '#ffffff',
                                border: '2px solid #e2e8f0',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.25s ease',
                                textAlign: 'left',
                                width: '100%'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#2563eb';
                                e.currentTarget.style.background = '#eff6ff';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.15)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '24px', flexShrink: 0
                            }}>
                                💳
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                                    Debit / Credit Card
                                </p>
                                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                                    Pay with Visa, Mastercard, or Verve
                                </p>
                            </div>
                            <span style={{ fontSize: '18px', color: '#94a3b8' }}>→</span>
                        </button>
                    </div>

                    {/* Powered by Paystack badge */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        fontSize: '11px', color: '#94a3b8', marginBottom: '8px'
                    }}>
                        <span>🔒</span>
                        <span>Secured by Paystack</span>
                    </div>

                    {onCancel && (
                        <button type="button" onClick={onCancel} style={{ width: '100%', border: 'none', background: 'none', color: '#64748b', fontSize: '13px', textDecoration: 'underline', marginTop: '8px', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                NON-AFRICA FLOW — Tab Selector (Card / Bank / Apple Pay)
            ═══════════════════════════════════════════════════════════ */}
            {isAfrica === false && step === 'card_input' && !isLoading && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#f8fafc', padding: '4px', borderRadius: '8px' }}>
                    <button 
                        type="button" 
                        onClick={() => setPaymentMethod('card')} 
                        style={methodBtnStyle(paymentMethod === 'card')}>
                        💳 Card
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setPaymentMethod('bank')} 
                        style={methodBtnStyle(paymentMethod === 'bank')}>
                        🏦 Bank
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setPaymentMethod('apple_pay')} 
                        style={methodBtnStyle(paymentMethod === 'apple_pay')}>
                         Pay
                    </button>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                AFRICA FLOW — Back button + active method indicator
                (shown when user has picked a method and is on card_input)
            ═══════════════════════════════════════════════════════════ */}
            {isAfrica === true && step === 'card_input' && !isLoading && (
                <div style={{ marginBottom: '16px' }}>
                    <button
                        type="button"
                        onClick={() => {
                            setStep('method_select');
                            setPaymentMethod('');
                            setErrorMsg('');
                        }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            border: 'none', background: '#f1f5f9', color: '#475569',
                            fontSize: '12px', fontWeight: '600', padding: '6px 12px',
                            borderRadius: '6px', cursor: 'pointer', marginBottom: '12px',
                            transition: 'all 0.2s'
                        }}
                    >
                        ← Change Payment Method
                    </button>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: paymentMethod === 'mobile_money' ? '#fffbeb' : '#eff6ff',
                        border: `1px solid ${paymentMethod === 'mobile_money' ? '#fbbf24' : '#93c5fd'}`,
                        borderRadius: '8px', padding: '8px 14px'
                    }}>
                        <span style={{ fontSize: '16px' }}>{paymentMethod === 'mobile_money' ? '📱' : '💳'}</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                            {paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Card Payment'}
                        </span>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                CARD INPUT FORM (shared for both Africa card + Non-Africa card)
            ═══════════════════════════════════════════════════════════ */}
            {step === 'card_input' && !isLoading && paymentMethod === 'card' && (
                <form onSubmit={handleSubmitCard}>
                    <div className="form-group" style={{ marginBottom: '14px' }}>
                        <label className="form-label" style={{ color: '#475569' }}>Cardholder Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="John Doe"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            required
                            style={{ border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '14px' }}>
                        <label className="form-label" style={{ color: '#475569' }}>Card Number</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="0000 0000 0000 0000"
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                required
                                style={{ border: '1px solid #cbd5e1', paddingRight: '40px' }}
                            />
                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>💳</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ color: '#475569' }}>Expiry Date</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="MM/YY"
                                value={expiry}
                                onChange={handleExpiryChange}
                                required
                                style={{ border: '1px solid #cbd5e1' }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ color: '#475569' }}>CVV</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="123"
                                maxLength="4"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                required
                                style={{ border: '1px solid #cbd5e1' }}
                            />
                        </div>
                    </div>

                    {/* Show PIN field for Africa users (GHS cards) */}
                    {isAfrica && (
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label className="form-label" style={{ color: '#475569' }}>Card PIN (Optional)</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter 4-digit PIN if required"
                                maxLength="4"
                                value={cardPin}
                                onChange={(e) => setCardPin(e.target.value.replace(/\D/g, ''))}
                                style={{ border: '1px solid #cbd5e1' }}
                            />
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Required for GHS debit/credit cards.</span>
                        </div>
                    )}

                    <button type="submit" className="btn" style={{ background: '#2563eb', padding: '12px', fontWeight: '600' }}>
                        {isAfrica
                            ? `Pay $${amount.toFixed(2)} (GHS ${formattedAmountGhs})`
                            : `Pay $${amount.toFixed(2)}`
                        }
                    </button>
                    
                    {onCancel && (
                        <button type="button" onClick={onCancel} style={{ width: '100%', border: 'none', background: 'none', color: '#64748b', fontSize: '13px', textDecoration: 'underline', marginTop: '12px', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    )}
                </form>
            )}

            {/* ═══════════════════════════════════════════════════════════
                MOBILE MONEY FORM (Africa only, processed by Paystack)
            ═══════════════════════════════════════════════════════════ */}
            {step === 'card_input' && !isLoading && paymentMethod === 'mobile_money' && (
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    setErrorMsg('');
                    if (!momoPhone) {
                        setErrorMsg('Please enter your mobile money number.');
                        return;
                    }
                    if (momoPhone.length < 10) {
                        setErrorMsg('Please enter a valid 10-digit mobile number.');
                        return;
                    }
                    setIsLoading(true);
                    setLoadingText('Connecting to Mobile Money network...');
                    try {
                        const response = await fetch('/.netlify/functions/paystack-charge', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'charge_mobile_money', provider: momoProvider, phone: momoPhone, email, amountInUsd: amount, type
                            })
                        });
                        const data = await response.json();
                        
                        if (!data.status) {
                            setErrorMsg(data.message || 'Mobile Money charge failed. Please verify details.');
                            setIsLoading(false);
                            return;
                        }

                        const status = data.data?.status;
                        const ref = data.data?.reference;
                        if (ref) setReference(ref);

                        if (status === 'send_otp' || status === 'pay_offline') {
                            setStep('otp_challenge');
                            setIsLoading(false);
                        } else if (status === 'send_pin') {
                            setStep('pin_challenge');
                            setIsLoading(false);
                        } else if (status === 'success') {
                            setIsLoading(false);
                            onSuccess(ref);
                        } else if (status === 'pending') {
                            setIsLoading(false);
                            setErrorMsg('Please approve the prompt on your phone, then check your email.');
                            // Optionally automatically succeed or wait.
                            setTimeout(() => {
                                onSuccess(ref || 'momo_' + Date.now());
                            }, 5000);
                        } else {
                            setIsLoading(false);
                            setErrorMsg(`Transaction status: ${status}.`);
                        }
                    } catch (err) {
                        setIsLoading(false);
                        setErrorMsg('Connection error. Failed to process Mobile Money.');
                    }
                }}>
                    <div className="form-group" style={{ marginBottom: '14px' }}>
                        <label className="form-label" style={{ color: '#475569' }}>Provider</label>
                        <select 
                            className="form-input" 
                            value={momoProvider} 
                            onChange={(e) => setMomoProvider(e.target.value)} 
                            required 
                            style={{ border: '1px solid #cbd5e1', appearance: 'auto' }}>
                            <option value="mtn">MTN Mobile Money</option>
                            <option value="vod">Vodafone Cash (Telecel)</option>
                            <option value="tgo">AirtelTigo Money</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label className="form-label" style={{ color: '#475569' }}>Phone Number</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 0551234567"
                            value={momoPhone}
                            onChange={(e) => setMomoPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                            required
                            style={{ border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <button type="submit" className="btn" style={{ background: '#f59e0b', color: '#1e293b', padding: '12px', fontWeight: '600' }}>
                        Pay ${amount.toFixed(2)} (GHS {formattedAmountGhs})
                    </button>
                    
                    {onCancel && (
                        <button type="button" onClick={onCancel} style={{ width: '100%', border: 'none', background: 'none', color: '#64748b', fontSize: '13px', textDecoration: 'underline', marginTop: '12px', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    )}
                </form>
            )}

            {/* ═══════════════════════════════════════════════════════════
                BANK TRANSFER FORM (Non-Africa only)
            ═══════════════════════════════════════════════════════════ */}
            {step === 'card_input' && !isLoading && paymentMethod === 'bank' && (
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    setErrorMsg('');
                    if (!bankName || !accountNumber) {
                        setErrorMsg('Please enter your bank name and account number.');
                        return;
                    }
                    setIsLoading(true);
                    setLoadingText('Connecting to bank...');
                    try {
                        const response = await fetch('/.netlify/functions/paystack-charge', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'charge_bank', bankName, accountNumber, email, amountInUsd: amount, type
                            })
                        });
                        const data = await response.json();
                        setIsLoading(false);
                        if (data.status) {
                            onSuccess('bank_' + Date.now());
                        } else {
                            setErrorMsg(data.message || 'Bank transfer failed. Please verify details.');
                        }
                    } catch (err) {
                        setIsLoading(false);
                        setErrorMsg('Connection error. Failed to process bank transfer.');
                    }
                }}>
                    <div className="form-group" style={{ marginBottom: '14px' }}>
                        <label className="form-label" style={{ color: '#475569' }}>Bank Name</label>
                        <select 
                            className="form-input" 
                            value={bankName} 
                            onChange={(e) => setBankName(e.target.value)} 
                            required 
                            style={{ border: '1px solid #cbd5e1', appearance: 'auto' }}>
                            <option value="">Select your bank</option>
                            <option value="Ecobank Ghana">Ecobank Ghana</option>
                            <option value="GCB Bank">GCB Bank</option>
                            <option value="Stanbic Bank">Stanbic Bank</option>
                            <option value="Absa Bank">Absa Bank</option>
                            <option value="GTBank">GTBank</option>
                            <option value="Zenith Bank">Zenith Bank</option>
                            <option value="Fidelity Bank">Fidelity Bank</option>
                            <option value="Access Bank">Access Bank</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label className="form-label" style={{ color: '#475569' }}>Account Number</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter your account number"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                            required
                            style={{ border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <button type="submit" className="btn" style={{ background: '#2563eb', padding: '12px', fontWeight: '600' }}>
                        Pay ${amount.toFixed(2)}
                    </button>
                    
                    {onCancel && (
                        <button type="button" onClick={onCancel} style={{ width: '100%', border: 'none', background: 'none', color: '#64748b', fontSize: '13px', textDecoration: 'underline', marginTop: '12px', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    )}
                </form>
            )}

            {/* ═══════════════════════════════════════════════════════════
                APPLE PAY (Non-Africa only)
            ═══════════════════════════════════════════════════════════ */}
            {step === 'card_input' && !isLoading && paymentMethod === 'apple_pay' && (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '20px' }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}></div>
                        <h4 style={{ fontSize: '16px', margin: '0 0 8px 0', color: '#1e293b' }}>Apple Pay</h4>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Fast, secure, and private checkout using Apple Pay.</p>
                    </div>

                    <button 
                        type="button" 
                        onClick={async () => {
                            setIsLoading(true);
                            setLoadingText('Connecting to Apple Pay...');
                            try {
                                const response = await fetch('/.netlify/functions/paystack-charge', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        action: 'charge_apple_pay', email, amountInUsd: amount, type
                                    })
                                });
                                const data = await response.json();
                                setIsLoading(false);
                                if (data.status) {
                                    onSuccess('apple_pay_' + Date.now());
                                } else {
                                    setErrorMsg(data.message || 'Apple Pay failed. Device not configured.');
                                }
                            } catch (err) {
                                setIsLoading(false);
                                setErrorMsg('Connection error.');
                            }
                        }}
                        className="btn" 
                        style={{ background: '#000000', color: '#ffffff', padding: '12px', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        <span></span> Pay ${amount.toFixed(2)}
                    </button>

                    {onCancel && (
                        <button type="button" onClick={onCancel} style={{ width: '100%', border: 'none', background: 'none', color: '#64748b', fontSize: '13px', textDecoration: 'underline', marginTop: '12px', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                OTP CHALLENGE (shared)
            ═══════════════════════════════════════════════════════════ */}
            {step === 'otp_challenge' && !isLoading && (
                <form onSubmit={handleSubmitOtp}>
                    <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>Enter One-Time PIN (OTP)</h4>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>An OTP authentication code has been sent to your phone or email. Please enter it below to complete the authorization.</p>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            required
                            style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '18px', letterSpacing: '4px' }}
                        />
                    </div>

                    <button type="submit" className="btn" style={{ background: '#16a34a', padding: '12px', fontWeight: '600' }}>
                        Confirm OTP Verification
                    </button>
                </form>
            )}

            {/* ═══════════════════════════════════════════════════════════
                PIN CHALLENGE (shared)
            ═══════════════════════════════════════════════════════════ */}
            {step === 'pin_challenge' && !isLoading && (
                <form onSubmit={handleSubmitPinChallenge}>
                    <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>Card PIN Required</h4>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Please enter your 4-digit card PIN to authorize this card transaction securely.</p>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="PIN"
                            maxLength="4"
                            value={cardPin}
                            onChange={(e) => setCardPin(e.target.value.replace(/\D/g, ''))}
                            required
                            style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '20px', letterSpacing: '8px' }}
                        />
                    </div>

                    <button type="submit" className="btn" style={{ background: '#2563eb', padding: '12px', fontWeight: '600' }}>
                        Submit PIN Code
                    </button>
                </form>
            )}

            {/* ═══════════════════════════════════════════════════════════
                3DS OPEN URL CHALLENGE (shared)
            ═══════════════════════════════════════════════════════════ */}
            {step === 'open_url_challenge' && !isLoading && (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏦</div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>Bank Verification Required</h4>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', lineHeight: '1.6' }}>
                        Your bank requires additional verification. A new tab has opened — complete the authentication there, then click the button below.
                    </p>
                    <button
                        type="button"
                        onClick={() => window.open(openUrl, '_blank', 'noopener,noreferrer')}
                        style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', color: '#334155', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        🔗 Re-open Bank Verification Page
                    </button>
                    <button
                        type="button"
                        onClick={async () => {
                            setErrorMsg('');
                            setIsLoading(true);
                            setLoadingText('Verifying payment status...');
                            const maxAttempts = 60; // poll for up to 5 minutes
                            const delayMs = 5000;   // every 5 seconds
                            try {
                                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                                    const response = await fetch(`/.netlify/functions/paystack-verify?reference=${reference}`);
                                    const data = await response.json();
                                    if (data.status === 'success') {
                                        setIsLoading(false);
                                        onSuccess(reference);
                                        return;
                                    } else if (data.status === 'ongoing' || data.status === 'pending') {
                                        setLoadingText(`Payment still processing... checking again (${attempt}/${maxAttempts})`);
                                        await new Promise(r => setTimeout(r, delayMs));
                                    } else {
                                        // failed, abandoned, insufficient funds, etc.
                                        setIsLoading(false);
                                        setErrorMsg('Payment failed. Your bank declined the transaction or your balance is insufficient. Please try again or use a different card.');
                                        return;
                                    }
                                }
                                // exhausted all attempts
                                setIsLoading(false);
                                setErrorMsg('Payment verification timed out. The transaction is still pending — please try again in a moment or contact your bank.');
                            } catch (err) {
                                setIsLoading(false);
                                setErrorMsg('Unable to verify payment. Please check your connection and try again.');
                            }
                        }}
                        className="btn"
                        style={{ background: '#16a34a', padding: '12px', fontWeight: '600' }}
                    >
                        ✅ I've Completed Verification
                    </button>
                    {onCancel && (
                        <button type="button" onClick={onCancel} style={{ width: '100%', border: 'none', background: 'none', color: '#64748b', fontSize: '13px', textDecoration: 'underline', marginTop: '12px', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    )}
                </div>
            )}

            {/* Loading state spinner */}
            {isLoading && (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        border: '3px solid #e2e8f0', borderTopColor: '#2563eb',
                        animation: 'spin 1s linear infinite', margin: '0 auto 16px auto'
                    }} />
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#334155' }}>{loadingText}</p>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Secured Badge footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <span>🔒</span> <span>Secure SSL Encrypted Connection</span>
            </div>
        </div>
    );
};

export default PaymentForm;
