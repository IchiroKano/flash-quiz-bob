// p5.jsを使った紙吹雪エフェクト

let confettiParticles = [];
let confettiActive = false;

function startConfetti() {
    confettiActive = true;
    confettiParticles = [];
    
    // 紙吹雪パーティクルを生成
    for (let i = 0; i < 150; i++) {
        confettiParticles.push(new ConfettiParticle());
    }
}

function stopConfetti() {
    confettiActive = false;
    confettiParticles = [];
}

class ConfettiParticle {
    constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = -20;
        this.size = Math.random() * 10 + 5;
        this.speedY = Math.random() * 3 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
        this.color = this.getRandomColor();
        this.opacity = 1;
    }
    
    getRandomColor() {
        const colors = [
            '#FF6B6B', '#FFD93D', '#6BCB77', 
            '#4D96FF', '#FF8C42', '#9B59B6',
            '#E74C3C', '#F39C12', '#27AE60'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        
        // 画面外に出たら上から再出現
        if (this.y > window.innerHeight + 20) {
            this.y = -20;
            this.x = Math.random() * window.innerWidth;
        }
        
        // 左右の端で跳ね返る
        if (this.x < 0 || this.x > window.innerWidth) {
            this.speedX *= -1;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

// Canvas描画ループ
function setupConfettiCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas-element';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    
    const container = document.getElementById('confetti-canvas');
    if (container) {
        container.innerHTML = '';
        container.appendChild(canvas);
    }
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const ctx = canvas.getContext('2d');
    
    function animate() {
        if (!confettiActive) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        confettiParticles.forEach(particle => {
            particle.update();
            particle.draw(ctx);
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // ウィンドウリサイズ対応
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// 初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupConfettiCanvas);
} else {
    setupConfettiCanvas();
}

// Made with Bob
