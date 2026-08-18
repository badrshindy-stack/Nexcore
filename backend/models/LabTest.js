const mongoose = require('mongoose');

const LabTestSchema = new mongoose.Schema({
  testId: {
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
  testName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['blood', 'urine', 'stool', 'imaging', 'microbiology', 'pathology', 'genetic', 'hormone', 'other'],
    default: 'other'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  collectedDate: {
    type: Date
  },
  collectedBy: {
    type: String,
    trim: true
  },
  sampleType: {
    type: String,
    enum: ['blood', 'serum', 'plasma', 'urine', 'stool', 'tissue', 'swab', 'other'],
    default: 'blood'
  },
  sampleQuality: {
    type: String,
    enum: ['good', 'hemolyzed', 'lipemic', 'icteric', 'insufficient', 'contaminated'],
    default: 'good'
  },
  results: [{
    parameter: { type: String, required: true, trim: true },
    value: { type: String, trim: true },
    unit: { type: String, trim: true },
    referenceRange: { type: String, trim: true },
    isAbnormal: { type: Boolean, default: false },
    flag: { type: String, enum: ['high', 'low', 'normal', 'critical'] }
  }],
  interpretation: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['ordered', 'collected', 'processing', 'completed', 'reviewed', 'cancelled'],
    default: 'ordered'
  },
  completedDate: {
    type: Date
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

LabTestSchema.index({ testId: 1, isActive: 1 });
LabTestSchema.index({ patient: 1, orderDate: -1 });
LabTestSchema.index({ status: 1, orderDate: 1 });

module.exports = mongoose.model('LabTest', LabTestSchema);
