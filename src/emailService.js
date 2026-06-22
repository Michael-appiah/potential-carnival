/**
 * Email Service for Gift Card dispatch and tokenization
 */

export const encodeCardToken = (cardDetails) => {
    try {
        const payloadStr = JSON.stringify(cardDetails);
        // Base64 encoding supporting UTF-8 characters safely
        return btoa(encodeURIComponent(payloadStr).replace(/%([0-9A-F]{2})/g, function(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    } catch (e) {
        console.error('Token encoding failed:', e);
        return '';
    }
};

export const decodeCardToken = (token) => {
    try {
        const payloadStr = decodeURIComponent(atob(token).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(payloadStr);
    } catch (e) {
        console.error('Token decoding failed:', e);
        return null;
    }
};

export const sendGiftCardEmail = async ({ to, purchaserName, senderEmail, brandName, amount, cardDetails }) => {
    // Unique ID for this specific clearance link — used to cancel it from Admin
    const clearanceId = `clr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const token = encodeCardToken({
        ...cardDetails,
        brandName,
        amount,
        purchaserName,
        clearanceId,
        recipientEmail: to,
        senderEmail: senderEmail || ''
    });

    const redeemUrl = `${window.location.origin}/purchase/verification?token=${encodeURIComponent(token)}`;

    const emailPayload = {
        to,
        purchaserName,
        senderEmail,
        brandName,
        amount,
        redeemUrl,
        clearanceId,
        cardDetails
    };

    try {
        const response = await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailPayload)
        });

        const data = await response.json();
        const errMsg = data.error || data.message || data.errorMessage || (typeof data === 'string' ? data : (data ? JSON.stringify(data) : null));

        // Persist clearance record to server
        fetch('/.netlify/functions/save-clearance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clearanceId,
                to,
                senderEmail: senderEmail || '',
                purchaserName,
                brandName,
                amount,
                redeemUrl,
                code: cardDetails.code,
                timestamp: new Date().toISOString(),
                status: response.ok ? 'Delivered' : 'Failed'
            })
        }).catch(() => {}); // fire and forget

        return {
            success: response.ok,
            redeemUrl,
            clearanceId,
            warning: data.warning || null,
            error: errMsg || null,
            data
        };
    } catch (error) {
        console.warn('Netlify function failed or not found (running locally?). Falling back to console log / UI display:', error);
        return {
            success: false,
            isLocalFallback: true,
            redeemUrl,
            clearanceId,
            error: error.message
        };
    }
};
