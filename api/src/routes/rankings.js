const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../utils/logger');

// GET /api/rankings/:categoryId - ランキングTop10取得
router.get('/:categoryId', async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    
    logger.info('Fetching rankings', { categoryId });

    // カテゴリの存在確認
    const [categories] = await db.query(
      'SELECT id FROM quiz_categories WHERE id = ?',
      [categoryId]
    );

    if (categories.length === 0) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    // ランキング取得（正解数降順、回答時間昇順、登録日時昇順）
    const [rankings] = await db.query(
      `SELECT 
        nickname,
        total_correct AS totalCorrect,
        total_time_ms AS totalTimeMs,
        created_at AS createdAt,
        ROW_NUMBER() OVER (
          ORDER BY total_correct DESC, total_time_ms ASC, created_at ASC
        ) AS rank
       FROM scores 
       WHERE category_id = ? 
       ORDER BY total_correct DESC, total_time_ms ASC, created_at ASC
       LIMIT 10`,
      [categoryId]
    );

    res.json({
      rankings: rankings
    });

    logger.info('Rankings fetched successfully', { 
      categoryId, 
      count: rankings.length 
    });
  } catch (error) {
    logger.error('Failed to fetch rankings', error, { 
      categoryId: req.params.categoryId 
    });
    next(error);
  }
});

module.exports = router;

// Made with Bob
