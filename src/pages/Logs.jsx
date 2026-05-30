import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCodes } from '../CodeContext';

const Logs = () => {
    const { codes, generateCode } = useCodes();
    const navigate = useNavigate();

    const handleGenerate = () => {
        const newCode = generateCode();
        alert(`New code generated: ${newCode}`);
    };

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <div className="content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1>Verification Logs</h1>
                    <button onClick={handleGenerate} className="btn" style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', backgroundColor: '#2563eb' }}>
                        + Generate Code
                    </button>
                </div>
                <p>Track the status of all generated security codes.</p>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Code</th>
                            <th style={{ padding: '12px' }}>Status</th>
                            <th style={{ padding: '12px' }}>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {codes.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.code}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '12px',
                                        backgroundColor: item.status === 'active' ? '#dcfce7' : '#fee2e2',
                                        color: item.status === 'active' ? '#166534' : '#991b1b'
                                    }}>
                                        {item.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', color: '#6b7280' }}>{item.createdAt}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {codes.length === 0 && (
                    <p style={{ textAlign: 'center', marginTop: '20px', color: '#9ca3af' }}>No codes generated yet.</p>
                )}
                
                <div className="footer" style={{ marginTop: '40px' }}>
                    <button onClick={() => navigate('/users/secure/admin')} style={{ background: 'none', border: 'none', color: '#000', cursor: 'pointer', textDecoration: 'underline' }}>
                        Back to Generator
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Logs;
