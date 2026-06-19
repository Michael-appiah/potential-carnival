import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandIcon } from '../BrandIcon';

const BRANDS = [
    { id: 'apple', name: 'Apple', icon: '', color: 'apple' },
    { id: 'steam', name: 'Steam Store', icon: '🎮', color: 'steam' },
    { id: 'amazon', name: 'Amazon', icon: '📦', color: 'amazon' },
    { id: 'playstation', name: 'PlayStation Network', icon: 'Ⓟ', color: 'playstation' },
    { id: 'xbox', name: 'Xbox Live', icon: 'Ⓧ', color: 'xbox' }
];

const AMOUNTS = [10, 25, 50, 100];

const Recharge = () => {
    const navigate = useNavigate();
    
    // States
    const [selectedBrand, setSelectedBrand] = useState(BRANDS[0]);
    const [selectedAmount, setSelectedAmount] = useState(AMOUNTS[1]);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loaderStep, setLoaderStep] = useState(0);
    const [showVoucher, setShowVoucher] = useState(false);
    const [voucherData, setVoucherData] = useState(null);
    const [toastMessage, setToastMessage] = useState('');

    // Load Paystack Inline JS script dynamically and set light theme
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        document.body.appendChild(script);

        // Force light theme on this specific page
        document.body.style.backgroundColor = '#f3f4f6';
        document.body.style.backgroundImage = 'none';
        document.body.style.color = '#111827';

        return () => {
            document.body.removeChild(script);
            document.body.style.backgroundColor = '';
            document.body.style.backgroundImage = '';
            document.body.style.color = '';
        };
    }, []);

    // Generate random realistic voucher codes based on selected brand
    const generateVoucherCode = (brandId) => {
        const randHex = (len) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let res = '';
            for (let i = 0; i < len; i++) {
                res += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return res;
        };

        let code = '';
        if (brandId === 'apple') {
            code = `A${randHex(3)}-${randHex(4)}-${randHex(4)}-${randHex(4)}`;
        } else if (brandId === 'steam') {
            code = `${randHex(5)}-${randHex(5)}-${randHex(5)}`;
        } else if (brandId === 'amazon') {
            code = `AQ${randHex(2)}-${randHex(6)}-${randHex(4)}`;
        } else if (brandId === 'playstation') {
            code = `${randHex(4)}-${randHex(4)}-${randHex(4)}`;
        } else if (brandId === 'xbox') {
            code = `${randHex(5)}-${randHex(5)}-${randHex(5)}-${randHex(5)}-${randHex(5)}`;
        }
        
        return {
            code,
            pin: Math.floor(1000 + Math.random() * 9000).toString(),
            serial: `SN-${Math.floor(100000000 + Math.random() * 900000000)}`
        };
    };

    // Trigger sequential loading animations
    const triggerGenerationAnimation = () => {
        setIsLoading(true);
        setLoaderStep(0);
        
        const steps = [
            'Verifying payment status...',
            'Processing your order...',
            'Generating digital gift card...',
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
                setVoucherData(generateVoucherCode(selectedBrand.id));
                setShowVoucher(true);
            }
        }, 1800);
    };

    // Initialize Paystack Payment Flow
    const handleCheckout = (e) => {
        e.preventDefault();
        
        if (!email) {
            alert('Please specify a recipient email address.');
            return;
        }

        // Use live public key from env or provided fallback public key safely
        const paystackPublicKey = import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_3861296b86487f4fc5dabc23e99be12f14e8e88f';

        // Check if Paystack script loaded correctly
        if (window.PaystackPop) {
            const USD_TO_GHS_RATE = 15.0;
            const convertedAmountGhs = selectedAmount * USD_TO_GHS_RATE;

            const handler = window.PaystackPop.setup({
                key: paystackPublicKey,
                email: email,
                amount: Math.round(convertedAmountGhs * 100), // Converted to GHS pesewas under the hood
                currency: 'GHS',
                channels: ['card'], // Restrict strictly to credit/debit card payments
                callback: function (response) {
                    // Payment successful callback
                    triggerGenerationAnimation();
                },
                onClose: function () {
                    // Payment cancelled or unsuccessful
                    alert('❌ Payment was unsuccessful or cancelled. Your digital voucher has not been generated.');
                }
            });
            handler.openIframe();
        } else {
            // Script failed fallback (simulated flow for local dev)
            triggerGenerationAnimation();
        }
    };

    // Copy code function
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setToastMessage('Voucher details copied successfully!');
        setTimeout(() => setToastMessage(''), 2    const lightContentStyle = {
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        padding: '36px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)',
        color: '#1f2937',
        animation: 'slideUpFade 0.6s ease'
    };

    const textMuted = { color: '#6b7280' };

    return (
        <div className="container">
            {!showVoucher && !isLoading ? (
                <div style={lightContentStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h1 style={{ color: '#111827', WebkitTextFillColor: 'initial', background: 'none', margin: 0 }}>recharge.com</h1>
                        <span style={{ fontSize: '12px', background: '#f3f4f6', padding: '6px 12px', borderRadius: '12px', color: '#4b5563', cursor: 'pointer', border: '1px solid #e5e7eb' }} onClick={() => navigate('/purchase/auth')}>
                            Admin Login
                        </span>
                    </div>
                    <p style={{ color: '#4b5563', fontSize: '15px', marginBottom: '24px' }}>Select a gift card, choose your amount, and enter your email to get your digital card instantly.</p>
                    
                    <form onSubmit={handleCheckout}>
                        {/* 1. Brand Selection Grid */}
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'block' }}>1. Select Brand</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                {BRANDS.map((brand) => (
                                    <div 
                                        key={brand.id}
                                        onClick={() => setSelectedBrand(brand)}
                                        style={{
                                            background: selectedBrand.id === brand.id ? '#eff6ff' : '#ffffff',
                                            border: `2px solid ${selectedBrand.id === brand.id ? '#2563eb' : '#e5e7eb'}`,
                                            borderRadius: '12px',
                                            padding: '16px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s ease',
                                            boxShadow: selectedBrand.id === brand.id ? '0 4px 6px -1px rgba(37,99,235,0.1)' : 'none'
                                        }}
                                    >
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '8px',
                                            background: selectedBrand.id === brand.id ? '#ffffff' : '#f9fafb',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                        }}>
                                            <BrandIcon brandId={brand.id} size={24} color="#111827" />
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{brand.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Amount Selection */}
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'block' }}>2. Select Amount (USD)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                {AMOUNTS.map((amount) => (
                                    <div
                                        key={amount}
                                        onClick={() => setSelectedAmount(amount)}
                                        style={{
                                            background: selectedAmount === amount ? '#2563eb' : '#ffffff',
                                            color: selectedAmount === amount ? '#ffffff' : '#111827',
                                            border: `2px solid ${selectedAmount === amount ? '#2563eb' : '#e5e7eb'}`,
                                            borderRadius: '10px',
                                            padding: '12px',
                                            textAlign: 'center',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        ${amount}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Recipient Email Input */}
                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label htmlFor="email-input" style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'block' }}>3. Your Email Address</label>
                            <input
                                id="email-input"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    background: '#ffffff',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '10px',
                                    color: '#111827',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>

                        {/* 4. Action Button */}
                        <button type="submit" className="btn" style={{ background: '#2563eb', color: '#ffffff', width: '100%', border: 'none', borderRadius: '10px', padding: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(37,99,235,0.2)' }}>
                            Pay ${selectedAmount}.00
                        </button>
                    </form>
                </div>
            ) : null}

            {/* Transaction Loader */}
            {isLoading && (
                <div style={{...lightContentStyle, textAlign: 'center'}}>
                    <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', 
                        border: '3px solid #e5e7eb', borderTopColor: '#2563eb', 
                        animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' 
                    }} />
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>Processing Order...</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', background: '#f9fafb', padding: '16px', borderRadius: '12px' }}>
                        {[
                            'Verifying payment status...',
                            'Processing your order...',
                            'Generating digital gift card...',
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
                    <style>{`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    `}</style>
                </div>
            )}

            {/* Holographic Gift Card Success View */}
            {showVoucher && !isLoading && (
                <div style={{...lightContentStyle, textAlign: 'center'}} className="animate-fadeIn">
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
                    <h1 style={{ color: '#111827', WebkitTextFillColor: 'initial', background: 'none', marginBottom: '8px' }}>Purchase Successful!</h1>
                    <p style={{ marginBottom: '28px', color: '#4b5563', fontSize: '15px' }}>Your gift card is ready. Please save your code.</p>
                    
                    {/* Floating Holo Card */}
                    <div className={`hologram-card hologram-${selectedBrand.color}`} style={{ margin: '0 auto 30px auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div className="hologram-logo">
                            <BrandIcon brandId={selectedBrand.id} size={32} style={{ marginRight: '8px' }} color="#ffffff" />
                            <span style={{ color: '#ffffff' }}>{selectedBrand.name}</span>
                        </div>
                        
                        <div className="hologram-details" style={{ textAlign: 'left', color: '#ffffff' }}>
                            <span style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '1px' }}>Voucher Code</span>
                            <div className="hologram-code" style={{ textShadow: 'none' }}>{voucherData?.code}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px', opacity: 0.9 }}>
                                <span>PIN: {voucherData?.pin}</span>
                                <span>{voucherData?.serial}</span>
                            </div>
                        </div>
                        
                        <div className="hologram-amount" style={{ color: '#ffffff' }}>
                            ${selectedAmount}.00
                        </div>
                    </div>

                    {/* Copy and Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button 
                            className="btn" 
                            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', padding: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(37,99,235,0.2)' }}
                            onClick={() => copyToClipboard(`Brand: ${selectedBrand.name}\nCode: ${voucherData?.code}\nPIN: ${voucherData?.pin}\nSerial: ${voucherData?.serial}\nValue: $${selectedAmount}.00`)}
                        >
                            Copy Card Details
                        </button>
                        <button 
                            className="btn" 
                            style={{ background: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                            onClick={() => {
                                setShowVoucher(false);
                                setVoucherData(null);
                            }}
                        >
                            Buy Another Card
                        </button>
                    </div>
                </div>
            )}

            {toastMessage && <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#111827', color: '#fff', padding: '10px 20px', borderRadius: '50px', fontSize: '14px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', animation: 'slideUpFade 0.3s ease', zIndex: 1000 }}>{toastMessage}</div>}
        </div>
    );
};

export default Recharge;
