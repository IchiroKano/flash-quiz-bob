// Datadog APMを最初にインポート（必須）
require('./config/datadog');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// ルートのインポート
const categoriesRouter = require('./routes/categories');
const quizzesRouter = require('./routes/quizzes');
const scoresRouter = require('./routes/scores');
const rankingsRouter = require('./routes/rankings');

const app = express();
const PORT = process.env.API_PORT || 3012;

// ミドルウェア設定
app.use(helmet()); // セキュリティヘッダー
app.use(compression()); // gzip圧縮
app.use(cors()); // CORS有効化
app.use(express.json()); // JSONパース
app.use(express.urlencoded({ extended: true }));

// レート制限（DDoS対策）
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// ヘルスチェックエンドポイント
app.get('/api/health', async (req, res) => {
  const db = require('./config/database');
  
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// APIルート
app.use('/api/categories', categoriesRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/rankings', rankingsRouter);

// 404ハンドラー
app.use(notFoundHandler);

// エラーハンドラー
app.use(errorHandler);

// サーバー起動
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Flash Quiz API Server started`, {
    port: PORT,
    env: process.env.NODE_ENV || 'production',
    datadogEnabled: true
  });
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Made with Bob
