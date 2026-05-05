-- フラッシュクイズ データベーススキーマ
-- 文字コード: UTF-8

-- データベースの作成（docker-compose.ymlで自動作成されるため、コメントアウト）
-- CREATE DATABASE IF NOT EXISTS flash_quiz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE flash_quiz;

-- クイズカテゴリテーブル
CREATE TABLE IF NOT EXISTS quiz_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT 'カテゴリ名',
    is_active BOOLEAN NOT NULL DEFAULT FALSE COMMENT '選択可能フラグ',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='クイズカテゴリ';

-- クイズ設問テーブル
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL COMMENT 'カテゴリID',
    question TEXT NOT NULL COMMENT '設問文',
    correct_answer INT NULL COMMENT '正解番号（1-4）※障害トレーニング用に5%はNULL',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    FOREIGN KEY (category_id) REFERENCES quiz_categories(id) ON DELETE CASCADE,
    INDEX idx_category_id (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='クイズ設問';

-- 回答選択肢テーブル
CREATE TABLE IF NOT EXISTS quiz_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL COMMENT 'クイズID',
    option_number INT NOT NULL COMMENT '選択肢番号（1-4）',
    option_text VARCHAR(200) NOT NULL COMMENT '選択肢テキスト',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_quiz_id (quiz_id),
    UNIQUE KEY uk_quiz_option (quiz_id, option_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回答選択肢';

-- 成績テーブル
CREATE TABLE IF NOT EXISTS scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nickname VARCHAR(50) NOT NULL COMMENT 'ニックネーム',
    category_id INT NOT NULL COMMENT 'カテゴリID',
    total_correct INT NOT NULL COMMENT '正解数',
    total_time_ms INT NOT NULL COMMENT '合計回答時間（ミリ秒）',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    FOREIGN KEY (category_id) REFERENCES quiz_categories(id) ON DELETE CASCADE,
    INDEX idx_created_at (created_at DESC),
    INDEX idx_category_ranking (category_id, total_correct DESC, total_time_ms ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成績';

-- 成績詳細テーブル
CREATE TABLE IF NOT EXISTS score_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    score_id INT NOT NULL COMMENT '成績ID',
    quiz_id INT NOT NULL COMMENT 'クイズID',
    selected_answer INT NOT NULL COMMENT '選択した回答番号',
    is_correct BOOLEAN NOT NULL COMMENT '正誤フラグ',
    response_time_ms INT NOT NULL COMMENT '回答時間（ミリ秒）',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    FOREIGN KEY (score_id) REFERENCES scores(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_score_id (score_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成績詳細';

-- Made with Bob
