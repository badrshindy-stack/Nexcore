const express = require('express');
const Medication = require('../models/Medication');

const router = express.Router();

// عرض جميع الأدوية
router.get('/', async (req, res) => {
    try {
        const medications = await Medication.find().sort({ name: 1 });
        res.json(medications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض دواء محدد
router.get('/:id', async (req, res) => {
    try {
        const medication = await Medication.findById(req.params.id);
        if (!medication) {
            return res.status(404).json({ error: 'الدواء غير موجود' });
        }
        res.json(medication);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// إضافة دواء جديد
router.post('/', async (req, res) => {
    try {
        const { name, code, dosage, type, manufacturer, expiry_date, quantity, min_threshold, price, batch_number, side_effects, interactions, instructions } = req.body;

        if (!name || !code) {
            return res.status(400).json({ error: 'الاسم والكود مطلوبان' });
        }

        const medication = new Medication({
            name,
            code,
            dosage,
            type,
            manufacturer,
            expiry_date,
            quantity: quantity || 0,
            min_threshold: min_threshold || 10,
            price,
            batch_number,
            side_effects,
            interactions,
            instructions
        });

        await medication.save();
        res.status(201).json(medication);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'الكود موجود بالفعل' });
        }
        res.status(500).json({ error: error.message });
    }
});

// تحديث دواء
router.put('/:id', async (req, res) => {
    try {
        const { name, code, dosage, type, manufacturer, expiry_date, quantity, min_threshold, price, batch_number, side_effects, interactions, instructions } = req.body;

        const medication = await Medication.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    name,
                    code,
                    dosage,
                    type,
                    manufacturer,
                    expiry_date,
                    quantity,
                    min_threshold,
                    price,
                    batch_number,
                    side_effects,
                    interactions,
                    instructions,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        if (!medication) {
            return res.status(404).json({ error: 'الدواء غير موجود' });
        }

        res.json(medication);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حذف دواء
router.delete('/:id', async (req, res) => {
    try {
        const medication = await Medication.findByIdAndDelete(req.params.id);

        if (!medication) {
            return res.status(404).json({ error: 'الدواء غير موجود' });
        }

        res.json({ message: 'تم حذف الدواء بنجاح', medication });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض الأدوية منخفضة المخزون
router.get('/low-stock/all', async (req, res) => {
    try {
        const medications = await Medication.find({ $expr: { $lt: ['$quantity', '$min_threshold'] } }).sort({ quantity: 1 });
        res.json(medications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض الأدوية منتهية الصلاحية
router.get('/expired/all', async (req, res) => {
    try {
        const medications = await Medication.find({ expiry_date: { $lt: new Date() } }).sort({ expiry_date: 1 });
        res.json(medications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
