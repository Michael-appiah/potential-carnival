// card-get.cjs — Fetch a public business card by username
const { getStore } = require('@netlify/blobs');

// Demo card shown at /card/demo for the landing page example link
const DEMO_CARD = {
    username: 'demo',
    name: 'Alex Johnson',
    title: 'Product Designer',
    company: 'Creative Studio',
    email: 'alex@creativestudio.com',
    phone: '+1 555 234 5678',
    whatsapp: '+15552345678',
    website: 'https://creativestudio.com',
    linkedin: 'https://linkedin.com/in/alexjohnson',
    location: 'San Francisco, CA',
    photo: '',
};

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    const username = (event.queryStringParameters?.username || '').toLowerCase().trim();

    if (!username) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Username is required' }) };
    }

    // Return demo card without hitting storage
    if (username === 'demo') {
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, card: DEMO_CARD }) };
    }

    try {
        const store = getStore({ name: 'nc-cards' });
        const card = await store.get(`card:${username}`, { type: 'json' }).catch(() => null);

        if (!card) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Card not found' }) };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, card }),
        };

    } catch (err) {
        console.error('card-get error:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
