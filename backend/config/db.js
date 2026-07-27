const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ متصل بـ MongoDB بنجاح');
        return mongoose.connection;
    } catch (error) {
        console.error('❌ خطأ في الاتصال بـ MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
