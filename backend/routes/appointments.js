const express = require('express');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const router = express.Router();

// عرض جميع المواعيد
router.get('/', async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate('patient')
            .populate('doctor')
            .populate('department')
            .sort({ date: -1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض موعد محدد
router.get('/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('patient')
            .populate('doctor')
            .populate('department');
        
        if (!appointment) {
            return res.status(404).json({ error: 'الموعد غير موجود' });
        }
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// إضافة موعد جديد
router.post('/', async (req, res) => {
    try {
        const { patient, doctor, date, time, department, reason, notes } = req.body;

        if (!patient || !doctor || !date || !time) {
            return res.status(400).json({ error: 'المريض والطبيب والتاريخ والوقت مطلوبان' });
        }

        const appointment = new Appointment({
            patient,
            doctor,
            date,
            time,
            department,
            reason,
            notes,
            status: 'scheduled'
        });

        await appointment.save();
        await appointment.populate(['patient', 'doctor', 'department']);
        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// تحديث موعد
router.put('/:id', async (req, res) => {
    try {
        const { patient, doctor, date, time, department, status, reason, notes } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    patient,
                    doctor,
                    date,
                    time,
                    department,
                    status,
                    reason,
                    notes,
                    updatedAt: new Date()
                }
            },
            { new: true }
        ).populate(['patient', 'doctor', 'department']);

        if (!appointment) {
            return res.status(404).json({ error: 'الموعد غير موجود' });
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حذف موعد
router.delete('/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);

        if (!appointment) {
            return res.status(404).json({ error: 'الموعد غير موجود' });
        }

        res.json({ message: 'تم حذف الموعد بنجاح', appointment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض مواعيد مريض محدد
router.get('/patient/:patientId', async (req, res) => {
    try {
        const appointments = await Appointment.find({ patient: req.params.patientId })
            .populate('patient')
            .populate('doctor')
            .sort({ date: -1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض مواعيد طبيب محدد
router.get('/doctor/:doctorId', async (req, res) => {
    try {
        const appointments = await Appointment.find({ doctor: req.params.doctorId })
            .populate('patient')
            .populate('doctor')
            .sort({ date: 1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
