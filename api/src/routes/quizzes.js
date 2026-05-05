const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../utils/logger');
const randomSlowdown = require('../middleware/slowdown');

// GET /api/quizzes/:categoryId - 指定カテゴリからランダムに10問取得
router.get('/:categoryId', randomSlowdown, async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    
    logger.info('Fetching quizzes', { categoryId });

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

    // ランダムに10問取得
    const [quizzes] = await db.query(
      `SELECT id, question 
       FROM quizzes 
       WHERE category_id = ? 
       ORDER BY RAND() 
       LIMIT 10`,
      [categoryId]
    );

    // 各クイズの選択肢を取得
    const quizzesWithOptions = await Promise.all(
      quizzes.map(async (quiz) => {
        const [options] = await db.query(
          `SELECT option_number AS number, option_text AS text 
           FROM quiz_options 
           WHERE quiz_id = ? 
           ORDER BY option_number`,
          [quiz.id]
        );

        return {
          id: quiz.id,
          question: quiz.question,
          options: options
        };
      })
    );

    res.json({
      quizzes: quizzesWithOptions
    });

    logger.info('Quizzes fetched successfully', { 
      categoryId, 
      count: quizzesWithOptions.length 
    });
  } catch (error) {
    logger.error('Failed to fetch quizzes', error, { 
      categoryId: req.params.categoryId 
    });
    next(error);
  }
});

module.exports = router;

// Made with Bob
