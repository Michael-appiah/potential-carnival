import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCodes } from '../CodeContext';

const Verify = () => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const inputs = useRef([]);
    const [error, setError] = useState('');
    const { validateCode } = useCodes();
    const navigate = useNavigate();

    const handleChange = (e, index) => {
        const value = e.target.value;
        setError(''); // Clear error on typing
        if (/^\d*$/.test(value)) {
            const newCode = [...code];
            newCode[index] = value.slice(-1);
            setCode(newCode);

            if (value && index < 5) {
                inputs.current[index + 1].focus();
            }
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputs.current[index - 1].focus();
        }
    };

    const handleVerify = () => {
        const fullCode = code.join('');
        if (fullCode.length < 6) {
            setError('Please enter all 6 digits.');
            return;
        }
        
        if (validateCode(fullCode)) {
            alert('Verification successful!');
            navigate('/');
        } else {
            setError('Invalid or already used code. Please check the logs.');
            setCode(['', '', '', '', '', '']);
            inputs.current[0].focus();
        }
    };

    return (
        <div className="container">
            <div className="content">
                <h1>Enter Verification Code</h1>
                <p>
                    The security verification code has been successfully dispatched to the original purchaser of the gift card. Please obtain the 6-digit code to complete the clearance process.
                </p>
                
                {error && <div style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>
                    {error}
                </div>}
                
                <div className="code-group">
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            type="text"
                            className="code-input"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            ref={(el) => (inputs.current[index] = el)}
                        />
                    ))}
                </div>

                <button onClick={handleVerify} className="btn">
                    Verify and Continue
                </button>
                
                <div className="footer">
                    <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#000', cursor: 'pointer', textDecoration: 'underline' }}>
                        Back to main page
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Verify;
