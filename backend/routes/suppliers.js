const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');

// الحصول على جميع الموردين
router.get('/', async (req, res) => {
  try {
    const { search, isActive = true } = req.query;
    const filter = { isActive: isActive === 'true' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(filter).sort({ name: 1 });
    const total = await Supplier.countDocuments(filter);

    res.json({
      success: true,
      data: { suppliers, total }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الموردين:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الموردين'
    });
  }
});

// الحصول على مورد معين
router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'المورد غير موجود'
      });
    }
    res.json({ success: true, data: { supplier } });
  } catch (error) {
    console.error('❌ خطأ في جلب المورد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المورد'
    });
  }
});

// إضافة مورد جديد
router.post('/', async (req, res) => {
  try {
    const supplierData = req.body;
    const count = await Supplier.countDocuments();
    supplierData.supplierId = `SUP-${String(count + 1).padStart(6, '0')}`;
    
    const supplier = new Supplier(supplierData);
    await supplier.save();

    res.status(201).json({
      success: true,
      message: 'تم إضافة المورد بنجاح',
      data: { supplier }
    });

  } catch (error) {
    console.error('❌ خطأ في إضافة المورد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة المورد'
    });
  }
});

// تحديث مورد
router.put('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'المورد غير موجود'
      });
    }
    res.json({
      success: true,
      message: 'تم تحديث المورد بنجاح',
      data: { supplier }
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث المورد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث المورد'
    });
  }
});

// حذف مورد
router.delete('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'المورد غير موجود'
      });
    }
    res.json({
      success: true,
      message: 'تم حذف المورد بنجاح'
    });
  } catch (error) {
    console.error('❌ خطأ في حذف المورد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المورد'
    });
  }
});

module.exports = router;
