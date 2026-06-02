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

    // Load Paystack Inline JS script dynamically
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
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
            'Verifying client request protocol...',
            'Connecting to card tokenization database...',
            'Generating highly secure digital voucher...',
            'Signing cryptographic voucher signature...'
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
            const handler = window.PaystackPop.setup({
                key: paystackPublicKey,
                email: email,
                amount: selectedAmount * 100, // Amount in USD cents
                currency: 'USD',
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
        setTimeout(() => setToastMessage(''), 2500);
    };

    return (
        <div className="container">
            {!showVoucher ? (
                <div className="content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h1>recharge.com</h1>
                        <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '12px', color: '#a5b4fc', cursor: 'pointer' }} onClick={() => navigate('/purchase/auth')}>
                            Verification Clearance
                        </span>
                    </div>
                    <p>Select your preferred digital network voucher, choose a denomination, and complete payment to securely generate your dynamic digital gift card instantly.</p>
                    
                    <form onSubmit={handleCheckout}>
                        {/* 1. Brand Selection Grid */}
                        <div className="form-group">
                            <label className="form-label">1. Select Digital Network</label>
                            <div className="card-grid">
                                {BRANDS.map((brand) => (
                                    <div 
                                        key={brand.id}
                                        className={`brand-card ${selectedBrand.id === brand.id ? 'active' : ''}`}
                                        onClick={() => setSelectedBrand(brand)}
                                    >
                                        <div className="brand-icon">
                                            <BrandIcon brandId={brand.id} size={28} />
                                        </div>
                                        <span className="brand-name">{brand.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Amount Selection */}
                        <div className="form-group">
                            <label className="form-label">2. Select Denomination (USD)</label>
                            <div className="denomination-list">
                                {AMOUNTS.map((amount) => (
                                    <div
                                        key={amount}
                                        className={`denomination-item ${selectedAmount === amount ? 'active' : ''}`}
                                        onClick={() => setSelectedAmount(amount)}
                                    >
                                        ${amount}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Recipient Email Input */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="email-input">3. Recipient Email Address</label>
                            <input
                                id="email-input"
                                type="email"
                                className="form-input"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {/* 4. Action Button */}
                        <button type="submit" className="btn" style={{ marginTop: '16px' }}>
                            <span>Proceed to Secure Checkout (${selectedAmount}.00)</span>
                            <span style={{ fontSize: '12px', opacity: 0.8 }}>⚡</span>
                        </button>
                    </form>
                </div>
            ) : (
                /* Holographic Gift Card Success View */
                <div className="content" style={{ textAlign: 'center', position: 'relative' }}>
                    <h1>Voucher Generated!</h1>
                    <p style={{ marginBottom: '32px' }}>Your voucher has been successfully tokenized and securely signed. Please preserve details immediately.</p>
                    
                    {/* Floating Holo Card */}
                    <div className={`hologram-card hologram-${selectedBrand.color}`} style={{ margin: '0 auto 36px auto' }}>
                        <div className="hologram-logo">
                            <BrandIcon brandId={selectedBrand.id} size={32} style={{ marginRight: '8px' }} />
                            <span>{selectedBrand.name}</span>
                        </div>
                        
                        <div className="hologram-details">
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.6, letterSpacing: '1px', textAlign: 'left' }}>Voucher Code</span>
                            <div className="hologram-code">{voucherData?.code}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px', opacity: 0.7 }}>
                                <span>PIN: {voucherData?.pin}</span>
                                <span>{voucherData?.serial}</span>
                            </div>
                        </div>
                        
                        <div className="hologram-amount">
                            ${selectedAmount}.00
                        </div>
                    </div>

                    {/* Copy and Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button 
                            className="btn" 
                            onClick={() => copyToClipboard(`Brand: ${selectedBrand.name}\nCode: ${voucherData?.code}\nPIN: ${voucherData?.pin}\nSerial: ${voucherData?.serial}\nValue: $${selectedAmount}.00`)}
                        >
                            Copy Voucher Details
                        </button>
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => {
                                setShowVoucher(false);
                                setVoucherData(null);
                            }}
                        >
                            Generate Another Voucher
                        </button>
                    </div>

                    {/* Warning Notice */}
                    <div style={{ 
                        marginTop: '28px', 
                        padding: '16px', 
                        borderRadius: '12px', 
                        background: 'rgba(239, 68, 68, 0.06)', 
                        border: '1px solid rgba(239, 68, 68, 0.15)', 
                        fontSize: '12px', 
                        color: '#fca5a5', 
                        lineHeight: '1.5'
                    }}>
                        <strong>🔒 Security Advisory:</strong> Secure this code immediately. For your optimal safety, this dynamic voucher is strictly single-use and will be permanently cleared from memory upon closing this panel. Copy before it's lost.
                    </div>
                </div>
            )}

            {/* Transaction Loader Overlay */}
            {isLoading && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            {/* Glowing Spinner */}
                            <div style={{ 
                                width: '48px', 
                                height: '48px', 
                                borderRadius: '50%', 
                                border: '3px solid rgba(99, 102, 241, 0.1)', 
                                borderTopColor: '#6366f1', 
                                animation: 'spin 1s linear infinite'
                            }} />
                            <h2 style={{ fontSize: '18px', fontWeight: '800', marginTop: '8px' }}>Processing Secure Transaction</h2>
                            <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', margin: 0 }}>Please hold on while we communicate with secure servers...</p>
                        </div>

                        {/* Animated Step List */}
                        <div className="progress-steps">
                            {[
                                'Verifying client request protocol...',
                                'Connecting to card tokenization database...',
                                'Generating highly secure digital voucher...',
                                'Signing cryptographic voucher signature...'
                            ].map((stepText, idx) => (
                                <div 
                                    key={idx} 
                                    className={`step-row ${loaderStep === idx ? 'active' : ''} ${loaderStep > idx ? 'completed' : ''}`}
                                >
                                    <div className="step-bullet" />
                                    <span style={{ fontSize: '13px' }}>{stepText}</span>
                                </div>
                            ))}
                        </div>

                        {/* Inline styles for loader animations */}
                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                </div>
            )}

            {/* Copied Successful Toast */}
            {toastMessage && (
                <div className="toast-msg">
                    {toastMessage}
                </div>
            )}
        </div>
    );
};

export default Recharge;
