// シンプルなロガーユーティリティ
// Datadog APMのログインジェクションと連携

const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },

  error: (message, error = null, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },

  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify({
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        ...meta
      }));
    }
  }
};

module.exports = logger;

// Made with Bob
