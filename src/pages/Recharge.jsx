import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BrandIcon } from '../BrandIcon';
import { logActivity } from '../utils/logger';
import PaymentForm from '../components/PaymentForm';

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
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    // Load Paystack script dynamically & check for payment reference on callback
    useEffect(() => {
        logActivity('A user visited the Main Purchase Page', 'info');
        
        // Handle Paystack callback verification
        const params = new URLSearchParams(window.location.search);
        const reference = params.get('reference');
        
        if (reference) {
            const verifyPayment = async () => {
                setIsLoading(true);
                setLoaderStep(0);
                
                try {
                    const res = await fetch(`/.netlify/functions/paystack-verify?reference=${reference}`);
                    const data = await res.json();
                    
                    if (data.status === 'success') {
                        // Retrieve pending details from localStorage
                        const pendingStr = localStorage.getItem('pending_recharge');
                        if (pendingStr) {
                            const pending = JSON.parse(pendingStr);
                            setSelectedBrand(BRANDS.find(b => b.id === pending.brandId) || BRANDS[0]);
                            setSelectedAmount(pending.amount);
                            setEmail(pending.email);
                            localStorage.removeItem('pending_recharge');
                        }
                        
                        logActivity(`User successfully paid for gift card! Reference: ${reference}`, 'success');
                        
                        // Clear reference from URL
                        window.history.replaceState({}, document.title, window.location.pathname);
                        
                        triggerGenerationAnimation();
                    } else {
                        setIsLoading(false);
                        alert('❌ Payment verification failed or payment was not completed.');
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                } catch (err) {
                    setIsLoading(false);
                    alert('❌ An error occurred while verifying the payment.');
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            };
            
            verifyPayment();
        }

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

    // Initialize Paystack Payment Flow via Serverless
    const handleCheckout = (e) => {
        e.preventDefault();
        
        if (!email) {
            alert('Please specify a recipient email address.');
            return;
        }

        setShowPaymentForm(true);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setToastMessage('Details copied!');
        setTimeout(() => setToastMessage(''), 2000);
    };

    return (
        <div className="container">
            <Helmet>
                <title>Buy Gift Cards Online - Recharge Store</title>
                <meta name="description" content="Select a gift card, choose your amount, and enter your email to get your digital card instantly. Support for Apple, Steam, PlayStation, Amazon, and Xbox." />
            </Helmet>
            {!showVoucher && !isLoading && !showPaymentForm ? (
                <div className="content">
                    <div style={{ marginBottom: '16px' }}>
                        <h1 style={{ margin: 0 }}>Recharge Store</h1>
                    </div>
                    <p>Select a gift card, choose your amount, and enter your email to get your digital card instantly.</p>
                    
                    <form onSubmit={handleCheckout}>
                        {/* 1. Brand Selection Grid */}
                        <div className="form-group">
                            <label className="form-label">1. Select Brand</label>
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
                        <div className="form-group">
                            <label className="form-label">2. Select Amount (USD)</label>
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
                        <div className="form-group">
                            <label htmlFor="email-input" className="form-label">3. Your Email Address</label>
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
                        <button type="submit" className="btn" style={{ marginTop: '10px' }}>
                            Pay ${selectedAmount}.00
                        </button>
                    </form>
                </div>
            ) : null}

            {/* Transaction Loader */}
            {isLoading && (
                <div className="content" style={{ textAlign: 'center' }}>
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
                <div className="content animate-fadeIn" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
                    <h1 style={{ margin: 0, marginBottom: '8px' }}>Purchase Successful!</h1>
                    <p style={{ marginBottom: '28px' }}>Your gift card is ready. Please save your code.</p>
                    
                    {/* Flat clean gift card UI */}
                    <div className={`hologram-card hologram-${selectedBrand.color}`}>
                        <div className="hologram-logo">
                            <BrandIcon brandId={selectedBrand.id} size={32} style={{ marginRight: '8px' }} color="#111827" />
                            <span>{selectedBrand.name}</span>
                        </div>
                        
                        <div className="hologram-details" style={{ textAlign: 'left' }}>
                            <span style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '1px' }}>Voucher Code</span>
                            <div className="hologram-code">{voucherData?.code}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px', opacity: 0.9 }}>
                                <span>PIN: {voucherData?.pin}</span>
                                <span>{voucherData?.serial}</span>
                            </div>
                        </div>
                        
                        <div className="hologram-amount">
                            ${selectedAmount}.00
                        </div>
                    </div>

                    {/* Copy and Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button 
                            className="btn" 
                            onClick={() => copyToClipboard(`Brand: ${selectedBrand.name}\nCode: ${voucherData?.code}\nPIN: ${voucherData?.pin}\nSerial: ${voucherData?.serial}\nValue: $${selectedAmount}.00`)}
                        >
                            Copy Card Details
                        </button>
                        <button 
                            className="btn btn-secondary" 
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

            {showPaymentForm && !showVoucher && !isLoading && (
                <PaymentForm
                    amount={selectedAmount}
                    email={email}
                    type="recharge"
                    onSuccess={(ref) => {
                        setShowPaymentForm(false);
                        triggerGenerationAnimation();
                    }}
                    onCancel={() => setShowPaymentForm(false)}
                />
            )}

            {toastMessage && <div className="toast-msg">{toastMessage}</div>}
        </div>
    );
};

export default Recharge;
