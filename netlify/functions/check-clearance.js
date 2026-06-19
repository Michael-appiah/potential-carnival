// check-clearance.js
// Checks whether a clearance ID has been cancelled by the admin.
// Cancelled IDs are stored as JSON in a free JSONBin bin (no extra setup needed).
// Falls back gracefully so the clearance page still works if check fails.

const CANCELLED_KEY = 'money_form_cancelled_ids';

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { clearanceId } = event.queryStringParameters || {};

        if (!clearanceId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing clearanceId' })
            };
        }

        // Read cancelled IDs from Netlify Blobs (built-in KV store)
        const { getStore } = require('@netlify/blobs');
        const store = getStore('clearance-control');

        let cancelledIds = [];
        try {
            const raw = await store.get(CANCELLED_KEY, { type: 'json' });
            if (Array.isArray(raw)) cancelledIds = raw;
        } catch (e) {
            // Not yet created — treat as empty list
            cancelledIds = [];
        }

        const isCancelled = cancelledIds.includes(clearanceId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ clearanceId, cancelled: isCancelled })
        };
    } catch (err) {
        // If Netlify Blobs isn't available (local dev), assume not cancelled
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ cancelled: false, note: 'Blobs unavailable, assuming active' })
        };
    }
};
