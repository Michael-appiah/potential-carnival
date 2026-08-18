// auth-signup.cjs — Create a new user account and initial card
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
        const { name, email, username, password } = JSON.parse(event.body);

        if (!name || !email || !username || !password) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'All fields are required' }) };
        }

        const cleanUsername = username.toLowerCase().trim();
        const cleanEmail = email.toLowerCase().trim();

        if (!/^[a-z0-9-]{3,30}$/.test(cleanUsername)) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Username must be 3–30 characters: lowercase letters, numbers, and hyphens only' }) };
        }

        if (password.length < 6) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Password must be at least 6 characters' }) };
        }

        const userStore = getStore({ name: 'nc-users' });
        const cardStore = getStore({ name: 'nc-cards' });

        // Check if email already registered
        const existingByEmail = await userStore.get(`email:${cleanEmail}`, { type: 'json' }).catch(() => null);
        if (existingByEmail) {
            return { statusCode: 409, headers, body: JSON.stringify({ error: 'An account with this email already exists' }) };
        }

        // Check if username taken
        const existingByUsername = await userStore.get(`username:${cleanUsername}`, { type: 'json' }).catch(() => null);
        if (existingByUsername) {
            return { statusCode: 409, headers, body: JSON.stringify({ error: 'This username is already taken. Try another.' }) };
        }

        // Hash password
        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = hashPassword(password, salt);

        const user = {
            name: name.trim(),
            email: cleanEmail,
            username: cleanUsername,
            passwordHash,
            salt,
            createdAt: new Date().toISOString(),
        };

        // Persist user records
        await userStore.setJSON(`email:${cleanEmail}`, user);
        await userStore.setJSON(`username:${cleanUsername}`, { email: cleanEmail });

        // Create blank card for user
        await cardStore.setJSON(`card:${cleanUsername}`, {
            username: cleanUsername,
            name: name.trim(),
            email: cleanEmail,
            title: '',
            company: '',
            phone: '',
            whatsapp: '',
            website: '',
            linkedin: '',
            location: '',
            photo: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        // Issue session token (expires in 30 days)
        const token = createToken({
            email: cleanEmail,
            username: cleanUsername,
            exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                token,
                user: { name: name.trim(), email: cleanEmail, username: cleanUsername },
            }),
        };

    } catch (err) {
        console.error('auth-signup error:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
