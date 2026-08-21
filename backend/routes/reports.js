const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Inventory = require('../models/Inventory');
const Invoice = require('../models/Invoice');
const Doctor = require('../models/Doctor');
const MedicalRecord = require('../models/MedicalRecord');

// =============================================
// 1. تقرير لوحة التحكم
// =============================================
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalPatients,
      totalAppointments,
      totalInventory,
      totalInvoices,
      totalDoctors,
      pendingAppointments,
      lowStockItems,
      revenueToday,
      revenueMonth,
      revenueYear
    ] = await Promise.all([
      Patient.countDocuments({ isActive: true }),
      Appointment.countDocuments({ isActive: true }),
      Inventory.countDocuments({ isActive: true }),
      Invoice.countDocuments({ isActive: true }),
      Doctor.countDocuments({ isActive: true }),
      Appointment.countDocuments({ status: 'scheduled' }),
      Inventory.countDocuments({ $expr: { $lte: ['$quantity', '$minThreshold'] } }),
      Invoice.aggregate([
        { $match: { issuedDate: { $gte: new Date(new Date().setHours(0,0,0,0)) } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Invoice.aggregate([
        { $match: { issuedDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Invoice.aggregate([
        { $match: { issuedDate: { $gte: new Date(new Date().getFullYear(), 0, 1) } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    // جلب المواعيد القادمة
    const upcomingAppointments = await Appointment.find({
      date: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] },
      isActive: true
    })
      .populate('patient', 'fullName')
      .populate('doctor', 'fullName')
      .sort({ date: 1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        stats: {
          totalPatients,
          totalAppointments,
          totalInventory,
          totalInvoices,
          totalDoctors,
          pendingAppointments,
          lowStockItems,
          revenueToday: revenueToday[0]?.total || 0,
          revenueMonth: revenueMonth[0]?.total || 0,
          revenueYear: revenueYear[0]?.total || 0
        },
        upcomingAppointments,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب تقرير لوحة التحكم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب التقرير'
    });
  }
});

// =============================================
// 2. تقرير المرضى
// =============================================
router.get('/patients', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const patients = await Patient.find({
      createdAt: { $gte: startDate },
      isActive: true
    });

    // إحصائيات حسب الجنس
    const genderStats = {
      male: patients.filter(p => p.gender === 'male').length,
      female: patients.filter(p => p.gender === 'female').length,
      other: patients.filter(p => p.gender === 'other').length
    };

    // إحصائيات حسب العمر
    const ageGroups = {
      '0-18': 0,
      '19-40': 0,
      '41-60': 0,
      '60+': 0
    };

    patients.forEach(p => {
      if (p.age !== null) {
        if (p.age <= 18) ageGroups['0-18']++;
        else if (p.age <= 40) ageGroups['19-40']++;
        else if (p.age <= 60) ageGroups['41-60']++;
        else ageGroups['60+']++;
      }
    });

    res.json({
      success: true,
      data: {
        total: patients.length,
        genderStats,
        ageGroups,
        period
      }
    });

  } catch (error) {
    console.error('❌ خطأ في تقرير المرضى:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب تقرير المرضى'
    });
  }
});

// =============================================
// 3. تقرير المخزون
// =============================================
router.get('/inventory', async (req, res) => {
  try {
    const items = await Inventory.find({ isActive: true });

    const totalItems = items.length;
    const lowStock = items.filter(i => i.quantity <= i.minThreshold);
    const outOfStock = items.filter(i => i.quantity === 0);

    // تجميع حسب الفئة
    const categories = {};
    items.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = { count: 0, totalValue: 0 };
      }
      categories[item.category].count++;
      categories[item.category].totalValue += (item.unitPrice || 0) * item.quantity;
    });

    res.json({
      success: true,
      data: {
        totalItems,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        categories
      }
    });

  } catch (error) {
    console.error('❌ خطأ في تقرير المخزون:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب تقرير المخزون'
    });
  }
});

// =============================================
// 4. تقرير المواعيد
// =============================================
router.get('/appointments', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const appointments = await Appointment.find({
      date: { $gte: startDate },
      isActive: true
    });

    const statusStats = {
      scheduled: appointments.filter(a => a.status === 'scheduled').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length
    };

    // المواعيد حسب اليوم
    const dailyStats = {};
    appointments.forEach(a => {
      const date = a.date.toDateString();
      if (!dailyStats[date]) {
        dailyStats[date] = 0;
      }
      dailyStats[date]++;
    });

    res.json({
      success: true,
      data: {
        total: appointments.length,
        statusStats,
        dailyStats,
        period
      }
    });

  } catch (error) {
    console.error('❌ خطأ في تقرير المواعيد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب تقرير المواعيد'
    });
  }
});

// =============================================
// 5. تقرير مالي
// =============================================
router.get('/financial', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const invoices = await Invoice.find({
      issuedDate: { $gte: startDate },
      isActive: true
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices.filter(i => i.paymentStatus === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    const totalUnpaid = invoices.filter(i => i.paymentStatus === 'unpaid')
      .reduce((sum, inv) => sum + inv.total, 0);

    // الإيرادات حسب اليوم
    const dailyRevenue = {};
    invoices.forEach(inv => {
      const date = inv.issuedDate.toDateString();
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = 0;
      }
      dailyRevenue[date] += inv.total;
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalPaid,
        totalUnpaid,
        invoiceCount: invoices.length,
        dailyRevenue,
        period
      }
    });

  } catch (error) {
    console.error('❌ خطأ في تقرير المالي:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب تقرير المالي'
    });
  }
});

module.exports = router;
