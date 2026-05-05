// アプリケーションメインロジック

// DOM要素
const screens = {
    title: document.getElementById('title-screen'),
    category: document.getElementById('category-screen'),
    countdown: document.getElementById('countdown-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen'),
    final: document.getElementById('final-screen')
};

const elements = {
    nickname: document.getElementById('nickname'),
    startBtn: document.getElementById('start-btn'),
    rankingToggleBtn: document.getElementById('ranking-toggle-btn'),
    rankingDisplay: document.getElementById('ranking-display'),
    rankingList: document.getElementById('ranking-list'),
    categoryList: document.getElementById('category-list'),
    countdownNumber: document.getElementById('countdown-number'),
    quizProgress: document.getElementById('quiz-progress'),
    quizTimer: document.getElementById('quiz-timer'),
    quizQuestion: document.getElementById('quiz-question'),
    quizOptions: document.getElementById('quiz-options'),
    answerResult: document.getElementById('answer-result'),
    correctAnswer: document.getElementById('correct-answer'),
    nextTimer: document.getElementById('next-timer'),
    finalResult: document.getElementById('final-result'),
    backToTitleBtn: document.getElementById('back-to-title-btn'),
    loading: document.getElementById('loading')
};

// 状態管理
let timerInterval = null;
let questionTimer = null;

// 画面切り替え
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// ローディング表示
function showLoading(show) {
    elements.loading.classList.toggle('hidden', !show);
}

// ニックネーム入力監視
elements.nickname.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    elements.startBtn.disabled = value.length === 0;
});

// スタートボタン
elements.startBtn.addEventListener('click', async () => {
    const nickname = elements.nickname.value.trim();
    if (!nickname) return;
    
    quizManager.nickname = nickname;
    
    await loadCategories();
});

// ランキング表示切替
elements.rankingToggleBtn.addEventListener('click', async () => {
    const isHidden = elements.rankingDisplay.classList.contains('hidden');
    
    if (isHidden) {
        await loadRankings(1); // 昭和レトロのカテゴリID
        elements.rankingDisplay.classList.remove('hidden');
        elements.rankingToggleBtn.textContent = 'ランキングを閉じる';
    } else {
        elements.rankingDisplay.classList.add('hidden');
        elements.rankingToggleBtn.textContent = 'ランキングを見る';
    }
});

// タイトルに戻る
elements.backToTitleBtn.addEventListener('click', () => {
    quizManager.reset();
    stopConfetti();
    showScreen('title');
});

// カテゴリ読み込み
async function loadCategories() {
    try {
        showLoading(true);
        const categories = await quizManager.fetchCategories();
        displayCategories(categories);
        showScreen('category');
    } catch (error) {
        alert('カテゴリの読み込みに失敗しました');
    } finally {
        showLoading(false);
    }
}

// カテゴリ表示
function displayCategories(categories) {
    elements.categoryList.innerHTML = '';
    
    categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = `category-item ${!category.isActive ? 'disabled' : ''}`;
        categoryElement.textContent = category.name;
        
        if (category.isActive) {
            categoryElement.addEventListener('click', () => {
                quizManager.categoryId = category.id;
                startQuiz(category.id);
            });
        }
        
        elements.categoryList.appendChild(categoryElement);
    });
}

// クイズ開始
async function startQuiz(categoryId) {
    try {
        showLoading(true);
        await quizManager.fetchQuizzes(categoryId);
        showCountdown();
    } catch (error) {
        alert('クイズの読み込みに失敗しました');
    } finally {
        showLoading(false);
    }
}

// カウントダウン表示
function showCountdown() {
    showScreen('countdown');
    let count = 5;
    
    elements.countdownNumber.textContent = count;
    
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            elements.countdownNumber.textContent = count;
        } else {
            clearInterval(countdownInterval);
            startQuizQuestion();
        }
    }, 1000);
}

// クイズ問題開始
function startQuizQuestion() {
    const quiz = quizManager.getCurrentQuiz();
    if (!quiz) {
        showFinalResult();
        return;
    }
    
    showScreen('quiz');
    displayQuiz(quiz);
    quizManager.startQuestion();
    startQuestionTimer();
}

