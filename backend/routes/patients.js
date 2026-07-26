const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// عرض كل المرضى
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM patients ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض مريض محدد
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'المريض غير موجود' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// إضافة مريض جديد
router.post('/', async (req, res) => {
    try {
        const { name, phone, email, medical_record } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'اسم المريض مطلوب' });
        }

        const result = await pool.query(
            'INSERT INTO patients (name, phone, email, medical_record) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, phone || null, email || null, medical_record || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// تحديث بيانات مريض
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, medical_record } = req.body;

        const result = await pool.query(
            'UPDATE patients SET name = COALESCE($1, name), phone = COALESCE($2, phone), email = COALESCE($3, email), medical_record = COALESCE($4, medical_record) WHERE id = $5 RETURNING *',
            [name, phone, email, medical_record, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'المريض غير موجود' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حذف مريض
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'المريض غير موجود' });
        }

        res.json({ message: 'تم حذف المريض بنجاح', patient: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// البحث عن مريض بالاسم أو رقم الهاتف
router.post('/search', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'البحث مطلوب' });
        }

        const result = await pool.query(
            "SELECT * FROM patients WHERE name ILIKE $1 OR phone ILIKE $1",
            [`%${query}%`]
        );

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
