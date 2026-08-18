const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  employeeId: {
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
  specialization: {
    type: String,
    required: true,
    trim: true
  },
  subSpecializations: [{
    type: String,
    trim: true
  }],
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  licenseExpiry: {
    type: Date
  },
  clinic: {
    type: String,
    trim: true
  },
  consultationFee: {
    type: Number,
    min: 0,
    default: 0
  },
  availableDays: [{
    type: String,
    enum: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  }],
  availableHours: {
    start: {
      type: String,
      match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'صيغة الوقت غير صحيحة']
    },
    end: {
      type: String,
      match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'صيغة الوقت غير صحيحة']
    },
    breakStart: String,
    breakEnd: String,
    slotDuration: {
      type: Number,
      default: 30 // بالدقائق
    }
  },
  education: [{
    degree: { type: String, trim: true },
    institution: { type: String, trim: true },
    year: { type: Number },
    country: { type: String, trim: true }
  }],
  experience: [{
    position: { type: String, trim: true },
    institution: { type: String, trim: true },
    from: { type: Date },
    to: { type: Date },
    current: { type: Boolean, default: false }
  }],
  languages: [{
    type: String,
    trim: true
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  patients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  }],
  maxPatientsPerDay: {
    type: Number,
    default: 20
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'on_leave', 'off_duty', 'inactive'],
    default: 'available'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: 500
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
DoctorSchema.virtual('fullDetails').get(function() {
  return `د. ${this.fullName} (${this.specialization})`;
});

DoctorSchema.virtual('isAvailable').get(function() {
  return this.status === 'available' && this.isActive;
});

// Indexes
DoctorSchema.index({ employeeId: 1, isActive: 1 });
DoctorSchema.index({ licenseNumber: 1 });
DoctorSchema.index({ fullName: 'text', specialization: 'text' });
DoctorSchema.index({ specialization: 1, status: 1 });

// Middleware
DoctorSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Doctor', DoctorSchema);
