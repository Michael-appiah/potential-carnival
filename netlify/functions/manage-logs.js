// manage-logs.js
// Ephemeral in-memory logging server to sync activity from buyers to the Admin dashboard
let globalLogs = [];

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod === 'POST') {
        try {
            const { text, type } = JSON.parse(event.body || '{}');
            if (text) {
                const newLog = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    text: `[${new Date().toLocaleTimeString()}] ${text}`,
                    type: type || 'info',
                    timestamp: Date.now()
                };
                globalLogs = [newLog, ...globalLogs].slice(0, 100);
            }
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, logs: globalLogs }) };
        } catch (e) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
        }
    } else {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ logs: globalLogs })
        };
    }
};
