const express = require('express');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const router = express.Router();

// عرض جميع السجلات الطبية
router.get('/', async (req, res) => {
    try {
        const records = await MedicalRecord.find()
            .populate('patient')
            .populate('doctor')
            .sort({ date: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض سجل طبي محدد
router.get('/:id', async (req, res) => {
    try {
        const record = await MedicalRecord.findById(req.params.id)
            .populate('patient')
            .populate('doctor');
        
        if (!record) {
            return res.status(404).json({ error: 'السجل الطبي غير موجود' });
        }
        res.json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// إضافة سجل طبي جديد
router.post('/', async (req, res) => {
    try {
        const { patient, doctor, diagnosis, symptoms, medications, notes, vital_signs, tests, attachment_url } = req.body;

        if (!patient || !doctor) {
            return res.status(400).json({ error: 'المريض والطبيب مطلوبان' });
        }

        const record = new MedicalRecord({
            patient,
            doctor,
            diagnosis,
            symptoms,
            medications,
            notes,
            vital_signs,
            tests,
            attachment_url,
            date: new Date()
        });

        await record.save();
        await record.populate(['patient', 'doctor']);
        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// تحديث سجل طبي
router.put('/:id', async (req, res) => {
    try {
        const { patient, doctor, diagnosis, symptoms, medications, notes, vital_signs, tests, attachment_url } = req.body;

        const record = await MedicalRecord.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    patient,
                    doctor,
                    diagnosis,
                    symptoms,
                    medications,
                    notes,
                    vital_signs,
                    tests,
                    attachment_url,
                    updatedAt: new Date()
                }
            },
            { new: true }
        ).populate(['patient', 'doctor']);

        if (!record) {
            return res.status(404).json({ error: 'السجل الطبي غير موجود' });
        }

        res.json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حذف سجل طبي
router.delete('/:id', async (req, res) => {
    try {
        const record = await MedicalRecord.findByIdAndDelete(req.params.id);

        if (!record) {
            return res.status(404).json({ error: 'السجل الطبي غير موجود' });
        }

        res.json({ message: 'تم حذف السجل الطبي بنجاح', record });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض سجلات مريض محدد
router.get('/patient/:patientId', async (req, res) => {
    try {
        const records = await MedicalRecord.find({ patient: req.params.patientId })
            .populate('patient')
            .populate('doctor')
            .sort({ date: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض سجلات طبيب محدد
router.get('/doctor/:doctorId', async (req, res) => {
    try {
        const records = await MedicalRecord.find({ doctor: req.params.doctorId })
            .populate('patient')
            .populate('doctor')
            .sort({ date: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
