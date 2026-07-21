const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { email, amountInUsd, callbackUrl, metadata } = JSON.parse(event.body || '{}');

        if (!email || !amountInUsd) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required parameters: email or amountInUsd' })
            };
        }

        // Convert USD to GHS (Exchange rate: 1 USD = 15 GHS)
        const exchangeRate = 15.0;
        const amountInGhs = amountInUsd * exchangeRate;
        const amountInPesewas = Math.round(amountInGhs * 100);

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                amount: amountInPesewas,
                currency: 'GHS',
                callback_url: callbackUrl,
                metadata: {
                    ...metadata,
                    amountInUsd,
                    amountInGhs
                }
            })
        });

        const data = await response.json();

        if (!data.status) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: data.message || 'Failed to initialize Paystack transaction' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                authorization_url: data.data.authorization_url,
                reference: data.data.reference
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
