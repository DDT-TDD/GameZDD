// Donkey Kong V2 - Enhanced Barrel Climb with Professional Physics
class BarrelClimbGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game managers
        this.audio = new AudioManager();
        this.input = new InputHandler();
        this.save = new SaveManager('barrel-climb');
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.gameState = 'menu';
        this.speedMultiplier = 1.0;
        this.lives = 3;
        
        // Player with enhanced physics (from Super Mario reference)
        this.player = {
            x: 50,
            y: 400,
            width: 30,
            height: 40,
            vx: 0,              // Horizontal velocity
            vy: 0,              // Vertical velocity
            jumping: false,
            onGround: false,
            onLadder: false,
            direction: 1,       // 1 for right, -1 for left
            state: 'idle',      // idle, climbing, jumping, falling
            animationFrame: 0,
            wasOnGround: false  // Track landing state for particle effects
        };
        
        // Physics system (inspired by Super Mario)
        this.PHYSICS = {
            gravity: 400,               // Pixels/second² (moderate gravity)
            maxFallSpeed: 300,          // Terminal velocity
            ladderClimbSpeed: 100,      // Vertical climb speed on ladder
            ladderSlideSpeed: 50,       // Slide down speed when letting go
            moveAccel: 200,             // Horizontal acceleration
            friction: 0.9,              // Ground friction
            airResistance: 0.95         // Air resistance
        };
        
        // Platforms and ladders
        this.platforms = [];
        this.ladders = [];
        this.barrels = [];
        this.particles = [];
        this.goal = null;
        
        // Level configurations
        this.levelConfigs = [
            {
                name: 'Beginner Climb',
                mission: 'Reach the top 1 time',
                barrelsCount: 2,
                targetScore: 500,
                scoreMultiplier: 1.0
            },
            {
                name: 'Intermediate Challenge',
                mission: 'Reach the top 2 times',
                barrelsCount: 3,
                targetScore: 1000,
                scoreMultiplier: 1.1
            },
            {
                name: 'Advanced Hazard',
                mission: 'Reach the top 3 times',
                barrelsCount: 4,
                targetScore: 1500,
                scoreMultiplier: 1.2
            },
            {
                name: 'Expert Barrel',
                mission: 'Reach the top 4 times',
                barrelsCount: 5,
                targetScore: 2000,
                scoreMultiplier: 1.3
            },
            {
                name: 'Master Climber',
                mission: 'Reach the top 5 times',
                barrelsCount: 6,
                targetScore: 2500,
                scoreMultiplier: 1.4
            },
            {
                name: 'Extreme Difficulty',
                mission: 'Reach the top 6 times',
                barrelsCount: 7,
                targetScore: 3000,
                scoreMultiplier: 1.5
            }
        ];
        
        this.currentLevel = 0;
        this.levelIntroTime = 0;
        this.comboTimer = 0;
        this.combo = 0;
        this.levelCompletions = 0;
        this.keysPressed = new Set();
        
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
        });
        
        // Continuous key tracking (like Super Mario)
        window.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                e.preventDefault();
                this.keysPressed.add('left');
                this.player.direction = -1;
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                e.preventDefault();
                this.keysPressed.add('right');
                this.player.direction = 1;
            }
            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                this.keysPressed.add('up');
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                e.preventDefault();
                this.keysPressed.add('down');
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.keysPressed.delete('left');
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.keysPressed.delete('right');
            }
            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                this.keysPressed.delete('up');
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.keysPressed.delete('down');
            }
        });
    }
    
    createLevel() {
        const config = this.levelConfigs[this.currentLevel] || this.levelConfigs[this.levelConfigs.length - 1];
        
        // Platform layout (Donkey Kong style - ascending)
        this.platforms = [
            { x: 0, y: 540, width: 800, height: 60 },      // Ground
            { x: 50, y: 460, width: 250, height: 20 },     // Platform 1
            { x: 500, y: 380, width: 250, height: 20 },    // Platform 2
            { x: 100, y: 300, width: 250, height: 20 },    // Platform 3
            { x: 500, y: 220, width: 250, height: 20 },    // Platform 4
            { x: 200, y: 140, width: 250, height: 20 },    // Platform 5
            { x: 500, y: 60, width: 250, height: 20 }      // Platform 6 (top)
        ];
        
        // Ladders connecting platforms
        this.ladders = [
            { x: 310, y: 460, height: 80, width: 30 },     // Ladder 1
            { x: 100, y: 380, height: 80, width: 30 },     // Ladder 2
            { x: 390, y: 300, height: 80, width: 30 },     // Ladder 3
            { x: 180, y: 220, height: 80, width: 30 },     // Ladder 4
            { x: 390, y: 140, height: 80, width: 30 },     // Ladder 5
            { x: 250, y: 60, height: 80, width: 30 }       // Ladder 6 (to goal)
        ];
        
        // Barrels (rolling hazards) with realistic physics
        this.barrels = [];
        for (let i = 0; i < config.barrelsCount; i++) {
            const platform = this.platforms[Math.floor(Math.random() * (this.platforms.length - 1))];
            this.barrels.push({
                x: platform.x + Math.random() * platform.width,
                y: platform.y - 30,
                vx: (-100 - i * 30) * (1 + this.currentLevel * 0.1),
                vy: 0,
                size: 15,
                onGround: false,
                bouncing: false
            });
        }
        
        // Goal (top of screen)
        this.goal = { x: 600, y: 20, width: 40, height: 40 };
        
        // Reset player - FIX: Start ON the ground platform
        this.player.x = 50;
        this.player.y = 500;  // Changed from 480 to 500 (ground is at 540, player height 40)
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.jumping = false;
        this.player.onGround = true;  // Changed from false - player starts on ground
        this.player.onLadder = false;
        this.player.state = 'idle';
        this.player.wasOnGround = true;  // Add flag to track landing state
        
        // Clear particles
        this.particles = [];
        
        this.levelIntroTime = 120; // 2 seconds at 60fps
        this.comboTimer = 0;
    }
    
    updatePlayer() {
        const dt = 1 / 60;
        
        // Check ladder collision first
        this.player.onLadder = false;
        for (let ladder of this.ladders) {
            if (this.player.x + this.player.width > ladder.x &&
                this.player.x < ladder.x + ladder.width &&
                this.player.y + this.player.height > ladder.y - ladder.height &&
                this.player.y < ladder.y + 10) {
                this.player.onLadder = true;
                break;
            }
        }
        
        // Handle climbing/ladder movement
        if (this.player.onLadder) {
            this.player.state = 'climbing';
            this.player.vy = 0; // No gravity on ladder
            
            // Vertical movement
            if (this.keysPressed.has('up')) {
                this.player.vy = -this.PHYSICS.ladderClimbSpeed * this.speedMultiplier;
            } else if (this.keysPressed.has('down')) {
                this.player.vy = this.PHYSICS.ladderSlideSpeed * this.speedMultiplier;
            } else {
                this.player.vy = 0;
            }
            
            // Horizontal movement on ladder (slow)
            if (this.keysPressed.has('left')) {
                this.player.vx = Math.max(this.player.vx - 50 * dt, -80);
                this.player.direction = -1;
            } else if (this.keysPressed.has('right')) {
                this.player.vx = Math.min(this.player.vx + 50 * dt, 80);
                this.player.direction = 1;
            } else {
                this.player.vx *= 0.9; // Friction on ladder
            }
        } else {
            // Ground/air physics
            
            // Horizontal acceleration
            if (this.keysPressed.has('left')) {
                this.player.vx = Math.max(this.player.vx - this.PHYSICS.moveAccel * dt, -150);
                this.player.direction = -1;
            } else if (this.keysPressed.has('right')) {
                this.player.vx = Math.min(this.player.vx + this.PHYSICS.moveAccel * dt, 150);
                this.player.direction = 1;
            } else {
                // Friction (slow down when no input)
                this.player.vx *= this.PHYSICS.friction;
            }
            
            // Apply gravity
            if (!this.player.onGround) {
                this.player.vy += this.PHYSICS.gravity * dt;
                this.player.vy = Math.min(this.player.vy, this.PHYSICS.maxFallSpeed);
                this.player.state = 'falling';
            } else {
                this.player.state = 'idle';
            }
        }
        
        // Update position
        this.player.x += this.player.vx * dt;
        this.player.y += this.player.vy * dt;
        
        // Platform collision detection
        this.player.onGround = false;
        for (let platform of this.platforms) {
            if (this.player.x + this.player.width > platform.x &&
                this.player.x < platform.x + platform.width &&
                this.player.y + this.player.height > platform.y &&
                this.player.y + this.player.height < platform.y + platform.height + 10 &&
                this.player.vy >= 0) {
                
                // Landing on platform
                this.player.y = platform.y - this.player.height;
                this.player.vy = 0;
                this.player.onGround = true;
                
                // Create landing particles only once (when transitioning from air to ground)
                if (!this.player.wasOnGround) {
                    this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height, 'land');
                }
            }
        }
        
        // Update ground state for next frame
        this.player.wasOnGround = this.player.onGround;
        
        // Bounds checking
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.canvas.width) {
            this.player.x = this.canvas.width - this.player.width;
        }
        
        // Fall out of bounds
        if (this.player.y > this.canvas.height) {
            this.lives--;
            this.audio.playSFX('die');
            if (this.lives <= 0) {
                this.gameState = 'gameOver';
            } else {
                this.createLevel();
            }
        }
        
        // Update animation
        if (Math.abs(this.player.vx) > 20 || Math.abs(this.player.vy) > 20) {
            this.player.animationFrame = (this.player.animationFrame + 0.1) % 4;
        } else {
            this.player.animationFrame = 0;
        }
    }
    
    updateBarrels() {
        for (let i = this.barrels.length - 1; i >= 0; i--) {
            const barrel = this.barrels[i];
            
            // Apply gravity to barrel
            if (!barrel.onGround) {
                barrel.vy += this.PHYSICS.gravity * (1 / 60);
                barrel.vy = Math.min(barrel.vy, this.PHYSICS.maxFallSpeed);
            } else {
                barrel.vy = 0;
            }
            
            // Update position
            barrel.x += barrel.vx * this.speedMultiplier * (1 / 60);
            barrel.y += barrel.vy * (1 / 60);
            
            // Check platform collision for barrel
            barrel.onGround = false;
            for (let platform of this.platforms) {
                if (barrel.x + barrel.size * 2 > platform.x &&
                    barrel.x < platform.x + platform.width &&
                    barrel.y + barrel.size * 2 > platform.y &&
                    barrel.y + barrel.size * 2 < platform.y + platform.height + 10 &&
                    barrel.vy >= 0) {
                    
                    barrel.y = platform.y - barrel.size * 2;
                    barrel.vy = 0;
                    barrel.onGround = true;
                }
            }
            
            // Bounce off edges
            if (barrel.x < 0 || barrel.x + barrel.size * 2 > this.canvas.width) {
                barrel.vx *= -1;
            }
            
            // Remove if fell off screen
            if (barrel.y > this.canvas.height) {
                this.barrels.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (this.player.x + this.player.width > barrel.x &&
                this.player.x < barrel.x + barrel.size * 2 &&
                this.player.y + this.player.height > barrel.y &&
                this.player.y < barrel.y + barrel.size * 2) {
                
                this.lives--;
                this.audio.playSFX('die');
                this.createParticles(barrel.x, barrel.y, 'collision');
                
                if (this.lives <= 0) {
                    this.gameState = 'gameOver';
                } else {
                    this.createLevel();
                }
            }
        }
    }
    
    checkGoal() {
        if (this.player.x + this.player.width > this.goal.x &&
            this.player.x < this.goal.x + this.goal.width &&
            this.player.y + this.player.height > this.goal.y &&
            this.player.y < this.goal.y + this.goal.height) {
            
            this.levelCompletions++;
            this.combo++;
            this.comboTimer = 1.5;
            
            const config = this.levelConfigs[this.currentLevel];
            const baseScore = 500;
            const multiplier = 1 + this.combo * 0.15;
            this.score += Math.floor(baseScore * multiplier);
            
            this.audio.playSFX('win');
            this.createParticles(this.goal.x, this.goal.y, 'victory');
            
            if (this.levelCompletions >= Math.ceil(config.targetScore / 500)) {
                this.currentLevel++;
                if (this.currentLevel >= this.levelConfigs.length) {
                    this.gameState = 'victory';
                    this.audio.playMusic('win');
                } else {
                    this.createLevel();
                }
            } else {
                this.createLevel();
            }
        }
    }
    
    createParticles(x, y, type) {
        if (type === 'land') {
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: x + (Math.random() - 0.5) * 20,
                    y: y,
                    vx: (Math.random() - 0.5) * 150,
                    vy: -80 - Math.random() * 80,
                    life: 0.4,
                    maxLife: 0.4,
                    radius: 2,
                    color: '#8B7355'
                });
            }
        } else if (type === 'collision') {
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * 150,
                    vy: Math.sin(angle) * 150 - 50,
                    life: 0.4,
                    maxLife: 0.4,
                    radius: 3,
                    color: '#FF6347'
                });
            }
        } else if (type === 'victory') {
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * 120,
                    vy: Math.sin(angle) * 120,
                    life: 0.5,
                    maxLife: 0.5,
                    radius: 2,
                    color: '#FFD700'
                });
            }
        }
    }
    
    updateParticles() {
        const dt = 1 / 60;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 300 * dt; // Gravity
            p.life -= dt;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    update() {
        if (this.levelIntroTime > 0) {
            this.levelIntroTime--;
            return;
        }
        
        if (this.comboTimer > 0) {
            this.comboTimer -= 1 / 60;
        } else {
            this.combo = 0;
        }
        
        this.updatePlayer();
        this.updateBarrels();
        this.checkGoal();
        this.updateParticles();
        
        // Update HUD
        this.level = Math.min(this.currentLevel + 1, this.levelConfigs.length);
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw platforms
        this.ctx.fillStyle = '#FF6347';
        for (let platform of this.platforms) {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            // Platform edge highlight
            this.ctx.fillStyle = '#FF7F50';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
            this.ctx.fillStyle = '#FF6347';
        }
        
        // Draw ladders
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 8;
        for (let ladder of this.ladders) {
            // Left rail
            this.ctx.beginPath();
            this.ctx.moveTo(ladder.x, ladder.y - ladder.height);
            this.ctx.lineTo(ladder.x, ladder.y);
            this.ctx.stroke();
            
            // Right rail
            this.ctx.beginPath();
            this.ctx.moveTo(ladder.x + ladder.width, ladder.y - ladder.height);
            this.ctx.lineTo(ladder.x + ladder.width, ladder.y);
            this.ctx.stroke();
            
            // Rungs
            this.ctx.lineWidth = 3;
            for (let i = 0; i < ladder.height; i += 15) {
                this.ctx.beginPath();
                this.ctx.moveTo(ladder.x, ladder.y - i);
                this.ctx.lineTo(ladder.x + ladder.width, ladder.y - i);
                this.ctx.stroke();
            }
        }
        
        // Draw barrels
        this.ctx.fillStyle = '#8B4513';
        for (let barrel of this.barrels) {
            this.ctx.beginPath();
            this.ctx.arc(barrel.x + barrel.size, barrel.y + barrel.size, barrel.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Barrel detail
            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(barrel.x + barrel.size, barrel.y + barrel.size, barrel.size, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw goal
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎯', this.goal.x + this.goal.width / 2, this.goal.y + this.goal.height / 2 + 5);
        
        // Draw player (Donkey Kong character simplified)
        this.ctx.fillStyle = '#FFD700';
        // Head
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width / 2, this.player.y + 10, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Body
        this.ctx.fillStyle = '#FF8C00';
        this.ctx.fillRect(this.player.x + 5, this.player.y + 20, 20, 15);
        
        // Legs animation
        this.ctx.fillStyle = '#6F4E37';
        const legOffset = Math.sin(this.player.animationFrame * Math.PI) * 3;
        this.ctx.fillRect(this.player.x + 8, this.player.y + 34, 5, 8 + legOffset);
        this.ctx.fillRect(this.player.x + 17, this.player.y + 34, 5, 8 - legOffset);
        
        // Draw particles
        for (let p of this.particles) {
            const alpha = p.life / p.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1.0;
        
        // Draw level intro
        if (this.levelIntroTime > 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            const config = this.levelConfigs[this.currentLevel];
            this.ctx.fillStyle = '#FF6347';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🪜 ' + config.name, this.canvas.width / 2, this.canvas.height / 2 - 50);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(config.mission, this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.createLevel();
        document.getElementById('startBtn').style.display = 'none';
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    gameLoop(currentTime) {
        if (this.gameState !== 'playing' && this.gameState !== 'gameOver' && this.gameState !== 'victory') {
            return;
        }
        
        if (this.gameState === 'playing') {
            this.update();
        }
        
        this.draw();
        
        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FF6347';
            this.ctx.font = 'bold 56px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '32px Arial';
            this.ctx.fillText('Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2 + 40);
            return;
        }
        
        if (this.gameState === 'victory') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 56px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#FFD700';
            this.ctx.fillText('🏆 VICTORY! 🏆', this.canvas.width / 2, this.canvas.height / 2 - 50);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '32px Arial';
            this.ctx.shadowBlur = 0;
            this.ctx.fillText('Final Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2 + 40);
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
        this.save.save({ score: this.score, level: this.level });
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
        this.ctx.fillStyle = '#FF6347';
        this.ctx.font = 'bold 56px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🪜 Barrel Climb', this.canvas.width / 2, 100);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Dodge barrels and climb to the top!', this.canvas.width / 2, 250);
        this.ctx.fillText('Arrow Keys or WASD to move', this.canvas.width / 2, 320);
        this.ctx.fillText('Up/Down to climb ladders', this.canvas.width / 2, 370);
    }
}

window.addEventListener('load', () => new BarrelClimbGame());
