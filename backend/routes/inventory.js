const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// عرض كل المخزون
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض صنف محدد
router.get('/:id', async (req, res) => {
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
router.post('/', async (req, res) => {
    try {
        const { name, code, quantity, min_threshold, category, expiry_date } = req.body;

        if (!name || !code) {
            return res.status(400).json({ error: 'الاسم والكود مطلوبان' });
        }

        const result = await pool.query(
            'INSERT INTO inventory (name, code, quantity, min_threshold, category, expiry_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, code, quantity || 0, min_threshold || 10, category || 'عام', expiry_date || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'الكود موجود بالفعل' });
        }
        res.status(500).json({ error: error.message });
    }
});

// تحديث صنف
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, quantity, min_threshold, category, expiry_date } = req.body;

        const result = await pool.query(
            'UPDATE inventory SET name = COALESCE($1, name), code = COALESCE($2, code), quantity = COALESCE($3, quantity), min_threshold = COALESCE($4, min_threshold), category = COALESCE($5, category), expiry_date = COALESCE($6, expiry_date), updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
            [name, code, quantity, min_threshold, category, expiry_date, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'الصنف غير موجود' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حذف صنف
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM inventory WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'الصنف غير موجود' });
        }

        res.json({ message: 'تم حذف الصنف بنجاح', item: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// البحث عن أصناف منخفضة الكمية
router.get('/low-stock/all', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory WHERE quantity < min_threshold ORDER BY quantity ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
