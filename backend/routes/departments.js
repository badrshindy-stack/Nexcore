const express = require('express');
const Department = require('../models/Department');

const router = express.Router();

// عرض جميع الأقسام
router.get('/', async (req, res) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض قسم محدد
router.get('/:id', async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ error: 'القسم غير موجود' });
        }
        res.json(department);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// إضافة قسم جديد
router.post('/', async (req, res) => {
    try {
        const { name, code, description, head_doctor, phone, email, floor } = req.body;

        if (!name || !code) {
            return res.status(400).json({ error: 'الاسم والكود مطلوبان' });
        }

        const department = new Department({
            name,
            code,
            description,
            head_doctor,
            phone,
            email,
            floor
        });

        await department.save();
        res.status(201).json(department);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'الاسم أو الكود موجود بالفعل' });
        }
        res.status(500).json({ error: error.message });
    }
});

// تحديث قسم
router.put('/:id', async (req, res) => {
    try {
        const { name, code, description, head_doctor, phone, email, floor } = req.body;

        const department = await Department.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    name,
                    code,
                    description,
                    head_doctor,
                    phone,
                    email,
                    floor,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        if (!department) {
            return res.status(404).json({ error: 'القسم غير موجود' });
        }

        res.json(department);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حذف قسم
router.delete('/:id', async (req, res) => {
    try {
        const department = await Department.findByIdAndDelete(req.params.id);

        if (!department) {
            return res.status(404).json({ error: 'القسم غير موجود' });
        }

        res.json({ message: 'تم حذف القسم بنجاح', department });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
