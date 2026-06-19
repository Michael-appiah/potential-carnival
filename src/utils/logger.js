export const logActivity = (text, type = 'info') => {
    try {
        const stored = localStorage.getItem('money_form_live_logs') || '[]';
        const logs = JSON.parse(stored);
        
        const newLog = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            text: `[${new Date().toLocaleTimeString()}] ${text}`,
            type,
            timestamp: Date.now()
        };
        
        const updatedLogs = [newLog, ...logs].slice(0, 50); // Keep last 50 logs
        localStorage.setItem('money_form_live_logs', JSON.stringify(updatedLogs));
        
        // Dispatch a custom event for same-tab updates (e.g. if testing locally in the same window)
        window.dispatchEvent(new Event('localLogUpdated'));
    } catch (e) {
        console.error('Failed to log activity', e);
    }
};
