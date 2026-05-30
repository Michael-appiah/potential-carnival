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
        let iconBg = '#6366f1';
        let cardImageUrl = '';
        let cardBg = 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)';

        // Inline SVG paths for each brand (from SimpleIcons)
        const BRAND_SVGS = {
            apple: {
                path: 'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701',
                fill: '#ffffff',
                bg: '#000000'
            },
            steam: {
                path: 'M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z',
                fill: '#ffffff',
                bg: '#1b2838'
            },
            amazon: {
                path: 'M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 01-10.951-.577 17.88 17.88 0 01-5.43-3.35c-.1-.074-.151-.15-.151-.22 0-.047.021-.09.051-.13zm6.565-6.218c0-1.005.247-1.863.743-2.577.495-.71 1.17-1.25 2.04-1.615.796-.335 1.756-.575 2.912-.72.39-.046 1.033-.103 1.92-.174v-.37c0-.93-.105-1.558-.3-1.875-.302-.43-.78-.65-1.44-.65h-.182c-.48.046-.896.196-1.246.46-.35.27-.575.63-.675 1.096-.06.3-.206.465-.435.51l-2.52-.315c-.248-.06-.372-.18-.372-.39 0-.046.007-.09.022-.15.247-1.29.855-2.25 1.82-2.88.976-.616 2.1-.975 3.39-1.05h.54c1.65 0 2.957.434 3.888 1.29.135.15.27.3.405.48.12.165.224.314.283.45.075.134.15.33.195.57.06.254.105.42.135.51.03.104.062.3.076.615.01.313.02.493.02.553v5.28c0 .376.06.72.165 1.036.105.313.21.54.315.674l.51.674c.09.136.136.256.136.36 0 .12-.06.226-.18.314-1.2 1.05-1.86 1.62-1.963 1.71-.165.135-.375.15-.63.045a6.062 6.062 0 01-.526-.496l-.31-.347a9.391 9.391 0 01-.317-.42l-.3-.435c-.81.886-1.603 1.44-2.4 1.665-.494.15-1.093.227-1.83.227-1.11 0-2.04-.343-2.76-1.034-.72-.69-1.08-1.665-1.08-2.94l-.05-.076zm3.753-.438c0 .566.14 1.02.425 1.364.285.34.675.512 1.155.512.045 0 .106-.007.195-.02.09-.016.134-.023.166-.023.614-.16 1.08-.553 1.424-1.178.165-.28.285-.58.36-.91.09-.32.12-.59.135-.8.015-.195.015-.54.015-1.005v-.54c-.84 0-1.484.06-1.92.18-1.275.36-1.92 1.17-1.92 2.43l-.035-.02zm9.162 7.027c.03-.06.075-.11.132-.17.362-.243.714-.41 1.05-.5a8.094 8.094 0 011.612-.24c.14-.012.28 0 .41.03.65.06 1.05.168 1.172.33.063.09.099.228.099.39v.15c0 .51-.149 1.11-.424 1.8-.278.69-.664 1.248-1.156 1.68-.073.06-.14.09-.197.09-.03 0-.06 0-.09-.012-.09-.044-.107-.12-.064-.24.54-1.26.806-2.143.806-2.64 0-.15-.03-.27-.087-.344-.145-.166-.55-.257-1.224-.257-.243 0-.533.016-.87.046-.363.045-.7.09-1 .135-.09 0-.148-.014-.18-.044-.03-.03-.036-.047-.02-.077 0-.017.006-.03.02-.063v-.06z',
                fill: '#FF9900',
                bg: '#232f3e'
            },
            playstation: {
                path: 'M8.984 2.596v17.547l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.18.76.814.76 1.505v5.875c2.441 1.193 4.362-.002 4.362-3.152 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.39-1.502zm4.656 16.241l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5V14.98l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.04 1.472 1.576 2.072-.465.6-1.622 1.036-1.622 1.036l-8.544 3.107V18.86zM1.807 18.6c-1.9-.545-2.214-1.668-1.352-2.32.801-.586 2.16-1.052 2.16-1.052l5.615-2.013v2.313L4.205 17c-.705.271-.825.632-.239.826.586.195 1.637.15 2.343-.12L8.247 17v2.074c-.12.03-.256.044-.39.073-1.939.331-3.996.196-6.038-.479z',
                fill: '#ffffff',
                bg: '#003791'
            },
            xbox: {
                path: 'M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.002 17.48 24 14.861 24 12.004c0-3.34-1.365-6.362-3.57-8.536 0 0-.027-.022-.082-.042-.063-.022-.152-.045-.281-.045-.592 0-1.985.434-4.805 3.246zM3.654 3.426c-.057.02-.082.041-.086.042C1.365 5.642 0 8.664 0 12.004c0 2.854.998 5.473 2.661 7.533-1.401-2.605 3.579-9.951 6.08-12.91-2.82-2.813-4.216-3.245-4.806-3.245-.131 0-.223.021-.281.046v-.002zM12 3.551S9.055 1.828 6.755 1.746c-.903-.033-1.454.295-1.521.339C7.379.646 9.659 0 11.984 0H12c2.334 0 4.605.646 6.766 2.085-.068-.046-.615-.372-1.52-.339C14.946 1.828 12 3.545 12 3.545v.006z',
                fill: '#ffffff',
                bg: '#107c10'
            }
        };

        // Match brand key to SVG data
        let svgData = null;
        if (brandKey.includes('apple')) {
            svgData = BRAND_SVGS.apple;
            amountColor = '#000000';
            badgeGradient = 'linear-gradient(135deg, #1f1f24 0%, #000000 100%)';
            iconBg = '#000000';
            cardImageUrl = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/gift-card-double-202501?wid=400&hei=280&fmt=jpeg&qlt=90&.v=1736550073000';
            cardBg = 'linear-gradient(135deg, #f0f0f0 0%, #ffffff 100%)';
        } else if (brandKey.includes('steam')) {
            svgData = BRAND_SVGS.steam;
            amountColor = '#00b4e4';
            badgeGradient = 'linear-gradient(135deg, #101b22 0%, #1b2838 100%)';
            iconBg = '#1b2838';
            cardImageUrl = 'https://cdn.cloudflare.steamstatic.com/steam/clusters/sale_autumn2023/4c89f1cce98d67b2e5db6291/page_bg_english.jpg';
            cardBg = 'linear-gradient(135deg, #101b22 0%, #1b2838 100%)';
        } else if (brandKey.includes('amazon')) {
            svgData = BRAND_SVGS.amazon;
            amountColor = '#ff9900';
            badgeGradient = 'linear-gradient(135deg, #232f3e 0%, #111111 100%)';
            iconBg = '#232f3e';
            cardImageUrl = 'https://images-na.ssl-images-amazon.com/images/G/01/gc/designs/livepreview/amazon_dkblue_noto_email_v2016_us-main._CB468775011_.png';
            cardBg = 'linear-gradient(135deg, #232f3e 0%, #131921 100%)';
        } else if (brandKey.includes('playstation') || brandKey.includes('psn')) {
            svgData = BRAND_SVGS.playstation;
            amountColor = '#0070d1';
            badgeGradient = 'linear-gradient(135deg, #003791 0%, #001a5c 100%)';
            iconBg = '#003791';
            cardImageUrl = 'https://gmedia.playstation.com/is/image/SIEPDC/psn-gift-card-image-block-01-en-06aug21?$800px--t$';
            cardBg = 'linear-gradient(135deg, #003087 0%, #00439c 100%)';
        } else if (brandKey.includes('xbox')) {
            svgData = BRAND_SVGS.xbox;
            amountColor = '#107c10';
            badgeGradient = 'linear-gradient(135deg, #107c10 0%, #052005 100%)';
            iconBg = '#107c10';
            cardImageUrl = 'https://compass-ssl.xbox.com/assets/9b/18/9b18b4a1-f5d8-4b71-b543-8ca218e9d6d4.jpg?n=Gift-Card_GiftCard-Solo_1084x610.jpg';
            cardBg = 'linear-gradient(135deg, #107c10 0%, #0a5a0a 100%)';
        }

        // Build inline SVG as base64 data URI (works in Gmail, Apple Mail, Outlook web)
        const brandIconImg = svgData
            ? (() => {
                const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48"><path d="${svgData.path}" fill="${svgData.fill}"/></svg>`;
                const b64 = Buffer.from(svgStr).toString('base64');
                return `<img src="data:image/svg+xml;base64,${b64}" width="48" height="48" alt="${brandName} logo" style="display:block;" />`;
            })()
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
