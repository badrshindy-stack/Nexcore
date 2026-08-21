const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// =============================================
// 1. الحصول على جميع الفواتير
// =============================================
router.get('/', async (req, res) => {
  try {
    const { patient, status, paymentStatus, startDate, endDate, search } = req.query;
    const filter = { isActive: true };

    if (patient) filter.patient = patient;
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (startDate) filter.issuedDate = { $gte: new Date(startDate) };
    if (endDate) filter.issuedDate = { ...filter.issuedDate, $lte: new Date(endDate) };

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'items.description': { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(filter)
      .populate('patient', 'fullName patientId phone')
      .populate('doctor', 'fullName')
      .populate('appointment')
      .populate('createdBy', 'username fullName')
      .sort({ issuedDate: -1 });

    const stats = {
      total: invoices.length,
      paid: invoices.filter(i => i.paymentStatus === 'paid').length,
      unpaid: invoices.filter(i => i.paymentStatus === 'unpaid').length,
      partial: invoices.filter(i => i.paymentStatus === 'partial').length,
      totalAmount: invoices.reduce((sum, i) => sum + i.total, 0)
    };

    res.json({
      success: true,
      data: { invoices, stats }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الفواتير:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الفواتير'
    });
  }
});

// =============================================
// 2. الحصول على فاتورة معينة
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('patient', 'fullName patientId phone email address')
      .populate('doctor', 'fullName specialization')
      .populate('appointment')
      .populate('createdBy', 'username fullName');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'الفاتورة غير موجودة'
      });
    }

    res.json({
      success: true,
      data: { invoice }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب الفاتورة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الفاتورة'
    });
  }
});

// =============================================
// 3. إنشاء فاتورة جديدة
// =============================================
router.post('/', async (req, res) => {
  try {
    const invoiceData = req.body;

    // التحقق من المريض
    const patient = await Patient.findById(invoiceData.patient);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'المريض غير موجود'
      });
    }

    // إنشاء رقم فاتورة
    const count = await Invoice.countDocuments();
    invoiceData.invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`;

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الفاتورة بنجاح',
      data: { invoice }
    });

  } catch (error) {
    console.error('❌ خطأ في إنشاء الفاتورة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الفاتورة'
    });
  }
});

// =============================================
// 4. تحديث فاتورة
// =============================================
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'الفاتورة غير موجودة'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث الفاتورة بنجاح',
      data: { invoice }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث الفاتورة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الفاتورة'
    });
  }
});

// =============================================
// 5. حذف فاتورة
// =============================================
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { isActive: false, status: 'cancelled', updatedAt: new Date() },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'الفاتورة غير موجودة'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الفاتورة بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف الفاتورة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الفاتورة'
    });
  }
});

// =============================================
// 6. تسجيل دفعة
// =============================================
router.post('/:id/payment', async (req, res) => {
  try {
    const { amount, paymentMethod, piPaymentId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'المبلغ غير صحيح'
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'الفاتورة غير موجودة'
      });
    }

    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'الفاتورة مدفوعة بالكامل'
      });
    }

    // تحديث المبلغ المدفوع
    invoice.paidAmount += amount;
    invoice.remainingAmount = invoice.total - invoice.paidAmount;

    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (piPaymentId) invoice.piPaymentId = piPaymentId;

    if (invoice.paidAmount >= invoice.total) {
      invoice.paymentStatus = 'paid';
      invoice.paidDate = new Date();
      invoice.status = 'paid';
    } else if (invoice.paidAmount > 0) {
      invoice.paymentStatus = 'partial';
    }

    await invoice.save();

    res.json({
      success: true,
      message: 'تم تسجيل الدفعة بنجاح',
      data: { invoice }
    });

  } catch (error) {
    console.error('❌ خطأ في تسجيل الدفعة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الدفعة'
    });
  }
});

module.exports = router;
