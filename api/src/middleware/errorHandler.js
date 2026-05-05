const logger = require('../utils/logger');

// グローバルエラーハンドラー
const errorHandler = (err, req, res, next) => {
  // エラーログ出力
  logger.error('API Error', err, {
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body
  });

  // エラーレスポンス
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404ハンドラー
const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method
  });

  res.status(404).json({
    error: 'Route not found'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};

// Made with Bob
