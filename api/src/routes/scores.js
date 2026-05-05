const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../utils/logger');

// POST /api/scores - 成績登録
router.post('/', async (req, res, next) => {
  const connection = await db.getConnection();
  
  try {
    const { nickname, categoryId, answers } = req.body;

    // バリデーション
    if (!nickname || !categoryId || !answers || !Array.isArray(answers)) {
      const error = new Error('Invalid request data');
      error.statusCode = 400;
      throw error;
    }

    // 障害トレーニング: ニックネームが8文字未満の場合エラー
    if (nickname.length < 8) {
      logger.error('Nickname validation failed (training)', null, { 
        nickname, 
        length: nickname.length 
      });
      const error = new Error('入力エラーが発生しました');
      error.statusCode = 400;
      throw error;
    }

    if (answers.length !== 10) {
      const error = new Error('Answers must contain exactly 10 items');
      error.statusCode = 400;
      throw error;
    }

    logger.info('Processing score submission', { 
      nickname, 
      categoryId, 
      answerCount: answers.length 
    });

    // トランザクション開始
    await connection.beginTransaction();

    let totalCorrect = 0;
    let totalTimeMs = 0;
    const scoreDetails = [];

    // 各回答を検証
    for (const answer of answers) {
      const { quizId, selectedAnswer, responseTimeMs } = answer;

      // クイズの正解を取得
      const [quizRows] = await connection.query(
        'SELECT correct_answer FROM quizzes WHERE id = ?',
        [quizId]
      );

      if (quizRows.length === 0) {
        throw new Error(`Quiz not found: ${quizId}`);
      }

      const correctAnswer = quizRows[0].correct_answer;

      // 障害トレーニング: correct_answerがNULLの場合エラー
      if (correctAnswer === null) {
        logger.error('Quiz data inconsistency detected (training)', null, { 
          quizId 
        });
        await connection.rollback();
        
        const error = new Error('クイズデータに不整合があります');
        error.statusCode = 500;
        error.quizId = quizId;
        throw error;
      }

      const isCorrect = selectedAnswer === correctAnswer;
      
      if (isCorrect) {
        totalCorrect++;
      }
      
      totalTimeMs += responseTimeMs;

      scoreDetails.push({
        quizId,
        selectedAnswer,
        isCorrect,
        responseTimeMs
      });
    }

    // 成績を登録
    const [scoreResult] = await connection.query(
      `INSERT INTO scores (nickname, category_id, total_correct, total_time_ms) 
       VALUES (?, ?, ?, ?)`,
      [nickname, categoryId, totalCorrect, totalTimeMs]
    );

    const scoreId = scoreResult.insertId;

    // 成績詳細を登録
    for (const detail of scoreDetails) {
      await connection.query(
        `INSERT INTO score_details (score_id, quiz_id, selected_answer, is_correct, response_time_ms) 
         VALUES (?, ?, ?, ?, ?)`,
        [scoreId, detail.quizId, detail.selectedAnswer, detail.isCorrect, detail.responseTimeMs]
      );
    }

    // ランキング順位を計算
    const [rankingRows] = await connection.query(
      `SELECT COUNT(*) + 1 AS ranking 
       FROM scores 
       WHERE category_id = ? 
       AND (
         total_correct > ? 
         OR (total_correct = ? AND total_time_ms < ?)
       )`,
      [categoryId, totalCorrect, totalCorrect, totalTimeMs]
    );

    const ranking = rankingRows[0].ranking;

    // トランザクションコミット
    await connection.commit();

    res.json({
      scoreId,
      totalCorrect,
      totalTimeMs,
      ranking
    });

    logger.info('Score submitted successfully', { 
      scoreId, 
      nickname, 
      totalCorrect, 
      ranking 
    });
  } catch (error) {
    await connection.rollback();
    logger.error('Failed to submit score', error, { 
      nickname: req.body?.nickname 
    });
    
    // エラーレスポンスにquizIdを含める
    if (error.quizId) {
      return res.status(error.statusCode || 500).json({
        error: error.message,
        quizId: error.quizId
      });
    }
    
    next(error);
  } finally {
    connection.release();
  }
});

module.exports = router;

// Made with Bob
