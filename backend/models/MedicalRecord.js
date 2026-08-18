const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  type: {
    type: String,
    enum: ['consultation', 'examination', 'lab_test', 'radiology', 'surgery', 'emergency', 'followup', 'vaccination', 'other'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  chiefComplaint: {
    type: String,
    trim: true,
    maxlength: 500
  },
  history: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  examination: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  diagnosis: {
    type: String,
    trim: true,
    maxlength: 500
  },
  diagnosisCode: {
    type: String,
    trim: true
  },
  treatmentPlan: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  medications: [{
    medication: { type: String, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    duration: { type: String, trim: true },
    prescribedDate: { type: Date, default: Date.now },
    notes: { type: String, trim: true }
  }],
  procedures: [{
    name: { type: String, trim: true },
    date: { type: Date },
    notes: { type: String, trim: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }
  }],
  labResults: [{
    test: { type: String, trim: true },
    result: { type: String, trim: true },
    unit: { type: String, trim: true },
    referenceRange: { type: String, trim: true },
    isAbnormal: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
    labName: { type: String, trim: true },
    notes: { type: String, trim: true }
  }],
  radiologyResults: [{
    study: { type: String, trim: true },
    findings: { type: String, trim: true },
    impression: { type: String, trim: true },
    recommendation: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    images: [{
      url: String,
      description: String
    }],
    notes: { type: String, trim: true }
  }],
  vitalSigns: {
    heartRate: { type: Number, min: 0 },
    bloodPressure: { type: String },
    temperature: { type: Number },
    respiratoryRate: { type: Number, min: 0 },
    oxygenSaturation: { type: Number, min: 0, max: 100 },
    weight: { type: Number },
    height: { type: Number },
    bmi: { type: Number }
  },
  attachments: [{
    name: { type: String, trim: true },
    type: { type: String },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  followUpDate: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isConfidential: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
MedicalRecordSchema.index({ recordId: 1, isActive: 1 });
MedicalRecordSchema.index({ patient: 1, date: -1 });
MedicalRecordSchema.index({ doctor: 1, date: -1 });
MedicalRecordSchema.index({ type: 1, date: -1 });
MedicalRecordSchema.index({ diagnosis: 'text', chiefComplaint: 'text' });

// Middleware
MedicalRecordSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
