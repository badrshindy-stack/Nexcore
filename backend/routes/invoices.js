const express = require('express');
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');

const router = express.Router();

// عرض جميع الفواتير
router.get('/', async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .populate('patient')
            .populate('issued_by')
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض فاتورة محددة
router.get('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('patient')
            .populate('issued_by');
        
        if (!invoice) {
            return res.status(404).json({ error: 'الفاتورة غير موجودة' });
        }
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// إضافة فاتورة جديدة
router.post('/', async (req, res) => {
    try {
        const { invoice_number, patient, items, total_amount, discount, tax, status, payment_method, due_date, notes, issued_by } = req.body;

        if (!invoice_number || !patient || !items || !total_amount) {
            return res.status(400).json({ error: 'رقم الفاتورة والمريض والبنود والمبلغ الإجمالي مطلوبان' });
        }

        const invoice = new Invoice({
            invoice_number,
            patient,
            items,
            total_amount,
            discount: discount || 0,
            tax: tax || 0,
            status: status || 'pending',
            payment_method,
            due_date,
            notes,
            issued_by
        });

        await invoice.save();
        await invoice.populate(['patient', 'issued_by']);
        res.status(201).json(invoice);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'رقم الفاتورة موجود بالفعل' });
        }
        res.status(500).json({ error: error.message });
    }
});

// تحديث فاتورة
router.put('/:id', async (req, res) => {
    try {
        const { invoice_number, patient, items, total_amount, paid_amount, discount, tax, status, payment_method, payment_date, due_date, notes } = req.body;

        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    invoice_number,
                    patient,
                    items,
                    total_amount,
                    paid_amount,
                    discount,
                    tax,
                    status,
                    payment_method,
                    payment_date,
                    due_date,
                    notes,
                    updatedAt: new Date()
                }
            },
            { new: true }
        ).populate(['patient', 'issued_by']);

        if (!invoice) {
            return res.status(404).json({ error: 'الفاتورة غير موجودة' });
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حذف فاتورة
router.delete('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);

        if (!invoice) {
            return res.status(404).json({ error: 'الفاتورة غير موجودة' });
        }

        res.json({ message: 'تم حذف الفاتورة بنجاح', invoice });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض فواتير مريض محدد
router.get('/patient/:patientId', async (req, res) => {
    try {
        const invoices = await Invoice.find({ patient: req.params.patientId })
            .populate('patient')
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض الفواتير المعلقة
router.get('/status/pending', async (req, res) => {
    try {
        const invoices = await Invoice.find({ status: 'pending' })
            .populate('patient')
            .sort({ due_date: 1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// عرض الفواتير المدفوعة
router.get('/status/paid', async (req, res) => {
    try {
        const invoices = await Invoice.find({ status: 'paid' })
            .populate('patient')
            .sort({ payment_date: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// حساب الإيرادات الإجمالية
router.get('/revenue/total', async (req, res) => {
    try {
        const result = await Invoice.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, totalRevenue: { $sum: '$total_amount' } } }
        ]);
        res.json({ totalRevenue: result[0]?.totalRevenue || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
