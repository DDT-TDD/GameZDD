// Marble Chain (Zuma) Game - Complete Implementation
class MarbleChainGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game managers
        this.audio = new AudioManager();
        this.input = new InputHandler();
        this.save = new SaveManager('marble-chain');
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.gameState = 'menu';
        this.speedMultiplier = 1.0;
        this.combo = 0;
        this.highestCombo = 0;
        
        // Marble properties - Enhanced for 7-year-old visibility
        this.marbleRadius = 20;  // INCREASED from 16 to 20 (+25% size) for better visibility
        this.marbleColors = ['#FF6347', '#FFD700', '#00FF00', '#0099FF', '#FF00FF', '#FF8C00'];
        
        // Level configurations with clear missions
        this.levelConfigs = [
            { name: 'Temple Entrance', pattern: 'spiral', marbles: 15, speed: 0.6, mission: 'Clear 15 marbles to enter the temple!' },
            { name: 'Sacred Path', pattern: 'snake', marbles: 20, speed: 0.7, mission: 'Navigate the sacred snake path!' },
            { name: 'Golden Chamber', pattern: 'zigzag', marbles: 25, speed: 0.8, mission: 'Destroy the golden marble chain!' },
            { name: 'Crystal Cave', pattern: 'spiral', marbles: 30, speed: 0.9, mission: 'Shatter the crystal formations!' },
            { name: 'Dragon\'s Lair', pattern: 'double-spiral', marbles: 35, speed: 1.0, mission: 'Face the dragon\'s marble horde!' },
            { name: 'Ancient Ruins', pattern: 'complex', marbles: 40, speed: 1.1, mission: 'Uncover the ancient secrets!' },
            { name: 'Fire Temple', pattern: 'snake', marbles: 45, speed: 1.2, mission: 'Survive the flames of challenge!' },
            { name: 'Final Gauntlet', pattern: 'chaos', marbles: 50, speed: 1.3, mission: 'Master the ultimate test!' }
        ];
        
        // Particle system for visual effects
        this.particles = [];
        
        // Path points (curved path from top to bottom)
        this.pathPoints = this.generatePath();
        this.marbles = [];
        
        // Player shooter
        this.shooter = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 40,
            angle: -Math.PI / 2,
            angle_min: -Math.PI + 0.3,
            angle_max: -0.3,
            width: 30,
            height: 30
        };
        
        this.activeMarble = null;
        this.shotSpeed = 4.2;  // REDUCED from 6 to 4.2 (-30% speed) for better control
        
        // Physics properties for realistic shot marble movement
        this.PHYSICS = {
            gravity: 0.08,           // REDUCED from 0.12 - gentler gravity for slower arc
            damping: 0.997,          // INCREASED from 0.995 - better momentum preservation
            airResistance: 0.98,     // Additional air friction
            trajectoryDuration: 3    // Frames before marble settles on path
        };
        
        // Game timing
        this.marbleSpeed = 0.8;
        this.spawnInterval = 120;
        this.spawnCounter = 0;
        this.lastTime = 0;
        this.animatingMarbles = new Map(); // Track marbles settling into path
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadGame();
        this.drawMenu();
    }
    
    generatePath(pattern = 'spiral') {
        const points = [];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const pointCount = 120;
        
        switch(pattern) {
            case 'spiral':
                // Classic inward spiral
                for (let i = 0; i < pointCount; i++) {
                    const t = i / pointCount;
                    const angle = t * Math.PI * 5;
                    const radius = 250 * (1 - t * 0.8);
                    points.push({
                        x: centerX + Math.cos(angle) * radius,
                        y: 50 + Math.sin(angle) * radius + t * 600
                    });
                }
                break;
                
            case 'snake':
                // Winding snake pattern
                for (let i = 0; i < pointCount; i++) {
                    const t = i / pointCount;
                    const waveFreq = 4;
                    points.push({
                        x: centerX + Math.sin(t * Math.PI * waveFreq) * 200,
                        y: 50 + t * 700
                    });
                }
                break;
                
            case 'zigzag':
                // Sharp zigzag pattern
                for (let i = 0; i < pointCount; i++) {
                    const t = i / pointCount;
                    const segment = Math.floor(t * 8);
                    const segmentT = (t * 8) - segment;
                    const direction = segment % 2 === 0 ? 1 : -1;
                    points.push({
                        x: centerX + direction * segmentT * 250,
                        y: 50 + t * 700
                    });
                }
                break;
                
            case 'double-spiral':
                // Two intertwined spirals
                for (let i = 0; i < pointCount; i++) {
                    const t = i / pointCount;
                    const angle = t * Math.PI * 6;
                    const radius = 180 * Math.sin(t * Math.PI * 2);
                    points.push({
                        x: centerX + Math.cos(angle) * radius,
                        y: 50 + t * 700
                    });
                }
                break;
                
            case 'complex':
                // Complex curved path with multiple bends
                for (let i = 0; i < pointCount; i++) {
                    const t = i / pointCount;
                    const x = Math.sin(t * Math.PI * 3) * 220;
                    const y = Math.cos(t * Math.PI * 2) * 80;
                    points.push({
                        x: centerX + x,
                        y: 50 + t * 600 + y
                    });
                }
                break;
                
            case 'chaos':
                // Chaotic path for final levels
                for (let i = 0; i < pointCount; i++) {
                    const t = i / pointCount;
                    const chaos1 = Math.sin(t * Math.PI * 5) * 180;
                    const chaos2 = Math.cos(t * Math.PI * 7) * 120;
                    points.push({
                        x: centerX + chaos1 + Math.sin(t * Math.PI * 11) * 50,
                        y: 50 + t * 600 + chaos2
                    });
                }
                break;
                
            default:
                // Default to spiral
                return this.generatePath('spiral');
        }
        
        return points;
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
            this.marbleSpeed = 0.8 * this.speedMultiplier;
            this.shotSpeed = 4.2 * this.speedMultiplier;  // FIX: Updated from 6 to 4.2 (-30% speed)
        });
        
        // Continuous key tracking for smooth aiming (like Puzzle Bubble)
        this.keysPressed = new Set();
        this.targetAngle = this.shooter.angle;
        
        // FIX: Add canvas click support for shooting (major usability improvement)
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === 'playing') {
                e.preventDefault();
                this.shootMarble();
            }
        });
        
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
            if (e.code === 'Space') {
                e.preventDefault();
                this.shootMarble();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.keysPressed.delete('left');
            }
            if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.keysPressed.delete('right');
            }
        });
    }
    
    updateShooterAngle() {
        // Update target angle based on held keys
        const angleSpeed = 0.04;
        if (this.keysPressed.has('left')) {
            this.targetAngle = Math.max(this.targetAngle - angleSpeed, this.shooter.angle_min);
        }
        if (this.keysPressed.has('right')) {
            this.targetAngle = Math.min(this.targetAngle + angleSpeed, this.shooter.angle_max);
        }
        
        // Smooth interpolation to target angle (lerp at 0.12 speed)
        const lerpSpeed = 0.12;
        this.shooter.angle += (this.targetAngle - this.shooter.angle) * lerpSpeed;
    }
    
    shootMarble() {
        if (this.activeMarble) return;
        
        const randomColor = this.marbleColors[Math.floor(Math.random() * this.marbleColors.length)];
        this.activeMarble = {
            x: this.shooter.x,
            y: this.shooter.y,
            vx: Math.cos(this.shooter.angle) * this.shotSpeed,
            vy: Math.sin(this.shooter.angle) * this.shotSpeed,
            color: randomColor,
            radius: this.marbleRadius,
            // Physics tracking: marble will settle into path after decay animation
            isSettling: false,
            settleTime: 0,
            settleMaxTime: this.PHYSICS.trajectoryDuration,
            startX: this.shooter.x,
            startY: this.shooter.y
        };
        this.audio.playSFX('shoot');
    }
    
    updateActiveMarble() {
        if (!this.activeMarble) return;
        
        // Apply physics: gravity and damping
        this.activeMarble.vy += this.PHYSICS.gravity;  // Apply gravity
        this.activeMarble.vx *= this.PHYSICS.damping;  // Velocity damping
        this.activeMarble.vy *= this.PHYSICS.damping;
        
        // Update position with velocity
        this.activeMarble.x += this.activeMarble.vx;
        this.activeMarble.y += this.activeMarble.vy;
        
        // Create trailing particles for trajectory visualization
        if (Math.random() < 0.4) {
            this.createTrailParticle(this.activeMarble.x, this.activeMarble.y, this.activeMarble.color);
        }
        
        // Check if out of bounds
        if (this.activeMarble.x < 0 || this.activeMarble.x > this.canvas.width ||
            this.activeMarble.y < 0 || this.activeMarble.y > this.canvas.height) {
            this.activeMarble = null;
            return;
        }
        
        // Check collision with path marbles
        for (let i = 0; i < this.marbles.length; i++) {
            const dist = Math.hypot(
                this.activeMarble.x - this.marbles[i].x,
                this.activeMarble.y - this.marbles[i].y
            );
            
            if (dist < this.marbleRadius * 2) {
                // Find closest position on path and insert marble
                let closestIdx = 0;
                let closestDist = Infinity;
                
                for (let j = 0; j < this.marbles.length; j++) {
                    const d = Math.hypot(this.activeMarble.x - this.marbles[j].x, this.activeMarble.y - this.marbles[j].y);
                    if (d < closestDist) {
                        closestDist = d;
                        closestIdx = j;
                    }
                }
                
                // Insert new marble into array with settling animation
                const newMarble = {
                    x: this.activeMarble.x,
                    y: this.activeMarble.y,
                    color: this.activeMarble.color,
                    pathProgress: closestIdx + 0.5,
                    radius: this.marbleRadius,
                    // Animation properties
                    targetPathProgress: closestIdx + 0.5,
                    isAnimating: true,
                    animationProgress: 0
                };
                this.marbles.splice(closestIdx + 1, 0, newMarble);
                this.animatingMarbles.set(newMarble, { start: performance.now() });
                
                this.activeMarble = null;
                this.checkMatches();
                this.audio.playSFX('match');
                return;
            }
        }
    }
    
    checkMatches() {
        let matched = true;
        let totalMatchesThisTurn = 0;
        
        while (matched) {
            matched = false;
            
            for (let i = 0; i < this.marbles.length - 2; i++) {
                if (this.marbles[i].color === this.marbles[i + 1].color && 
                    this.marbles[i + 1].color === this.marbles[i + 2].color) {
                    
                    // Found 3+ in a row, count them
                    let j = i;
                    const matchColor = this.marbles[i].color;
                    
                    while (j < this.marbles.length && this.marbles[j].color === matchColor) {
                        j++;
                    }
                    
                    const matchCount = j - i;
                    totalMatchesThisTurn += matchCount;
                    
                    // Create particle explosions with intensity based on match count
                    for (let k = i; k < j; k++) {
                        this.createParticleExplosion(this.marbles[k].x, this.marbles[k].y, matchColor);
                        
                        // Extra particles for big matches (5+)
                        if (matchCount >= 5) {
                            this.createParticleExplosion(this.marbles[k].x, this.marbles[k].y, matchColor);
                        }
                    }
                    
                    // Award points with enhanced combo multiplier (2x-5x based on combo level)
                    this.combo++;
                    const comboMultiplier = Math.min(1 + (this.combo * 0.4), 5);  // 1x to 5x
                    const basePoints = matchCount * 15;
                    const comboBonus = Math.floor(basePoints * (comboMultiplier - 1));
                    const points = basePoints + comboBonus;
                    this.score += points;
                    
                    // Track highest combo
                    if (this.combo > this.highestCombo) {
                        this.highestCombo = this.combo;
                    }
                    
                    // Remove matched marbles
                    this.marbles.splice(i, matchCount);
                    matched = true;
                    this.audio.playSFX('collect');
                    break;
                }
            }
        }
        
        // Reset combo if no matches
        if (totalMatchesThisTurn === 0) {
            this.combo = 0;
        }
        
        // Check if all marbles cleared
        if (this.marbles.length === 0) {
            this.level++;
            this.score += 500;
            this.audio.playSFX('win');
            
            // Check if all levels completed
            if (this.level > this.levelConfigs.length) {
                this.gameState = 'victory';
                this.audio.playMusic('win');
            } else {
                this.createLevel();
            }
        }
    }
    
    createParticleExplosion(x, y, color) {
        // Create 12 particles radiating outward
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                life: 30 + Math.random() * 20, // 30-50 frames
                maxLife: 50,
                radius: 3 + Math.random() * 3,
                type: 'burst'
            });
        }
    }
    
    createTrailParticle(x, y, color) {
        // Create trailing particles that fade out behind shot marble
        const speed = 0.3 + Math.random() * 0.5;
        const angle = Math.atan2(0, 1) + (Math.random() - 0.5) * 0.3;
        
        this.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            life: 15 + Math.random() * 10,   // 15-25 frames
            maxLife: 25,
            radius: 2 + Math.random() * 2,
            type: 'trail'
        });
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Apply gravity
            p.vy += 0.2;
            
            // Fade out
            p.life--;
            
            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateMarbles() {
        // Move marbles along path
        for (let marble of this.marbles) {
            marble.pathProgress += this.marbleSpeed * this.speedMultiplier;
            
            // Check if marble reached end
            if (marble.pathProgress >= this.pathPoints.length - 1) {
                this.gameState = 'gameOver';
                this.audio.playSFX('die');
                return;
            }
            
            // Update position based on path progress
            const idx = Math.floor(marble.pathProgress);
            const progress = marble.pathProgress - idx;
            
            if (idx < this.pathPoints.length - 1) {
                const p1 = this.pathPoints[idx];
                const p2 = this.pathPoints[idx + 1];
                marble.x = p1.x + (p2.x - p1.x) * progress;
                marble.y = p1.y + (p2.y - p1.y) * progress;
            }
        }
    }
    
    createLevel() {
        // Get level configuration
        const levelIndex = Math.min(this.level - 1, this.levelConfigs.length - 1);
        const config = this.levelConfigs[levelIndex];
        
        // Generate path based on level pattern
        this.pathPoints = this.generatePath(config.pattern);
        
        // Reset game state
        this.marbles = [];
        this.activeMarble = null;
        this.spawnCounter = 0;
        this.combo = 0;
        this.marbleSpeed = config.speed * this.speedMultiplier;
        
        // Spawn initial marbles with strategic color patterns for combos
        const initialCount = config.marbles;
        const colorSequence = [];
        
        // Create color patterns that encourage combos (groups of 2-4 same colors)
        for (let i = 0; i < initialCount; i++) {
            if (i % 5 === 0) {
                // Start new color group
                const newColor = this.marbleColors[Math.floor(Math.random() * this.marbleColors.length)];
                const groupSize = 2 + Math.floor(Math.random() * 3); // 2-4 marbles
                for (let j = 0; j < groupSize && colorSequence.length < initialCount; j++) {
                    colorSequence.push(newColor);
                }
            }
        }
        
        // Fill remaining with random colors
        while (colorSequence.length < initialCount) {
            colorSequence.push(this.marbleColors[Math.floor(Math.random() * this.marbleColors.length)]);
        }
        
        // Place marbles on path
        for (let i = 0; i < initialCount; i++) {
            this.marbles.push({
                x: this.pathPoints[Math.min(i, this.pathPoints.length - 1)].x,
                y: this.pathPoints[Math.min(i, this.pathPoints.length - 1)].y,
                color: colorSequence[i],
                pathProgress: i,
                radius: this.marbleRadius
            });
        }
        
        // Show level intro message
        this.showLevelIntro(config);
    }
    
    showLevelIntro(config) {
        // Display level intro for 2 seconds
        this.levelIntroTime = 120; // frames
        this.currentLevelConfig = config;
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
            this.updateShooterAngle();  // Smooth aiming system
            this.updateActiveMarble();
            this.updateMarbles();
            this.updateParticles();
        }
        
        this.draw();
        
        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FF1654';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2 + 50);
            return;
        }
        
        if (this.gameState === 'victory') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Victory message
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 56px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#FFD700';
            this.ctx.fillText('🏆 VICTORY! 🏆', this.canvas.width / 2, this.canvas.height / 2 - 50);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.shadowBlur = 0;
            this.ctx.fillText('All Levels Completed!', this.canvas.width / 2, this.canvas.height / 2 + 20);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Final Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2 + 70);
            this.ctx.fillText('Highest Combo: ' + this.highestCombo, this.canvas.width / 2, this.canvas.height / 2 + 110);
            return;
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw path (faint guideline)
        this.ctx.strokeStyle = 'rgba(255, 22, 84, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            this.ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        this.ctx.stroke();
        
        // Draw marbles on path with glow effect
        for (let marble of this.marbles) {
            // Enhanced glow effect during combos
            const glowIntensity = this.combo > 0 ? 25 + (this.combo * 3) : 20;
            this.ctx.shadowBlur = glowIntensity;
            this.ctx.shadowColor = marble.color;
            
            // Outer glow circle
            this.ctx.fillStyle = marble.color;
            this.ctx.globalAlpha = 0.3;
            this.ctx.beginPath();
            this.ctx.arc(marble.x, marble.y, marble.radius + 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Main marble
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = marble.color;
            this.ctx.beginPath();
            this.ctx.arc(marble.x, marble.y, marble.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Highlight
            const gradient = this.ctx.createRadialGradient(
                marble.x - marble.radius/3, marble.y - marble.radius/3, 0,
                marble.x, marble.y, marble.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(marble.x, marble.y, marble.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Border
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(marble.x, marble.y, marble.radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw active marble with stronger glow
        if (this.activeMarble) {
            this.ctx.shadowBlur = 30;
            this.ctx.shadowColor = this.activeMarble.color;
            
            // Outer glow
            this.ctx.fillStyle = this.activeMarble.color;
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.ctx.arc(this.activeMarble.x, this.activeMarble.y, this.activeMarble.radius + 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Main marble
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = this.activeMarble.color;
            this.ctx.beginPath();
            this.ctx.arc(this.activeMarble.x, this.activeMarble.y, this.activeMarble.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Highlight
            const gradient = this.ctx.createRadialGradient(
                this.activeMarble.x - this.activeMarble.radius/3, 
                this.activeMarble.y - this.activeMarble.radius/3, 0,
                this.activeMarble.x, this.activeMarble.y, this.activeMarble.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(this.activeMarble.x, this.activeMarble.y, this.activeMarble.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
        }
        
        // Draw shooter with enhanced visuals
        this.ctx.shadowBlur = 25;
        this.ctx.shadowColor = '#FFD700';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(this.shooter.x, this.shooter.y, 18, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Shooter highlight
        const shooterGradient = this.ctx.createRadialGradient(
            this.shooter.x - 6, this.shooter.y - 6, 0,
            this.shooter.x, this.shooter.y, 18
        );
        shooterGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        shooterGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = shooterGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.shooter.x, this.shooter.y, 18, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        // Draw aim line with glow
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#FFD700';
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(this.shooter.x, this.shooter.y);
        this.ctx.lineTo(
            this.shooter.x + Math.cos(this.shooter.angle) * 150,
            this.shooter.y + Math.sin(this.shooter.angle) * 150
        );
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1.0;
        
        // Draw particles with type-specific rendering
        for (let p of this.particles) {
            const alpha = p.life / p.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = p.color;
            
            // Trail particles are slightly dimmer and smaller
            const sizeMultiplier = p.type === 'trail' ? 0.7 : 1.0;
            const displayRadius = p.radius * sizeMultiplier;
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, displayRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1.0;
        
        // Draw game stats
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Score: ' + this.score, 20, 40);
        
        // Draw level info with name
        const levelIndex = Math.min(this.level - 1, this.levelConfigs.length - 1);
        const config = this.levelConfigs[levelIndex];
        this.ctx.fillText('Level ' + this.level + ': ' + config.name, 20, 70);
        
        // Draw mission text (top center)
        if (this.levelIntroTime && this.levelIntroTime > 0) {
            // Large mission display during intro
            this.ctx.font = 'bold 36px Arial';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#FFD700';
            this.ctx.fillText(config.name, this.canvas.width / 2, 100);
            
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(config.mission, this.canvas.width / 2, 140);
            this.ctx.shadowBlur = 0;
            
            this.levelIntroTime--;
        } else {
            // Smaller mission reminder at top
            this.ctx.font = 'bold 18px Arial';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(config.mission, this.canvas.width / 2, 30);
        }
        
        // Draw combo counter (top right)
        if (this.combo > 0) {
            this.ctx.textAlign = 'right';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.fillStyle = '#FF1654';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#FF1654';
            this.ctx.fillText('COMBO x' + this.combo + '!', this.canvas.width - 20, 50);
            this.ctx.shadowBlur = 0;
        }
        
        // Draw highest combo
        this.ctx.textAlign = 'right';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        this.ctx.fillText('Best Combo: ' + this.highestCombo, this.canvas.width - 20, 80);
        
        // Draw marbles remaining
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText('Marbles: ' + this.marbles.length, this.canvas.width - 20, 110);
        
        // Update sidebar UI
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('combo').textContent = this.marbles.length + ' marbles';
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
        
        this.ctx.fillStyle = '#FF1654';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🔴 Marble Chain', this.canvas.width / 2, 100);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Match 3+ marbles!', this.canvas.width / 2, 300);
        this.ctx.fillText('Use Arrow Keys to aim, Space to shoot', this.canvas.width / 2, 350);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new MarbleChainGame();
});
