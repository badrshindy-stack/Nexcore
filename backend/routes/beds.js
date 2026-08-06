const express = require('express');
const Bed = require('../models/Bed');
const Department = require('../models/Department');
const Patient = require('../models/Patient');

const router = express.Router();

// عرض جميع الأسرة
router.get('/', async (req, res) => {
    try {
        const beds = await Bed.find()
            .populate('department')
            .populate('patient')
            .sort({ room_number: 1, bed_number: 1 });
        res.json(beds);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض سرير محدد
router.get('/:id', async (req, res) => {
    try {
        const bed = await Bed.findById(req.params.id)
            .populate('department')
            .populate('patient');
        
        if (!bed) {
            return res.status(404).json({ error: 'السرير غير موجود' });
        }
        res.json(bed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// إضافة سرير جديد
router.post('/', async (req, res) => {
    try {
        const { room_number, bed_number, department, status, patient, bed_type, price_per_day } = req.body;

        if (!room_number || !bed_number || !department) {
            return res.status(400).json({ error: 'رقم الغرفة ورقم السرير والقسم مطلوبان' });
        }

        const bed = new Bed({
            room_number,
            bed_number,
            department,
            status: status || 'available',
            patient,
            bed_type,
            price_per_day
        });

        await bed.save();
        await bed.populate(['department', 'patient']);
        res.status(201).json(bed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// تحديث سرير
router.put('/:id', async (req, res) => {
    try {
        const { room_number, bed_number, department, status, patient, assigned_date, discharge_date, bed_type, price_per_day } = req.body;

        const bed = await Bed.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    room_number,
                    bed_number,
                    department,
                    status,
                    patient,
                    assigned_date,
                    discharge_date,
                    bed_type,
                    price_per_day,
                    updatedAt: new Date()
                }
            },
            { new: true }
        ).populate(['department', 'patient']);

        if (!bed) {
            return res.status(404).json({ error: 'السرير غير موجود' });
        }

        res.json(bed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حذف سرير
router.delete('/:id', async (req, res) => {
    try {
        const bed = await Bed.findByIdAndDelete(req.params.id);

        if (!bed) {
            return res.status(404).json({ error: 'السرير غير موجود' });
        }

        res.json({ message: 'تم حذف السرير بنجاح', bed });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض الأسرة المتاحة
router.get('/available/all', async (req, res) => {
    try {
        const beds = await Bed.find({ status: 'available' })
            .populate('department')
            .sort({ room_number: 1 });
        res.json(beds);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض الأسرة المشغولة
router.get('/occupied/all', async (req, res) => {
    try {
        const beds = await Bed.find({ status: 'occupied' })
            .populate('department')
            .populate('patient')
            .sort({ room_number: 1 });
        res.json(beds);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض أسرة قسم محدد
router.get('/department/:departmentId', async (req, res) => {
    try {
        const beds = await Bed.find({ department: req.params.departmentId })
            .populate('department')
            .populate('patient')
            .sort({ room_number: 1 });
        res.json(beds);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
