   const express = require('express');
const Inventory = require('../models/Inventory');

const router = express.Router();

// عرض كل المخزون
router.get('/', async (req, res) => {
    try {
        const items = await Inventory.find().sort({ name: 1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض صنف محدد
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Inventory.findById(id);
        
        if (!item) {
            return res.status(404).json({ error: 'الصنف غير موجود' });
        }
        
        res.json(item);
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

        const codeExists = await Inventory.findOne({ code });
        if (codeExists) {
            return res.status(400).json({ error: 'الكود موجود بالفعل' });
        }

        const item = new Inventory({
            name,
            code,
            quantity: quantity || 0,
            min_threshold: min_threshold || 10,
            category: category || 'عام',
            expiry_date: expiry_date || null
        });

        await item.save();
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// تحديث صنف
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, quantity, min_threshold, category, expiry_date } = req.body;

        const item = await Inventory.findByIdAndUpdate(
            id,
            {
                $set: {
                    name: name,
                    code: code,
                    quantity: quantity,
                    min_threshold: min_threshold,
                    category: category,
                    expiry_date: expiry_date,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({ error: 'الصنف غير موجود' });
        }

        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حذف صنف
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const item = await Inventory.findByIdAndDelete(id);

        if (!item) {
            return res.status(404).json({ error: 'الصنف غير موجود' });
        }

        res.json({ message: 'تم حذف الصنف بنجاح', item });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// البحث عن أصناف منخفضة الكمية
router.get('/low-stock/all', async (req, res) => {
    try {
        const items = await Inventory.find({ $expr: { $lt: ['$quantity', '$min_threshold'] } }).sort({ quantity: 1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
        
