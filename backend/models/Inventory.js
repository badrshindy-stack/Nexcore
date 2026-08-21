const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  itemId: {
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
  category: {
    type: String,
    enum: ['medicine', 'supply', 'equipment', 'surgical', 'lab', 'radiology', 'office', 'other'],
    default: 'other'
  },
  subCategory: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  barcode: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  minThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  maxThreshold: {
    type: Number,
    default: 100,
    min: 0
  },
  unit: {
    type: String,
    enum: ['piece', 'box', 'bottle', 'pack', 'vial', 'strip', 'tablet', 'capsule', 'ampule', 'other'],
    default: 'piece'
  },
  unitPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  sellingPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  location: {
    shelf: { type: String, trim: true },
    row: { type: String, trim: true },
    zone: { type: String, trim: true }
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  storageConditions: {
    temperature: { type: String, trim: true },
    humidity: { type: String, trim: true },
    light: { type: String, trim: true }
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
InventorySchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minThreshold && this.quantity > 0;
});

InventorySchema.virtual('isOutOfStock').get(function() {
  return this.quantity === 0;
});

InventorySchema.virtual('isExpired').get(function() {
  return this.expiryDate && new Date() > this.expiryDate;
});

// Indexes
InventorySchema.index({ itemId: 1, isActive: 1 });
InventorySchema.index({ code: 1 });
InventorySchema.index({ name: 'text', description: 'text' });
InventorySchema.index({ category: 1, isActive: 1 });
InventorySchema.index({ supplier: 1 });
InventorySchema.index({ expiryDate: 1 });

// Middleware
InventorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Inventory', InventorySchema);
