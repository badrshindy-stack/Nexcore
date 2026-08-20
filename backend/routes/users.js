const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Department = require('../models/Department');

// =============================================
// 1. الحصول على جميع المستخدمين
// =============================================
router.get('/', async (req, res) => {
  try {
    const { search, role, department, isActive } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) filter.role = role;
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter)
      .populate('department', 'name code')
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { users, total: users.length }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب المستخدمين:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المستخدمين'
    });
  }
});

// =============================================
// 2. الحصول على مستخدم معين
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('department', 'name code')
      .select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المستخدم'
    });
  }
});

// =============================================
// 3. إنشاء مستخدم جديد
// =============================================
router.post('/', async (req, res) => {
  try {
    const { username, piUserId, fullName, email, phone, role, department } = req.body;

    // التحقق من وجود المستخدم
    const existingUser = await User.findOne({
      $or: [{ username }, { piUserId }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'يوجد مستخدم بنفس اسم المستخدم أو معرف Pi'
      });
    }

    const user = new User({
      username,
      piUserId,
      fullName,
      email,
      phone,
      role: role || 'viewer',
      department: department || null,
      isVerified: true
    });

    await user.save();

    const userData = await User.findById(user._id)
      .populate('department', 'name code');

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      data: { user: userData }
    });

  } catch (error) {
    console.error('❌ خطأ في إنشاء المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء المستخدم'
    });
  }
});

// =============================================
// 4. تحديث مستخدم
// =============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('department', 'name code');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث المستخدم بنجاح',
      data: { user }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث المستخدم'
    });
  }
});

// =============================================
// 5. حذف مستخدم
// =============================================
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المستخدم'
    });
  }
});

// =============================================
// 6. تحديث صلاحيات المستخدم
// =============================================
router.patch('/:id/permissions', async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'الصلاحيات يجب أن تكون مصفوفة'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { permissions, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث صلاحيات المستخدم بنجاح',
      data: { user }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث صلاحيات المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث صلاحيات المستخدم'
    });
  }
});

module.exports = router;
