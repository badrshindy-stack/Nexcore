const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    position: String,
    department: mongoose.Schema.Types.ObjectId,
    phone: String,
    email: String,
    salary: Number,
    hire_date: Date,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Employee', employeeSchema);
