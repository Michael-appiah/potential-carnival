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
        let iconBg = '#f8fafc';
        let logoUrl = '';
        let cardImageUrl = '';
        let cardBg = 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)';

        // Real brand logo URLs (Clearbit Logo API — official brand domain logos, returns crisp PNG)
        const BRAND_CONFIG = {
            apple:       { logo: 'https://logo.clearbit.com/apple.com',          bg: '#000000', iconBg: '#000000', amount: '#000000', badge: 'linear-gradient(135deg, #1f1f24 0%, #000000 100%)' },
            steam:       { logo: 'https://logo.clearbit.com/steampowered.com',   bg: '#1b2838', iconBg: '#1b2838', amount: '#00b4e4', badge: 'linear-gradient(135deg, #101b22 0%, #1b2838 100%)' },
            amazon:      { logo: 'https://logo.clearbit.com/amazon.com',         bg: '#232f3e', iconBg: '#ff9900', amount: '#ff9900', badge: 'linear-gradient(135deg, #232f3e 0%, #111111 100%)' },
            playstation: { logo: 'https://logo.clearbit.com/playstation.com',    bg: '#003791', iconBg: '#003791', amount: '#0070d1', badge: 'linear-gradient(135deg, #003791 0%, #001a5c 100%)' },
            xbox:        { logo: 'https://logo.clearbit.com/xbox.com',           bg: '#107c10', iconBg: '#107c10', amount: '#107c10', badge: 'linear-gradient(135deg, #107c10 0%, #052005 100%)' },
        };

        let brandConfig = null;
        if (brandKey.includes('apple')) {
            brandConfig = BRAND_CONFIG.apple;
            cardImageUrl = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/gift-card-double-202501?wid=400&hei=280&fmt=jpeg&qlt=90&.v=1736550073000';
            cardBg = 'linear-gradient(135deg, #f0f0f0 0%, #ffffff 100%)';
        } else if (brandKey.includes('steam')) {
            brandConfig = BRAND_CONFIG.steam;
            cardImageUrl = 'https://cdn.cloudflare.steamstatic.com/steam/clusters/sale_autumn2023/4c89f1cce98d67b2e5db6291/page_bg_english.jpg';
            cardBg = 'linear-gradient(135deg, #101b22 0%, #1b2838 100%)';
        } else if (brandKey.includes('amazon')) {
            brandConfig = BRAND_CONFIG.amazon;
            cardImageUrl = 'https://images-na.ssl-images-amazon.com/images/G/01/gc/designs/livepreview/amazon_dkblue_noto_email_v2016_us-main._CB468775011_.png';
            cardBg = 'linear-gradient(135deg, #232f3e 0%, #131921 100%)';
        } else if (brandKey.includes('playstation') || brandKey.includes('psn')) {
            brandConfig = BRAND_CONFIG.playstation;
            cardImageUrl = 'https://gmedia.playstation.com/is/image/SIEPDC/psn-gift-card-image-block-01-en-06aug21?$800px--t$';
            cardBg = 'linear-gradient(135deg, #003087 0%, #00439c 100%)';
        } else if (brandKey.includes('xbox')) {
            brandConfig = BRAND_CONFIG.xbox;
            cardImageUrl = 'https://compass-ssl.xbox.com/assets/9b/18/9b18b4a1-f5d8-4b71-b543-8ca218e9d6d4.jpg?n=Gift-Card_GiftCard-Solo_1084x610.jpg';
            cardBg = 'linear-gradient(135deg, #107c10 0%, #0a5a0a 100%)';
        }

        if (brandConfig) {
            amountColor   = brandConfig.amount;
            badgeGradient = brandConfig.badge;
            iconBg        = brandConfig.iconBg;
            logoUrl       = brandConfig.logo;
        }

        // Real brand logo <img> — served as PNG from Clearbit (CDN-backed, email safe)
        const brandIconImg = logoUrl
            ? `<img src="${logoUrl}" width="48" height="48" alt="${brandName} logo" style="display:block;border-radius:8px;" />`
            : `<span style="font-size:32px;line-height:1;">🎁</span>`;

        // Build the card image block — real gift card image if available, fallback to styled text card
        const brandIcon = cardImageUrl
            ? `<img src="${cardImageUrl}" width="320" height="200" alt="${brandName} Gift Card" style="display: block; margin: 0 auto; border-radius: 16px; object-fit: cover; box-shadow: 0 20px 40px rgba(0,0,0,0.18); border: 1px solid rgba(0,0,0,0.06);" />`
            : `<div style="width:320px;height:200px;margin:0 auto;border-radius:16px;background:${cardBg};display:flex;align-items:center;justify-content:center;box-shadow:0 20px 40px rgba(0,0,0,0.18);"><span style="color:#fff;font-size:32px;font-weight:900;letter-spacing:-1px;">${brandName} Gift Card</span></div>`;
        
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
                        background: #f1f5f9;
                        border-radius: 20px;
                        padding: 32px 20px;
                        margin-bottom: 35px;
                    }
                    .card-preview {
                        margin-bottom: 20px;
                        text-align: center;
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
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" style="width: 72px; height: 72px; background: ${iconBg}; border-radius: 20px; padding: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);">
                                                    ${brandIconImg}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <span class="badge">${brandName} Gift Card</span>
                                    </td>
                                </tr>
                            </table>
                            <h1>Gift Card Ready!</h1>
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
