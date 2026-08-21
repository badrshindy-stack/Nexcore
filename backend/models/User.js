const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  piUserId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'البريد الإلكتروني غير صحيح']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10,15}$/, 'رقم الهاتف غير صحيح']
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    enum: [
      'super_admin',
      'admin',
      'doctor',
      'nurse',
      'receptionist',
      'finance',
      'hr',
      'inventory_manager',
      'lab_tech',
      'radiologist',
      'pharmacist',
      'viewer'
    ],
    default: 'viewer',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  permissions: [{
    type: String,
    enum: [
      'view_dashboard',
      'manage_users',
      'manage_patients',
      'manage_appointments',
      'manage_inventory',
      'manage_invoices',
      'manage_employees',
      'manage_departments',
      'manage_medical_records',
      'manage_beds',
      'view_reports',
      'manage_settings',
      'manage_payments',
      'manage_medications'
    ]
  }],
  avatar: {
    type: String,
    default: null
  },
  preferences: {
    language: { type: String, default: 'ar' },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
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
UserSchema.virtual('isAdmin').get(function() {
  return ['super_admin', 'admin'].includes(this.role);
});

UserSchema.virtual('isMedicalStaff').get(function() {
  return ['doctor', 'nurse', 'lab_tech', 'radiologist', 'pharmacist'].includes(this.role);
});

// Indexes
UserSchema.index({ username: 1, isActive: 1 });
UserSchema.index({ piUserId: 1, isActive: 1 });

// Middleware
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

UserSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('User', UserSchema);
