const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

dotenv.config();

const app = express();

// =============================================
// 1. الإعدادات الأساسية
// =============================================
const PORT = process.env.PORT || 3000;

// =============================================
// 2. الاتصال بقاعدة البيانات
// =============================================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexcore', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ متصل بقاعدة البيانات'))
.catch(err => console.error('❌ خطأ في الاتصال:', err));

// =============================================
// 3. Middleware
// =============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'nexcore-secret-key',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexcore',
    collectionName: 'sessions'
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 ساعة
}));

// =============================================
// 4. نماذج البيانات
// =============================================

// نموذج المستخدم
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  piUserId: { type: String, required: true, unique: true },
  email: String,
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'finance', 'hr', 'inventory_manager', 'lab_tech', 'radiologist', 'viewer'],
    default: 'viewer'
  },
  department: { type: String, enum: ['management', 'medical', 'nursing', 'lab', 'radiology', 'surgery', 'emergency', 'finance', 'hr', 'inventory', 'it'] },
  fullName: String,
  phone: String,
  isActive: { type: Boolean, default: true },
  permissions: [String],
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

// نموذج القسم
const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['medical', 'administrative', 'support'], default: 'medical' },
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  floor: String,
  building: String,
  phone: String,
  email: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// نموذج الموظف
const EmployeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employeeId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  position: String,
  specialization: String,
  qualifications: [String],
  experience: Number,
  hireDate: { type: Date, default: Date.now },
  salary: Number,
  workSchedule: {
    days: [String],
    startTime: String,
    endTime: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  isActive: { type: Boolean, default: true }
});

// نموذج الطبيب
const DoctorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  specialization: { type: String, required: true },
  subSpecializations: [String],
  licenseNumber: String,
  clinic: String,
  consultationFee: Number,
  availableDays: [String],
  availableHours: {
    start: String,
    end: String
  },
  patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
  rating: { type: Number, min: 0, max: 5, default: 0 },
  isActive: { type: Boolean, default: true }
});

// نموذج المريض
const PatientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  phone: String,
  email: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  allergies: [String],
  chronicDiseases: [String],
  currentMedications: [String],
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    treatment: String,
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }
  }],
  insuranceProvider: String,
  insuranceNumber: String,
  primaryPhysician: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// نموذج الموعد
const AppointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  duration: { type: Number, default: 30 }, // بالدقائق
  type: { type: String, enum: ['consultation', 'followup', 'emergency', 'procedure', 'surgery'], default: 'consultation' },
  status: { type: String, enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'], default: 'scheduled' },
  notes: String,
  symptoms: [String],
  diagnosis: String,
  prescription: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String,
    notes: String
  }],
  followUpDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// نموذج المخزون
const InventorySchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['medicine', 'supply', 'equipment', 'surgical', 'lab', 'radiology', 'office'] },
  subCategory: String,
  code: { type: String, required: true, unique: true },
  barcode: String,
  description: String,
  quantity: { type: Number, default: 0, min: 0 },
  minThreshold: { type: Number, default: 10 },
  maxThreshold: { type: Number, default: 100 },
  unit: { type: String, enum: ['piece', 'box', 'bottle', 'pack', 'vial', 'strip', 'tablet', 'capsule', 'ampule', 'other'], default: 'piece' },
  unitPrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  location: {
    shelf: String,
    row: String,
    zone: String
  },
  expiryDate: Date,
  batchNumber: String,
  manufacturer: String,
  requiresPrescription: { type: Boolean, default: false },
  storageConditions: {
    temperature: String,
    humidity: String,
    light: String
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// نموذج المورد
const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  contactPerson: String,
  phone: String,
  email: String,
  address: {
    street: String,
    city: String,
    country: String
  },
  taxNumber: String,
  rating: { type: Number, min: 0, max: 5, default: 0 },
  paymentTerms: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// نموذج المشتريات
const PurchaseSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  items: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'ordered', 'received', 'cancelled'], default: 'pending' },
  orderDate: { type: Date, default: Date.now },
  expectedDelivery: Date,
  receivedDate: Date,
  paymentStatus: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  paymentMethod: { type: String, enum: ['pi', 'cash', 'bank', 'credit'], default: 'pi' },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// نموذج الفاتورة
const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number,
    type: { type: String, enum: ['consultation', 'procedure', 'lab', 'radiology', 'surgery', 'medicine', 'supply'] }
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
  paymentMethod: { type: String, enum: ['pi', 'cash', 'card', 'insurance'], default: 'pi' },
  piPaymentId: String,
  dueDate: Date,
  issuedDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String
});

