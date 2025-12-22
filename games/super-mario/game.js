// Super Mario V2 - Realistic Platformer with Advanced Physics
class SuperMarioGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game managers
        this.audio = new AudioManager();
        this.input = new InputHandler();
        this.save = new SaveManager('super-mario');
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.gameState = 'menu';
        this.speedMultiplier = 1.0;
        this.coins = 0;
        this.lives = 3;
        
        // Player physics system (inspired by Super Mario reference)
        this.player = {
            x: 50,
            y: 300,
            width: 24,
            height: 32,
            vx: 0,           // Horizontal velocity
            vy: 0,           // Vertical velocity
            ax: 0,           // Horizontal acceleration
            onGround: false,
            onWall: false,
            wallSide: null,  // 'left' or 'right'
            direction: 1,    // 1 for right, -1 for left
            isAnimating: false,
            animationFrame: 0,
            
            // Jump system (inspired by Super Mario Jump trait)
            jumpReady: false,
            jumpRequested: false,
            jumpEngageTime: 0,
            jumpBufferTime: 0,
            coyoteTime: 0,
            
            // State tracking
            state: 'idle'     // 'idle', 'running', 'jumping', 'falling', 'wallslide'
        };
        
        // Physics constants (from Super Mario reference)
        this.PHYSICS = {
            gravity: 600,              // Pixels/second² (strong gravity)
            maxFallSpeed: 400,         // Terminal velocity
            moveAccel: 800,            // Acceleration when moving
            friction: 0.85,            // Ground friction
            
            // Jump physics (hold-to-jump system)
            jumpPower: -320,           // Initial jump velocity (negative = upward)
            jumpHoldTime: 0.15,        // How long jump key affects trajectory
            maxJumpHeight: 120,        // Pixels (for reference)
            
            // Air control
            airAccel: 600,             // Acceleration in air
            
            // Wall physics
            wallFriction: 0.9,         // Slide down walls slowly
            wallJumpPower: -300,       // Jump away from wall
            wallJumpSideVelocity: 200  // Horizontal boost from wall jump
        };
        
        // Platforms
        this.platforms = [];
        
        // Enemies (goombas)
        this.enemies = [];
        
        // Collectibles (coins)
        this.coins_collectible = [];
        
        // Particles
        this.particles = [];
        
        // Goal flag
        this.goal = null;
        
        // Level configurations (7 levels total)
        this.levelConfigs = [
            {
                name: 'Grassland Start',
                platforms: [
                    { x: 0, y: 540, width: 800, height: 60 },      // Ground
                    { x: 150, y: 450, width: 200, height: 20 },    // Platform
                    { x: 450, y: 380, width: 200, height: 20 },    // Platform
                    { x: 200, y: 300, width: 150, height: 20 },    // Platform
                    { x: 550, y: 250, width: 150, height: 20 }     // Platform
                ],
                enemies: [
                    { x: 300, y: 410, width: 24, height: 24, vx: -100, type: 'goomba' },
                    { x: 600, y: 410, width: 24, height: 24, vx: -80, type: 'goomba' }
                ],
                coins: [
                    { x: 180, y: 400, collected: false },
                    { x: 220, y: 400, collected: false },
                    { x: 480, y: 320, collected: false },
                    { x: 520, y: 320, collected: false },
                    { x: 240, y: 250, collected: false }
                ],
                goal: { x: 700, y: 490, width: 40, height: 50 }
            },
            {
                name: 'Mountain Challenge',
                platforms: [
                    { x: 0, y: 540, width: 800, height: 60 },
                    { x: 100, y: 420, width: 120, height: 20 },
                    { x: 280, y: 360, width: 120, height: 20 },
                    { x: 460, y: 300, width: 120, height: 20 },
                    { x: 640, y: 240, width: 120, height: 20 }
                ],
                enemies: [
                    { x: 150, y: 380, width: 24, height: 24, vx: -120, type: 'goomba' },
                    { x: 330, y: 320, width: 24, height: 24, vx: -100, type: 'goomba' },
                    { x: 510, y: 260, width: 24, height: 24, vx: -90, type: 'goomba' }
                ],
                coins: [
                    { x: 150, y: 370, collected: false },
                    { x: 330, y: 310, collected: false },
                    { x: 510, y: 250, collected: false },
                    { x: 690, y: 190, collected: false }
                ],
                goal: { x: 700, y: 190, width: 40, height: 50 }
            },
            {
                name: 'Floating Isles',
                platforms: [
                    { x: 0, y: 540, width: 200, height: 60 },
                    { x: 250, y: 450, width: 150, height: 20 },
                    { x: 450, y: 380, width: 150, height: 20 },
                    { x: 200, y: 300, width: 120, height: 20 },
                    { x: 450, y: 250, width: 120, height: 20 },
                    { x: 700, y: 190, width: 150, height: 20 }
                ],
                enemies: [
                    { x: 280, y: 410, width: 24, height: 24, vx: -110, type: 'goomba' },
                    { x: 480, y: 340, width: 24, height: 24, vx: 100, type: 'goomba' },
                    { x: 230, y: 260, width: 24, height: 24, vx: -95, type: 'goomba' },
                    { x: 700, y: 150, width: 24, height: 24, vx: 85, type: 'goomba' }
                ],
                coins: [
                    { x: 280, y: 400, collected: false },
                    { x: 480, y: 330, collected: false },
                    { x: 350, y: 270, collected: false },
                    { x: 480, y: 200, collected: false },
                    { x: 725, y: 140, collected: false }
                ],
                goal: { x: 730, y: 140, width: 40, height: 50 }
            },
            {
                name: 'Fortress Tower',
                platforms: [
                    { x: 0, y: 540, width: 300, height: 60 },
                    { x: 350, y: 480, width: 100, height: 20 },
                    { x: 250, y: 420, width: 100, height: 20 },
                    { x: 450, y: 360, width: 100, height: 20 },
                    { x: 300, y: 300, width: 80, height: 20 },
                    { x: 500, y: 250, width: 100, height: 20 },
                    { x: 350, y: 180, width: 80, height: 20 }
                ],
                enemies: [
                    { x: 370, y: 440, width: 24, height: 24, vx: -130, type: 'goomba' },
                    { x: 270, y: 380, width: 24, height: 24, vx: 110, type: 'goomba' },
                    { x: 470, y: 320, width: 24, height: 24, vx: -105, type: 'goomba' },
                    { x: 320, y: 260, width: 24, height: 24, vx: 100, type: 'goomba' },
                    { x: 520, y: 210, width: 24, height: 24, vx: -95, type: 'goomba' }
                ],
                coins: [
                    { x: 370, y: 430, collected: false },
                    { x: 270, y: 370, collected: false },
                    { x: 470, y: 310, collected: false },
                    { x: 320, y: 250, collected: false },
                    { x: 520, y: 200, collected: false },
                    { x: 360, y: 130, collected: false }
                ],
                goal: { x: 350, y: 130, width: 40, height: 50 }
            },
            {
                name: 'Cave Escape',
                platforms: [
                    { x: 0, y: 540, width: 150, height: 60 },
                    { x: 100, y: 450, width: 120, height: 20 },
                    { x: 280, y: 380, width: 150, height: 20 },
                    { x: 480, y: 320, width: 120, height: 20 },
                    { x: 200, y: 250, width: 100, height: 20 },
                    { x: 580, y: 200, width: 150, height: 20 },
                    { x: 350, y: 150, width: 120, height: 20 }
                ],
                enemies: [
                    { x: 120, y: 410, width: 24, height: 24, vx: 115, type: 'goomba' },
                    { x: 310, y: 340, width: 24, height: 24, vx: -120, type: 'goomba' },
                    { x: 500, y: 280, width: 24, height: 24, vx: 100, type: 'goomba' },
                    { x: 220, y: 210, width: 24, height: 24, vx: -105, type: 'goomba' },
                    { x: 610, y: 160, width: 24, height: 24, vx: 90, type: 'goomba' }
                ],
                coins: [
                    { x: 120, y: 400, collected: false },
                    { x: 310, y: 330, collected: false },
                    { x: 500, y: 270, collected: false },
                    { x: 220, y: 200, collected: false },
                    { x: 610, y: 150, collected: false },
                    { x: 370, y: 100, collected: false }
                ],
                goal: { x: 350, y: 100, width: 40, height: 50 }
            },
            {
                name: 'Sky Bridge Challenge',
                platforms: [
                    { x: 0, y: 540, width: 180, height: 60 },
                    { x: 80, y: 420, width: 100, height: 20 },
                    { x: 220, y: 380, width: 100, height: 20 },
                    { x: 380, y: 340, width: 100, height: 20 },
                    { x: 540, y: 300, width: 100, height: 20 },
                    { x: 300, y: 240, width: 100, height: 20 },
                    { x: 500, y: 180, width: 150, height: 20 }
                ],
                enemies: [
                    { x: 100, y: 380, width: 24, height: 24, vx: -125, type: 'goomba' },
                    { x: 240, y: 340, width: 24, height: 24, vx: 115, type: 'goomba' },
                    { x: 400, y: 300, width: 24, height: 24, vx: -110, type: 'goomba' },
                    { x: 560, y: 260, width: 24, height: 24, vx: 105, type: 'goomba' },
                    { x: 320, y: 200, width: 24, height: 24, vx: -100, type: 'goomba' },
                    { x: 550, y: 140, width: 24, height: 24, vx: 95, type: 'goomba' }
                ],
                coins: [
                    { x: 100, y: 370, collected: false },
                    { x: 240, y: 330, collected: false },
                    { x: 400, y: 290, collected: false },
                    { x: 560, y: 250, collected: false },
                    { x: 320, y: 190, collected: false },
                    { x: 550, y: 130, collected: false },
                    { x: 625, y: 130, collected: false }
                ],
                goal: { x: 575, y: 130, width: 40, height: 50 }
            },
            {
                name: 'Final Castle',
                platforms: [
                    { x: 0, y: 540, width: 200, height: 60 },
                    { x: 100, y: 440, width: 130, height: 20 },
                    { x: 300, y: 370, width: 130, height: 20 },
                    { x: 500, y: 300, width: 130, height: 20 },
                    { x: 200, y: 240, width: 100, height: 20 },
                    { x: 450, y: 190, width: 130, height: 20 },
                    { x: 300, y: 120, width: 100, height: 20 }
                ],
                enemies: [
                    { x: 130, y: 400, width: 24, height: 24, vx: 120, type: 'goomba' },
                    { x: 330, y: 330, width: 24, height: 24, vx: -135, type: 'goomba' },
                    { x: 530, y: 260, width: 24, height: 24, vx: 125, type: 'goomba' },
                    { x: 220, y: 200, width: 24, height: 24, vx: -115, type: 'goomba' },
                    { x: 480, y: 150, width: 24, height: 24, vx: 110, type: 'goomba' },
                    { x: 330, y: 80, width: 24, height: 24, vx: -100, type: 'goomba' }
                ],
                coins: [
                    { x: 130, y: 390, collected: false },
                    { x: 330, y: 320, collected: false },
                    { x: 530, y: 250, collected: false },
                    { x: 220, y: 190, collected: false },
                    { x: 480, y: 140, collected: false },
                    { x: 330, y: 70, collected: false }
                ],
                goal: { x: 310, y: 70, width: 40, height: 50 }
            }
        ];
        
        this.currentLevelConfig = this.levelConfigs[0];
        this.levelIntroTime = 0;
        
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
        
        // Continuous key tracking for smooth controls
        this.keysPressed = new Set();
        
        window.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                e.preventDefault();
                this.keysPressed.add('left');
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                e.preventDefault();
                this.keysPressed.add('right');
            }
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                // Jump request (handled in update)
                this.player.jumpRequested = true;
                this.player.jumpBufferTime = 0.1; // Jump buffer window
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.keysPressed.delete('left');
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.keysPressed.delete('right');
            }
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                // Jump key released - cut jump short if still rising
                this.player.jumpEngageTime = 0;
            }
        });
    }
    
    createLevel() {
        const levelIndex = Math.min(this.level - 1, this.levelConfigs.length - 1);
        this.currentLevelConfig = this.levelConfigs[levelIndex];
        
        // Copy platforms
        this.platforms = JSON.parse(JSON.stringify(this.currentLevelConfig.platforms));
        
        // Copy enemies
        this.enemies = JSON.parse(JSON.stringify(this.currentLevelConfig.enemies));
        
        // Copy coins
        this.coins_collectible = JSON.parse(JSON.stringify(this.currentLevelConfig.coins));
        
        // Set goal
        this.goal = { ...this.currentLevelConfig.goal };
        
        // Reset player
        this.player.x = 50;
        this.player.y = 300;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.onGround = false;
        this.player.jumpReady = false;
        this.player.coyoteTime = 0;
        this.player.state = 'idle';
        
        // Clear particles
        this.particles = [];
        
        this.levelIntroTime = 120; // 2 seconds at 60fps
    }
    
    updatePlayerMovement() {
        const dt = 1 / 60;
        
        // Horizontal movement input
        let moveInput = 0;
        if (this.keysPressed.has('left')) {
            moveInput = -1;
            this.player.direction = -1;
        }
        if (this.keysPressed.has('right')) {
            moveInput = 1;
            this.player.direction = 1;
        }
        
        // Smooth horizontal acceleration (like Super Mario)
        const targetVx = moveInput * 150 * this.speedMultiplier;
        const accelRate = this.player.onGround ? this.PHYSICS.friction : 0.95;
        
        if (this.player.onGround) {
            // Ground friction and acceleration
            this.player.vx += (targetVx - this.player.vx) * 0.2;
        } else {
            // Air control (less responsive)
            this.player.vx += (targetVx - this.player.vx) * 0.1;
        }
        
        // Clamp velocity
        this.player.vx = Math.max(-200, Math.min(200, this.player.vx));
        
        // Update animation state
        if (Math.abs(this.player.vx) > 10) {
            this.player.state = this.player.onGround ? 'running' : 'jumping';
            this.player.animationFrame = (this.player.animationFrame + 0.1) % 4;
        } else {
            this.player.state = this.player.onGround ? 'idle' : 'falling';
            this.player.animationFrame = 0;
        }
    }
    
    updateJumpPhysics() {
        const dt = 1 / 60;
        
        // Coyote time: allows jump for a few frames after leaving ground
        if (this.player.onGround || this.player.onWall) {
            this.player.coyoteTime = 6; // 6 frames of coyote time
            this.player.jumpReady = true;
        } else {
            this.player.coyoteTime--;
            if (this.player.coyoteTime <= 0) {
                this.player.jumpReady = false;
            }
        }
        
        // Jump request handling (with jump buffer)
        if (this.player.jumpRequested) {
            this.player.jumpBufferTime -= dt;
            
            if (this.player.jumpReady && this.player.jumpBufferTime > 0) {
                // Initiate jump
                if (this.player.onWall && this.player.wallSide) {
                    // Wall jump: boost away from wall
                    this.player.vy = this.PHYSICS.wallJumpPower;
                    this.player.vx = this.PHYSICS.wallJumpSideVelocity * (this.player.wallSide === 'left' ? 1 : -1);
                    this.createParticles(this.player.x, this.player.y + this.player.height, 'wall-jump');
                } else {
                    // Normal jump
                    this.player.vy = this.PHYSICS.jumpPower;
                    this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height, 'jump');
                }
                
                this.player.jumpEngageTime = this.PHYSICS.jumpHoldTime;
                this.player.jumpRequested = false;
                this.player.jumpReady = false;
                this.audio.playSFX('jump');
            }
            
            if (this.player.jumpBufferTime <= 0) {
                this.player.jumpRequested = false;
            }
        }
        
        // Hold-to-jump: extend jump height if jump key held
        if (this.player.jumpEngageTime > 0) {
            this.player.vy = this.PHYSICS.jumpPower;
            this.player.jumpEngageTime -= dt;
        }
        
        // Apply gravity with terminal velocity
        this.player.vy += this.PHYSICS.gravity * dt;
        this.player.vy = Math.min(this.player.vy, this.PHYSICS.maxFallSpeed);
    }
    
    updatePlayerPhysics() {
        const dt = 1 / 60;
        
        // Update position
        this.player.x += this.player.vx * dt;
        this.player.y += this.player.vy * dt;
        
        // Reset ground/wall states
        this.player.onGround = false;
        this.player.onWall = false;
        
        // Platform collision detection
        for (let platform of this.platforms) {
            // Collision check
            if (this.player.x + this.player.width > platform.x &&
                this.player.x < platform.x + platform.width &&
                this.player.y + this.player.height > platform.y &&
                this.player.y + this.player.height < platform.y + platform.height + 10 &&
                this.player.vy >= 0) {
                
                // Landing on platform
                this.player.y = platform.y - this.player.height;
                this.player.vy = 0;
                this.player.onGround = true;
                this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height, 'land');
            }
            
            // Wall collision (allow sliding down walls)
            if (this.player.x + this.player.width > platform.x &&
                this.player.x < platform.x + platform.width &&
                this.player.y < platform.y + platform.height &&
                this.player.y + this.player.height > platform.y) {
                
                // Check which side we hit
                if (this.player.vx > 0) {
                    // Hit right side
                    this.player.x = platform.x - this.player.width;
                    this.player.vx = 0;
                    this.player.onWall = true;
                    this.player.wallSide = 'left';
                } else if (this.player.vx < 0) {
                    // Hit left side
                    this.player.x = platform.x + platform.width;
                    this.player.vx = 0;
                    this.player.onWall = true;
                    this.player.wallSide = 'right';
                }
            }
        }
        
        // Wall slide physics
        if (this.player.onWall && this.player.vy > 0) {
            this.player.vy *= this.PHYSICS.wallFriction;
            this.player.state = 'wallslide';
        }
        
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
    }
    
    updateEnemies() {
        for (let enemy of this.enemies) {
            // Move enemy
            enemy.x += enemy.vx * this.speedMultiplier / 60;
            
            // Bounce off edges
            if (enemy.x < 0 || enemy.x + enemy.width > this.canvas.width) {
                enemy.vx *= -1;
            }
            
            // Check collision with player
            if (this.player.x + this.player.width > enemy.x &&
                this.player.x < enemy.x + enemy.width &&
                this.player.y + this.player.height > enemy.y &&
                this.player.y < enemy.y + enemy.height) {
                
                // Jump on enemy to defeat it
                if (this.player.vy > 0 && this.player.y + this.player.height - enemy.y < 15) {
                    // Bounce off enemy
                    this.player.vy = -200;
                    this.score += 100;
                    this.createParticles(enemy.x, enemy.y, 'enemy-defeat');
                    enemy.defeated = true;
                    this.audio.playSFX('collect');
                } else {
                    // Hit by enemy
                    this.lives--;
                    this.audio.playSFX('die');
                    if (this.lives <= 0) {
                        this.gameState = 'gameOver';
                    } else {
                        this.createLevel();
                    }
                }
            }
        }
        
        // Remove defeated enemies
        this.enemies = this.enemies.filter(e => !e.defeated);
    }
    
    updateCoins() {
        for (let coin of this.coins_collectible) {
            if (coin.collected) continue;
            
            if (this.player.x + this.player.width > coin.x &&
                this.player.x < coin.x + 16 &&
                this.player.y + this.player.height > coin.y &&
                this.player.y < coin.y + 16) {
                
                coin.collected = true;
                this.coins++;
                this.score += 10;
                this.createParticles(coin.x + 8, coin.y + 8, 'coin-collect');
                this.audio.playSFX('collect');
            }
        }
    }
    
    updateGoal() {
        if (this.player.x + this.player.width > this.goal.x &&
            this.player.x < this.goal.x + this.goal.width &&
            this.player.y + this.player.height > this.goal.y &&
            this.player.y < this.goal.y + this.goal.height) {
            
            this.level++;
            this.score += 500;
            this.audio.playSFX('win');
            
            if (this.level > this.levelConfigs.length) {
                this.gameState = 'victory';
                this.audio.playMusic('win');
            } else {
                this.createLevel();
            }
        }
    }
    
    createParticles(x, y, type) {
        if (type === 'jump') {
            // Jump particles (small burst below player)
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI / 4) + (i * Math.PI / 2);
                const speed = 100 + Math.random() * 50;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.3,
                    maxLife: 0.3,
                    radius: 3,
                    color: '#FFD700'
                });
            }
        } else if (type === 'land') {
            // Landing dust particles
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: x + (Math.random() - 0.5) * 20,
                    y: y,
                    vx: (Math.random() - 0.5) * 100,
                    vy: -50 - Math.random() * 50,
                    life: 0.4,
                    maxLife: 0.4,
                    radius: 2,
                    color: '#8B7355'
                });
            }
        } else if (type === 'coin-collect') {
            // Coin collection sparkles
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
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
        } else if (type === 'enemy-defeat') {
            // Enemy defeat explosion
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
        } else if (type === 'wall-jump') {
            // Wall jump particles
            for (let i = 0; i < 5; i++) {
                this.particles.push({
                    x: x,
                    y: y + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 200,
                    vy: -100 - Math.random() * 100,
                    life: 0.3,
                    maxLife: 0.3,
                    radius: 2,
                    color: '#00FFFF'
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
        
        this.updatePlayerMovement();
        this.updateJumpPhysics();
        this.updatePlayerPhysics();
        this.updateEnemies();
        this.updateCoins();
        this.updateGoal();
        this.updateParticles();
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(135, 206, 235, 0.9)'; // Sky blue
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw platforms
        this.ctx.fillStyle = '#228B22';
        for (let platform of this.platforms) {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            // Platform edge highlight
            this.ctx.fillStyle = '#32CD32';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
            this.ctx.fillStyle = '#228B22';
        }
        
        // Draw goal flag
        this.ctx.fillStyle = '#FF1654';
        this.ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⛳', this.goal.x + this.goal.width / 2, this.goal.y + this.goal.height / 2 + 5);
        
        // Draw enemies (goombas)
        this.ctx.fillStyle = '#8B4513';
        for (let enemy of this.enemies) {
            this.ctx.beginPath();
            this.ctx.ellipse(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 
                            enemy.width / 2, enemy.height / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Eyes
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(enemy.x + 6, enemy.y + 6, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(enemy.x + enemy.width - 6, enemy.y + 6, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#8B4513';
        }
        
        // Draw coins
        this.ctx.fillStyle = '#FFD700';
        for (let coin of this.coins_collectible) {
            if (!coin.collected) {
                this.ctx.beginPath();
                this.ctx.arc(coin.x + 8, coin.y + 8, 6, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Draw player (Mario-like character)
        this.ctx.fillStyle = '#FF0000';
        // Body
        this.ctx.fillRect(this.player.x + 4, this.player.y + 8, 16, 16);
        // Head
        this.ctx.fillStyle = '#FFDBAC';
        this.ctx.fillRect(this.player.x + 2, this.player.y, 20, 8);
        // Eyes
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(this.player.x + 6, this.player.y + 2, 2, 3);
        this.ctx.fillRect(this.player.x + 14, this.player.y + 2, 2, 3);
        // Legs animation
        this.ctx.fillStyle = '#0066CC';
        const legOffset = Math.sin(this.player.animationFrame * Math.PI) * 2;
        this.ctx.fillRect(this.player.x + 6, this.player.y + 24, 4, 8 + legOffset);
        this.ctx.fillRect(this.player.x + 14, this.player.y + 24, 4, 8 - legOffset);
        
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
        
        // Draw HUD
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 40);
        this.ctx.fillText(`Coins: ${this.coins}`, 20, 70);
        this.ctx.fillText(`Level: ${this.level}`, 20, 100);
        this.ctx.fillText(`Lives: ${this.lives}`, 20, 130);
        
        // Level intro
        if (this.levelIntroTime > 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Level ${this.level}: ${this.currentLevelConfig.name}`, 
                             this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.font = '24px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(this.currentLevelConfig.platforms ? 'Ready?' : '', 
                             this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.level = 1;
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
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
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = 'bold 56px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER!', this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '32px Arial';
            this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
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
            this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
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
        this.ctx.fillStyle = 'rgba(135, 206, 235, 0.95)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = 'bold 56px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎮 SUPER MARIO', this.canvas.width / 2, 100);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Run, Jump, and Collect Coins!', this.canvas.width / 2, 300);
        this.ctx.fillText('Arrow Keys or WASD to move', this.canvas.width / 2, 350);
        this.ctx.fillText('Space/Up to jump (Hold for higher jump)', this.canvas.width / 2, 400);
        this.ctx.fillText('Jump on enemies to defeat them', this.canvas.width / 2, 450);
    }
}

window.addEventListener('load', () => new SuperMarioGame());
