const express = require('express');
const router = express.Router();
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// =============================================
// 1. الحصول على جميع السجلات الطبية
// =============================================
router.get('/', async (req, res) => {
  try {
    const { patient, doctor, type, startDate, endDate, search } = req.query;
    const filter = { isActive: true };

    if (patient) filter.patient = patient;
    if (doctor) filter.doctor = doctor;
    if (type) filter.type = type;
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };

    if (search) {
      filter.$or = [
        { diagnosis: { $regex: search, $options: 'i' } },
        { treatmentPlan: { $regex: search, $options: 'i' } },
        { chiefComplaint: { $regex: search, $options: 'i' } }
      ];
    }

    const records = await MedicalRecord.find(filter)
      .populate('patient', 'fullName patientId')
      .populate('doctor', 'fullName specialization')
      .populate('appointment')
      .populate('createdBy', 'username fullName')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: { records, total: records.length }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب السجلات الطبية:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب السجلات الطبية'
    });
  }
});

// =============================================
// 2. الحصول على سجل طبي معين
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patient', 'fullName patientId phone email')
      .populate('doctor', 'fullName specialization')
      .populate('appointment')
      .populate('createdBy', 'username fullName');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'السجل الطبي غير موجود'
      });
    }

    res.json({
      success: true,
      data: { record }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب السجل الطبي:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب السجل الطبي'
    });
  }
});

// =============================================
// 3. إنشاء سجل طبي جديد
// =============================================
router.post('/', async (req, res) => {
  try {
    const recordData = req.body;

    // التحقق من المريض
    const patient = await Patient.findById(recordData.patient);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'المريض غير موجود'
      });
    }

    // إنشاء رقم سجل
    const count = await MedicalRecord.countDocuments();
    recordData.recordId = `MR-${String(count + 1).padStart(6, '0')}`;

    const record = new MedicalRecord(recordData);
    await record.save();

    res.status(201).json({
      success: true,
      message: 'تم إنشاء السجل الطبي بنجاح',
      data: { record }
    });

  } catch (error) {
    console.error('❌ خطأ في إنشاء السجل الطبي:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء السجل الطبي'
    });
  }
});

// =============================================
// 4. تحديث سجل طبي
// =============================================
router.put('/:id', async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'السجل الطبي غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث السجل الطبي بنجاح',
      data: { record }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث السجل الطبي:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث السجل الطبي'
    });
  }
});

// =============================================
// 5. حذف سجل طبي
// =============================================
router.delete('/:id', async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'السجل الطبي غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف السجل الطبي بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف السجل الطبي:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف السجل الطبي'
    });
  }
});

// =============================================
// 6. السجلات الطبية لمريض معين
// =============================================
router.get('/patient/:patientId', async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      patient: req.params.patientId,
      isActive: true
    })
      .populate('doctor', 'fullName specialization')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: { records, total: records.length }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب سجلات المريض:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب سجلات المريض'
    });
  }
});

module.exports = router;
