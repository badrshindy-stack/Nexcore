const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Invoice = require('../models/Invoice');

// =============================================
// 1. الحصول على جميع المواعيد
// =============================================
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      startDate, 
      endDate, 
      status, 
      doctor, 
      patient,
      type,
      page = 1,
      limit = 50
    } = req.query;

    const filter = { isActive: true };

    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };
    if (status) filter.status = status;
    if (doctor) filter.doctor = doctor;
    if (patient) filter.patient = patient;
    if (type) filter.type = type;

    if (search) {
      filter.$or = [
        { 'symptoms': { $regex: search, $options: 'i' } },
        { 'diagnosis': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const appointments = await Appointment.find(filter)
      .populate('patient', 'fullName patientId phone')
      .populate('doctor', 'fullName specialization')
      .populate('department', 'name code')
      .populate('createdBy', 'username fullName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        appointments,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب المواعيد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المواعيد'
    });
  }
});

// =============================================
// 2. الحصول على موعد معين
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'fullName patientId phone email')
      .populate('doctor', 'fullName specialization consultationFee')
      .populate('department', 'name code')
      .populate('createdBy', 'username fullName')
      .populate('cancelledBy', 'username fullName')
      .populate('invoice');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'الموعد غير موجود'
      });
    }

    res.json({
      success: true,
      data: { appointment }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الموعد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الموعد'
    });
  }
});

// =============================================
// 3. إضافة موعد جديد
// =============================================
router.post('/', async (req, res) => {
  try {
    const appointmentData = req.body;

    // التحقق من المريض
    const patient = await Patient.findById(appointmentData.patient);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'المريض غير موجود'
      });
    }

    // التحقق من الطبيب
    const doctor = await Doctor.findById(appointmentData.doctor);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'الطبيب غير موجود'
      });
    }

    // التحقق من عدم وجود تعارض في المواعيد
