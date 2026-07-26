const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const patientsRoutes = require('./routes/patients');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// CSRF Token Middleware
app.use((req, res, next) => {
    res.setHeader('X-CSRF-Token', 'generated-token-' + Date.now());
    next();
});

// مسار الاختبار
app.get('/', (req, res) => {
    res.json({
        message: '👋 مرحباً بك في Nexcore API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            inventory: '/api/inventory',
            patients: '/api/patients',
            piPayment: {
                approve: '/api/approve (POST)',
                complete: '/api/complete (POST)'
            }
        }
    });
});

// مسارات API
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/patients', patientsRoutes);

// مسارات Pi Network - الموافقة على الدفعة
app.post('/api/approve', async (req, res) => {
    try {
        const { paymentId } = req.body;
        
        if (!paymentId) {
            return res.status(400).json({ error: 'paymentId مطلوب' });
        }

        const apiKey = process.env.PI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'PI_API_KEY غير موجود - تأكد من ملف .env' 
            });
        }

        const response = await fetch(
            `https://api.minepi.com/v2/payments/${paymentId}/approve`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.text();
        
        if (!response.ok) {
            console.error('❌ خطأ من Pi API:', data);
            return res.status(response.status).json({ error: data });
        }

        res.status(response.status).json({ message: 'تمت الموافقة بنجاح', data });
    } catch (error) {
        console.error('❌ خطأ في الموافقة:', error);
        res.status(500).json({ error: error.message });
    }
});

// مسارات Pi Network - إكمال الدفعة
app.post('/api/complete', async (req, res) => {
    try {
        const { paymentId, txid } = req.body;
        
        if (!paymentId || !txid) {
            return res.status(400).json({ error: 'paymentId و txid مطلوبان' });
        }

        const apiKey = process.env.PI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'PI_API_KEY غير موجود - تأكد من ملف .env' 
            });
        }

        const response = await fetch(
            `https://api.minepi.com/v2/payments/${paymentId}/complete`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ txid })
            }
        );

        const data = await response.text();
        
        if (!response.ok) {
            console.error('❌ خطأ من Pi API:', data);
            return res.status(response.status).json({ error: data });
        }

        res.status(response.status).json({ message: 'تم إكمال الدفعة بنجاح', data });
    } catch (error) {
        console.error('❌ خطأ في إكمال الدفعة:', error);
        res.status(500).json({ error: error.message });
    }
});

// معالج الأخطاء
app.use((err, req, res, next) => {
    console.error('❌ خطأ:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
});

// تشغيل الخادم
app.listen(port, '0.0.0.0', () => {
    console.log('✅ NEXCORE API يعمل على http://localhost:' + port);
    console.log('📦 Inventory API: http://localhost:' + port + '/api/inventory');
    console.log('👥 Patients API: http://localhost:' + port + '/api/patients');
    console.log('🔐 Auth API: http://localhost:' + port + '/api/auth');
    console.log('💰 Pi Payment API: http://localhost:' + port + '/api/approve و /api/complete');
});

module.exports = app;
