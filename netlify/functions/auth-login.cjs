// auth-login.cjs — Verify credentials and return session token
const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

const SECRET = process.env.AUTH_SECRET || 'ncard-secret-2026-change-me';

function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function createToken(payload) {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64');
    const sig = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
    return `${data}.${sig}`;
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        const { email, password } = JSON.parse(event.body);

        if (!email || !password) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email and password are required' }) };
        }

        const cleanEmail = email.toLowerCase().trim();
        const userStore = getStore({ name: 'nc-users' });
        const user = await userStore.get(`email:${cleanEmail}`, { type: 'json' }).catch(() => null);

        if (!user) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid email or password' }) };
        }

        const hash = hashPassword(password, user.salt);
        if (hash !== user.passwordHash) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid email or password' }) };
        }

        // Issue fresh session token (30 day expiry)
        const token = createToken({
            email: user.email,
            username: user.username,
            exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                token,
                user: { name: user.name, email: user.email, username: user.username },
            }),
        };

    } catch (err) {
        console.error('auth-login error:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