// نموذج المختبر
const LabTestSchema = new mongoose.Schema({
  testId: { type: String, required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  testName: { type: String, required: true },
  category: { type: String, enum: ['blood', 'urine', 'imaging', 'microbiology', 'pathology', 'genetic'] },
  orderDate: { type: Date, default: Date.now },
  collectedDate: Date,
  collectedBy: String,
  results: [{
    parameter: String,
    value: String,
    unit: String,
    referenceRange: String,
    isAbnormal: { type: Boolean, default: false }
  }],
  interpretation: String,
  status: { type: String, enum: ['ordered', 'collected', 'processing', 'completed', 'cancelled'], default: 'ordered' },
  completedDate: Date,
  reportUrl: String,
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// نموذج الأشعة
const RadiologySchema = new mongoose.Schema({
  studyId: { type: String, required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  studyType: { type: String, enum: ['xray', 'ct', 'mri', 'ultrasound', 'mammography', 'fluoroscopy', 'pet'] },
  bodyPart: String,
  orderDate: { type: Date, default: Date.now },
  performedDate: Date,
  performedBy: String,
  images: [{
    url: String,
    description: String,
    label: String
  }],
  findings: String,
  impression: String,
  recommendation: String,
  status: { type: String, enum: ['ordered', 'performed', 'reviewed', 'completed', 'cancelled'], default: 'ordered' },
  reportUrl: String,
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// نموذج العمليات
const SurgerySchema = new mongoose.Schema({
  surgeryId: { type: String, required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  surgeon: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  anesthesiologist: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  surgicalTeam: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  surgeryName: { type: String, required: true },
  type: { type: String, enum: ['emergency', 'elective', 'urgent'] },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  scheduledDate: Date,
  startTime: Date,
  endTime: Date,
  operatingRoom: String,
  duration: Number, // بالدقائق
  status: { type: String, enum: ['scheduled', 'pre_op', 'in_progress', 'recovery', 'completed', 'cancelled', 'postponed'], default: 'scheduled' },
  preOpNotes: String,
  procedureNotes: String,
  postOpNotes: String,
  complications: [String],
  medications: [{
    name: String,
    dosage: String,
    timing: String
  }],
  instruments: [String],
  implants: [{
    name: String,
    serialNumber: String,
    manufacturer: String
  }],
  reportUrl: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// نموذج الطوارئ
const EmergencySchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patientName: String,
  triageLevel: { type: String, enum: ['critical', 'urgent', 'semi_urgent', 'non_urgent'], required: true },
  triageDate: { type: Date, default: Date.now },
  triageBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chiefComplaint: String,
  symptoms: [String],
  vitals: {
    heartRate: Number,
    bloodPressure: String,
    temperature: Number,
    respiratoryRate: Number,
    oxygenSaturation: Number,
    painScale: { type: Number, min: 0, max: 10 }
  },
  initialDiagnosis: String,
  treatment: String,
  admittingDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  status: { type: String, enum: ['waiting', 'under_treatment', 'admitted', 'discharged', 'transferred', 'deceased'], default: 'waiting' },
  dischargeDate: Date,
  dischargeNotes: String,
  referralHospital: String,
  referralReason: String,
  outcome: String,
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// =============================================
// 5. إنشاء النماذج
// =============================================
const User = mongoose.model('User', UserSchema);
const Department = mongoose.model('Department', DepartmentSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);
const Doctor = mongoose.model('Doctor', DoctorSchema);
const Patient = mongoose.model('Patient', PatientSchema);
const Appointment = mongoose.model('Appointment', AppointmentSchema);
const Inventory = mongoose.model('Inventory', InventorySchema);
const Supplier = mongoose.model('Supplier', SupplierSchema);
const Purchase = mongoose.model('Purchase', PurchaseSchema);
const Invoice = mongoose.model('Invoice', InvoiceSchema);
const LabTest = mongoose.model('LabTest', LabTestSchema);
const Radiology = mongoose.model('Radiology', RadiologySchema);
const Surgery = mongoose.model('Surgery', SurgerySchema);
const Emergency = mongoose.model('Emergency', EmergencySchema);

// =============================================
// 6. تصدير النماذج للاستخدام في المسارات
// =============================================
module.exports = {
  User, Department, Employee, Doctor, Patient, Appointment,
  Inventory, Supplier, Purchase, Invoice, LabTest,
  Radiology, Surgery, Emergency
};

// =============================================
// 7. المسارات (Routes)
// =============================================

// مسارات المستخدمين
app.use('/api/users', require('./routes/users'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/lab', require('./routes/lab'));
app.use('/api/radiology', require('./routes/radiology'));
app.use('/api/surgery', require('./routes/surgery'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/payments', require('./routes/payments'));

// =============================================
// 8. المسار الرئيسي
// =============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================================
// 9. تشغيل الخادم
// =============================================
app.listen(PORT, () => {
  console.log(`🚀 Nexcore يعمل على http://localhost:${PORT}`);
  console.log(`📋 بيئة: ${process.env.NODE_ENV || 'development'}`);
});
