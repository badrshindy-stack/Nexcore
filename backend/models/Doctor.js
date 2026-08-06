const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    license_number: { type: String, unique: true },
    phone: String,
    email: String,
    department: mongoose.Schema.Types.ObjectId,
    bio: String,
    photo_url: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doctor', doctorSchema);
