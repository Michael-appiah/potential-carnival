// Actually, standard Node 18+ has global fetch natively. No node-fetch dependency required.
exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { to, purchaserName, brandName, amount, redeemUrl, cardDetails } = JSON.parse(event.body);

        if (!to || !purchaserName || !brandName || !amount || !redeemUrl) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        const apiKey = process.env.RESEND_API_KEY || 're_TZWMwMix_4X7i5Tj3JQzje9LfUXPszoGg';
        
        // Beautiful Premium Gift Card Email Template
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Your ${brandName} Gift Card has Arrived!</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        background-color: #0f172a;
                        color: #f8fafc;
                        margin: 0;
                        padding: 0;
                    }
                    .email-wrapper {
                        width: 100%;
                        background-color: #0f172a;
                        padding: 40px 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                        border-radius: 16px;
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        overflow: hidden;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5);
                    }
                    .header {
                        padding: 40px 30px;
                        text-align: center;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    }
                    .badge {
                        display: inline-block;
                        background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);
                        color: #ffffff;
                        font-size: 12px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 1.5px;
                        padding: 6px 16px;
                        border-radius: 50px;
                        margin-bottom: 20px;
                    }
                    h1 {
                        font-size: 28px;
                        font-weight: 800;
                        margin: 0 0 10px 0;
                        background: linear-gradient(to right, #ffffff, #94a3b8);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        color: #ffffff;
                    }
                    .subtitle {
                        color: #94a3b8;
                        font-size: 16px;
                        margin: 0;
                    }
                    .content {
                        padding: 40px 30px;
                        text-align: center;
                    }
                    .gift-box {
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px dashed rgba(255, 255, 255, 0.1);
                        border-radius: 12px;
                        padding: 30px;
                        margin-bottom: 30px;
                    }
                    .card-preview {
                        font-size: 64px;
                        margin-bottom: 10px;
                    }
                    .amount-display {
                        font-size: 40px;
                        font-weight: 800;
                        color: #818cf8;
                        margin-bottom: 10px;
                    }
                    .details-text {
                        color: #cbd5e1;
                        font-size: 15px;
                        line-height: 1.6;
                        margin-bottom: 20px;
                    }
                    .btn-redeem {
                        display: inline-block;
                        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                        color: #ffffff !important;
                        text-decoration: none;
                        font-weight: 700;
                        font-size: 16px;
                        padding: 16px 36px;
                        border-radius: 12px;
                        box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
                        transition: all 0.3s ease;
                    }
                    .security-notice {
                        font-size: 12px;
                        color: #64748b;
                        margin-top: 30px;
                        line-height: 1.5;
                    }
                    .footer {
                        padding: 30px;
                        text-align: center;
                        font-size: 12px;
                        color: #475569;
                        border-top: 1px solid rgba(255, 255, 255, 0.05);
                        background-color: rgba(0, 0, 0, 0.2);
                    }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <div class="container">
                        <div class="header">
                            <span class="badge">Voucher Delivery</span>
                            <h1>Gift Card Ready</h1>
                            <p class="subtitle">A special surprise has been sent to you</p>
                        </div>
                        <div class="content">
                            <div class="gift-box">
                                <div class="card-preview">🎁</div>
                                <div class="amount-display">$${amount}.00</div>
                                <p class="details-text">
                                    A <strong>${brandName} Gift Card</strong> purchased by <strong>${purchaserName}</strong> is waiting for you! 
                                    Please complete the secure ownership verification to claim and reveal your card details.
                                </p>
                                <a href="${redeemUrl}" class="btn-redeem" target="_blank">Redeem Your Gift Card</a>
                            </div>
                            <p class="security-notice">
                                Security Notice: This gift card token is protected by bank-grade security. 
                                A standard verification process is required to securely assign this card to your ownership.
                            </p>
                        </div>
                        <div class="footer">
                            &copy; 2026 Recharge Voucher Hub. Secure Digital Asset Delivery.
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Direct fetch to Resend API
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.SENDER_EMAIL || 'Recharge Hub <onboarding@resend.dev>',
                to: to,
                subject: `Your $${amount} ${brandName} Gift Card from ${purchaserName} has arrived!`,
                html: emailHtml
            })
        });

        const resData = await response.json();

        if (response.ok) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Email sent successfully!', data: resData, redeemUrl })
            };
        } else {
            // If Resend failed (e.g. wrong email, domain not verified), return error but still provide the link
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: resData.message || 'Resend API error', 
                    redeemUrl,
                    warning: 'Note: Resend free tier accounts can only send emails to the owner address unless you verify your domain.'
                })
            };
        }

    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        };
    }
};
