const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  supplierId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
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
  website: {
    type: String,
    trim: true
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true }
  },
  taxNumber: {
    type: String,
    trim: true
  },
  commercialRegister: {
    type: String,
    trim: true
  },
  bankAccount: {
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    iban: { type: String, trim: true }
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalTransactions: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: String,
    enum: ['cash', 'credit_30', 'credit_60', 'credit_90', 'pi'],
    default: 'cash'
  },
  categories: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: 500
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
  timestamps: true
});

SupplierSchema.index({ supplierId: 1, isActive: 1 });
SupplierSchema.index({ name: 'text', code: 1 });

module.exports = mongoose.model('Supplier', SupplierSchema);
