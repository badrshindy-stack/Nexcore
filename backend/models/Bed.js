const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
    room_number: String,
    bed_number: String,
    department: mongoose.Schema.Types.ObjectId,
    status: { type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available' },
    patient: mongoose.Schema.Types.ObjectId,
    assigned_date: Date,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bed', bedSchema);
