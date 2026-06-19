// cancel-clearance.js
// Marks a clearance ID as cancelled, stores it in Netlify Blobs,
// and sends cancellation emails to both the recipient and sender.

const CANCELLED_KEY = 'money_form_cancelled_ids';

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { clearanceId, recipientEmail, senderEmail, purchaserName, brandName, amount } = JSON.parse(event.body);

        if (!clearanceId) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing clearanceId' }) };
        }

        // --- Persist the cancelled ID in Netlify Blobs ---
        const { getStore } = require('@netlify/blobs');
        const store = getStore('clearance-control');

        let cancelledIds = [];
        try {
            const raw = await store.get(CANCELLED_KEY, { type: 'json' });
            if (Array.isArray(raw)) cancelledIds = raw;
        } catch (e) {
            cancelledIds = [];
        }

        if (!cancelledIds.includes(clearanceId)) {
            cancelledIds.push(clearanceId);
        }

        await store.setJSON(CANCELLED_KEY, cancelledIds);

        // --- Send cancellation emails ---
        const apiKey = process.env.RESEND_API_KEY || 're_7hiQhjXs_P7XJeTbUz3go4uNAVBih5mjU';
        const fromAddr = process.env.SENDER_EMAIL || 'Recharge Hub <no-reply@rechargecard.store>';
        const formattedName = purchaserName
            ? purchaserName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            : 'The sender';

        const cancelHtmlRecipient = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Gift Card Cancelled</title>
            </head>
            <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;margin:0;padding:0;">
                <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
                    <div style="padding:32px 28px;border-bottom:1px solid #f1f5f9;">
                        <p style="margin:0 0 4px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Notice</p>
                        <h1 style="margin:0;font-size:24px;font-weight:700;color:#dc2626;">Gift Card Cancelled</h1>
                    </div>
                    <div style="padding:32px 28px;">
                        <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
                            We are writing to let you know that the <strong>${brandName || 'Gift'} Card</strong>${amount ? ` ($${amount}.00)` : ''} 
                            sent by <strong>${formattedName}</strong> has been <strong>cancelled</strong>.
                        </p>
                        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:24px;">
                            <p style="margin:0;font-size:14px;color:#991b1b;font-weight:600;">
                                ⛔ Your clearance link has been deactivated and can no longer be used to access the gift card.
                            </p>
                        </div>
                        <p style="color:#64748b;font-size:13px;margin:0;">
                            If you believe this is a mistake, please contact the sender directly.
                        </p>
                    </div>
                    <div style="padding:20px 28px;background:#f8fafc;border-top:1px solid #f1f5f9;font-size:12px;color:#94a3b8;text-align:center;">
                        &copy; 2026 Recharge Hub &mdash; <a href="https://rechargecard.store" style="color:#94a3b8;">rechargecard.store</a>
                    </div>
                </div>
            </body>
            </html>
        `;

        const cancelHtmlSender = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Cancellation Confirmed</title>
            </head>
            <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;margin:0;padding:0;">
                <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
                    <div style="padding:32px 28px;border-bottom:1px solid #f1f5f9;">
                        <p style="margin:0 0 4px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Cancellation Confirmed</p>
                        <h1 style="margin:0;font-size:24px;font-weight:700;color:#0f172a;">Gift Card Cancelled</h1>
                    </div>
                    <div style="padding:32px 28px;">
                        <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
                            Hi ${formattedName}, the following gift card has been successfully cancelled:
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                            <tr style="background:#f8fafc;">
                                <td style="padding:12px 16px;font-size:13px;color:#64748b;">Gift Card</td>
                                <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#0f172a;text-align:right;">${brandName || 'N/A'}</td>
                            </tr>
                            ${amount ? `<tr>
                                <td style="padding:12px 16px;font-size:13px;color:#64748b;">Amount</td>
                                <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#0f172a;text-align:right;">$${amount}.00</td>
                            </tr>` : ''}
                            ${recipientEmail ? `<tr style="background:#f8fafc;">
                                <td style="padding:12px 16px;font-size:13px;color:#64748b;">Sent To</td>
                                <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#0f172a;text-align:right;">${recipientEmail}</td>
                            </tr>` : ''}
                            <tr>
                                <td style="padding:12px 16px;font-size:13px;color:#64748b;">Status</td>
                                <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#dc2626;text-align:right;">Cancelled</td>
                            </tr>
                        </table>
                        <p style="margin:24px 0 0 0;font-size:13px;color:#64748b;">
                            The clearance link has been permanently deactivated. The recipient has also been notified.
                        </p>
                    </div>
                    <div style="padding:20px 28px;background:#f8fafc;border-top:1px solid #f1f5f9;font-size:12px;color:#94a3b8;text-align:center;">
                        &copy; 2026 Recharge Hub &mdash; <a href="https://rechargecard.store" style="color:#94a3b8;">rechargecard.store</a>
                    </div>
                </div>
            </body>
            </html>
        `;

        const emailJobs = [];

        // Send to recipient
        if (recipientEmail) {
            emailJobs.push(fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: fromAddr,
                    to: recipientEmail,
                    subject: `Your ${brandName || 'Gift'} Card clearance has been cancelled`,
                    html: cancelHtmlRecipient,
                    text: `Your ${brandName} Card clearance has been cancelled and the link is no longer active.`
                })
            }));
        }

        // Send to sender
        if (senderEmail) {
            emailJobs.push(fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: fromAddr,
                    to: senderEmail,
                    subject: `Cancellation confirmed: ${brandName || 'Gift'} Card to ${recipientEmail || 'recipient'}`,
                    html: cancelHtmlSender,
                    text: `Your ${brandName} Card sent to ${recipientEmail} has been cancelled and the clearance link is deactivated.`
                })
            }));
        }

        await Promise.allSettled(emailJobs);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: `Clearance ${clearanceId} has been cancelled.` })
        };

    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        };
    }
};
