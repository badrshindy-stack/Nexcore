const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
    patient: mongoose.Schema.Types.ObjectId,
    doctor: mongoose.Schema.Types.ObjectId,
    date: { type: Date, default: Date.now },
    diagnosis: String,
    symptoms: [String],
    medications: [String],
    notes: String,
    vital_signs: {
        temperature: Number,
        blood_pressure: String,
        heart_rate: Number,
        respiratory_rate: Number
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
