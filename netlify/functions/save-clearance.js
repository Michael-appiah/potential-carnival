// save-clearance.js
// Persists a clearance record to Netlify Blobs when a card is sent.

const RECORDS_KEY = 'money_form_clearance_records';

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

    try {
        const record = JSON.parse(event.body);

        if (!record.clearanceId) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing clearanceId' }) };
        }

        const { getStore } = require('@netlify/blobs');
        const store = getStore('clearance-control');

        let records = [];
        try {
            const raw = await store.get(RECORDS_KEY, { type: 'json' });
            if (Array.isArray(raw)) records = raw;
        } catch (e) {
            records = [];
        }

        // Don't add duplicates
        if (!records.find(r => r.clearanceId === record.clearanceId)) {
            records.unshift(record);
        }

        await store.setJSON(RECORDS_KEY, records);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, total: records.length })
        };
    } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
