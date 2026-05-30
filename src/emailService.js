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

export const sendGiftCardEmail = async ({ to, purchaserName, brandName, amount, cardDetails }) => {
    const token = encodeCardToken({
        ...cardDetails,
        brandName,
        amount,
        purchaserName
    });

    const redeemUrl = `${window.location.origin}/purchase/verification?token=${token}`;

    const emailPayload = {
        to,
        purchaserName,
        brandName,
        amount,
        redeemUrl,
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
        return {
            success: response.ok,
            redeemUrl,
            warning: data.warning || null,
            error: data.error || data.message || (typeof data === 'string' ? data : null) || null,
            data
        };
    } catch (error) {
        console.warn('Netlify function failed or not found (running locally?). Falling back to console log / UI display:', error);
        return {
            success: false,
            isLocalFallback: true,
            redeemUrl,
            error: error.message
        };
    }
};
