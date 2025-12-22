// Sailor Quest Game
class SailorQuestGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game managers
        this.audio = new AudioManager();
        this.input = new InputHandler();
        this.save = new SaveManager('sailor-quest');
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'menu';
        this.speedMultiplier = 1.0;
        
        // Player
        this.player = {
            x: 100,
            y: 350,
            width: 30,
            height: 40,
            vx: 0,
            vy: 0,
            jumping: false,
            speed: 3
        };
        
        // Platforms
        this.platforms = [];
        
        // Collectibles
        this.olives = [];
        
        // Enemies
        this.enemies = [];
        
        // Physics
        this.gravity = 0.5;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadGame();
        this.drawMenu();
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('backBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            speedValue.textContent = speed.toFixed(1) + 'x';
            this.speedMultiplier = speed;
            this.player.speed = 3 * this.speedMultiplier;
        });
        
        this.input.on('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.player.vx = -this.player.speed;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.player.vx = this.player.speed;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                case 'Space':
                    if (!this.player.jumping) {
                        this.player.vy = -12;
                        this.player.jumping = true;
                        this.audio.playSFX('jump');
                    }
                    break;
            }
        });
        
        this.input.on('keyup', (e) => {
            if (this.gameState !== 'playing') return;
            
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                case 'ArrowRight':
                case 'KeyD':
                    this.player.vx = 0;
                    break;
            }
        });
    }
    
    createLevel() {
        // Create platforms
        this.platforms = [
            { x: 0, y: 450, width: 640, height: 30 }, // Ground
            { x: 100, y: 380, width: 150, height: 20 },
            { x: 300, y: 300, width: 150, height: 20 },
            { x: 50, y: 220, width: 150, height: 20 },
            { x: 400, y: 180, width: 150, height: 20 },
            { x: 250, y: 100, width: 140, height: 20 }
        ];
        
        // Create olives
        this.olives = [
            { x: 150, y: 340, collected: false },
            { x: 350, y: 260, collected: false },
            { x: 100, y: 180, collected: false },
            { x: 450, y: 140, collected: false },
            { x: 300, y: 60, collected: false }
        ];
        
        // Create enemies
        this.enemies = [
            { x: 250, y: 430, vx: 1, width: 25, height: 25 },
            { x: 150, y: 360, vx: 1.5, width: 25, height: 25 },
            { x: 420, y: 160, vx: -1, width: 25, height: 25 }
        ];
        
        this.player.x = 100;
        this.player.y = 350;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.jumping = false;
    }
    
    update() {
        // Apply gravity
        this.player.vy += this.gravity;
        
        // Update position
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        // Collision with platforms
        this.player.jumping = true;
        for (let platform of this.platforms) {
            if (this.player.x + this.player.width > platform.x &&
                this.player.x < platform.x + platform.width &&
                this.player.y + this.player.height > platform.y &&
                this.player.y + this.player.height < platform.y + platform.height + 10 &&
                this.player.vy > 0) {
                this.player.y = platform.y - this.player.height;
                this.player.vy = 0;
                this.player.jumping = false;
            }
        }
        
        // Boundaries
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.canvas.width) {
            this.player.x = this.canvas.width - this.player.width;
        }
        
        // Fall off screen
        if (this.player.y > this.canvas.height) {
            this.lives--;
            this.audio.playSFX('die');
            if (this.lives <= 0) {
                this.gameState = 'gameOver';
            } else {
                this.createLevel();
            }
        }
        
        // Collect olives
        for (let olive of this.olives) {
            if (!olive.collected) {
                const dist = Math.hypot(this.player.x - olive.x, this.player.y - olive.y);
                if (dist < 30) {
                    olive.collected = true;
                    this.score += 100;
                    this.audio.playSFX('collect');
                }
            }
        }
        
        // Check win
        if (this.olives.every(o => o.collected)) {
            this.level++;
            this.audio.playSFX('win');
            this.createLevel();
        }
        
        // Update enemies
        for (let enemy of this.enemies) {
            enemy.x += enemy.vx * this.speedMultiplier;
            
            // Bounce off walls
            if (enemy.x < 0 || enemy.x + enemy.width > this.canvas.width) {
                enemy.vx *= -1;
            }
            
            // Collision with player
            if (this.player.x + this.player.width > enemy.x &&
                this.player.x < enemy.x + enemy.width &&
                this.player.y + this.player.height > enemy.y &&
                this.player.y < enemy.y + enemy.height) {
                this.lives--;
                this.audio.playSFX('die');
                if (this.lives <= 0) {
                    this.gameState = 'gameOver';
                } else {
                    this.createLevel();
                }
            }
        }
        
        // Update UI
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw platforms
        this.ctx.fillStyle = '#1E90FF';
        for (let platform of this.platforms) {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            this.ctx.strokeStyle = '#00CED1';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        }
        
        // Draw olives
        this.ctx.fillStyle = '#90EE90';
        for (let olive of this.olives) {
            if (!olive.collected) {
                this.ctx.beginPath();
                this.ctx.arc(olive.x, olive.y, 8, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Draw player
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw enemies
        this.ctx.fillStyle = '#FF4500';
        for (let enemy of this.enemies) {
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.createLevel();
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    gameLoop(currentTime) {
        if (this.gameState !== 'playing' && this.gameState !== 'gameOver') {
            return;
        }
        
        if (this.gameState === 'playing') {
            this.update();
        }
        this.draw();
        
        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FF4500';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Final Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2 + 50);
            return;
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
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
        this.gameState = 'menu';
        this.save.save({score: this.score, level: this.level});
        window.location.href = '../../launcher.html';
    }
    
    loadGame() {
        const data = this.save.load();
        if (data) {
            this.score = data.score || 0;
            this.level = data.level || 1;
        }
    }
    
    drawMenu() {
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.95)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#1E90FF';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚓ Sailor Quest', this.canvas.width / 2, 100);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Collect all the olives!', this.canvas.width / 2, 300);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new SailorQuestGame();
});
