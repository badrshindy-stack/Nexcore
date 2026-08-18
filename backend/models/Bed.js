const mongoose = require('mongoose');

const BedSchema = new mongoose.Schema({
  bedId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  roomNumber: {
    type: String,
    required: true,
    trim: true
  },
  floor: {
    type: String,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  type: {
    type: String,
    enum: ['general', 'icu', 'ccu', 'nicu', 'pediatric', 'maternity', 'psychiatric', 'isolation', 'recovery', 'observation'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance', 'cleaning', 'blocked'],
    default: 'available'
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  admissionDate: {
    type: Date
  },
  expectedDischargeDate: {
    type: Date
  },
  actualDischargeDate: {
    type: Date
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  assignedNurse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  equipment: [{
    type: String,
    trim: true
  }],
  features: {
    hasOxygen: { type: Boolean, default: false },
    hasMonitor: { type: Boolean, default: false },
    hasVentilator: { type: Boolean, default: false },
    hasSuction: { type: Boolean, default: false },
    hasCallButton: { type: Boolean, default: true },
    hasTV: { type: Boolean, default: false },
    hasPrivateBathroom: { type: Boolean, default: false },
    hasWindow: { type: Boolean, default: true }
  },
  notes: {
    type: String,
    maxlength: 500
  },
  maintenanceSchedule: [{
    type: Date
  }],
  lastMaintenance: {
    type: Date
  },
  nextMaintenance: {
    type: Date
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

// Virtuals
BedSchema.virtual('isAvailable').get(function() {
  return this.status === 'available';
});

BedSchema.virtual('isOccupied').get(function() {
  return this.status === 'occupied';
});

BedSchema.virtual('bedInfo').get(function() {
  return `${this.type} - ${this.roomNumber} (${this.status})`;
});

// Indexes
BedSchema.index({ bedId: 1, isActive: 1 });
BedSchema.index({ department: 1, status: 1 });
BedSchema.index({ roomNumber: 1, floor: 1 });
BedSchema.index({ patient: 1, status: 1 });

// Middleware
BedSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Bed', BedSchema);
