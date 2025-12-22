// Brick Breaker (Arkanoid) Game
class BrickBreakerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 800;
        this.height = 600;
        
        // Game managers
        this.audio = new AudioManager();
        this.input = new InputHandler();
        this.save = new SaveManager('arkanoid');
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'menu';
        this.easyMode = true; // No ball loss in easy mode
        
        // Paddle
        this.paddle = {
            x: this.width / 2 - 75,
            y: this.height - 40,
            width: 150, // Kid-friendly wider paddle
            height: 15,
            speed: 8,
            color: '#FF6B6B'
        };
        
        // Ball
        this.ball = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 8,
            dx: 0,
            dy: 0,
            speed: 5,
            baseSpeed: 5,
            color: '#FFD700',
            stuck: true
        };
        
        // Speed control
        this.speedMultiplier = 1.0;
        
        // Bricks
        this.bricks = [];
        this.brickRowCount = 5;
        this.brickColumnCount = 10;
        this.brickWidth = 75;
        this.brickHeight = 25;
        this.brickPadding = 5;
        this.brickOffsetTop = 60;
        this.brickOffsetLeft = 10;
        
        // Power-ups
        this.powerUps = [];
        this.activePowerUps = [];
        this.powerUpTypes = [
            { name: 'Wide Paddle', icon: '📏', color: '#4ECDC4', effect: 'widePaddle' },
            { name: 'Multi-Ball', icon: '⚽⚽', color: '#FFB6C1', effect: 'multiBall' },
            { name: 'Slow Ball', icon: '🐌', color: '#98D8C8', effect: 'slowBall' },
            { name: 'Extra Life', icon: '❤️', color: '#FF6B6B', effect: 'extraLife' },
            { name: 'Power Ball', icon: '💪', color: '#FFD700', effect: 'powerBall' }
        ];
        
        // Additional balls for multi-ball
        this.extraBalls = [];
        
        // Level themes
        this.themes = [
            { name: 'Candy Land', colors: ['#FF6B9D', '#FFC75F', '#C5A8FF', '#8BDFFF', '#FFB5E8'] },
            { name: 'Ocean', colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#ADE8F4'] },
            { name: 'Space', colors: ['#4A148C', '#6A1B9A', '#8E24AA', '#AB47BC', '#BA68C8'] },
            { name: 'Forest', colors: ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2'] },
            { name: 'Sunset', colors: ['#F94144', '#F3722C', '#F8961E', '#F9C74F', '#90BE6D'] }
        ];
        
        // Animation
        this.lastTime = 0;
        this.animationId = null;
        this.particles = [];
        
        // Mission Level System
        this.levelConfigs = [
            { name: 'Training Bricks', mission: 'Break all bricks to progress.', targetBricks: 50, timeBonus: 30, powerUpRate: 0.15 },
            { name: 'Candy Chaos', mission: 'Break 45 bricks before time runs out.', targetBricks: 45, timeBonus: 25, powerUpRate: 0.12 },
            { name: 'Crystal Storm', mission: 'Survive the hardened bricks!', targetBricks: 50, timeBonus: 20, powerUpRate: 0.08 },
            { name: 'Metal Madness', mission: 'Master the difficult brick patterns.', targetBricks: 55, timeBonus: 15, powerUpRate: 0.10 },
            { name: 'Eternal Battle', mission: 'Ultimate brick-breaking challenge!', targetBricks: 60, timeBonus: 10, powerUpRate: 0.12 }
        ];
        this.currentConfig = this.levelConfigs[0];
        this.bricksBroken = 0;
        this.levelIntroTime = 0;
        this.combo = 0;
        this.comboTimer = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadGame();
        this.createBricks();
        this.drawMenu();
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('backBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        document.getElementById('retryBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('menuBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('quitBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        
        // Speed control slider
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            speedValue.textContent = speed.toFixed(1) + 'x';
            this.updateGameSpeed(speed);
        });
        
        // Mouse/touch controls
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.gameState === 'playing') {
                const rect = this.canvas.getBoundingClientRect();
                this.paddle.x = e.clientX - rect.left - this.paddle.width / 2;
                this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, this.paddle.x));
            }
        });
        
        this.canvas.addEventListener('click', () => {
            if (this.ball.stuck && this.gameState === 'playing') {
                this.launchBall();
            }
        });
        
        // Keyboard controls
        this.input.on('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            switch(e.code) {
                case 'Space':
                case 'Enter':
                    e.preventDefault(); // Prevent page scroll
                    if (this.ball.stuck) {
                        this.launchBall();
                    }
                    break;
                case 'ArrowLeft':
                case 'ArrowRight':
                case 'ArrowUp':
                case 'ArrowDown':
                    e.preventDefault(); // Prevent page scroll
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
    }
    
    updateGameSpeed(speed) {
        this.speedMultiplier = speed;
        // Update ball speed if it's not stuck
        if (!this.ball.stuck) {
            const currentAngle = Math.atan2(this.ball.dy, this.ball.dx);
            this.ball.speed = this.ball.baseSpeed * this.speedMultiplier;
            this.ball.dx = this.ball.speed * Math.cos(currentAngle);
            this.ball.dy = this.ball.speed * Math.sin(currentAngle);
        }
    }
    
    createBricks() {
        this.bricks = [];
        const index = Math.min(this.level - 1, this.levelConfigs.length - 1);
        this.currentConfig = this.levelConfigs[index];
        this.bricksBroken = 0;
        this.levelIntroTime = 120; // ~2 seconds
        
        const theme = this.themes[(this.level - 1) % this.themes.length];
        
        for (let row = 0; row < this.brickRowCount; row++) {
            this.bricks[row] = [];
            for (let col = 0; col < this.brickColumnCount; col++) {
                const x = col * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
                const y = row * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;
                
                // Some bricks are unbreakable or worth more points
                const type = Math.random();
                let hits = 1;
                let points = 10;
                
                if (type < 0.1 && this.level > 2) {
                    hits = 3; // Hard brick
                    points = 30;
                } else if (type < 0.25 && this.level > 1) {
                    hits = 2; // Medium brick
                    points = 20;
                }
                
                this.bricks[row][col] = {
                    x: x,
                    y: y,
                    width: this.brickWidth,
                    height: this.brickHeight,
                    hits: hits,
                    maxHits: hits,
                    points: points,
                    color: theme.colors[row % theme.colors.length],
                    visible: true
                };
            }
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.resetBall();
        
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'inline-block';
        
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    gameLoop(currentTime) {
        if (this.gameState !== 'playing') {
            this.animationId = null;
            return;
        }
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
        
        // Update level intro
        if (this.levelIntroTime > 0) {
            this.levelIntroTime--;
        }
        
        // Move paddle with keyboard
        if (this.input.isKeyDown('ArrowLeft') || this.input.isKeyDown('KeyA')) {
            this.paddle.x -= this.paddle.speed;
        }
        if (this.input.isKeyDown('ArrowRight') || this.input.isKeyDown('KeyD')) {
            this.paddle.x += this.paddle.speed;
        }
        
        this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, this.paddle.x));
        
        // Update ball
        if (this.ball.stuck) {
            this.ball.x = this.paddle.x + this.paddle.width / 2;
            this.ball.y = this.paddle.y - this.ball.radius;
        } else {
            this.updateBall(this.ball);
        }
        
        // Update extra balls
        this.extraBalls.forEach((ball, index) => {
            this.updateBall(ball);
            if (ball.y > this.height) {
                this.extraBalls.splice(index, 1);
            }
        });
        
        // Update power-ups
        this.updatePowerUps(deltaTime);
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.life -= deltaTime;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += 200 * deltaTime; // Gravity
            return p.life > 0;
        });
        
        // Check level complete
        const allBricksCleared = this.bricks.every(row => 
            row.every(brick => !brick.visible)
        );
        
        if (allBricksCleared) {
            this.levelComplete();
        }
    }
    
    updateBall(ball) {
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        // Wall collision
        if (ball.x + ball.radius > this.width || ball.x - ball.radius < 0) {
            ball.dx = -ball.dx;
        }
        
        if (ball.y - ball.radius < 0) {
            ball.dy = -ball.dy;
        }
        
        // Bottom collision
        if (ball.y + ball.radius > this.height) {
            if (this.easyMode) {
                // In easy mode, respawn ball
                this.resetBall();
            } else {
                // In normal mode, lose life
                if (ball === this.ball) {
                    this.loseLife();
                }
            }
        }
        
        // Paddle collision
        if (ball.y + ball.radius > this.paddle.y &&
            ball.y - ball.radius < this.paddle.y + this.paddle.height &&
            ball.x > this.paddle.x &&
            ball.x < this.paddle.x + this.paddle.width) {
            
            // Calculate bounce angle based on where ball hit paddle
            const hitPos = (ball.x - this.paddle.x) / this.paddle.width;
            const angle = (hitPos - 0.5) * Math.PI * 0.6; // Max 54 degrees
            
            const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            ball.dx = speed * Math.sin(angle);
            ball.dy = -Math.abs(speed * Math.cos(angle));
        }
        
        // Brick collision
        this.checkBrickCollision(ball);
    }
    
    checkBrickCollision(ball) {
        const hasPowerBall = this.activePowerUps.some(p => p.effect === 'powerBall');
        
        for (let row = 0; row < this.brickRowCount; row++) {
            for (let col = 0; col < this.brickColumnCount; col++) {
                const brick = this.bricks[row][col];
                
                if (brick.visible) {
                    if (ball.x + ball.radius > brick.x &&
                        ball.x - ball.radius < brick.x + brick.width &&
                        ball.y + ball.radius > brick.y &&
                        ball.y - ball.radius < brick.y + brick.height) {
                        
                        if (hasPowerBall) {
                            brick.hits = 0; // Power ball breaks any brick instantly
                        } else {
                            brick.hits--;
                        }
                        
                        if (brick.hits <= 0) {
                            brick.visible = false;
                            this.score += brick.points;
                            this.bricksBroken++;
                            this.combo++;
                            this.comboTimer = 1.5; // seconds
                            this.score += Math.floor(brick.points * (this.combo * 0.1));
                            this.updateUI();
                            
                            // Create particles
                            this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);
                            this.audio.playSFX('collect');
                            
                            // Random power-up drop
                            if (Math.random() < this.currentConfig.powerUpRate) {
                                this.spawnPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
                            }
                        }
                        
                        if (!hasPowerBall) {
                            ball.dy = -ball.dy;
                        }
                    }
                }
            }
        }
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200 - 100,
                color: color,
                size: Math.random() * 4 + 2,
                life: 1
            });
        }
    }
    
    spawnPowerUp(x, y) {
        const type = this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)];
        this.powerUps.push({
            x: x,
            y: y,
            width: 40,
            height: 40,
            dy: 2,
            type: type,
            icon: type.icon,
            color: type.color
        });
    }
    
    updatePowerUps(deltaTime) {
        // Move falling power-ups
        this.powerUps.forEach((powerUp, index) => {
            powerUp.y += powerUp.dy;
            
            // Check paddle collision
            if (powerUp.y + powerUp.height > this.paddle.y &&
                powerUp.y < this.paddle.y + this.paddle.height &&
                powerUp.x + powerUp.width > this.paddle.x &&
                powerUp.x < this.paddle.x + this.paddle.width) {
                
                this.activatePowerUp(powerUp.type);
                this.powerUps.splice(index, 1);
            }
            
            // Remove if off screen
            if (powerUp.y > this.height) {
                this.powerUps.splice(index, 1);
            }
        });
        
        // Update active power-up timers
        this.activePowerUps.forEach((powerUp, index) => {
            powerUp.duration -= deltaTime;
            if (powerUp.duration <= 0) {
                this.deactivatePowerUp(powerUp);
                this.activePowerUps.splice(index, 1);
            }
        });
        
        this.updatePowerUpDisplay();
    }
    
    activatePowerUp(type) {
        switch(type.effect) {
            case 'widePaddle':
                this.paddle.width = 200;
                this.activePowerUps.push({ ...type, duration: 10 });
                break;
            case 'multiBall':
                this.spawnExtraBalls();
                break;
            case 'slowBall':
                this.ball.speed *= 0.7;
                this.ball.dx *= 0.7;
                this.ball.dy *= 0.7;
                this.activePowerUps.push({ ...type, duration: 8 });
                break;
            case 'extraLife':
                this.lives++;
                this.updateUI();
                break;
            case 'powerBall':
                this.activePowerUps.push({ ...type, duration: 10 });
                break;
        }
    }
    
    deactivatePowerUp(powerUp) {
        switch(powerUp.effect) {
            case 'widePaddle':
                this.paddle.width = 150;
                break;
            case 'slowBall':
                this.ball.speed /= 0.7;
                this.ball.dx /= 0.7;
                this.ball.dy /= 0.7;
                break;
        }
    }
    
    spawnExtraBalls() {
        const angles = [-0.5, -0.3, 0.3, 0.5];
        angles.forEach(angle => {
            const speed = this.ball.speed;
            this.extraBalls.push({
                x: this.ball.x,
                y: this.ball.y,
                radius: this.ball.radius,
                dx: speed * Math.sin(angle),
                dy: -Math.abs(speed * Math.cos(angle)),
                speed: speed,
                color: this.ball.color
            });
        });
    }
    
    updatePowerUpDisplay() {
        const list = document.getElementById('powerUpsList');
        
        if (this.activePowerUps.length === 0) {
            list.innerHTML = '<span style="color: #999;">No active power-ups</span>';
        } else {
            list.innerHTML = this.activePowerUps.map(p => 
                `<span class="power-up-item">${p.icon} ${p.name} (${Math.ceil(p.duration)}s)</span>`
            ).join('');
        }
    }
    
    launchBall() {
        const angle = (Math.random() - 0.5) * 0.5; // Random angle
        this.ball.speed = this.ball.baseSpeed * this.speedMultiplier;
        this.ball.dx = this.ball.speed * Math.sin(angle);
        this.ball.dy = -this.ball.speed * Math.cos(angle);
        this.ball.stuck = false;
    }
    
    resetBall() {
        this.ball.x = this.paddle.x + this.paddle.width / 2;
        this.ball.y = this.paddle.y - this.ball.radius;
        this.ball.dx = 0;
        this.ball.dy = 0;
        this.ball.stuck = true;
        this.extraBalls = [];
    }
    
    loseLife() {
        this.lives--;
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.resetBall();
        }
    }
    
    levelComplete() {
        this.gameState = 'levelComplete';
        
        // Calculate stars based on lives remaining
        const stars = this.lives;
        document.getElementById('starsEarned').textContent = '⭐'.repeat(stars);
        document.getElementById('levelScore').textContent = this.score;
        document.getElementById('levelCompleteModal').classList.add('active');
        
        this.saveGame();
    }
    
    nextLevel() {
        this.level++;
        this.lives = Math.min(3, this.lives + 1); // Restore a life
        this.activePowerUps = [];
        this.powerUps = [];
        this.particles = [];
        
        this.createBricks();
        this.resetBall();
        this.updateUI();
        
        document.getElementById('levelCompleteModal').classList.remove('active');
        this.startGame();
    }
    
    gameOver() {
        this.gameState = 'gameover';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('levelsCompleted').textContent = this.level - 1;
        document.getElementById('gameOverModal').classList.add('active');
        document.getElementById('pauseBtn').style.display = 'none';
        document.getElementById('startBtn').style.display = 'inline-block';
        this.saveGame();
    }
    
    restartGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.activePowerUps = [];
        this.powerUps = [];
        this.particles = [];
        this.extraBalls = [];
        
        document.getElementById('gameOverModal').classList.remove('active');
        this.createBricks();
        this.updateUI();
        this.startGame();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseModal').classList.add('active');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseModal').classList.remove('active');
            this.lastTime = performance.now();
            this.gameLoop(this.lastTime);
        }
    }
    
    toggleFullscreen() {
        const container = document.querySelector('.game-container');
        
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
            document.getElementById('fullscreenBtn').textContent = '🖥️ Exit Fullscreen';
        } else {
            document.exitFullscreen();
            document.getElementById('fullscreenBtn').textContent = '🖥️ Fullscreen';
        }
    }
    
    backToMenu() {
        this.saveGame();
        window.location.href = '../../launcher.html';
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = '❤️'.repeat(this.lives);
        document.getElementById('level').textContent = this.level;
    }
    
    saveGame() {
        this.save.save({
            highScore: Math.max(this.score, this.save.load()?.highScore || 0),
            currentLevel: this.level,
            totalLevels: 15
        });
    }
    
    loadGame() {
        const data = this.save.load();
        if (data) {
            // Start fresh but keep high score
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw bricks
        for (let row = 0; row < this.brickRowCount; row++) {
            for (let col = 0; col < this.brickColumnCount; col++) {
                const brick = this.bricks[row][col];
                
                if (brick.visible) {
                    // Brick color based on hits remaining
                    const alpha = brick.hits / brick.maxHits;
                    this.ctx.fillStyle = brick.color;
                    this.ctx.globalAlpha = 0.4 + alpha * 0.6;
                    
                    this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                    
                    // Shine effect
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.fillRect(brick.x + 2, brick.y + 2, brick.width / 3, brick.height / 3);
                    
                    this.ctx.globalAlpha = 1;
                    
                    // Hit indicator
                    if (brick.hits > 1) {
                        this.ctx.fillStyle = '#FFF';
                        this.ctx.font = 'bold 14px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(brick.hits, brick.x + brick.width / 2, brick.y + brick.height / 2);
                    }
                }
            }
        }
        
        // Draw paddle
        const gradient = this.ctx.createLinearGradient(this.paddle.x, 0, this.paddle.x + this.paddle.width, 0);
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(0.5, '#FFD93D');
        gradient.addColorStop(1, '#6BCB77');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        
        // Paddle shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height / 3);
        
        // Draw ball
        this.drawBall(this.ball);
        
        // Draw extra balls
        this.extraBalls.forEach(ball => this.drawBall(ball));
        
        // Draw power-ups
        this.powerUps.forEach(powerUp => {
            this.ctx.fillStyle = powerUp.color;
            this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(powerUp.icon, powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
        });
        
        // Draw particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
        this.ctx.globalAlpha = 1;
        
        // Draw "Click to launch" message
        if (this.ball.stuck) {
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Click or Press SPACE to Launch!', this.width / 2, this.height - 100);
        }
        
        // Draw mission HUD
        this.drawMissionHUD();
    }
    
    drawMissionHUD() {
        // Title bar
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(0, 0, this.width, 50);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Level ${this.level}: ${this.currentConfig.name}`, 15, 28);
        
        // Mission objective
        if (this.levelIntroTime > 0) {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.currentConfig.name, this.width / 2, this.height / 2 - 20);
            
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(this.currentConfig.mission, this.width / 2, this.height / 2 + 30);
        } else {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.currentConfig.mission, this.width / 2, 28);
        }
        
        // Bricks broken progress
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(`Bricks: ${this.bricksBroken}/${this.currentConfig.targetBricks}`, this.width - 15, 28);
        
        // Combo indicator
        if (this.combo > 1 && this.comboTimer > 0) {
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText(`Combo x${this.combo}!`, this.width / 2, this.height - 20);
        }
    }
    
    drawBall(ball) {
        // Glow effect
        const gradient = this.ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius * 2);
        gradient.addColorStop(0, ball.color);
        gradient.addColorStop(0.5, ball.color);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius * 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ball
        this.ctx.fillStyle = ball.color;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(ball.x - ball.radius / 3, ball.y - ball.radius / 3, ball.radius / 3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawMenu() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Brick Breaker', this.width / 2, this.height / 2 - 50);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press Start to Play!', this.width / 2, this.height / 2 + 20);
    }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new BrickBreakerGame();
});
