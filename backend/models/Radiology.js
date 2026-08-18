const mongoose = require('mongoose');

const RadiologySchema = new mongoose.Schema({
  studyId: {
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
  studyType: {
    type: String,
    enum: ['xray', 'ct', 'mri', 'ultrasound', 'mammography', 'fluoroscopy', 'pet', 'spect', 'dental', 'other'],
    required: true
  },
  bodyPart: {
    type: String,
    required: true,
    trim: true
  },
  clinicalIndication: {
    type: String,
    trim: true,
    maxlength: 500
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  performedDate: {
    type: Date
  },
  performedBy: {
    type: String,
    trim: true
  },
  images: [{
    url: { type: String, trim: true },
    description: { type: String, trim: true },
    label: { type: String, trim: true },
    view: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  findings: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  impression: {
    type: String,
    trim: true,
    maxlength: 500
  },
  recommendation: {
    type: String,
    trim: true,
    maxlength: 500
  },
  comparison: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['ordered', 'performed', 'reviewed', 'completed', 'cancelled'],
    default: 'ordered'
  },
  reviewedDate: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  reportUrl: {
    type: String,
    trim: true
  },
  radiationDose: {
    type: String,
    trim: true
  },
  contrastUsed: {
    type: Boolean,
    default: false
  },
  contrastDetails: {
    type: String,
    trim: true
  },
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

RadiologySchema.index({ studyId: 1, isActive: 1 });
RadiologySchema.index({ patient: 1, orderDate: -1 });
RadiologySchema.index({ studyType: 1, status: 1 });

module.exports = mongoose.model('Radiology', RadiologySchema);
