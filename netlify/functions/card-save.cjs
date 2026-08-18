// card-save.cjs — Save or update the authenticated user's business card
const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

const SECRET = process.env.AUTH_SECRET || 'ncard-secret-2026-change-me';

function verifyToken(token) {
    try {
        const dotIdx = token.lastIndexOf('.');
        if (dotIdx === -1) return null;
        const data = token.slice(0, dotIdx);
        const sig = token.slice(dotIdx + 1);
        const expected = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
        if (sig !== expected) return null;
        const payload = JSON.parse(Buffer.from(data, 'base64').toString());
        if (payload.exp < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    const payload = verifyToken(token);

    if (!payload) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized — please log in again' }) };
    }

    try {
        const body = JSON.parse(event.body);
        const store = getStore({ name: 'nc-cards' });

        const card = {
            username: payload.username,
            name: (body.name || '').trim(),
            title: (body.title || '').trim(),
            company: (body.company || '').trim(),
            email: (body.email || payload.email).trim(),
            phone: (body.phone || '').trim(),
            whatsapp: (body.whatsapp || '').trim(),
            website: (body.website || '').trim(),
            linkedin: (body.linkedin || '').trim(),
            location: (body.location || '').trim(),
            photo: (body.photo || '').trim(),
            updatedAt: new Date().toISOString(),
        };

        await store.setJSON(`card:${payload.username}`, card);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, card }),
        };

    } catch (err) {
        console.error('card-save error:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
