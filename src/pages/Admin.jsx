import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCodes } from '../CodeContext';

const Admin = () => {
    const { generateCode } = useCodes();
    const navigate = useNavigate();

    const handleGenerate = () => {
        const newCode = generateCode();
        alert(`New code generated: ${newCode}`);
    };

    return (
        <div className="container">
            <div className="content">
                <h1>Code Generator</h1>
                <p>Use this page to generate new verification codes for the clearance process.</p>
                
                <button onClick={handleGenerate} className="btn" style={{ backgroundColor: '#2563eb' }}>
                    Generate New Code
                </button>
                
                <div className="footer" style={{ marginTop: '20px' }}>
                    <button onClick={() => navigate('/ll/lt/yk/logs')} className="btn" style={{ backgroundColor: '#4b5563', marginTop: '10px' }}>
                        View Logs
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Admin;
