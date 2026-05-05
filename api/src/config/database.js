const mysql = require('mysql2/promise');

// データベース接続プール設定
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'quiz_user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'flash_quiz',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // タイムゾーン設定
  timezone: '+09:00',
  // 文字コード設定
  charset: 'utf8mb4'
});

// 接続テスト
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = pool;

// Made with Bob
