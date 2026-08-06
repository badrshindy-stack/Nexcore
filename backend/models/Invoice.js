const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoice_number: { type: String, unique: true },
    patient: mongoose.Schema.Types.ObjectId,
    items: [{
        description: String,
        quantity: Number,
        unit_price: Number,
        total: Number
    }],
    total_amount: Number,
    paid_amount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'paid', 'partial'], default: 'pending' },
    payment_date: Date,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
