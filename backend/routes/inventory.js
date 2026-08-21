const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');

// =============================================
// 1. الحصول على جميع الأصناف
// =============================================
router.get('/', async (req, res) => {
  try {
    const { search, category, supplier, lowStock } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) filter.category = category;
    if (supplier) filter.supplier = supplier;
    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$quantity', '$minThreshold'] };
    }

    const items = await Inventory.find(filter)
      .populate('supplier', 'name code')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { items, total: items.length }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب المخزون:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المخزون'
    });
  }
});

// =============================================
// 2. الحصول على صنف معين
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id)
      .populate('supplier', 'name code');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'الصنف غير موجود'
      });
    }

    res.json({
      success: true,
      data: { item }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الصنف:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الصنف'
    });
  }
});

// =============================================
// 3. إضافة صنف جديد
// =============================================
router.post('/', async (req, res) => {
  try {
    const itemData = req.body;

    const existing = await Inventory.findOne({
      $or: [{ code: itemData.code }, { itemId: itemData.itemId }]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'يوجد صنف بنفس الكود أو المعرف'
      });
    }

    const item = new Inventory(itemData);
    await item.save();

    res.status(201).json({
      success: true,
      message: 'تم إضافة الصنف بنجاح',
      data: { item }
    });

  } catch (error) {
    console.error('❌ خطأ في إضافة الصنف:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة الصنف'
    });
  }
});

// =============================================
// 4. تحديث صنف
// =============================================
router.put('/:id', async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'الصنف غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث الصنف بنجاح',
      data: { item }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث الصنف:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الصنف'
    });
  }
});

// =============================================
// 5. حذف صنف
// =============================================
router.delete('/:id', async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'الصنف غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الصنف بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف الصنف:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الصنف'
    });
  }
});

// =============================================
// 6. تحديث الكمية
// =============================================
router.patch('/:id/quantity', async (req, res) => {
  try {
    const { quantity, operation = 'set' } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'الكمية غير صحيحة'
      });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'الصنف غير موجود'
      });
    }

    if (operation === 'add') {
      item.quantity += quantity;
    } else if (operation === 'subtract') {
      if (item.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: 'الكمية غير متوفرة'
        });
      }
      item.quantity -= quantity;
    } else {
      item.quantity = quantity;
    }

    item.updatedAt = new Date();
    await item.save();

    res.json({
      success: true,
      message: 'تم تحديث الكمية بنجاح',
      data: { item }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث الكمية:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الكمية'
    });
  }
});

// =============================================
// 7. الأصناف منخفضة المخزون
// =============================================
router.get('/low-stock', async (req, res) => {
  try {
    const items = await Inventory.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$minThreshold'] }
    }).populate('supplier', 'name');

    res.json({
      success: true,
      data: { items, total: items.length }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الأصناف منخفضة المخزون:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الأصناف منخفضة المخزون'
    });
  }
});

module.exports = router;
