const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
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
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  items: [{
    description: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    type: {
      type: String,
      enum: ['consultation', 'procedure', 'lab', 'radiology', 'surgery', 'medicine', 'supply', 'service'],
      default: 'service'
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    },
    code: String
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'overdue', 'refunded'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['pi', 'cash', 'card', 'insurance', 'bank_transfer', 'other'],
    default: 'pi'
  },
  piPaymentId: {
    type: String,
    trim: true
  },
  insuranceProvider: {
    type: String,
    trim: true
  },
  insuranceNumber: {
    type: String,
    trim: true
  },
  insuranceCoverage: {
    type: Number,
    default: 0,
    min: 0
  },
  dueDate: {
    type: Date
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  paidDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['draft', 'issued', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
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
InvoiceSchema.virtual('isFullyPaid').get(function() {
  return this.paymentStatus === 'paid';
});

InvoiceSchema.virtual('isOverdue').get(function() {
  return this.dueDate && new Date() > this.dueDate && this.paymentStatus !== 'paid';
});

InvoiceSchema.virtual('paymentProgress').get(function() {
  if (this.total === 0) return 0;
  return (this.paidAmount / this.total) * 100;
});

// Indexes
InvoiceSchema.index({ invoiceNumber: 1, isActive: 1 });
InvoiceSchema.index({ patient: 1, issuedDate: -1 });
InvoiceSchema.index({ paymentStatus: 1, dueDate: 1 });
InvoiceSchema.index({ issuedDate: -1 });

// Middleware
InvoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // حساب المجموع الكلي
  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  
  // حساب الخصم
  let discountAmount = 0;
  if (this.discountType === 'percentage') {
    discountAmount = (this.subtotal * this.discount) / 100;
  } else {
    discountAmount = this.discount;
  }
  
  // حساب الضريبة
  const taxAmount = (this.subtotal - discountAmount) * (this.taxRate / 100);
  
  this.total = this.subtotal - discountAmount + taxAmount;
  this.remainingAmount = this.total - this.paidAmount;
  
  // تحديث حالة الدفع
  if (this.remainingAmount <= 0) {
    this.paymentStatus = 'paid';
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'unpaid';
  }
  
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
