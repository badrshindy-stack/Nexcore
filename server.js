const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');
const helmet = require('helmet');

// تحميل المتغيرات البيئية
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// 1. Middleware
// =============================================
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// =============================================
// 2. ملفات ثابتة
// =============================================
app.use(express.static(path.join(__dirname, 'public')));

// =============================================
// 3. Session Configuration
// =============================================
app.use(session({
  secret: process.env.SESSION_SECRET || 'nexcore-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexcore',
    collectionName: 'sessions',
    ttl: 60 * 60 * 24
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// =============================================
// 4. الاتصال بقاعدة البيانات
// =============================================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexcore', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ متصل بقاعدة البيانات بنجاح');
  console.log(`📊 قاعدة البيانات: ${mongoose.connection.name}`);
})
.catch(err => {
  console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
  process.exit(1);
});

// مراقبة حالة الاتصال
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ انقطع الاتصال بقاعدة البيانات، جاري إعادة المحاولة...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ خطأ في قاعدة البيانات:', err);
});

// =============================================
// 5. استيراد النماذج - مسارات معدلة
// =============================================
const User = require('./backend/models/User');
const Department = require('./backend/models/Department');
const Employee = require('./backend/models/Employee');
const Doctor = require('./backend/models/Doctor');
const Patient = require('./backend/models/Patient');
const Appointment = require('./backend/models/Appointment');
const Inventory = require('./backend/models/Inventory');
const Invoice = require('./backend/models/Invoice');
const MedicalRecord = require('./backend/models/MedicalRecord');
const Bed = require('./backend/models/Bed');
const Medication = require('./backend/models/Medication');

// =============================================
// 6. استيراد المسارات - مسارات معدلة
// =============================================
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/users', require('./backend/routes/users'));
app.use('/api/departments', require('./backend/routes/departments'));
app.use('/api/employees', require('./backend/routes/employees'));
app.use('/api/doctors', require('./backend/routes/doctors'));
app.use('/api/patients', require('./backend/routes/patients'));
app.use('/api/appointments', require('./backend/routes/appointments'));
app.use('/api/inventory', require('./backend/routes/inventory'));
app.use('/api/invoices', require('./backend/routes/invoices'));
app.use('/api/medical-records', require('./backend/routes/medicalRecords'));
app.use('/api/beds', require('./backend/routes/beds'));
app.use('/api/medications', require('./backend/routes/medications'));
app.use('/api/payments', require('./backend/routes/payments'));
app.use('/api/reports', require('./backend/routes/reports'));
app.use('/api/settings', require('./backend/routes/settings'));

// =============================================
// 7. مسار الحالة الصحية
// =============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// =============================================
// 8. مسار الصفحة الرئيسية
// =============================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================================
// 9. معالجة الأخطاء
// =============================================
app.use((err, req, res, next) => {
  console.error('❌ خطأ في الخادم:', err.stack);
  
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'حدث خطأ في الخادم' 
    : err.message;
  
  res.status(status).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// =============================================
// 10. تشغيل الخادم
// =============================================
const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 Nexcore Server يعمل على http://localhost:${PORT}`);
  console.log(`📋 البيئة: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 مسار الباك إند: ${path.join(__dirname, 'backend')}`);
  console.log(`📁 مسار العامة: ${path.join(__dirname, 'public')}`);
  console.log(`🕐 الوقت: ${new Date().toLocaleString('ar-EG')}`);
  console.log('='.repeat(60));
});

// =============================================
// 11. إيقاف التشغيل بشكل آمن
// =============================================
process.on('SIGTERM', () => {
  console.log('🛑 استلام إشارة SIGTERM، جاري الإيقاف الآمن...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('✅ تم إيقاف الخادم وقاعدة البيانات بنجاح');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🛑 استلام إشارة SIGINT، جاري الإيقاف الآمن...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('✅ تم إيقاف الخادم وقاعدة البيانات بنجاح');
      process.exit(0);
    });
  });
});

module.exports = app;
