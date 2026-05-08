// api/check-status.js
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { order_id, transaction_id } = req.query;
    const id = order_id || transaction_id;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'Parameter order_id atau transaction_id diperlukan'
        });
    }

    try {
        const QRIS_API_URL = 'https://qris.pw/api/check-payment.php';
        const API_KEY = '61ca43a4e6861fef952193910d116f08f681b0873163eb7a9900541f50342b9c';
        const API_SECRET = 'ccb05f10fff89cd4d2bd6d86e3ddbbaffb5fbbfb72d88c9b9f779aa0fa5b6569';

        console.log('🔍 Checking payment status for:', id);

        const response = await fetch(`${QRIS_API_URL}?order_id=${id}`, {
            method: 'GET',
            headers: {
                'X-API-Key': API_KEY,
                'X-API-Secret': API_SECRET,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        console.log('📊 Status Response:', data);

        // Mapping status dari QRIS
        let status = 'pending';
        if (data.status === 'paid' || data.event === 'payment.paid') {
            status = 'paid';
        } else if (data.status === 'expired' || data.event === 'payment.expired') {
            status = 'expired';
        }

        return res.status(200).json({
            success: true,
            order_id: id,
            status: status,
            transaction_id: data.transaction_id || null,
            amount: data.amount || null,
            paid_at: data.paid_at || null,
            created_at: data.created_at || null,
            data: data
        });

    } catch (error) {
        console.error('❌ Check Status Error:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Gagal mengecek status pembayaran',
            error: error.message
        });
    }
}