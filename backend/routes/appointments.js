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

    // التحقق من عدم وجود تعارض في المواعيد    const conflicting = await Appointment.findOne({
      doctor: appointmentData.doctor,
      date: appointmentData.date,
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
    });

    if (conflicting) {
      return res.status(409).json({
        success: false,
        message: 'يوجد تعارض في المواعيد مع طبيب آخر'
      });
    }

    // إنشاء رقم موعد فريد
    const count = await Appointment.countDocuments();
    appointmentData.appointmentId = `APP-${String(count + 1).padStart(6, '0')}`;

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الموعد بنجاح',
      data: { appointment }
    });

  } catch (error) {
    console.error('❌ خطأ في إنشاء الموعد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الموعد'
    });
  }
});

// =============================================
// 4. تحديث موعد
// =============================================
router.put('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'الموعد غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث الموعد بنجاح',
      data: { appointment }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث الموعد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الموعد'
    });
  }
});

// =============================================
// 5. حذف موعد
// =============================================
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { isActive: false, status: 'cancelled', updatedAt: new Date() },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'الموعد غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الموعد بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف الموعد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الموعد'
    });
  }
});

// =============================================
// 6. تحديث حالة الموعد
// =============================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'الحالة مطلوبة'
      });
    }

    const updateData = { 
      status, 
      updatedAt: new Date() 
    };

    if (status === 'cancelled' && cancellationReason) {
      updateData.cancellationReason = cancellationReason;
    }

    if (status === 'completed') {
      // إنشاء فاتورة عند إكمال الموعد
      const appointment = await Appointment.findById(req.params.id);
      if (appointment) {
        const invoice = new Invoice({
          invoiceNumber: `INV-${Date.now()}`,
          patient: appointment.patient,
          appointment: appointment._id,
          doctor: appointment.doctor,
          items: [{
            description: `موعد ${appointment.type}`,
            quantity: 1,
            unitPrice: 50, // يمكن جلبها من الطبيب
            total: 50,
            type: 'consultation'
          }],
          createdBy: req.session.userId
        });
        await invoice.save();
        updateData.invoice = invoice._id;
      }
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'الموعد غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث حالة الموعد بنجاح',
      data: { appointment }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث حالة الموعد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث حالة الموعد'
    });
  }
});

// =============================================
// 7. المواعيد القادمة للمريض
// =============================================
router.get('/patient/:patientId/upcoming', async (req, res) => {
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

module.exports = router;
