const express = require('express');
const Patient = require('../models/Patient');

const router = express.Router();

// عرض كل المرضى
router.get('/', async (req, res) => {
    try {
        const patients = await Patient.find().sort({ name: 1 });
        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض مريض محدد
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient.findById(id);
        
        if (!patient) {
            return res.status(404).json({ error: 'المريض غير موجود' });
        }
        
        res.json(patient);
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

        const patient = new Patient({
            name,
            phone: phone || null,
            email: email || null,
            medical_record: medical_record || null
        });

        await patient.save();
        res.status(201).json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// تحديث بيانات مريض
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, medical_record } = req.body;

        const patient = await Patient.findByIdAndUpdate(
            id,
            {
                $set: {
                    name: name,
                    phone: phone,
                    email: email,
                    medical_record: medical_record
                }
            },
            { new: true }
        );

        if (!patient) {
            return res.status(404).json({ error: 'المريض غير موجود' });
        }

        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حذف مريض
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const patient = await Patient.findByIdAndDelete(id);

        if (!patient) {
            return res.status(404).json({ error: 'المريض غير موجود' });
        }

        res.json({ message: 'تم حذف المريض بنجاح', patient });
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

        const patients = await Patient.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } }
            ]
        });

        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
