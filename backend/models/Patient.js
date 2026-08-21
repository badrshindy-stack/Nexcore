const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  phone: {
    type: String,
    required: true,
    match: [/^[0-9]{10,15}$/, 'رقم الهاتف غير صحيح']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'البريد الإلكتروني غير صحيح']
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true }
  },
  emergencyContact: {
    name: { type: String, trim: true },
    phone: { type: String, match: [/^[0-9]{10,15}$/, 'رقم الهاتف غير صحيح'] },
    relation: { type: String, trim: true }
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
    default: 'unknown'
  },
  allergies: [{
    type: String,
    trim: true
  }],
  chronicDiseases: [{
    type: String,
    trim: true
  }],
  currentMedications: [{
    medication: { type: String, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true }
  }],
  medicalHistory: [{
    condition: { type: String, required: true },
    diagnosedDate: { type: Date },
    treatment: { type: String },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    notes: { type: String }
  }],
  insuranceProvider: {
    type: String,
    trim: true
  },
  insuranceNumber: {
    type: String,
    trim: true
  },
  primaryPhysician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deceased', 'transferred'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: 1000
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

// Virtuals
PatientSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

PatientSchema.virtual('fullDetails').get(function() {
  return `${this.fullName} (${this.patientId})`;
});

// Indexes
PatientSchema.index({ patientId: 1, isActive: 1 });
PatientSchema.index({ fullName: 'text', phone: 'text', email: 'text' });
PatientSchema.index({ primaryPhysician: 1, department: 1 });

// Middleware
PatientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Patient', PatientSchema);
