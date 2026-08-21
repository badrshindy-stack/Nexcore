const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const Inventory = require('../models/Inventory');

// =============================================
// 1. الحصول على جميع المشتريات
// =============================================
router.get('/', async (req, res) => {
  try {
    const { supplier, status, startDate, endDate } = req.query;
    const filter = { isActive: true };

    if (supplier) filter.supplier = supplier;
    if (status) filter.status = status;
    if (startDate) filter.orderDate = { $gte: new Date(startDate) };
    if (endDate) filter.orderDate = { ...filter.orderDate, $lte: new Date(endDate) };

    const purchases = await Purchase.find(filter)
      .populate('supplier', 'name code')
      .populate('createdBy', 'username fullName')
      .sort({ orderDate: -1 });

    res.json({
      success: true,
      data: { purchases, total: purchases.length }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب المشتريات:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المشتريات'
    });
  }
});

// =============================================
// 2. الحصول على أمر شراء معين
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'name code')
      .populate('createdBy', 'username fullName')
      .populate('approvedBy', 'username fullName');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'أمر الشراء غير موجود'
      });
    }

    res.json({
      success: true,
      data: { purchase }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب أمر الشراء:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب أمر الشراء'
    });
  }
});

// =============================================
// 3. إضافة أمر شراء جديد
// =============================================
router.post('/', async (req, res) => {
  try {
    const purchaseData = req.body;

    // التحقق من المورد
    const supplier = await Supplier.findById(purchaseData.supplier);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'المورد غير موجود'
      });
    }

    const count = await Purchase.countDocuments();
    purchaseData.purchaseId = `PUR-${String(count + 1).padStart(6, '0')}`;
    purchaseData.orderNumber = `PO-${String(count + 1).padStart(6, '0')}`;

    const purchase = new Purchase(purchaseData);
    await purchase.save();

    res.status(201).json({
      success: true,
      message: 'تم إنشاء أمر الشراء بنجاح',
      data: { purchase }
    });

  } catch (error) {
    console.error('❌ خطأ في إنشاء أمر الشراء:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء أمر الشراء'
    });
  }
});

// =============================================
// 4. تحديث أمر شراء
// =============================================
router.put('/:id', async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'أمر الشراء غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث أمر الشراء بنجاح',
      data: { purchase }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث أمر الشراء:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث أمر الشراء'
    });
  }
});

// =============================================
// 5. حذف أمر شراء
// =============================================
router.delete('/:id', async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      { isActive: false, status: 'cancelled', updatedAt: new Date() },
      { new: true }
    );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'أمر الشراء غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف أمر الشراء بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف أمر الشراء:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف أمر الشراء'
    });
  }
});

// =============================================
// 6. استلام مشتريات
// =============================================
router.post('/:id/receive', async (req, res) => {
  try {
    const { items } = req.body;
    const purchase = await Purchase.findById(req.params.id);
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'أمر الشراء غير موجود'
      });
    }

    // تحديث الكميات المستلمة
    purchase.items.forEach((item, index) => {
      if (items[index]) {
        item.receivedQuantity = items[index].receivedQuantity || item.quantity;
      }
    });

    // تحديث حالة الأمر
    const allReceived = purchase.items.every(item => item.receivedQuantity === item.quantity);
    const partiallyReceived = purchase.items.some(item => item.receivedQuantity > 0);

    if (allReceived) {
      purchase.status = 'received';
      purchase.receivedDate = new Date();
    } else if (partiallyReceived) {
      purchase.status = 'partially_received';
    }

    // تحديث المخزون
    for (const item of purchase.items) {
      if (item.receivedQuantity > 0) {
        const inventoryItem = await Inventory.findOne({ code: item.code });
        if (inventoryItem) {
          inventoryItem.quantity += item.receivedQuantity;
          await inventoryItem.save();
        }
      }
    }

    await purchase.save();

    res.json({
      success: true,
      message: 'تم استلام المشتريات بنجاح',
      data: { purchase }
    });

  } catch (error) {
    console.error('❌ خطأ في استلام المشتريات:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء استلام المشتريات'
    });
  }
});

module.exports = router;
