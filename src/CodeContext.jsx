import React, { createContext, useContext, useState, useEffect } from 'react';

const CodeContext = createContext();

export const CodeProvider = ({ children }) => {
    const [codes, setCodes] = useState(() => {
        const saved = localStorage.getItem('verification_codes');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('verification_codes', JSON.stringify(codes));
    }, [codes]);

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'verification_codes' && e.newValue) {
                setCodes(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const generateCode = () => {
        const newCode = {
            id: Math.random().toString(36).substr(2, 9),
            code: Math.floor(100000 + Math.random() * 900000).toString(),
            status: 'active',
            createdAt: new Date().toLocaleString()
        };
        setCodes(prev => [newCode, ...prev]);
        return newCode.code;
    };

    const validateCode = (inputCode) => {
        const found = codes.find(c => c.code === inputCode && c.status === 'active');
        if (found) {
            setCodes(prev => prev.map(c => 
                c.code === inputCode ? { ...c, status: 'used' } : c
            ));
            return true;
        }
        return false;
    };

    return (
        <CodeContext.Provider value={{ codes, generateCode, validateCode }}>
            {children}
        </CodeContext.Provider>
    );
};

export const useCodes = () => useContext(CodeContext);
