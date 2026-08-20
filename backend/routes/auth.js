const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Department = require('../models/Department');

// =============================================
// 1. تسجيل الدخول عبر Pi
// =============================================
router.post('/pi-login', async (req, res) => {
  try {
    const { piUserId, username, fullName, email, phone } = req.body;

    if (!piUserId || !username) {
      return res.status(400).json({
        success: false,
        message: 'بيانات الدخول غير مكتملة'
      });
    }

    // البحث عن المستخدم أو إنشاؤه
    let user = await User.findOne({ piUserId });

    if (!user) {
      // إنشاء مستخدم جديد
      user = new User({
        username: username,
        piUserId: piUserId,
        fullName: fullName || username,
        email: email || '',
        phone: phone || '',
        role: 'viewer',
        isVerified: true
      });

      await user.save();
      console.log(`✅ تم إنشاء مستخدم جديد: ${username} (${piUserId})`);
    } else {
      user.lastLogin = new Date();
      await user.save();
      console.log(`👤 تسجيل دخول: ${user.username}`);
    }

    // جلب بيانات المستخدم
    const userData = await User.findById(user._id)
      .populate('department', 'name code');

    // إنشاء جلسة
    req.session.userId = user._id;
    req.session.userRole = user.role;

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: {
          id: userData._id,
          username: userData.username,
          fullName: userData.fullName,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          department: userData.department,
          permissions: userData.permissions,
          isVerified: userData.isVerified,
          lastLogin: userData.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الدخول',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =============================================
// 2. التحقق من الجلسة
// =============================================
router.get('/session', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'غير مسجل الدخول'
      });
    }

    const user = await User.findById(req.session.userId)
      .populate('department', 'name code')
      .select('-__v');

    if (!user) {
      req.session.destroy();
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
    console.error('❌ خطأ في التحقق من الجلسة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحقق من الجلسة'
    });
  }
});

// =============================================
// 3. تسجيل الخروج
// =============================================
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ خطأ في تسجيل الخروج:', err);
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء تسجيل الخروج'
      });
    }

    res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
  });
});

// =============================================
// 4. الحصول على قائمة المستخدمين
// =============================================
router.get('/users', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح به'
      });
    }

    const currentUser = await User.findById(req.session.userId);
    if (!currentUser || !['super_admin', 'admin'].includes(currentUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح به - تحتاج صلاحيات إدارية'
      });
    }

    const users = await User.find()
      .populate('department', 'name code')
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { users }
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
// 5. تحديث دور المستخدم
// =============================================
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح به'
      });
    }

    const currentUser = await User.findById(req.session.userId);
    if (!currentUser || !['super_admin', 'admin'].includes(currentUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح به - تحتاج صلاحيات إدارية'
      });
    }

    const validRoles = ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'finance', 'hr', 'inventory_manager', 'lab_tech', 'radiologist', 'pharmacist', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'دور غير صحيح'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
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
      message: 'تم تحديث دور المستخدم بنجاح',
      data: { user }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث دور المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث دور المستخدم'
    });
  }
});

module.exports = router;
