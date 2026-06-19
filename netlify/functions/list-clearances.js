// list-clearances.js
// Returns all clearance records from Netlify Blobs for the admin dashboard.

const RECORDS_KEY = 'money_form_clearance_records';
const CANCELLED_KEY = 'money_form_cancelled_ids';

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    try {
        const { getStore } = require('@netlify/blobs');
        const store = getStore('clearance-control');

        let records = [];
        try {
            const raw = await store.get(RECORDS_KEY, { type: 'json' });
            if (Array.isArray(raw)) records = raw;
        } catch (e) {
            records = [];
        }

        let cancelledIds = [];
        try {
            const raw = await store.get(CANCELLED_KEY, { type: 'json' });
            if (Array.isArray(raw)) cancelledIds = raw;
        } catch (e) {
            cancelledIds = [];
        }

        // Map properties to match what Admin.jsx expects locally
        const enriched = records.map(r => ({
            id: r.clearanceId,
            clearanceId: r.clearanceId,
            to: r.to,
            senderEmail: r.senderEmail,
            purchaser: r.purchaserName,
            brand: r.brandName,
            amount: r.amount,
            code: r.code,
            redeemUrl: r.redeemUrl,
            timestamp: r.timestamp,
            status: r.status,
            cancelled: cancelledIds.includes(r.clearanceId)
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ records: enriched, total: enriched.length })
        };
    } catch (err) {
        return { statusCode: 200, headers, body: JSON.stringify({ records: [], error: err.message }) };
    }
};
