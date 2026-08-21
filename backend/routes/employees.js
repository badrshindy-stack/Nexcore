const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const User = require('../models/User');
const Department = require('../models/Department');

// =============================================
// 1. الحصول على جميع الموظفين
// =============================================
router.get('/', async (req, res) => {
  try {
    const { search, department, position, status } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) filter.department = department;
    if (position) filter.position = position;
    if (status) filter.status = status;

    const employees = await Employee.find(filter)
      .populate('user', 'username email phone')
      .populate('department', 'name code')
      .sort({ fullName: 1 });

    res.json({
      success: true,
      data: { employees, total: employees.length }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الموظفين:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الموظفين'
    });
  }
});

// =============================================
// 2. الحصول على موظف معين
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'username email phone')
      .populate('department', 'name code');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    res.json({
      success: true,
      data: { employee }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الموظف:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الموظف'
    });
  }
});

// =============================================
// 3. إضافة موظف جديد
// =============================================
router.post('/', async (req, res) => {
  try {
    const employeeData = req.body;

    // التحقق من المستخدم
    if (employeeData.userId) {
      const user = await User.findById(employeeData.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }
      employeeData.user = employeeData.userId;
      delete employeeData.userId;
    }

    // التحقق من القسم
    if (employeeData.department) {
      const department = await Department.findById(employeeData.department);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'القسم غير موجود'
        });
      }
    }

    // التحقق من عدم التكرار
    const existing = await Employee.findOne({ employeeId: employeeData.employeeId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'يوجد موظف بنفس رقم الموظف'
      });
    }

    const employee = new Employee(employeeData);
    await employee.save();

    res.status(201).json({
      success: true,
      message: 'تم إضافة الموظف بنجاح',
      data: { employee }
    });

  } catch (error) {
    console.error('❌ خطأ في إضافة الموظف:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة الموظف'
    });
  }
});

// =============================================
// 4. تحديث موظف
// =============================================
router.put('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث الموظف بنجاح',
      data: { employee }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث الموظف:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الموظف'
    });
  }
});

// =============================================
// 5. حذف موظف
// =============================================
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: false, status: 'terminated', updatedAt: new Date() },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الموظف بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف الموظف:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الموظف'
    });
  }
});

// =============================================
// 6. تحديث حالة الموظف
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

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث حالة الموظف بنجاح',
      data: { employee }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث حالة الموظف:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث حالة الموظف'
    });
  }
});

module.exports = router;
