const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    default: 'string'
  },
  category: {
    type: String,
    enum: ['general', 'hospital', 'company', 'payment', 'notification', 'security', 'appearance'],
    default: 'general'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedBy: {
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

// الإعدادات الافتراضية
SettingsSchema.statics.getDefaultSettings = function() {
  return {
    // إعدادات عامة
    'site_name': { value: 'Nexcore', type: 'string', category: 'general' },
    'site_logo': { value: null, type: 'string', category: 'general' },
    'timezone': { value: 'Africa/Cairo', type: 'string', category: 'general' },
    'language': { value: 'ar', type: 'string', category: 'general' },
    'currency': { value: 'USD', type: 'string', category: 'general' },
    
    // إعدادات المستشفى
    'hospital_name': { value: 'مستشفى Nexcore', type: 'string', category: 'hospital' },
    'hospital_address': { value: '', type: 'string', category: 'hospital' },
    'hospital_phone': { value: '', type: 'string', category: 'hospital' },
    'hospital_email': { value: '', type: 'string', category: 'hospital' },
    
    // إعدادات الدفع
    'payment_pi_enabled': { value: true, type: 'boolean', category: 'payment' },
    'payment_cash_enabled': { value: true, type: 'boolean', category: 'payment' },
    'payment_card_enabled': { value: true, type: 'boolean', category: 'payment' },
    'default_consultation_fee': { value: 50, type: 'number', category: 'payment' },
    
    // إعدادات الإشعارات
    'notification_email': { value: true, type: 'boolean', category: 'notification' },
    'notification_sms': { value: false, type: 'boolean', category: 'notification' },
    'notification_push': { value: true, type: 'boolean', category: 'notification' },
    
    // إعدادات الأمان
    'session_timeout': { value: 1440, type: 'number', category: 'security' },
    'max_login_attempts': { value: 5, type: 'number', category: 'security' },
    'require_2fa': { value: false, type: 'boolean', category: 'security' }
  };
};

SettingsSchema.index({ key: 1, isActive: 1 });
SettingsSchema.index({ category: 1 });

module.exports = mongoose.model('Settings', SettingsSchema);
