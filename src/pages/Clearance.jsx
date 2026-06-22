import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentForm from '../components/PaymentForm';

const Clearance = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    const CLEARANCE_USD = 4.44;

    const handlePayment = (e) => {
        e.preventDefault();
        if (!email) {
            alert('Please enter your email address to proceed.');
            return;
        }
        setShowPaymentForm(true);
    };

    return (
        <div className="container">
            {showPaymentForm ? (
                <PaymentForm 
                    amount={CLEARANCE_USD}
                    email={email}
                    type="clearance"
                    onSuccess={(ref) => {
                        alert('Clearance Payment Successful!');
                        navigate('/verify');
                    }}
                    onCancel={() => setShowPaymentForm(false)}
                />
            ) : (
                <div className="content payment-card animate-fadeIn">
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', marginBottom: '16px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1>Security Verification</h1>
                        <p style={{ color: '#64748b', fontSize: '15px' }}>
                            A refundable clearance fee is required to activate and redeem this gift card securely.
                        </p>
                    </div>
                    
                    <div className="payment-summary">
                        <div className="summary-row">
                            <span>Clearance Fee</span>
                            <span style={{ fontWeight: '600', color: '#0f172a' }}>${CLEARANCE_USD.toFixed(2)}</span>
                        </div>
                        <div className="summary-row total">
                            <span>Total to Pay</span>
                            <span>${CLEARANCE_USD.toFixed(2)}</span>
                        </div>
                    </div>

                    <form onSubmit={handlePayment} style={{ marginTop: '24px' }}>
                        <div className="form-group">
                            <label className="form-label">Email Address for Receipt</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn paystack-btn" style={{ marginTop: '16px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Continue to Payment Options
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#64748b' }}>
                            Supports Card, Bank, Apple Pay, and Mobile Money (MoMo)
                        </div>
                    </form>
                    
                    <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                        Payments are 100% secure and encrypted
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clearance;
