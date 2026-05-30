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
        const { to, from, purchaserName, brandName, amount, redeemUrl, cardDetails } = JSON.parse(event.body);

        if (!to || !purchaserName || !brandName || !amount || !redeemUrl) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        const apiKey = process.env.RESEND_API_KEY || 're_7hiQhjXs_P7XJeTbUz3go4uNAVBih5mjU';

        // Set brand-specific icon and colors
        const brandKey = brandName.toLowerCase();
        let amountColor = '#4f46e5';
        let badgeGradient = 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)';
        
        if (brandKey.includes('apple')) {
            amountColor = '#000000';
            badgeGradient = 'linear-gradient(135deg, #1f1f24 0%, #000000 100%)';
        } else if (brandKey.includes('steam')) {
            amountColor = '#00c0f4';
            badgeGradient = 'linear-gradient(135deg, #101b22 0%, #171a21 100%)';
        } else if (brandKey.includes('amazon')) {
            amountColor = '#ff9900';
            badgeGradient = 'linear-gradient(135deg, #232f3e 0%, #111 100%)';
        } else if (brandKey.includes('playstation') || brandKey.includes('psn')) {
            amountColor = '#0070d1';
            badgeGradient = 'linear-gradient(135deg, #003087 0%, #001030 100%)';
        } else if (brandKey.includes('xbox')) {
            amountColor = '#107c10';
            badgeGradient = 'linear-gradient(135deg, #107c10 0%, #052005 100%)';
        }

        const colorHex = amountColor.replace('#', '');
        let iconSlug = 'gift';
        if (brandKey.includes('apple')) {
            iconSlug = 'apple-logo';
        } else if (brandKey.includes('steam')) {
            iconSlug = 'steam';
        } else if (brandKey.includes('amazon')) {
            iconSlug = 'amazon';
        } else if (brandKey.includes('playstation') || brandKey.includes('psn')) {
            iconSlug = 'playstation';
        } else if (brandKey.includes('xbox')) {
            iconSlug = 'xbox';
        }

        const brandIcon = `<img src="https://img.icons8.com/ios-filled/100/${colorHex}/${iconSlug}.png" width="64" height="64" alt="${brandName} Logo" style="display: inline-block; vertical-align: middle;" />`;
        
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
                        background-color: #f8fafc;
                        color: #334155;
                        margin: 0;
                        padding: 0;
                        -webkit-font-smoothing: antialiased;
                    }
                    .email-wrapper {
                        width: 100%;
                        background-color: #f8fafc;
                        padding: 60px 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: #ffffff;
                        border-radius: 20px;
                        border: 1px solid #e2e8f0;
                        overflow: hidden;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
                    }
                    .header {
                        padding: 40px 30px;
                        text-align: center;
                        border-bottom: 1px solid #f1f5f9;
                    }
                    .badge {
                        display: inline-block;
                        background: ${badgeGradient};
                        color: #ffffff;
                        font-size: 12px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 1.5px;
                        padding: 8px 18px;
                        border-radius: 50px;
                        margin-bottom: 24px;
                        box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
                    }
                    h1 {
                        font-size: 32px;
                        font-weight: 800;
                        margin: 0 0 12px 0;
                        color: #0f172a;
                        letter-spacing: -0.5px;
                    }
                    .subtitle {
                        color: #64748b;
                        font-size: 16px;
                        margin: 0;
                        font-weight: 500;
                    }
                    .content {
                        padding: 40px 30px;
                        text-align: center;
                    }
                    .gift-box {
                        background: #f8fafc;
                        border: 2px dashed #cbd5e1;
                        border-radius: 16px;
                        padding: 35px 20px;
                        margin-bottom: 35px;
                    }
                    .card-preview {
                        font-size: 64px;
                        margin-bottom: 15px;
                    }
                    .amount-display {
                        font-size: 48px;
                        font-weight: 900;
                        color: ${amountColor};
                        margin-bottom: 12px;
                        letter-spacing: -1px;
                    }
                    .details-text {
                        color: #475569;
                        font-size: 16px;
                        line-height: 1.6;
                        margin-bottom: 30px;
                        padding: 0 10px;
                    }
                    .btn-redeem {
                        display: inline-block;
                        background: ${badgeGradient};
                        color: #ffffff !important;
                        text-decoration: none;
                        font-weight: 700;
                        font-size: 16px;
                        padding: 18px 40px;
                        border-radius: 12px;
                        box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
                        transition: all 0.3s ease;
                    }
                    .security-notice {
                        font-size: 13px;
                        color: #94a3b8;
                        margin-top: 30px;
                        line-height: 1.6;
                    }
                    .footer {
                        padding: 30px;
                        text-align: center;
                        font-size: 13px;
                        color: #94a3b8;
                        border-top: 1px solid #f1f5f9;
                        background-color: #f8fafc;
                        font-weight: 500;
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
                                <div class="card-preview">${brandIcon}</div>
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
                            &copy; 2026 recharge.com. Secure Digital Asset Delivery.
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
                from: from || process.env.SENDER_EMAIL || 'Recharge Hub <no-reply@rechargecard.store>',
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
