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
        const { to, from, senderEmail, purchaserName, brandName, amount, redeemUrl, cardDetails } = JSON.parse(event.body);

        if (!to || !purchaserName || !brandName || !amount || !redeemUrl) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        const formattedPurchaserName = purchaserName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

        const apiKey = process.env.RESEND_API_KEY || 're_7hiQhjXs_P7XJeTbUz3go4uNAVBih5mjU';

        // Set brand-specific icon and colors
        const brandKey = brandName.toLowerCase();
        let amountColor = '#4f46e5';
        let badgeGradient = 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)';
        let iconBg = '#f8fafc';
        let logoUrl = '';
        let cardImageUrl = '';
        let cardBg = 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)';

        // Inline SVG paths for each brand — base64 encoded so no external image requests needed
        const BRAND_CONFIG = {
            apple: {
                svgPath: 'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701',
                svgFill: '#ffffff', iconBg: '#000000', amount: '#000000',
                badge: 'linear-gradient(135deg, #1f1f24 0%, #000000 100%)'
            },
            steam: {
                svgPath: 'M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z',
                svgFill: '#ffffff', iconBg: '#1b2838', amount: '#00b4e4',
                badge: 'linear-gradient(135deg, #101b22 0%, #1b2838 100%)'
            },
            amazon: {
                svgPath: 'M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.67-1.748 1.092-3.65 1.82-5.71 2.185-1.78.33-3.545.44-5.3.335-2.47-.15-4.8-.79-7.01-1.92-.985-.49-1.916-1.07-2.79-1.73-.24-.18-.29-.36-.15-.53zm6.976-7.638c0-1.928.48-3.538 1.441-4.83.96-1.29 2.214-2.05 3.757-2.28.387-.054.77-.08 1.148-.08 1.666 0 3.028.56 4.087 1.68.52.54.867 1.18 1.042 1.91.065.28.02.5-.14.66l-2.5 2.38c-.088.083-.19.126-.31.126-.22 0-.39-.1-.51-.32-.2-.4-.5-.73-.91-.99-.41-.27-.86-.4-1.37-.4-.7 0-1.28.26-1.73.78-.46.52-.69 1.17-.69 1.96v5.16c0 .82.23 1.49.7 2.01.47.52 1.06.78 1.77.78.53 0 1.01-.14 1.43-.42.42-.27.72-.64.91-1.1.05-.12.15-.2.3-.26l2.6.84c.22.07.33.22.33.45 0 .05-.01.1-.02.16-.4 1.12-1.09 1.98-2.07 2.6-.97.62-2.09.93-3.34.93-1.66 0-3.03-.59-4.1-1.76-1.07-1.18-1.61-2.7-1.61-4.57v-5.18z',
                svgFill: '#ffffff', iconBg: '#ff9900', amount: '#ff9900',
                badge: 'linear-gradient(135deg, #232f3e 0%, #111111 100%)'
            },
            playstation: {
                svgPath: 'M8.984 2.596v16.815l3.915 1.222V6.688c0-.69.304-1.151.794-.996.636.18.76.814.76 1.501v5.03c1.454.515 2.585.06 3.29-.76.662-.768.926-1.99.926-3.333 0-1.385-.272-2.48-.832-3.235-.772-1.043-2.06-1.436-3.738-1.436-1.21 0-3.032.418-4.315.637zm-3.306 14.87c-1.616-.457-1.882-1.41-1.147-1.96.67-.506 1.845-.883 1.845-.883l4.79-1.727v1.97l-3.448 1.24c-.622.223-.714.527-.224.696.49.168 1.33.12 1.952-.102l1.72-.625v1.763c-.083.015-.17.03-.256.046-1.672.295-3.27.147-5.232-.418zM22.092 14.7c-.8-.457-1.867-.626-3.026-.626-.63 0-1.272.054-1.904.162v1.97l1.28-.463c.622-.224.714-.527.224-.696-.284-.096-.637-.13-1.024-.076v-1.8c.29-.027.582-.04.877-.04 1.002 0 1.85.154 2.454.496.852.48.805 1.13.154 1.647-.498.39-1.302.686-1.302.686v1.96c.11-.038.217-.078.32-.12 1.266-.507 2.25-1.263 2.25-2.356 0-.598-.16-1.08-.303-1.344z',
                svgFill: '#ffffff', iconBg: '#003791', amount: '#0070d1',
                badge: 'linear-gradient(135deg, #003791 0%, #001a5c 100%)'
            },
            xbox: {
                svgPath: 'M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.002 17.48 24 14.861 24 12.004c0-3.34-1.365-6.362-3.57-8.536 0 0-.027-.022-.082-.042-.063-.022-.152-.045-.281-.045-.592 0-1.985.434-4.805 3.246zM3.654 3.426c-.057.02-.082.041-.086.042C1.365 5.642 0 8.664 0 12.004c0 2.854.998 5.473 2.661 7.533-1.401-2.605 3.579-9.951 6.08-12.91-2.82-2.813-4.216-3.245-4.806-3.245-.131 0-.223.021-.281.046v-.002zM12 3.551S9.055 1.828 6.755 1.746c-.903-.033-1.454.295-1.521.339C7.379.646 9.659 0 11.984 0H12c2.334 0 4.605.646 6.766 2.085-.068-.046-.615-.372-1.52-.339C14.946 1.828 12 3.545 12 3.545v.006z',
                svgFill: '#ffffff', iconBg: '#107c10', amount: '#107c10',
                badge: 'linear-gradient(135deg, #107c10 0%, #052005 100%)'
            }
        };

        let brandConfig = null;
        if (brandKey.includes('apple')) {
            brandConfig = BRAND_CONFIG.apple;
            let siteOrigin = 'https://rechargecard.store';
            try { siteOrigin = new URL(redeemUrl).origin; } catch(e) {}
            cardImageUrl = `${siteOrigin}/icons/apple-card.png`;
            cardBg = 'linear-gradient(135deg, #000000 0%, #111111 100%)';
        } else if (brandKey.includes('steam')) {
            brandConfig = BRAND_CONFIG.steam;
            cardImageUrl = '';
            cardBg = 'linear-gradient(135deg, #101b22 0%, #1b2838 100%)';
        } else if (brandKey.includes('amazon')) {
            brandConfig = BRAND_CONFIG.amazon;
            cardImageUrl = '';
            cardBg = 'linear-gradient(135deg, #232f3e 0%, #131921 100%)';
        } else if (brandKey.includes('playstation') || brandKey.includes('psn')) {
            brandConfig = BRAND_CONFIG.playstation;
            cardImageUrl = '';
            cardBg = 'linear-gradient(135deg, #003087 0%, #00439c 100%)';
        } else if (brandKey.includes('xbox')) {
            brandConfig = BRAND_CONFIG.xbox;
            cardImageUrl = '';
            cardBg = 'linear-gradient(135deg, #107c10 0%, #0a5a0a 100%)';
        }

        if (brandConfig) {
            amountColor   = brandConfig.amount;
            badgeGradient = brandConfig.badge;
            iconBg        = brandConfig.iconBg;
        }

        // Build brand icon as base64-encoded inline SVG — works in ALL email clients, no external requests
        const buildIconImg = (config) => {
            if (!config) return `<span style="font-size:32px;line-height:1;">🎁</span>`;
            const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48"><path d="${config.svgPath}" fill="${config.svgFill}"/></svg>`;
            const b64 = Buffer.from(svgStr).toString('base64');
            return `<img src="data:image/svg+xml;base64,${b64}" width="48" height="48" alt="${brandName} logo" style="display:block;" />`;
        };
        const brandIconImg = buildIconImg(brandConfig);

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
                                        <span class="badge">${brandName} Digital Item</span>
                                    </td>
                                </tr>
                            </table>
                            <h1>Digital Delivery Notification</h1>
                        </div>
                        <div class="content">
                            <div class="gift-box">
                                <div class="card-preview">${brandIcon}</div>
                                <div class="amount-display">$${amount}.00</div>
                                <p class="details-text">
                                    This is a notification that ${formattedPurchaserName} has sent you a digital item.<br><br>
                                    You can safely access your delivery details using the link below.
                                </p>
                                <!-- Bulletproof button for iOS Mail -->
                                <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                                    <tr>
                                        <td align="center" style="border-radius: 12px; background: ${badgeGradient};">
                                            <a href="${redeemUrl}" class="btn-redeem" style="display: inline-block; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 12px; background: ${badgeGradient}; line-height: 1.5; mso-padding-alt: 0;" target="_blank">Access Delivery</a>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            <p class="security-notice">
                                This automated notification was sent regarding a digital delivery. If you did not expect this, you can safely ignore this email.
                            </p>
                        </div>
                        <div class="footer">
                            Need help? Visit <a href="https://rechargecard.store" style="color:#94a3b8; text-decoration:underline;">rechargecard.store</a> or contact <a href="mailto:support@rechargecard.store" style="color:#94a3b8; text-decoration:underline;">support@rechargecard.store</a><br><br>
                            If you no longer wish to receive these notifications, <a href="mailto:unsubscribe@rechargecard.store" style="color:#94a3b8; text-decoration:underline;">unsubscribe here</a>.<br><br>
                            &copy; 2026 Recharge Hub, 123 Tech District, NY 10001
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Prepare the recipient email payload
        const recipientPayload = {
            from: from || process.env.SENDER_EMAIL || 'Recharge Hub <no-reply@rechargecard.store>',
            to: to,
            subject: `You have received a digital item from ${formattedPurchaserName}`,
            html: emailHtml,
            text: `This is a notification that ${formattedPurchaserName} has sent you a digital item.\n\nYou can access your delivery details here: ${redeemUrl}\n\nIf you did not expect this, you can safely ignore it.\n\nRecharge Hub Support`
        };

        const emailJobs = [];

        // Job 1: Send to Recipient
        emailJobs.push(fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recipientPayload)
        }).then(res => res.json()));

        // Job 2: Send receipt to Sender (if provided)
        if (senderEmail) {
            const confirmationHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Purchase Confirmation</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 0; }
                        .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
                        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
                        .header { padding: 32px 28px; border-bottom: 1px solid #f1f5f9; }
                        .content { padding: 32px 28px; }
                        .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
                        .label { color: #64748b; }
                        .value { font-weight: 600; color: #0f172a; }
                        .footer { padding: 24px 28px; background: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <p style="margin:0 0 4px 0; font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:1px;">Purchase Confirmation</p>
                                <h1 style="margin:0; font-size:24px; font-weight:700; color:#0f172a;">Your gift card was sent!</h1>
                            </div>
                            <div class="content">
                                <p style="margin:0 0 24px 0; color:#475569; font-size:15px;">
                                    Hi ${formattedPurchaserName}, your ${brandName} Gift Card has been successfully delivered to <strong>${to}</strong>.
                                </p>
                                <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
                                    <tr style="background:#f8fafc;">
                                        <td style="padding:12px 16px; font-size:13px; color:#64748b;">Gift Card</td>
                                        <td style="padding:12px 16px; font-size:13px; font-weight:600; color:#0f172a; text-align:right;">${brandName}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:12px 16px; font-size:13px; color:#64748b;">Amount</td>
                                        <td style="padding:12px 16px; font-size:13px; font-weight:600; color:#0f172a; text-align:right;">$${amount}.00 USD</td>
                                    </tr>
                                    <tr style="background:#f8fafc;">
                                        <td style="padding:12px 16px; font-size:13px; color:#64748b;">Sent To</td>
                                        <td style="padding:12px 16px; font-size:13px; font-weight:600; color:#0f172a; text-align:right;">${to}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:12px 16px; font-size:13px; color:#64748b;">Date</td>
                                        <td style="padding:12px 16px; font-size:13px; font-weight:600; color:#0f172a; text-align:right;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    </tr>
                                </table>
                                <p style="margin:24px 0 0 0; font-size:13px; color:#64748b;">Keep this email as your purchase receipt.</p>
                            </div>
                            <div class="footer">
                                &copy; 2026 Recharge Hub &mdash; <a href="https://rechargecard.store" style="color:#94a3b8;">rechargecard.store</a>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            emailJobs.push(fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: from || process.env.SENDER_EMAIL || 'Recharge Hub <no-reply@rechargecard.store>',
                    to: senderEmail,
                    subject: `✅ Your $${amount} ${brandName} Gift Card was sent to ${to}`,
                    html: confirmationHtml,
                    text: `Hi ${formattedPurchaserName},\n\nYour $${amount} ${brandName} Gift Card has been successfully delivered to ${to}.\n\nKeep this as your purchase receipt.\n\nRecharge Hub`
                })
            }).then(res => res.json()));
        }

        // Execute both requests simultaneously
        const results = await Promise.allSettled(emailJobs);
        
        // Extract recipient result (always the first one)
        const recipientResult = results[0].value || {};

        if (results[0].status === 'fulfilled' && !recipientResult.error) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Email sent successfully!', 
                    data: recipientResult, 
                    redeemUrl 
                })
            };
        } else {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: recipientResult.message || recipientResult.error || 'Resend API error', 
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
