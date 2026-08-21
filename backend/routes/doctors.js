const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// =============================================
// 1. الحصول على جميع الأطباء
// =============================================
router.get('/', async (req, res) => {
  try {
    const { search, specialization, status, department } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    if (specialization) filter.specialization = specialization;
    if (status) filter.status = status;
    if (department) filter.department = department;

    const doctors = await Doctor.find(filter)
      .populate('user', 'username email phone')
      .populate('employee', 'fullName employeeId')
      .sort({ fullName: 1 });

    res.json({
      success: true,
      data: { doctors, total: doctors.length }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الأطباء:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الأطباء'
    });
  }
});

// =============================================
// 2. الحصول على طبيب معين
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'username email phone')
      .populate('employee', 'fullName employeeId');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'الطبيب غير موجود'
      });
    }

    const upcomingAppointments = await Appointment.countDocuments({
      doctor: doctor._id,
      date: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    res.json({
      success: true,
      data: { doctor, upcomingAppointments }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الطبيب:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الطبيب'
    });
  }
});

// =============================================
// 3. إضافة طبيب جديد
// =============================================
router.post('/', async (req, res) => {
  try {
    const doctorData = req.body;

    const existing = await Doctor.findOne({
      $or: [
        { employeeId: doctorData.employeeId },
        { licenseNumber: doctorData.licenseNumber }
      ]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'يوجد طبيب بنفس رقم الموظف أو رقم الرخصة'
      });
    }

    if (doctorData.userId) {
      const user = await User.findById(doctorData.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }
      doctorData.user = doctorData.userId;
      delete doctorData.userId;
    }

    const doctor = new Doctor(doctorData);
    await doctor.save();

    res.status(201).json({
      success: true,
      message: 'تم إضافة الطبيب بنجاح',
      data: { doctor }
    });

  } catch (error) {
    console.error('❌ خطأ في إضافة الطبيب:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة الطبيب'
    });
  }
});

// =============================================
// 4. تحديث طبيب
// =============================================
router.put('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'الطبيب غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث الطبيب بنجاح',
      data: { doctor }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث الطبيب:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الطبيب'
    });
  }
});

// =============================================
// 5. حذف طبيب
// =============================================
router.delete('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isActive: false, status: 'inactive', updatedAt: new Date() },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'الطبيب غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الطبيب بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف الطبيب:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الطبيب'
    });
  }
});

// =============================================
// 6. تحديث حالة الطبيب
// =============================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'الحالة مطلوبة'
      });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'الطبيب غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث حالة الطبيب بنجاح',
      data: { doctor }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث حالة الطبيب:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث حالة الطبيب'
    });
  }
});

module.exports = router;
