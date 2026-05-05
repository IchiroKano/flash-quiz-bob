const logger = require('../utils/logger');

// 障害トレーニング: 5%の確率で2秒以上の遅延を発生させる
const randomSlowdown = async (req, res, next) => {
  // 5%の確率で遅延を発生
  if (Math.random() < 0.05) {
    const delay = 2000 + Math.random() * 1000; // 2-3秒の遅延
    logger.warn('Simulated slowdown triggered', {
      path: req.path,
      delay: `${delay}ms`,
      type: 'training'
    });
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  next();
};

module.exports = randomSlowdown;

// Made with Bob
