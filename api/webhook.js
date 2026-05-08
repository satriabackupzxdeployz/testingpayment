// api/webhook.js
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-API-Secret');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET request untuk testing
    if (req.method === 'GET') {
        return res.status(200).json({
            success: true,
            message: '✅ Webhook endpoint is active and ready',
            supported_events: [
                'payment.paid',
                'payment.pending', 
                'payment.expired'
            ],
            timestamp: new Date().toISOString(),
            server_time: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
        });
    }

    // POST request untuk webhook
    if (req.method === 'POST') {
        try {
            const webhookData = req.body;
            
            // Logging detail
            console.log('='.repeat(50));
            console.log('🔔 WEBHOOK RECEIVED');
            console.log('='.repeat(50));
            console.log('📅 Timestamp:', new Date().toISOString());
            console.log('📋 Event:', webhookData.event);
            console.log('📦 Payload:', JSON.stringify(webhookData, null, 2));
            console.log('='.repeat(50));

            const {
                event,
                transaction_id,
                order_id,
                amount,
                customer_name,
                customer_phone,
                status,
                paid_at,
                created_at,
                qr_image_url,
                merchant_id,
                merchant_name
            } = webhookData;

            // Handle different event types
            switch (event) {
                case 'payment.pending':
                    console.log('⏳ PAYMENT PENDING');
                    console.log(`   Order ID: ${order_id}`);
                    console.log(`   Amount: Rp ${amount?.toLocaleString('id-ID')}`);
                    console.log(`   Created: ${created_at}`);
                    console.log(`   Action: Tampilkan QR ke customer`);
                    
                    // TODO: Simpan ke database
                    // await db.save({ order_id, status: 'pending', ...webhookData });
                    
                    break;

                case 'payment.paid':
                    console.log('✅ PAYMENT SUCCESS');
                    console.log(`   Order ID: ${order_id}`);
                    console.log(`   Transaction ID: ${transaction_id}`);
                    console.log(`   Amount: Rp ${amount?.toLocaleString('id-ID')}`);
                    console.log(`   Customer: ${customer_name} (${customer_phone})`);
                    console.log(`   Paid at: ${paid_at}`);
                    console.log(`   Action: Proses order, kirim email, dll.`);
                    
                    // TODO: Update database
                    // await db.update({ order_id, status: 'paid', paid_at });
                    
                    // TODO: Kirim notifikasi ke customer
                    // await sendNotification({ order_id, status: 'success' });
                    
                    break;

                case 'payment.expired':
                    console.log('❌ PAYMENT EXPIRED');
                    console.log(`   Order ID: ${order_id}`);
                    console.log(`   Created: ${created_at}`);
                    console.log(`   Action: Batalkan order, refund jika perlu`);
                    
                    // TODO: Update database
                    // await db.update({ order_id, status: 'expired' });
                    
                    break;

                default:
                    console.log(`❓ UNKNOWN EVENT: ${event}`);
                    console.log(`   Full payload:`, webhookData);
            }

            // Log untuk monitoring
            console.log('✅ Webhook processed successfully');
            console.log('='.repeat(50));

            // Response ke payment gateway
            return res.status(200).json({
                success: true,
                message: 'Webhook received and processed',
                data: {
                    event: event,
                    order_id: order_id || transaction_id,
                    status: status,
                    processed_at: new Date().toISOString(),
                    server_time: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
                }
            });

        } catch (error) {
            console.error('❌ WEBHOOK ERROR:', error);
            console.error('Stack:', error.stack);
            
            return res.status(500).json({
                success: false,
                message: 'Error processing webhook',
                error: error.message
            });
        }
    }

    // Method not allowed
    return res.status(405).json({
        success: false,
        message: 'Method not allowed. Use GET or POST.'
    });
}