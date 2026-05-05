const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../utils/logger');

// GET /api/categories - カテゴリ一覧取得
router.get('/', async (req, res, next) => {
  try {
    logger.info('Fetching categories');

    const [rows] = await db.query(
      'SELECT id, name, is_active AS isActive FROM quiz_categories ORDER BY id'
    );

    res.json({
      categories: rows
    });

    logger.info('Categories fetched successfully', { count: rows.length });
  } catch (error) {
    logger.error('Failed to fetch categories', error);
    next(error);
  }
});

module.exports = router;

// Made with Bob
