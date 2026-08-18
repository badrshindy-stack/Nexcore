const mongoose = require('mongoose');

const EmergencySchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  patientName: {
    type: String,
    trim: true
  },
  patientPhone: {
    type: String,
    trim: true
  },
  triageLevel: {
    type: String,
    enum: ['critical', 'urgent', 'semi_urgent', 'non_urgent'],
    required: true
  },
  triageDate: {
    type: Date,
    default: Date.now
  },
  triageBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  chiefComplaint: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  history: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  vitals: {
    heartRate: { type: Number, min: 0 },
    bloodPressure: { type: String },
    temperature: { type: Number },
    respiratoryRate: { type: Number, min: 0 },
    oxygenSaturation: { type: Number, min: 0, max: 100 },
    painScale: { type: Number, min: 0, max: 10 },
    glucose: { type: Number },
    gcs: { type: Number, min: 3, max: 15 }
  },
  initialDiagnosis: {
    type: String,
    trim: true,
    maxlength: 500
  },
  treatment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  admittingDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  assignedBed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bed'
  },
  status: {
    type: String,
    enum: ['waiting', 'under_treatment', 'admitted', 'discharged', 'transferred', 'deceased'],
    default: 'waiting'
  },
  admissionDate: {
    type: Date
  },
  dischargeDate: {
    type: Date
  },
  dischargeNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  dischargeCondition: {
    type: String,
    enum: ['improved', 'stable', 'referred', 'against_advice', 'deceased'],
    default: 'stable'
  },
  referralHospital: {
    type: String,
    trim: true
  },
  referralReason: {
    type: String,
    trim: true
  },
  outcome: {
    type: String,
    trim: true,
    maxlength: 500
  },
  medications: [{
    name: { type: String, trim: true },
    dosage: { type: String, trim: true },
    route: { type: String, trim: true },
    administered: { type: Boolean, default: false },
    administeredAt: { type: Date }
  }],
  procedures: [{
    name: { type: String, trim: true },
    performedAt: { type: Date },
    performedBy: { type: String, trim: true },
    notes: { type: String, trim: true }
  }],
  notes: {
    type: String,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  timestamps: true
});

EmergencySchema.index({ caseId: 1, isActive: 1 });
EmergencySchema.index({ patient: 1, createdAt: -1 });
EmergencySchema.index({ triageLevel: 1, status: 1 });
EmergencySchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('Emergency', EmergencySchema);
