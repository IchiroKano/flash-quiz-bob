// クイズ管理クラス
class QuizManager {
    constructor() {
        this.apiBase = '/flashquiz_bob/api';
        this.currentQuizzes = [];
        this.currentQuizIndex = 0;
        this.answers = [];
        this.startTime = null;
        this.questionStartTime = null;
        this.nickname = '';
        this.categoryId = null;
    }

    // カテゴリ一覧取得
    async fetchCategories() {
        try {
            const response = await fetch(`${this.apiBase}/categories`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            return data.categories;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    }

    // クイズ取得
    async fetchQuizzes(categoryId) {
        try {
            const response = await fetch(`${this.apiBase}/quizzes/${categoryId}`);
            if (!response.ok) throw new Error('Failed to fetch quizzes');
            const data = await response.json();
            this.currentQuizzes = data.quizzes;
            this.currentQuizIndex = 0;
            this.answers = [];
            return this.currentQuizzes;
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            throw error;
        }
    }

    // 現在のクイズを取得
    getCurrentQuiz() {
        return this.currentQuizzes[this.currentQuizIndex];
    }

    // 回答を記録
    recordAnswer(quizId, selectedAnswer) {
        const responseTime = Date.now() - this.questionStartTime;
        this.answers.push({
            quizId,
            selectedAnswer,
            responseTimeMs: responseTime
        });
    }

    // 次のクイズへ
    nextQuiz() {
        this.currentQuizIndex++;
        return this.currentQuizIndex < this.currentQuizzes.length;
    }

    // クイズ完了チェック
    isQuizComplete() {
        return this.currentQuizIndex >= this.currentQuizzes.length;
    }

    // スコア送信
    async submitScore(nickname, categoryId) {
        try {
            const response = await fetch(`${this.apiBase}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nickname,
                    categoryId,
                    answers: this.answers
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit score');
            }

            const data = await response.json();
            
            return data;
        } catch (error) {
            console.error('Error submitting score:', error);
            throw error;
        }
    }

    // ランキング取得
    async fetchRankings(categoryId) {
        try {
            const response = await fetch(`${this.apiBase}/rankings/${categoryId}`);
            if (!response.ok) throw new Error('Failed to fetch rankings');
            const data = await response.json();
            return data.rankings;
        } catch (error) {
            console.error('Error fetching rankings:', error);
            throw error;
        }
    }

    // 問題開始時刻を記録
    startQuestion() {
        this.questionStartTime = Date.now();
    }

    // リセット
    reset() {
        this.currentQuizzes = [];
        this.currentQuizIndex = 0;
        this.answers = [];
        this.startTime = null;
        this.questionStartTime = null;
        this.nickname = '';
        this.categoryId = null;
    }
}

// グローバルインスタンス
const quizManager = new QuizManager();

// Made with Bob
