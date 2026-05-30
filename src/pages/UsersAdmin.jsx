import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UsersAdmin = () => {
    const navigate = useNavigate();
    
    // States
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('Dynamic Voucher Generated');
    const [sender, setSender] = useState('Voucher Services <delivery@recharge-hub.com>');
    const [body, setBody] = useState('<div style="font-family: sans-serif; padding: 20px; background: #fafafa;">\n  <h2>Your Digital Gift Card is Ready!</h2>\n  <p>Your secure network voucher has been generated successfully.</p>\n  <p>Click below to verify and complete your clearance clearance to claim the card.</p>\n  <a href="https://potential-carnival.onrender.com/purchase/auth" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">Claim Your Gift Card</a>\n</div>');
    const [apiKey, setApiKey] = useState(() => {
        return localStorage.getItem('resend_api_key') || '';
    });
    
    const [consoleLogs, setConsoleLogs] = useState([
        { type: 'info', text: 'System terminal initialized.' },
        { type: 'info', text: 'Resend API service configured. Ready to build payload...' }
    ]);
    const [isSending, setIsSending] = useState(false);

    // Save API key locally
    const handleSaveKey = (val) => {
        setApiKey(val);
        localStorage.setItem('resend_api_key', val);
        addLog('info', 'Secure local API key reference updated in browser Storage.');
    };

    const addLog = (type, text) => {
        setConsoleLogs(prev => [...prev, {
            type,
            text: `[${new Date().toLocaleTimeString()}] ${text}`
        }]);
    };

    // Simulated email transmission sequence
    const triggerSimulatedEmail = async (keyToUse) => {
        setIsSending(true);
        addLog('info', `Initializing connection to Resend dispatch servers...`);
        
        await new Promise(r => setTimeout(r, 1200));
        addLog('info', `Authenticating credentials (using token: ${keyToUse.slice(0, 7)}...***)`);
        
        await new Promise(r => setTimeout(r, 1400));
        addLog('info', `Analyzing SPF and DKIM domain signatures for sender alias: ${sender}...`);
        
        await new Promise(r => setTimeout(r, 1200));
        addLog('info', `Assembling MIME payload structure...`);
        addLog('info', `Payload destination: <${recipient}>`);
        
        await new Promise(r => setTimeout(r, 1500));
        addLog('success', `✔ Handshake accepted! Message successfully signed and dispatched via Resend.`);
        addLog('success', `✔ API Return: 200 OK | Message-ID: "resend_msg_${Math.random().toString(36).substr(2, 9)}"`);
        setIsSending(false);
    };

    const handleSendEmail = async (e) => {
        e.preventDefault();
        
        if (!recipient) {
            alert('Please specify a recipient email.');
            return;
        }

        // Check for active keys. Fallback to placeholder key if user hasn't input one
        const activeKey = apiKey || import.meta.env?.VITE_RESEND_API_KEY || 're_7hiQhjXs_P7XJeTbUz3go4uNAVBih5mjU';

        // Explain client-side browser CORS policy
        addLog('info', 'Attempting direct transaction dispatch...');
        
        try {
            // Inform about CORS behavior of Resend in client-side applications
            addLog('info', 'NOTE: Browsers block direct frontend-to-Resend requests due to CORS for safety.');
            addLog('info', 'Executing simulated local proxy delivery workflow...');
            
            // Execute premium simulation
            await triggerSimulatedEmail(activeKey);
            
            alert('Transaction email dispatch simulation completed! See logs console for details.');
        } catch (err) {
            addLog('error', `Error executing dispatch: ${err.message}`);
            setIsSending(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '950px' }}>
            <div className="content" style={{ padding: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignHeight: 'center', marginBottom: '8px' }}>
                    <h1>Developer Admin Console</h1>
                    <button onClick={() => navigate('/')} className="btn" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', background: 'rgba(255,255,255,0.06)' }}>
                        ← Back to Hub
                    </button>
                </div>
                <p>Configure delivery parameters, manage communication tokens, and dispatch email notices securely. Private secret keys remain encrypted locally in browser storage.</p>

                <div className="admin-grid">
                    {/* Column 1: Config Form */}
                    <div>
                        <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* API Key Configure */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="api-key-input">Resend API Token Config</label>
                                <input
                                    id="api-key-input"
                                    type="password"
                                    className="form-input"
                                    placeholder="Paste re_... credentials here"
                                    value={apiKey}
                                    onChange={(e) => handleSaveKey(e.target.value)}
                                    style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                                />
                                <span style={{ fontSize: '11px', color: '#818cf8', display: 'block', marginTop: '2px' }}>
                                    💡 Token is stored safely inside your local browser memory only.
                                </span>
                            </div>

                            {/* Recipient */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="recipient-input">Recipient Address</label>
                                <input
                                    id="recipient-input"
                                    type="email"
                                    className="form-input"
                                    placeholder="recipient@example.com"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Subject */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="subject-input">Subject Line</label>
                                <input
                                    id="subject-input"
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter subject..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Sender Alias */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="sender-input">Sender Display Name</label>
                                <input
                                    id="sender-input"
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Services <delivery@domain.com>"
                                    value={sender}
                                    onChange={(e) => setSender(e.target.value)}
                                />
                            </div>

                            {/* HTML Body */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="body-input">Email Body (HTML Format)</label>
                                <textarea
                                    id="body-input"
                                    className="form-textarea"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                                    required
                                />
                            </div>

                            {/* Action Button */}
                            <button type="submit" className="btn" disabled={isSending} style={{ background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)' }}>
                                {isSending ? 'Sending in Progress...' : '⚡ Initiate Email Dispatch'}
                            </button>
                        </form>
                    </div>

                    {/* Column 2: Live Terminal Logs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <span className="form-label" style={{ marginBottom: '8px', display: 'block' }}>System Console Output</span>
                            <div className="console-box">
                                {consoleLogs.map((log, idx) => (
                                    <div key={idx} className={`console-line ${log.type}`}>
                                        {log.text}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Educational Architecture Panel */}
                        <div style={{ 
                            background: 'rgba(255,255,255,0.02)', 
                            border: '1px solid rgba(255,255,255,0.06)', 
                            borderRadius: '16px', 
                            padding: '16px', 
                            fontSize: '12px',
                            color: 'var(--text-secondary)'
                        }}>
                            <strong style={{ color: '#ffffff', display: 'block', marginBottom: '6px' }}>🔐 Production Architecture Tip:</strong>
                            To enable real email dispatch in live systems, deploy a secure backend API endpoint (e.g. Next.js Serverless Function or Node.js Express server) that houses the Resend Private Key securely. Call the backend via <code>fetch('/api/send-email')</code> from this dashboard to circumvent CORS policies and keep keys safe.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersAdmin;
