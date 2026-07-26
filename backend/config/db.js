const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.on('error', (err) => {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err);
});

module.exports = pool;