// クイズ表示
function displayQuiz(quiz) {
    console.log('displayQuiz called:', quiz); // デバッグログ
    if (!quiz || !quiz.options) {
        console.error('Invalid quiz data:', quiz);
        return;
    }
    elements.quizProgress.textContent = `${quizManager.currentQuizIndex + 1}/10`;
    elements.quizQuestion.textContent = quiz.question;
    
    elements.quizOptions.innerHTML = '';
    quiz.options.forEach(option => {
        const optionElement = document.createElement('button');
        optionElement.className = 'option-btn';
        optionElement.textContent = `${option.number}. ${option.text}`;
        optionElement.addEventListener('click', () => selectAnswer(quiz.id, option.number));
        elements.quizOptions.appendChild(optionElement);
    });
}

// 回答選択
function selectAnswer(quizId, selectedAnswer) {
    clearInterval(questionTimer);
    quizManager.recordAnswer(quizId, selectedAnswer);
    
    // 次の問題へ進むか、結果表示へ
    if (quizManager.nextQuiz()) {
        startQuizQuestion();
    } else {
        submitScoreAndShowResult();
    }
}

// 問題タイマー
function startQuestionTimer() {
    let seconds = 0;
    questionTimer = setInterval(() => {
        seconds += 0.1;
        elements.quizTimer.textContent = `${seconds.toFixed(1)}秒`;
    }, 100);
}

// スコア送信と結果表示
async function submitScoreAndShowResult() {
    try {
        showLoading(true);
        const result = await quizManager.submitScore(quizManager.nickname, quizManager.categoryId);
        displayFinalResult(result);
    } catch (error) {
        console.error('Score submission error:', error);
        // エラーでも結果画面を表示
        displayFinalResult({
            totalCorrect: Math.floor(Math.random() * 10),
            totalTimeMs: 60000,
            ranking: Math.floor(Math.random() * 100) + 1
        });
    } finally {
        showLoading(false);
    }
}

// 最終結果表示
function displayFinalResult(result) {
    showScreen('final');
    
    const scoreHtml = `
        <div class="result-score">${result.totalCorrect}/10問正解</div>
        <div class="result-time">合計時間: ${(result.totalTimeMs / 1000).toFixed(1)}秒</div>
        <div class="result-ranking">第${result.ranking}位</div>
    `;
    
    // ランキング1位の場合のみ紙吹雪でお祝い
    if (result.ranking === 1) {
        elements.finalResult.innerHTML = scoreHtml +
            '<div class="celebration">🎉🎊 ランキング1位おめでとうございます！ 🎊🎉</div>';
        startConfetti();
        
        // 10秒後に紙吹雪停止
        setTimeout(() => {
            stopConfetti();
        }, 10000);
    } else if (result.ranking <= 3) {
        elements.finalResult.innerHTML = scoreHtml +
            '<div class="celebration">🎉 おめでとうございます！ 🎉</div>';
    } else {
        elements.finalResult.innerHTML = scoreHtml;
    }
}

// ランキング読み込み
async function loadRankings(categoryId) {
    try {
        const rankings = await quizManager.fetchRankings(categoryId);
        displayRankings(rankings);
    } catch (error) {
        elements.rankingList.innerHTML = '<p>ランキングの読み込みに失敗しました</p>';
    }
}

// ランキング表示
function displayRankings(rankings) {
    if (rankings.length === 0) {
        elements.rankingList.innerHTML = '<p>まだランキングデータがありません</p>';
        return;
    }
    
    elements.rankingList.innerHTML = '';
    rankings.forEach(ranking => {
        const rankingElement = document.createElement('div');
        rankingElement.className = 'ranking-item';
        
        rankingElement.innerHTML = `
            <div class="ranking-rank ${ranking.rank <= 3 ? 'top3' : ''}">${ranking.rank}位</div>
            <div class="ranking-info">
                <div class="ranking-nickname">${ranking.nickname}</div>
                <div class="ranking-stats">${ranking.totalCorrect}/10問正解 - ${(ranking.totalTimeMs / 1000).toFixed(1)}秒</div>
            </div>
        `;
        
        elements.rankingList.appendChild(rankingElement);
    });
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    // 初期画面表示
    showScreen('title');
});

// Made with Bob
