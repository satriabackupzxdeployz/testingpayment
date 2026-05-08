// api/create-payment.js
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed. Use POST.' 
        });
    }

    try {
        const { amount, productName } = req.body;

        // Validasi input
        if (!amount || amount < 1000) {
            return res.status(400).json({
                success: false,
                message: 'Jumlah pembayaran minimal Rp 1.000'
            });
        }

        // Konfigurasi API QRIS
        const QRIS_API_URL = 'https://qris.pw/api/create-payment.php';
        const API_KEY = '61ca43a4e6861fef952193910d116f08f681b0873163eb7a9900541f50342b9c';
        const API_SECRET = 'ccb05f10fff89cd4d2bd6d86e3ddbbaffb5fbbfb72d88c9b9f779aa0fa5b6569';

        // Payload untuk QRIS API
        const payload = {
            amount: parseInt(amount),
            description: `Terimakasih telah membeli produk ${productName || 'Digital Premium'} 🙏`
        };

        console.log('📤 Sending to QRIS API:', payload);

        // Kirim request ke QRIS API
        const qrisResponse = await fetch(QRIS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
                'X-API-Secret': API_SECRET
            },
            body: JSON.stringify(payload)
        });

        // Coba parse response
        let data;
        const responseText = await qrisResponse.text();
        
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Failed to parse QRIS response:', responseText);
            return res.status(502).json({
                success: false,
                message: 'Invalid response from payment gateway',
                raw_response: responseText.substring(0, 200)
            });
        }

        console.log('📥 QRIS API Response:', {
            status: qrisResponse.status,
            data: data
        });

        // Handle success response
        if (data && (data.success || data.order_id || data.transaction_id)) {
            return res.status(200).json({
                success: true,
                order_id: data.order_id || data.transaction_id,
                transaction_id: data.transaction_id || null,
                qr_url: data.qr_image_url || data.qr_url || data.qr_code_url,
                qr_image_url: data.qr_image_url || data.qr_url,
                amount: data.amount || amount,
                description: payload.description,
                status: 'pending',
                created_at: data.created_at || new Date().toISOString(),
                expired_time: data.expired_time || new Date(Date.now() + 3600000).toISOString(),
                merchant_id: data.merchant_id || '406',
                merchant_name: data.merchant_name || 'Misteryid',
                // Include raw response untuk debugging
                _raw: process.env.NODE_ENV === 'development' ? data : undefined
            });
        } 
        // Handle error response
        else if (data && data.message) {
            return res.status(400).json({
                success: false,
                message: data.message || 'Gagal membuat pembayaran',
                error_code: data.error_code || null
            });
        }
        // Fallback jika response tidak dikenali
        else {
            return res.status(502).json({
                success: false,
                message: 'Unexpected response from payment gateway',
                response_data: data
            });
        }

    } catch (error) {
        console.error('❌ Server Error:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server. Silakan coba lagi.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}