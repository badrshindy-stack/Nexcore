const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');
const helmet = require('helmet');
const fs = require('fs');

// =============================================
// 1. تحميل المتغيرات البيئية
// =============================================
dotenv.config();

// التحقق من وجود المتغيرات الأساسية
const requiredEnvVars = ['PORT', 'MONGODB_URI', 'SESSION_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ المتغيرات البيئية التالية مفقودة:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('⚠️ يرجى إضافتها في ملف .env');
  process.exit(1);
}

// =============================================
// 2. إنشاء المجلدات المطلوبة
// =============================================
const directories = [
  process.env.STORAGE_PATH || './uploads',
  process.env.REPORT_PATH || './reports',
  './logs'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 تم إنشاء المجلد: ${dir}`);
  }
});

// =============================================
// 3. إعداد التطبيق
// =============================================
const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// 4. Middleware
// =============================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// تسجيل الطلبات
app.use(morgan('combined', {
  stream: fs.createWriteStream('./logs/access.log', { flags: 'a' })
}));

app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '5mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '5mb' }));

// =============================================
// 5. الملفات الثابتة
// =============================================
app.use('/uploads', express.static(path.join(__dirname, process.env.STORAGE_PATH || 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// =============================================
// 6. إعداد الجلسات
// =============================================
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24 // 24 ساعة
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  },
  name: 'nexcore.sid'
}));

// =============================================
// 7. الاتصال بقاعدة البيانات
// =============================================
console.log('📡 جاري الاتصال بقاعدة البيانات...');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ متصل بقاعدة البيانات بنجاح');
  console.log(`📊 اسم قاعدة البيانات: ${mongoose.connection.name}`);
  console.log(`📊 المضيف: ${mongoose.connection.host}`);
})
.catch(err => {
  console.error('❌ فشل الاتصال بقاعدة البيانات:');
  console.error(`   ${err.message}`);
  console.log('⚠️ تأكد من تشغيل MongoDB');
  console.log('💡 للتشغيل: mongod --dbpath ./data');
  process.exit(1);
});

// مراقبة حالة الاتصال
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ انقطع الاتصال بقاعدة البيانات، جاري إعادة المحاولة...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ تم إعادة الاتصال بقاعدة البيانات');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ خطأ في قاعدة البيانات:', err.message);
});

// =============================================
// 8. استيراد النماذج
// =============================================
console.log('📦 جاري تحميل النماذج...');

try {
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
  const Supplier = require('./backend/models/Supplier');
  const Purchase = require('./backend/models/Purchase');
  const Settings = require('./backend/models/Settings');
  const LabTest = require('./backend/models/LabTest');
  const Radiology = require('./backend/models/Radiology');
  const Surgery = require('./backend/models/Surgery');
  const Emergency = require('./backend/models/Emergency');
  console.log('✅ تم تحميل جميع النماذج بنجاح');
} catch (error) {
  console.error('❌ خطأ في تحميل النماذج:', error.message);
  process.exit(1);
}

// =============================================
// 9. استيراد المسارات (جميع المسارات)
// =============================================
console.log('🛣️ جاري تحميل المسارات...');

try {
  // ===== مسارات المصادقة والمستخدمين =====
  app.use('/api/auth', require('./backend/routes/auth'));
  app.use('/api/users', require('./backend/routes/users'));
  
  // ===== مسارات الإدارة الأساسية =====
  app.use('/api/departments', require('./backend/routes/departments'));
  app.use('/api/employees', require('./backend/routes/employees'));
  app.use('/api/doctors', require('./backend/routes/doctors'));
  app.use('/api/patients', require('./backend/routes/patients'));
  
  // ===== مسارات المواعيد والخدمات الطبية =====
  app.use('/api/appointments', require('./backend/routes/appointments'));
  app.use('/api/medical-records', require('./backend/routes/medicalRecords'));
  app.use('/api/beds', require('./backend/routes/beds'));
  
  // ===== مسارات المخزون والمشتريات =====
  app.use('/api/inventory', require('./backend/routes/inventory'));
  app.use('/api/suppliers', require('./backend/routes/suppliers'));
  app.use('/api/purchases', require('./backend/routes/purchases'));
  app.use('/api/medications', require('./backend/routes/medications'));
  
  // ===== مسارات المالية والمدفوعات =====
  app.use('/api/invoices', require('./backend/routes/invoices'));
  app.use('/api/payments', require('./backend/routes/payments'));
  
  // ===== مسارات المختبر والأشعة =====
  app.use('/api/lab', require('./backend/routes/lab'));
  app.use('/api/radiology', require('./backend/routes/radiology'));
  
  // ===== مسارات العمليات والطوارئ =====
  app.use('/api/surgery', require('./backend/routes/surgery'));
  app.use('/api/emergency', require('./backend/routes/emergency'));
  
  // ===== مسارات التقارير والإعدادات =====
  app.use('/api/reports', require('./backend/routes/reports'));
  app.use('/api/settings', require('./backend/routes/settings'));
  
  console.log('✅ تم تحميل جميع المسارات بنجاح');
} catch (error) {
  console.error('❌ خطأ في تحميل المسارات:', error.message);
  process.exit(1);
}

// =============================================
// 10. مسار الحالة الصحية
// =============================================
app.get('/api/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: process.memoryUsage().heapUsed / 1024 / 1024,
      total: process.memoryUsage().heapTotal / 1024 / 1024,
      unit: 'MB'
    },
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: mongoose.connection.name || 'unknown',
      host: mongoose.connection.host || 'unknown'
    },
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    routes: {
      total: 17,
      list: [
        '/api/auth',
        '/api/users',
        '/api/departments',
        '/api/employees',
        '/api/doctors',
        '/api/patients',
        '/api/appointments',
        '/api/medical-records',
        '/api/beds',
        '/api/inventory',
        '/api/suppliers',
        '/api/purchases',
        '/api/medications',
        '/api/invoices',
        '/api/payments',
        '/api/lab',
        '/api/radiology',
        '/api/surgery',
        '/api/emergency',
        '/api/reports',
        '/api/settings'
      ]
    }
  };

  res.json({
    success: true,
    data: health
  });
});

// =============================================
// 11. مسار اختبار Pi SDK
// =============================================
app.get('/api/pi/config', (req, res) => {
  res.json({
    success: true,
    data: {
      sandbox: process.env.PI_SANDBOX === 'true',
      apiKey: process.env.PI_API_KEY ? 'configured' : 'not configured',
      clientId: process.env.PI_CLIENT_ID ? 'configured' : 'not configured'
    }
  });
});

// =============================================
// 12. مسار الصفحة الرئيسية
// =============================================
app.get('*', (req, res) => {
  // التحقق من وجود index.html
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      success: false,
      message: 'الصفحة غير موجودة'
    });
  }
});

// =============================================
// 13. معالجة الأخطاء العالمية
// =============================================
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'حدث خطأ في الخادم';

  console.error('❌ خطأ:', {
    status,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // تسجيل الخطأ في ملف
  const logPath = './logs/errors.log';
  const logEntry = `[${new Date().toISOString()}] ${status} - ${message} - ${req.url}\n`;
  fs.appendFileSync(logPath, logEntry);

  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'حدث خطأ في الخادم' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// =============================================
// 14. مسار غير موجود
// =============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود'
  });
});

// =============================================
// 15. تشغيل الخادم
// =============================================
const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 NEXCORE SERVER');
  console.log('='.repeat(70));
  console.log(`📡 الخادم يعمل على: http://localhost:${PORT}`);
  console.log(`📋 البيئة: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 مسار الباك إند: ${path.join(__dirname, 'backend')}`);
  console.log(`📁 مسار العامة: ${path.join(__dirname, 'public')}`);
  console.log(`📊 قاعدة البيانات: ${mongoose.connection.name || 'جاري الاتصال...'}`);
  console.log(`🕐 الوقت: ${new Date().toLocaleString('ar-EG')}`);
  console.log('='.repeat(70));
  console.log('✅ الخادم جاهز لاستقبال الطلبات');
  console.log('📋 المسارات المتاحة:');
  console.log('   🔐 /api/auth          - المصادقة');
  console.log('   👤 /api/users         - المستخدمين');
  console.log('   🏢 /api/departments   - الأقسام');
  console.log('   👨‍⚕️ /api/employees    - الموظفين');
  console.log('   🩺 /api/doctors       - الأطباء');
  console.log('   🏥 /api/patients      - المرضى');
  console.log('   📅 /api/appointments  - المواعيد');
  console.log('   📋 /api/medical-records - السجلات الطبية');
  console.log('   🛏️ /api/beds          - الأسرة');
  console.log('   📦 /api/inventory     - المخزون');
  console.log('   🤝 /api/suppliers     - الموردين');
  console.log('   🛒 /api/purchases     - المشتريات');
  console.log('   💊 /api/medications   - الأدوية');
  console.log('   💰 /api/invoices      - الفواتير');
  console.log('   💳 /api/payments      - المدفوعات');
  console.log('   🔬 /api/lab           - المختبر');
  console.log('   📷 /api/radiology     - الأشعة');
  console.log('   🔪 /api/surgery       - العمليات');
  console.log('   🚨 /api/emergency     - الطوارئ');
  console.log('   📊 /api/reports       - التقارير');
  console.log('   ⚙️ /api/settings      - الإعدادات');
  console.log('='.repeat(70) + '\n');
});

// =============================================
// 16. إيقاف التشغيل بشكل آمن
// =============================================
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 استلام إشارة ${signal}، جاري الإيقاف الآمن...`);

  server.close(() => {
    console.log('✅ تم إغلاق الخادم');

    mongoose.connection.close(false, () => {
      console.log('✅ تم إغلاق اتصال قاعدة البيانات');
      console.log('👋 تم إيقاف Nexcore بنجاح');
      process.exit(0);
    });
  });

  // في حالة عدم الاستجابة خلال 10 ثوانٍ
  setTimeout(() => {
    console.error('⚠️ لم يتم الإيقاف خلال 10 ثوانٍ، إيقاف قسري');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// التعامل مع الاستثناءات غير المعالجة
process.on('uncaughtException', (err) => {
  console.error('❌ استثناء غير معالج:', err);
  const logPath = './logs/crashes.log';
  const logEntry = `[${new Date().toISOString()}] ${err.stack}\n`;
  fs.appendFileSync(logPath, logEntry);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ رفض غير معالج:', reason);
  const logPath = './logs/crashes.log';
  const logEntry = `[${new Date().toISOString()}] REJECTION: ${reason}\n`;
  fs.appendFileSync(logPath, logEntry);
});

module.exports = app;
