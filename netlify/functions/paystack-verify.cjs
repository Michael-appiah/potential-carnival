const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

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
        const { reference } = event.queryStringParameters || {};

        if (!reference) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing parameter: reference' })
            };
        }

        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
            }
        });

        const data = await response.json();

        if (!data.status) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: data.message || 'Failed to verify Paystack transaction' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: data.data.status, // e.g. "success", "failed", "ongoing"
                amount: data.data.amount,
                currency: data.data.currency,
                metadata: data.data.metadata
            })
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        };
    }
};
