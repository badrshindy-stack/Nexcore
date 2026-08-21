const express = require('express');
const router = express.Router();
const Medication = require('../models/Medication');

// =============================================
// 1. الحصول على جميع الأدوية
// =============================================
router.get('/', async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) filter.category = category;
    if (status) filter.status = status;

    const medications = await Medication.find(filter)
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { medications, total: medications.length }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الأدوية:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الأدوية'
    });
  }
});

// =============================================
// 2. الحصول على دواء معين
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'الدواء غير موجود'
      });
    }

    res.json({
      success: true,
      data: { medication }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الدواء:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الدواء'
    });
  }
});

// =============================================
// 3. إضافة دواء جديد
// =============================================
router.post('/', async (req, res) => {
  try {
    const medicationData = req.body;

    const existing = await Medication.findOne({
      $or: [{ code: medicationData.code }, { name: medicationData.name }]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'يوجد دواء بنفس الاسم أو الكود'
      });
    }

    const medication = new Medication(medicationData);
    await medication.save();

    res.status(201).json({
      success: true,
      message: 'تم إضافة الدواء بنجاح',
      data: { medication }
    });

  } catch (error) {
    console.error('❌ خطأ في إضافة الدواء:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة الدواء'
    });
  }
});

// =============================================
// 4. تحديث دواء
// =============================================
router.put('/:id', async (req, res) => {
  try {
    const medication = await Medication.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'الدواء غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث الدواء بنجاح',
      data: { medication }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث الدواء:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الدواء'
    });
  }
});

// =============================================
// 5. حذف دواء
// =============================================
router.delete('/:id', async (req, res) => {
  try {
    const medication = await Medication.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'الدواء غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الدواء بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف الدواء:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الدواء'
    });
  }
});

// =============================================
// 6. تحديث مخزون الدواء
// =============================================
router.patch('/:id/stock', async (req, res) => {
  try {
    const { quantity, operation = 'set' } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'الكمية غير صحيحة'
      });
    }

    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'الدواء غير موجود'
      });
    }

    if (operation === 'add') {
      medication.stockQuantity += quantity;
    } else if (operation === 'subtract') {
      if (medication.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: 'الكمية غير متوفرة'
        });
      }
      medication.stockQuantity -= quantity;
    } else {
      medication.stockQuantity = quantity;
    }

    medication.updatedAt = new Date();
    await medication.save();

    res.json({
      success: true,
      message: 'تم تحديث مخزون الدواء بنجاح',
      data: { medication }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث مخزون الدواء:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث مخزون الدواء'
    });
  }
});

module.exports = router;
