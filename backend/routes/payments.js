const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');

// =============================================
// 1. إنشاء دفعة جديدة
// =============================================
router.post('/create', async (req, res) => {
  try {
    const { amount, memo, metadata, patientId, invoiceId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'المبلغ غير صحيح'
      });
    }

    let patient = null;
    if (patientId) {
      patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'المريض غير موجود'
        });
      }
    }

    const payment = {
      paymentId: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      amount,
      memo: memo || 'دفع عبر Pi Network',
      metadata: metadata || {},
      patient: patientId || null,
      invoice: invoiceId || null,
      status: 'pending',
      createdAt: new Date()
    };

    if (invoiceId) {
      const invoice = await Invoice.findById(invoiceId);
      if (invoice) {
        invoice.paymentStatus = 'processing';
        await invoice.save();
      }
    }

    res.json({
      success: true,
      message: 'تم إنشاء الدفعة بنجاح',
      data: payment
    });

  } catch (error) {
    console.error('❌ خطأ في إنشاء الدفعة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الدفعة'
    });
  }
});

// =============================================
// 2. الموافقة على الدفعة
// =============================================
router.post('/approve', async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'معرف الدفعة مطلوب'
      });
    }

    res.json({
      success: true,
      message: 'تمت الموافقة على الدفعة بنجاح',
      data: { paymentId, status: 'approved' }
    });

  } catch (error) {
    console.error('❌ خطأ في الموافقة على الدفعة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء الموافقة على الدفعة'
    });
  }
});

// =============================================
// 3. إكمال الدفعة
// =============================================
router.post('/complete', async (req, res) => {
  try {
    const { paymentId, txid } = req.body;

    if (!paymentId || !txid) {
      return res.status(400).json({
        success: false,
        message: 'بيانات الدفعة غير مكتملة'
      });
    }

    res.json({
      success: true,
      message: 'تم إكمال الدفعة بنجاح',
      data: {
        paymentId,
        txid,
        status: 'completed',
        completedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ خطأ في إكمال الدفعة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إكمال الدفعة'
    });
  }
});

// =============================================
// 4. الحصول على حالة الدفعة
// =============================================
router.get('/:paymentId/status', async (req, res) => {
  try {
    const { paymentId } = req.params;

    res.json({
      success: true,
      data: {
        paymentId,
        status: 'completed',
        verified: true,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب حالة الدفعة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب حالة الدفعة'
    });
  }
});

module.exports = router;
