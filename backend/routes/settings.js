const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// =============================================
// 1. الحصول على جميع الإعدادات
// =============================================
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;

    const settings = await Settings.find(filter);
    
    // تحويل إلى كائن key: value
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    res.json({
      success: true,
      data: { settings: settingsMap }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الإعدادات:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الإعدادات'
    });
  }
});

// =============================================
// 2. الحصول على إعداد معين
// =============================================
router.get('/:key', async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key, isActive: true });
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'الإعداد غير موجود'
      });
    }

    res.json({
      success: true,
      data: { setting }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الإعداد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الإعداد'
    });
  }
});

// =============================================
// 3. إنشاء أو تحديث إعداد
// =============================================
router.post('/', async (req, res) => {
  try {
    const { key, value, type, category, description } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'مفتاح الإعداد مطلوب'
      });
    }

    let setting = await Settings.findOne({ key });

    if (setting) {
      // تحديث الإعداد الموجود
      setting.value = value;
      setting.type = type || setting.type;
      setting.category = category || setting.category;
      setting.description = description || setting.description;
      setting.updatedAt = new Date();
      await setting.save();
    } else {
      // إنشاء إعداد جديد
      setting = new Settings({
        key,
        value,
        type: type || 'string',
        category: category || 'general',
        description: description || ''
      });
      await setting.save();
    }

    res.json({
      success: true,
      message: 'تم حفظ الإعداد بنجاح',
      data: { setting }
    });

  } catch (error) {
    console.error('❌ خطأ في حفظ الإعداد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حفظ الإعداد'
    });
  }
});

// =============================================
// 4. تحديث إعداد
// =============================================
router.put('/:key', async (req, res) => {
  try {
    const { value, type, category, description } = req.body;

    const setting = await Settings.findOne({ key: req.params.key });
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'الإعداد غير موجود'
      });
    }

    setting.value = value;
    if (type) setting.type = type;
    if (category) setting.category = category;
    if (description) setting.description = description;
    setting.updatedAt = new Date();
    await setting.save();

    res.json({
      success: true,
      message: 'تم تحديث الإعداد بنجاح',
      data: { setting }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث الإعداد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الإعداد'
    });
  }
});

// =============================================
// 5. حذف إعداد
// =============================================
router.delete('/:key', async (req, res) => {
  try {
    const setting = await Settings.findOneAndUpdate(
      { key: req.params.key },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'الإعداد غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الإعداد بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف الإعداد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الإعداد'
    });
  }
});

// =============================================
// 6. إعادة تعيين الإعدادات الافتراضية
// =============================================
router.post('/reset', async (req, res) => {
  try {
    const defaultSettings = Settings.getDefaultSettings();
    
    for (const [key, config] of Object.entries(defaultSettings)) {
      await Settings.findOneAndUpdate(
        { key },
        {
          key,
          value: config.value,
          type: config.type,
          category: config.category,
          isActive: true,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: 'تم إعادة تعيين الإعدادات الافتراضية بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين الإعدادات:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إعادة تعيين الإعدادات'
    });
  }
});

module.exports = router;
