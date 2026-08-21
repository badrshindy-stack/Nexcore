const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const Doctor = require('../models/Doctor');
const Bed = require('../models/Bed');

// =============================================
// 1. الحصول على جميع الأقسام
// =============================================
router.get('/', async (req, res) => {
  try {
    const { type, isActive = true } = req.query;
    const filter = { isActive: isActive === 'true' };

    if (type) filter.type = type;

    const departments = await Department.find(filter)
      .populate('head', 'fullName username')
      .populate('parentDepartment', 'name code')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { departments }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الأقسام:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الأقسام'
    });
  }
});

// =============================================
// 2. الحصول على قسم معين
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('head', 'fullName username email');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'القسم غير موجود'
      });
    }

    // جلب إحصائيات القسم
    const employees = await Employee.countDocuments({ department: department._id, isActive: true });
    const doctors = await Doctor.countDocuments({ department: department._id, isActive: true });
    const beds = await Bed.countDocuments({ department: department._id, isActive: true });

    res.json({
      success: true,
      data: {
        department,
        stats: { employees, doctors, beds }
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب القسم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب القسم'
    });
  }
});

// =============================================
// 3. إضافة قسم جديد
// =============================================
router.post('/', async (req, res) => {
  try {
    const departmentData = req.body;

    // التحقق من عدم التكرار
    const existing = await Department.findOne({
      $or: [{ name: departmentData.name }, { code: departmentData.code }]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'يوجد قسم بنفس الاسم أو الكود'
      });
    }

    const department = new Department(departmentData);
    await department.save();

    res.status(201).json({
      success: true,
      message: 'تم إضافة القسم بنجاح',
      data: { department }
    });

  } catch (error) {
    console.error('❌ خطأ في إضافة القسم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة القسم'
    });
  }
});

// =============================================
// 4. تحديث قسم
// =============================================
router.put('/:id', async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'القسم غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث القسم بنجاح',
      data: { department }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث القسم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث القسم'
    });
  }
});

// =============================================
// 5. حذف قسم
// =============================================
router.delete('/:id', async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'القسم غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف القسم بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف القسم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف القسم'
    });
  }
});

module.exports = router;
