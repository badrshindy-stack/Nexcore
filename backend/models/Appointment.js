const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  appointmentId: {
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
    ref: 'Doctor',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  date: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    default: 30 // بالدقائق
  },
  type: {
    type: String,
    enum: ['consultation', 'followup', 'emergency', 'procedure', 'surgery', 'checkup', 'vaccination'],
    default: 'consultation'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'],
    default: 'scheduled'
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  diagnosis: {
    type: String,
    trim: true
  },
  prescription: [{
    medication: { type: String, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    duration: { type: String, trim: true },
    notes: { type: String, trim: true }
  }],
  notes: {
    type: String,
    maxlength: 500
  },
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
  followUpDate: {
    type: Date
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderDate: {
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
AppointmentSchema.virtual('isUpcoming').get(function() {
  return this.status === 'scheduled' || this.status === 'confirmed';
});

AppointmentSchema.virtual('isPast').get(function() {
  return ['completed', 'cancelled', 'no_show'].includes(this.status);
});

AppointmentSchema.virtual('isToday').get(function() {
  const today = new Date();
  const appDate = new Date(this.date);
  return appDate.toDateString() === today.toDateString();
});

// Indexes
AppointmentSchema.index({ appointmentId: 1, isActive: 1 });
AppointmentSchema.index({ patient: 1, date: -1 });
AppointmentSchema.index({ doctor: 1, date: -1 });
AppointmentSchema.index({ date: 1, status: 1 });
AppointmentSchema.index({ status: 1, date: 1 });

// Middleware
AppointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
