-- إنشاء قاعدة البيانات
CREATE DATABASE nexcore_db;

-- الاتصال بقاعدة البيانات
\c nexcore_db;

-- جدول المستخدمين
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول المخزون
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    quantity INT DEFAULT 0,
    min_threshold INT DEFAULT 10,
    category VARCHAR(50),
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول المرضى
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    medical_record TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إضافة مستخدم افتراضي (admin/admin123)
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$10$ZGHF4VNx7mE.2J1eCx3YaezpLqRVx3sJw7yZ5xY6E7f8g9h0i1j2k3l', 'admin');
res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض كل المخزون
app.get('/api/inventory', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض صنف محدد
app.get('/api/inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM inventory WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'الصنف غير موجود' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// إضافة صنف جديد
app.post('/api/inventory', async (req, res) => {
    try {
        const { name, code, quantity, min_threshold, category, expiry_date } = req.body;
        
        // التحقق من البيانات
        if (!name || !code) {
            return res.status(400).json({ error: 'الاسم والكود مطلوبان' });
        }

        const result = await pool.query(
          // بدء الخادم
app.listen(port, '0.0.0.0', () => {
    console.log(✅ NEXCORE API running on http://localhost:${port});
    console.log(📦 Inventory API: http://localhost:${port}/api/inventory);
    console.log(👥 Patients API: http://localhost:${port}/api/patients);
});
