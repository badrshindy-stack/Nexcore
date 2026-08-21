const express = require('express');
const router = express.Router();
const Bed = require('../models/Bed');
const Department = require('../models/Department');
const Patient = require('../models/Patient');

// =============================================
// 1. الحصول على جميع الأسرة
// =============================================
router.get('/', async (req, res) => {
  try {
    const { department, status, type, search } = req.query;
    const filter = { isActive: true };

    if (department) filter.department = department;
    if (status) filter.status = status;
    if (type) filter.type = type;

    if (search) {
      filter.$or = [
        { bedId: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const beds = await Bed.find(filter)
      .populate('department', 'name code')
      .populate('patient', 'fullName patientId')
      .populate('assignedDoctor', 'fullName')
      .populate('assignedNurse', 'fullName')
      .sort({ roomNumber: 1 });

    const stats = {
      total: beds.length,
      available: beds.filter(b => b.status === 'available').length,
      occupied: beds.filter(b => b.status === 'occupied').length,
      reserved: beds.filter(b => b.status === 'reserved').length,
      maintenance: beds.filter(b => b.status === 'maintenance').length
    };

    res.json({
      success: true,
      data: { beds, stats }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الأسرة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الأسرة'
    });
  }
});

// =============================================
// 2. الحصول على سرير معين
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id)
      .populate('department', 'name code')
      .populate('patient', 'fullName patientId')
      .populate('assignedDoctor', 'fullName')
      .populate('assignedNurse', 'fullName');

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'السرير غير موجود'
      });
    }

    res.json({
      success: true,
      data: { bed }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب السرير:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب السرير'
    });
  }
});

// =============================================
// 3. إضافة سرير جديد
// =============================================
router.post('/', async (req, res) => {
  try {
    const bedData = req.body;

    // التحقق من القسم
    const department = await Department.findById(bedData.department);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'القسم غير موجود'
      });
    }

    // التحقق من عدم التكرار
    const existing = await Bed.findOne({ bedId: bedData.bedId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'يوجد سرير بنفس المعرف'
      });
    }

    const bed = new Bed(bedData);
    await bed.save();

    res.status(201).json({
      success: true,
      message: 'تم إضافة السرير بنجاح',
      data: { bed }
    });

  } catch (error) {
    console.error('❌ خطأ في إضافة السرير:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة السرير'
    });
  }
});

// =============================================
// 4. تحديث سرير
// =============================================
router.put('/:id', async (req, res) => {
  try {
    const bed = await Bed.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'السرير غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث السرير بنجاح',
      data: { bed }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث السرير:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث السرير'
    });
  }
});

// =============================================
// 5. حذف سرير
// =============================================
router.delete('/:id', async (req, res) => {
  try {
    const bed = await Bed.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'السرير غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف السرير بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف السرير:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف السرير'
    });
  }
});

// =============================================
// 6. تغيير حالة السرير
// =============================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, patientId } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'الحالة مطلوبة'
      });
    }

    const updateData = { status, updatedAt: new Date() };

    if (status === 'occupied' && patientId) {
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'المريض غير موجود'
        });
      }
      updateData.patient = patientId;
      updateData.admissionDate = new Date();
    }

    if (status === 'available') {
      updateData.patient = null;
      updateData.admissionDate = null;
      updateData.expectedDischargeDate = null;
      updateData.actualDischargeDate = new Date();
    }

    const bed = await Bed.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: 'السرير غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث حالة السرير بنجاح',
      data: { bed }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث حالة السرير:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث حالة السرير'
    });
  }
});

// =============================================
// 7. إحصائيات الأسرة حسب القسم
// =============================================
router.get('/stats/department', async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true });
    const stats = [];

    for (const dept of departments) {
      const beds = await Bed.find({ department: dept._id, isActive: true });
      stats.push({
        department: dept.name,
        departmentId: dept._id,
        total: beds.length,
        available: beds.filter(b => b.status === 'available').length,
        occupied: beds.filter(b => b.status === 'occupied').length,
        reserved: beds.filter(b => b.status === 'reserved').length,
        maintenance: beds.filter(b => b.status === 'maintenance').length
      });
    }

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب إحصائيات الأسرة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب إحصائيات الأسرة'
    });
  }
});

module.exports = router;
