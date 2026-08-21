const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');

// =============================================
// 1. الحصول على جميع المرضى
// =============================================
router.get('/', async (req, res) => {
  try {
    const { search, doctor, department, status } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (doctor) filter.primaryPhysician = doctor;
    if (department) filter.department = department;
    if (status) filter.status = status;

    const patients = await Patient.find(filter)
      .populate('primaryPhysician', 'fullName specialization')
      .populate('department', 'name code')
      .sort({ fullName: 1 });

    res.json({
      success: true,
      data: { patients, total: patients.length }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب المرضى:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المرضى'
    });
  }
});

// =============================================
// 2. الحصول على مريض معين
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('primaryPhysician', 'fullName specialization phone')
      .populate('department', 'name code');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'المريض غير موجود'
      });
    }

    // جلب المواعيد القادمة
    const upcomingAppointments = await Appointment.countDocuments({
      patient: patient._id,
      date: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    // جلب عدد السجلات الطبية
    const medicalRecords = await MedicalRecord.countDocuments({
      patient: patient._id,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        patient,
        stats: { upcomingAppointments, medicalRecords }
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب المريض:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المريض'
    });
  }
});

// =============================================
// 3. إضافة مريض جديد
// =============================================
router.post('/', async (req, res) => {
  try {
    const patientData = req.body;

    // إنشاء رقم مريض
    const count = await Patient.countDocuments();
    patientData.patientId = `PAT-${String(count + 1).padStart(6, '0')}`;

    const patient = new Patient(patientData);
    await patient.save();

    res.status(201).json({
      success: true,
      message: 'تم إضافة المريض بنجاح',
      data: { patient }
    });

  } catch (error) {
    console.error('❌ خطأ في إضافة المريض:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة المريض'
    });
  }
});

// =============================================
// 4. تحديث مريض
// =============================================
router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'المريض غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث المريض بنجاح',
      data: { patient }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث المريض:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث المريض'
    });
  }
});

// =============================================
// 5. حذف مريض
// =============================================
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isActive: false, status: 'inactive', updatedAt: new Date() },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'المريض غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف المريض بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف المريض:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المريض'
    });
  }
});

// =============================================
// 6. المواعيد القادمة للمريض
// =============================================
router.get('/:patientId/appointments/upcoming', async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.params.patientId,
      date: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] },
      isActive: true
    })
      .populate('doctor', 'fullName specialization')
      .sort({ date: 1 });

    res.json({
      success: true,
      data: { appointments }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب المواعيد القادمة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المواعيد القادمة'
    });
  }
});

// =============================================
// 7. السجلات الطبية للمريض
// =============================================
router.get('/:patientId/medical-records', async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      patient: req.params.patientId,
      isActive: true
    })
      .populate('doctor', 'fullName specialization')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: { records }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب السجلات الطبية:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب السجلات الطبية'
    });
  }
});

module.exports = router;
