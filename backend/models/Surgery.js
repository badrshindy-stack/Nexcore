const mongoose = require('mongoose');

const SurgerySchema = new mongoose.Schema({
  surgeryId: {
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
  surgeon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  anesthesiologist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  surgicalTeam: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  surgeryName: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['emergency', 'elective', 'urgent', 'scheduled'],
    default: 'elective'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  operatingRoom: {
    type: String,
    trim: true
  },
  duration: {
    type: Number, // بالدقائق
    min: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'pre_op', 'in_progress', 'recovery', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  preOpNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  preOpChecklist: [{
    item: { type: String, trim: true },
    completed: { type: Boolean, default: false },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date }
  }],
  procedureNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  postOpNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  complications: [{
    type: String,
    trim: true
  }],
  medications: [{
    name: { type: String, trim: true },
    dosage: { type: String, trim: true },
    timing: { type: String, trim: true },
    administered: { type: Boolean, default: false }
  }],
  instruments: [{
    name: { type: String, trim: true },
    count: { type: Number, default: 1 },
    sterilized: { type: Boolean, default: true }
  }],
  implants: [{
    name: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    manufacturer: { type: String, trim: true },
    lotNumber: { type: String, trim: true },
    expiryDate: { type: Date }
  }],
  bloodLoss: {
    type: String,
    trim: true
  },
  transfusions: [{
    type: String,
    trim: true
  }],
  reportUrl: {
    type: String,
    trim: true
  },
  followUpDate: {
    type: Date
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

SurgerySchema.index({ surgeryId: 1, isActive: 1 });
SurgerySchema.index({ patient: 1, scheduledDate: -1 });
SurgerySchema.index({ surgeon: 1, scheduledDate: 1 });
SurgerySchema.index({ status: 1, scheduledDate: 1 });

module.exports = mongoose.model('Surgery', SurgerySchema);
