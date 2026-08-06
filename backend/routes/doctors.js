const express = require('express');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');

const router = express.Router();

// عرض جميع الأطباء
router.get('/', async (req, res) => {
    try {
        const doctors = await Doctor.find().populate('department').sort({ name: 1 });
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض طبيب محدد
router.get('/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).populate('department');
        if (!doctor) {
            return res.status(404).json({ error: 'الطبيب غير موجود' });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// إضافة طبيب جديد
router.post('/', async (req, res) => {
    try {
        const { name, specialization, license_number, phone, email, department, bio, photo_url, available_hours } = req.body;

        if (!name || !specialization) {
            return res.status(400).json({ error: 'الاسم والتخصص مطلوبان' });
        }

        const doctor = new Doctor({
            name,
            specialization,
            license_number,
            phone,
            email,
            department,
            bio,
            photo_url,
            available_hours
        });

        await doctor.save();
        await doctor.populate('department');
        res.status(201).json(doctor);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'رقم الترخيص موجود بالفعل' });
        }
        res.status(500).json({ error: error.message });
    }
});

// تحديث طبيب
router.put('/:id', async (req, res) => {
    try {
        const { name, specialization, license_number, phone, email, department, bio, photo_url, available_hours } = req.body;

        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    name,
                    specialization,
                    license_number,
                    phone,
                    email,
                    department,
                    bio,
                    photo_url,
                    available_hours,
                    updatedAt: new Date()
                }
            },
            { new: true }
        ).populate('department');

        if (!doctor) {
            return res.status(404).json({ error: 'الطبيب غير موجود' });
        }

        res.json(doctor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حذف طبيب
router.delete('/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndDelete(req.params.id);

        if (!doctor) {
            return res.status(404).json({ error: 'الطبيب غير موجود' });
        }

        res.json({ message: 'تم حذف الطبيب بنجاح', doctor });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// البحث عن أطباء حسب التخصص
router.get('/search/specialization/:spec', async (req, res) => {
    try {
        const doctors = await Doctor.find({ specialization: req.params.spec }).populate('department');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
