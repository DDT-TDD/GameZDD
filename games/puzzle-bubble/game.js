// Bubble Pop Game
class BubblePopGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game managers
        this.audio = new AudioManager();
        this.input = new InputHandler();
        this.save = new SaveManager('bubble-pop');
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.gameState = 'menu';
        this.speedMultiplier = 1.0;
        
        // Physics system - OPTIMIZED for reliable trajectory
        this.gravity = 0.15;                 // Bubble gravity (slight downward pull)
        this.bulletGravity = 0.02;           // Bullet gravity REDUCED (was 0.05) - allows higher arc
        this.damping = 0.99;                 // Velocity damping INCREASED (was 0.98) - preserves momentum
        this.bounceElasticity = 0.85;        // Energy retention INCREASED (was 0.82) - better bounces
        
        // Bubble grid
        this.bubbleSize = 30;  // Increased from 24 for better visibility
        this.gridSpacing = this.bubbleSize * 2; // 60px spacing
        this.gridCols = Math.floor(this.canvas.width / this.gridSpacing);
        this.gridRows = 8; // Fixed rows instead of dynamic
        this.bubbles = [];
        this.activeBubble = null;
        this.nextBubbleColor = null;
        
        // Particle system
        this.particles = [];
        
        // Shooter
        this.shooter = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 60,
            angle: 3 * Math.PI / 2, // Point UPWARD (90° up in canvas coords)
            width: 50,
            height: 50
        };
        
        // Smooth aiming system (IMPROVED: continuous key tracking)
        this.keysPressed = {};                           // Track all pressed keys
        this.targetAngle = this.shooter.angle;           // Smooth interpolation target
        this.angleSmoothSpeed = 0.12;                    // Lerp coefficient (0-1, higher = faster)
        this.angleDegreesDisplay = 90;                   // Display angle in degrees (90° = straight up)
        
        // Shot counter for grid descent (like reference implementation)
        this.shotCounter = 0;
        this.shotsUntilDescent = 8; // Add new row every 8 shots
        
        // Animation system (IMPROVED)
        this.animatingBubbles = new Map();  // Bubbles mid-placement animation
        this.particleTrails = [];           // Bullet trail particles
        this.effectParticles = [];          // Separate effect particles from gameplay
        this.animationSpeed = 1.0;          // Global animation speed multiplier
        this.frameCounter = 0;              // Global frame counter for animations
        this.glowRings = [];                // Glow ring effects on matches
        this.descendAnimating = false;      // Grid descent animation flag
        this.descendProgress = 0;           // Descent animation progress (0-1)
        this.shooterRecoil = 0;             // Shooter recoil animation (0-1)
        
        // Difficulty tracking
        this.boardFillPercentage = 0;       // % of grid occupied
        this.totalBubblesOnBoard = 0;       // Count for difficulty scaling
        this.handcraftedLevels = true;      // Use pre-designed patterns
        
        // Timing
        this.lastTime = 0;
        this.shotSpeed = 8;  // INCREASED from 5 to 8 - higher initial velocity
        
        // Mission Level System
        this.levelConfigs = [
            { name: 'Bubble Basics', mission: 'Pop 15 bubbles and clear the board.', targetPops: 15, timeLimit: 120, multiplier: 1.0 },
            { name: 'Rainbow Challenge', mission: 'Clear 20 matched bubbles within 2 minutes.', targetPops: 20, timeLimit: 120, multiplier: 1.2 },
            { name: 'Quick Strike', mission: 'Pop 25 bubbles in 90 seconds!', targetPops: 25, timeLimit: 90, multiplier: 1.5 },
            { name: 'Bubble Blitz', mission: 'Clear 30 bubbles with accurate shots.', targetPops: 30, timeLimit: 120, multiplier: 2.0 },
            { name: 'Master Challenge', mission: 'Pop 35 bubbles and achieve expert status!', targetPops: 35, timeLimit: 150, multiplier: 2.5 }
        ];
        this.currentConfig = this.levelConfigs[0];
        this.popCount = 0;
        this.timeRemaining = 120;
        this.elapsedTime = 0;  // FIX: Initialize elapsed time counter
        this.combo = 0;
        this.comboTimer = 0;
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
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            speedValue.textContent = speed.toFixed(1) + 'x';
            this.speedMultiplier = speed;
            this.shotSpeed = 8 * this.speedMultiplier;  // UPDATED: was 5 * multiplier
        });
        
        // IMPROVED: Continuous key tracking system (instead of discrete key events)
        this.input.on('keydown', (e) => {
            this.keysPressed[e.code] = true;
            
            if (this.gameState !== 'playing') {
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.shootBubble();
                }
                return;
            }
            
            // Only handle Space and Escape in discrete event mode
            if (e.code === 'Space') {
                e.preventDefault();
                this.shootBubble();
            } else if (e.code === 'Escape') {
                e.preventDefault();
                this.togglePause();
            }
        });
        
        // Key up tracking
        this.input.on('keyup', (e) => {
            this.keysPressed[e.code] = false;
        });
        
        // Fallback for window blur
        window.addEventListener('blur', () => {
            this.keysPressed = {};
        });
    }
    
    // IMPROVED: Smooth angle updates each frame based on pressed keys
    updateShooterAngle() {
        const angleStep = 0.08;  // Radians per frame when key held
        const minAngle = Math.PI * 1.02;  // Near 180° (far left) - was Pi * 0.02
        const maxAngle = Math.PI * 1.98;  // Near 360° (far right, wraps) - was Pi * 0.98
        
        // Left key pressed - rotate LEFT (increase angle)
        if (this.keysPressed['ArrowLeft'] || this.keysPressed['KeyA']) {
            this.targetAngle = Math.min(this.targetAngle + angleStep, maxAngle);
        }
        // Right key pressed - rotate RIGHT (decrease angle)
        if (this.keysPressed['ArrowRight'] || this.keysPressed['KeyD']) {
            this.targetAngle = Math.max(this.targetAngle - angleStep, minAngle);
        }
        
        // Smooth interpolation toward target (lerp with easing)
        const angleDiff = this.targetAngle - this.shooter.angle;
        this.shooter.angle += angleDiff * this.angleSmoothSpeed;
        
        // Update display angle (convert to 0-360 degrees for display)
        let degrees = (this.shooter.angle / Math.PI) * 180;
        if (degrees < 0) degrees += 360;
        this.angleDegreesDisplay = Math.round(degrees);
    }
    
    createBubbleGrid() {
        this.bubbles = [];
        const index = Math.min(this.level - 1, this.levelConfigs.length - 1);
        this.currentConfig = this.levelConfigs[index];
        this.popCount = 0;
        this.timeRemaining = this.currentConfig.timeLimit;
        this.combo = 0;
        this.comboTimer = 0;
        this.levelIntroTime = 120; // ~2 seconds
        
        const colors = ['#FF1744', '#2196F3', '#00E676', '#9C27B0', '#FFD600', '#FF6D00'];
        
        // IMPROVED: Use semi-handcrafted level patterns with controlled randomness
        // Level-based difficulty scaling
        const difficultyScale = Math.min(this.level, 5);  // Cap at level 5
        const fillPercentage = 0.60 + (difficultyScale * 0.08);  // 60% to 100% fill (FIXED: was 0.35, too sparse)
        const colorVariety = Math.min(3 + difficultyScale, colors.length);  // Start with 3-4 colors
        const colorsUsed = colors.slice(0, colorVariety);
        
        // Create grid with strategic pattern
        for (let row = 0; row < this.gridRows; row++) {
            this.bubbles[row] = [];
            for (let col = 0; col < this.gridCols; col++) {
                // IMPROVED: Use pattern-based generation (not pure random)
                // Top rows are more populated, bottom rows sparser
                const rowInfluence = row / this.gridRows;
                const spawnChance = fillPercentage * (1 - rowInfluence * 0.3);  // Adjusted for denser boards
                
                // Allow up to 6 rows initially (was 5)
                const shouldSpawn = (Math.random() < spawnChance) && row < 6;
                
                if (shouldSpawn) {
                    const offsetX = (row % 2) * (this.gridSpacing / 2);
                    this.bubbles[row][col] = {
                        x: col * this.gridSpacing + this.gridSpacing / 2 + offsetX,
                        y: row * this.gridSpacing + this.gridSpacing / 2 + 30,
                        color: colorsUsed[Math.floor(Math.random() * colorsUsed.length)],
                        row: row,
                        col: col,
                        animating: false  // IMPROVED: Track animation state
                    };
                }
            }
        }
        
        // IMPROVED: Ensure board is not impossible (has clear path to early match)
        // Make first row have at least 2 sets of matching colors
        if (this.bubbles[0]) {
            let colorCounts = {};
            for (let col = 0; col < this.gridCols; col++) {
                if (this.bubbles[0][col]) {
                    const color = this.bubbles[0][col].color;
                    colorCounts[color] = (colorCounts[color] || 0) + 1;
                }
            }
            
            // If not enough matches, add some
            const colorsWithCount = Object.entries(colorCounts).filter(([_, count]) => count < 2);
            if (colorsWithCount.length > 0) {
                // Find empty spaces and fill with matching colors
                for (let col = 0; col < this.gridCols; col++) {
                    if (!this.bubbles[0][col] && this.bubbles[0][0]) {
                        this.bubbles[0][col] = {
                            x: col * this.gridSpacing + this.gridSpacing / 2,
                            y: this.gridSpacing / 2 + 30,
                            color: this.bubbles[0][0].color,
                            row: 0,
                            col: col,
                            animating: false
                        };
                        break;
                    }
                }
            }
        }
        
        // Initialize next bubble preview
        this.nextBubbleColor = colors[Math.floor(Math.random() * colors.length)];
        
        // IMPROVED: Track total bubbles for difficulty scaling
        this.totalBubblesOnBoard = this.bubbles.flat().filter(b => b).length;
        this.boardFillPercentage = this.totalBubblesOnBoard / (this.gridRows * this.gridCols);
    }
    
    descendGrid() {
        // PHASE 3: Start descent animation flag
        this.descendAnimating = true;
        this.descendProgress = 0;
        
        // Add a new row at the top and move everything down (reference implementation pattern)
        const colors = ['#FF1744', '#2196F3', '#00E676', '#9C27B0', '#FFD600', '#FF6D00'];
        const newRow = [];
        
        // Determine if the new row should be offset (alternating pattern)
        const isOffsetRow = this.bubbles[0].length < this.gridCols;
        const colCount = isOffsetRow ? this.gridCols - 1 : this.gridCols;
        
        // Create new row with random colors
        for (let col = 0; col < colCount; col++) {
            const offsetX = isOffsetRow ? (this.gridSpacing / 2) : 0;
            newRow.push({
                x: col * this.gridSpacing + this.gridSpacing / 2 + offsetX,
                y: this.gridSpacing / 2 + 30 - this.gridSpacing, // PHASE 3: Start above viewport
                color: colors[Math.floor(Math.random() * colors.length)],
                row: 0,
                col: col,
                descendTarget: this.gridSpacing / 2 + 30 // Target Y position
            });
        }
        
        // PHASE 3: Store descent target for all existing bubbles
        this.bubbles.forEach(row => {
            row.forEach(bubble => {
                if (bubble) {
                    bubble.descendStart = bubble.y;
                    bubble.descendTarget = bubble.y + this.gridSpacing;
                    bubble.row++;
                }
            });
        });
        
        // Add new row at the top
        this.bubbles.unshift(newRow);
        
        // Remove last row if too many
        if (this.bubbles.length > this.gridRows) {
            this.bubbles.pop();
        }
        
        // PHASE 3: Animate descent over time (handled in updateParticles)
        const animateDescent = () => {
            if (this.descendProgress < 1.0) {
                this.descendProgress = Math.min(1.0, this.descendProgress + 0.05);
                
                // Update all bubble positions with easing
                const easeProgress = 1 - Math.pow(1 - this.descendProgress, 3); // Ease-out cubic
                
                this.bubbles.forEach(row => {
                    row.forEach(bubble => {
                        if (bubble && bubble.descendTarget !== undefined) {
                            const start = bubble.descendStart || bubble.descendTarget - this.gridSpacing;
                            bubble.y = start + (bubble.descendTarget - start) * easeProgress;
                        }
                    });
                });
                
                requestAnimationFrame(animateDescent);
            } else {
                // Animation complete - finalize positions
                this.bubbles.forEach(row => {
                    row.forEach(bubble => {
                        if (bubble) {
                            bubble.y = bubble.descendTarget;
                            delete bubble.descendStart;
                            delete bubble.descendTarget;
                        }
                    });
                });
                this.descendAnimating = false;
            }
        };
        
        animateDescent();
        
        // Play descent sound
        this.audio.playSFX('die'); // Using available sound
    }
    
    drawBubble(x, y, color, radius) {
        // PHASE 1: Drop shadow for depth
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 4;
        
        // Shadow circle (base for shadow effect)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(x, y + 2, radius * 0.95, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // Main bubble with radial gradient
        const gradient = this.ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, radius * 0.1,
            x, y, radius
        );
        
        // Highlight
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(0.8, color);
        
        // Shadow
        const shadowColor = this.darkenColor(color, 0.4);
        gradient.addColorStop(1, shadowColor);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // PHASE 1: Inner shadow for depth
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'multiply';
        const innerShadow = this.ctx.createRadialGradient(
            x + radius * 0.3, y + radius * 0.3, 0,
            x + radius * 0.3, y + radius * 0.3, radius * 0.8
        );
        innerShadow.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
        innerShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = innerShadow;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // Glossy shine effect
        const shineGradient = this.ctx.createRadialGradient(
            x - radius * 0.35, y - radius * 0.35, 0,
            x - radius * 0.35, y - radius * 0.35, radius * 0.5
        );
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = shineGradient;
        this.ctx.beginPath();
        this.ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Subtle outline
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    darkenColor(color, amount) {
        // Parse hex color and darken it
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    shootBubble() {
        if (this.activeBubble) return;
        
        const colors = ['#FF1744', '#2196F3', '#00E676', '#9C27B0', '#FFD600', '#FF6D00']; // Vibrant: Red, Blue, Green, Purple, Yellow, Orange
        
        // Calculate velocity: angle 0 = right, 90 = up in standard math coordinates
        // In canvas: angle should produce upward motion (negative Y)
        // At angle 3π/2 (270°, pointing up): cos(3π/2)=0, sin(3π/2)=-1
        // So: vx = 0, vy = -(-1) * speed = +speed (WRONG - goes down)
        // FIX: vy = Math.sin(angle) * speed (positive sin at 270° = -1, so -1*speed goes UP)
        
        this.activeBubble = {
            x: this.shooter.x,
            y: this.shooter.y,
            vx: Math.cos(this.shooter.angle) * this.shotSpeed,
            vy: Math.sin(this.shooter.angle) * this.shotSpeed, // Direct sine for upward motion
            color: this.nextBubbleColor || colors[Math.floor(Math.random() * colors.length)],
            radius: this.bubbleSize
        };
        
        // Pre-generate next bubble
        this.nextBubbleColor = colors[Math.floor(Math.random() * colors.length)];
        
        // PHASE 2: Trigger shooter recoil animation
        this.shooterRecoil = 1.0;
        
        // Increment shot counter (reference implementation pattern)
        this.shotCounter++;
        if (this.shotCounter >= this.shotsUntilDescent) {
            this.shotCounter = 0;
            this.descendGrid();
        }
        
        this.audio.playSFX('shoot');
    }
    
    updateActiveBubble() {
        if (!this.activeBubble) return;
        
        // IMPROVED: Add realistic physics to bullet movement
        this.activeBubble.vy += this.bulletGravity;  // Apply downward gravity
        this.activeBubble.vx *= this.damping;        // Air resistance
        this.activeBubble.vy *= this.damping;
        
        this.activeBubble.x += this.activeBubble.vx;
        this.activeBubble.y += this.activeBubble.vy;
        
        // IMPROVED: Better wall bounce with realistic reflection
        if (this.activeBubble.x - this.activeBubble.radius < 0) {
            this.activeBubble.x = this.activeBubble.radius;
            this.activeBubble.vx *= -this.bounceElasticity;  // Energy loss on bounce
            this.activeBubble.vy *= 0.95;  // Small vertical dampening
        } else if (this.activeBubble.x + this.activeBubble.radius > this.canvas.width) {
            this.activeBubble.x = this.canvas.width - this.activeBubble.radius;
            this.activeBubble.vx *= -this.bounceElasticity;  // Energy loss on bounce
            this.activeBubble.vy *= 0.95;  // Small vertical dampening
        }
        
        // Hit the ceiling - snap to top row immediately
        if (this.activeBubble.y - this.activeBubble.radius < 30) {
            this.snapBubbleToGrid();
            return;
        }
        
        // IMPROVED: Better collision detection with more frequent checks
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const bubble = this.bubbles[row][col];
                if (!bubble) continue;
                
                const dist = Math.hypot(
                    this.activeBubble.x - bubble.x,
                    this.activeBubble.y - bubble.y
                );
                
                // Slightly looser collision for better feel
                if (dist <= this.bubbleSize * 1.95) {
                    this.snapBubbleToGridNearBubble(bubble);
                    return;
                }
            }
        }
        
        // Check if bubbles have reached the bottom/shooter area (game over condition)
        let maxBubbleY = 0;
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                if (this.bubbles[row][col]) {
                    maxBubbleY = Math.max(maxBubbleY, this.bubbles[row][col].y);
                }
            }
        }
        
        // Game over if bubbles reach near the shooter (450px is threshold)
        if (maxBubbleY > 450) {
            this.gameState = 'gameOver';
            this.gameOverReason = 'Bubbles reached the launcher!';
            this.audio.playSFX('die');
        }
    }
    
    snapBubbleToGridNearBubble(nearBubble) {
        // Find the best empty grid position adjacent to the collision point
        const targetRow = nearBubble.row;
        const targetCol = nearBubble.col;
        
        // Check all 6 adjacent positions in honeycomb pattern
        const adjacentPositions = [
            { row: targetRow - 1, col: targetCol },     // Top
            { row: targetRow + 1, col: targetCol },     // Bottom
            { row: targetRow, col: targetCol - 1 },     // Left
            { row: targetRow, col: targetCol + 1 },     // Right
            { row: targetRow - 1, col: targetCol + (targetRow % 2) }, // Top-right diagonal
            { row: targetRow + 1, col: targetCol + (targetRow % 2) }  // Bottom-right diagonal
        ];
        
        let bestPos = null;
        let minDist = Infinity;
        
        // Find closest empty position to where the bubble currently is
        for (const pos of adjacentPositions) {
            if (pos.row < 0 || pos.row >= this.gridRows || pos.col < 0 || pos.col >= this.gridCols) continue;
            if (this.bubbles[pos.row][pos.col]) continue; // Skip occupied
            
            const offsetX = (pos.row % 2) * (this.gridSpacing / 2);
            const gridX = pos.col * this.gridSpacing + this.gridSpacing / 2 + offsetX;
            const gridY = pos.row * this.gridSpacing + this.gridSpacing / 2 + 30;
            
            const dist = Math.hypot(this.activeBubble.x - gridX, this.activeBubble.y - gridY);
            if (dist < minDist) {
                minDist = dist;
                bestPos = { row: pos.row, col: pos.col, x: gridX, y: gridY };
            }
        }
        
        // Place bubble in best position
        if (bestPos) {
            // IMPROVED: Add animation data for smooth placement
            const newBubble = {
                x: bestPos.x,
                y: bestPos.y,
                color: this.activeBubble.color,
                row: bestPos.row,
                col: bestPos.col,
                animating: true,
                animProgress: 0,
                startX: this.activeBubble.x,
                startY: this.activeBubble.y,
                targetX: bestPos.x,
                targetY: bestPos.y
            };
            
            this.bubbles[bestPos.row][bestPos.col] = newBubble;
            
            // Track animation for smooth transitions
            this.animatingBubbles.set(`${bestPos.row},${bestPos.col}`, {
                progress: 0,
                duration: 100,  // 100ms animation
                startPos: { x: this.activeBubble.x, y: this.activeBubble.y },
                endPos: bestPos
            });
            
            // Check for matches AFTER placing bubble
            this.handleBubbleMatch(this.activeBubble.color, bestPos.row, bestPos.col);
            
            // Increment shot counter and check for grid descent
            this.shotCounter++;
            if (this.shotCounter >= this.shotsUntilDescent) {
                this.descendGrid();
                this.shotCounter = 0;
                this.audio.playSFX('collect');
                this.canvas.classList.add('shaking');
                setTimeout(() => this.canvas.classList.remove('shaking'), 300);
            }
            
            this.activeBubble = null;
        } else {
            // Fallback to simple grid snap if no adjacent position found
            this.snapBubbleToGrid();
        }
    }
    
    snapBubbleToGrid() {
        // Simple grid snap for ceiling hits
        let bestRow = Math.max(0, Math.floor((this.activeBubble.y - 30) / this.gridSpacing));
        let bestCol = Math.round(this.activeBubble.x / this.gridSpacing);
        
        bestRow = Math.min(bestRow, this.gridRows - 1);
        bestCol = Math.max(0, Math.min(bestCol, this.gridCols - 1));
        
        // Find nearest empty position
        const searchRadius = 3;
        let placed = false;
        
        for (let r = bestRow; r <= Math.min(bestRow + searchRadius, this.gridRows - 1) && !placed; r++) {
            for (let c = Math.max(0, bestCol - searchRadius); c <= Math.min(bestCol + searchRadius, this.gridCols - 1) && !placed; c++) {
                if (!this.bubbles[r][c]) {
                    const offsetX = (r % 2) * (this.gridSpacing / 2);
                    
                    // IMPROVED: Add animation data
                    const newBubble = {
                        x: c * this.gridSpacing + this.gridSpacing / 2 + offsetX,
                        y: r * this.gridSpacing + this.gridSpacing / 2 + 30,
                        color: this.activeBubble.color,
                        row: r,
                        col: c,
                        animating: true,
                        animProgress: 0
                    };
                    
                    this.bubbles[r][c] = newBubble;
                    
                    // Track animation for smooth transitions
                    this.animatingBubbles.set(`${r},${c}`, {
                        progress: 0,
                        duration: 100,
                        startPos: { x: this.activeBubble.x, y: this.activeBubble.y },
                        endPos: { x: newBubble.x, y: newBubble.y }
                    });
                    
                    // IMPORTANT: Only call handleBubbleMatch once
                    this.handleBubbleMatch(this.activeBubble.color, r, c);
                    
                    // Increment shot counter and check for grid descent
                    this.shotCounter++;
                    if (this.shotCounter >= this.shotsUntilDescent) {
                        this.descendGrid();
                        this.shotCounter = 0;
                        this.audio.playSFX('collect');
                        this.canvas.classList.add('shaking');
                        setTimeout(() => this.canvas.classList.remove('shaking'), 300);
                    }
                    
                    placed = true;
                }
            }
        }
        
        this.activeBubble = null;
    }
    
    handleBubbleMatch(color, row, col) {
        const toDelete = this.getConnectedBubbles(color, row, col);
        
        if (toDelete.length >= 3) {
            // PHASE 2: Calculate center point for glow ring
            let centerX = 0, centerY = 0;
            toDelete.forEach(({r, c}) => {
                const bubble = this.bubbles[r][c];
                if (bubble) {
                    centerX += bubble.x;
                    centerY += bubble.y;
                }
            });
            centerX /= toDelete.length;
            centerY /= toDelete.length;
            
            // PHASE 2: Add expanding glow ring effect
            this.glowRings.push({
                x: centerX,
                y: centerY,
                radius: this.bubbleSize,
                maxRadius: this.bubbleSize * (2 + toDelete.length * 0.3),
                life: 1.0,
                color: color,
                intensity: Math.min(1.0, toDelete.length / 10)
            });
            
            // PHASE 2: Enhanced screen shake for big matches
            if (toDelete.length >= 5) {
                const shakeIntensity = Math.min(toDelete.length * 50, 400);
                this.canvas.classList.add('shaking');
                setTimeout(() => this.canvas.classList.remove('shaking'), shakeIntensity);
            }
            
            toDelete.forEach(({r, c}) => {
                const bubble = this.bubbles[r][c];
                if (bubble) {
                    // PHASE 2: Enhanced particles for big matches
                    this.createPopParticles(bubble.x, bubble.y, bubble.color, toDelete.length);
                }
                this.bubbles[r][c] = null;
                this.score += Math.floor(10 * this.currentConfig.multiplier * (1 + this.combo * 0.2));
                this.popCount++;
            });
            this.combo++;
            this.comboTimer = 2;
            this.audio.playSFX('collect');
            this.dropFloatingBubbles();
        }
    }
    
    createPopParticles(x, y, color, matchCount = 3) {
        // PHASE 3: Scale particle count based on match size
        const particleCount = Math.min(12 + matchCount * 2, 24);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2.5 + Math.random() * 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                life: 1.0,
                size: 4 + Math.random() * 6,
                maxLife: 1.0
            });
        }
        
        // PHASE 3: Enhanced secondary burst for big matches
        const burstCount = Math.min(8 + matchCount, 16);
        for (let i = 0; i < burstCount; i++) {
            const angle = (Math.PI * 2 * i) / burstCount + Math.random() * 0.3;
            const speed = 4 + Math.random() * 3;
            this.effectParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed * 0.7,
                vy: Math.sin(angle) * speed * 0.7,
                color: 'rgba(255, 255, 200, 0.8)',
                life: 0.8,
                size: 2 + Math.random() * 3,
                maxLife: 0.8
            });
        }
        
        // PHASE 3: Confetti particles for combos (4+ bubbles)
        if (matchCount >= 4) {
            const confettiCount = matchCount * 2;
            const confettiColors = ['#FF1744', '#2196F3', '#00E676', '#FFD600', '#FF6D00', '#9C27B0'];
            
            for (let i = 0; i < confettiCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 5;
                this.effectParticles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2, // Shoot upward
                    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
                    life: 1.2,
                    size: 3 + Math.random() * 4,
                    maxLife: 1.2,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.3
                });
            }
        }
    }
    
    updateParticles(deltaTime) {
        // Update regular particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15; // Gravity
            p.vx *= 0.98;
            p.life -= deltaTime * 2.2;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // PHASE 3: Update effect particles with rotation
        for (let i = this.effectParticles.length - 1; i >= 0; i--) {
            const p = this.effectParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.vx *= 0.95;
            p.life -= deltaTime * 2.5;
            
            // Update rotation for confetti
            if (p.rotation !== undefined) {
                p.rotation += p.rotationSpeed;
            }
            
            if (p.life <= 0) {
                this.effectParticles.splice(i, 1);
            }
        }
        
        // PHASE 2: Update glow rings
        for (let i = this.glowRings.length - 1; i >= 0; i--) {
            const ring = this.glowRings[i];
            ring.radius += deltaTime * ring.maxRadius * 3; // Expand
            ring.life -= deltaTime * 2;
            
            if (ring.life <= 0) {
                this.glowRings.splice(i, 1);
            }
        }
        
        // Update animating bubbles
        for (const [key, anim] of this.animatingBubbles.entries()) {
            anim.progress += deltaTime * 10;
            if (anim.progress >= 1.0) {
                this.animatingBubbles.delete(key);
            }
        }
    }
    
    drawParticles() {
        // PHASE 2: Draw glow rings first (behind particles)
        this.glowRings.forEach(ring => {
            const alpha = ring.life * ring.intensity;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha * 0.4;
            this.ctx.strokeStyle = ring.color;
            this.ctx.lineWidth = 8;
            this.ctx.shadowColor = ring.color;
            this.ctx.shadowBlur = 20;
            this.ctx.beginPath();
            this.ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        });
        
        // Draw regular particles
        this.particles.forEach(p => {
            const easedLife = Math.sqrt(p.life);
            
            this.ctx.globalAlpha = easedLife;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * easedLife, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // PHASE 3: Draw effect particles with rotation
        this.effectParticles.forEach(p => {
            this.ctx.globalAlpha = p.life * 0.8;
            
            if (p.rotation !== undefined) {
                // Confetti with rotation
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rotation);
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                this.ctx.restore();
            } else {
                // Regular effect particles
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        this.ctx.globalAlpha = 1.0;
    }
    
    getConnectedBubbles(color, row, col, visited = new Set()) {
        const key = `${row},${col}`;
        if (visited.has(key)) return [];
        
        const bubble = this.bubbles[row]?.[col];
        if (!bubble || bubble.color !== color) return [];
        
        visited.add(key);
        const connected = [{r: row, c: col}];
        
        // HONEYCOMB 6-NEIGHBOR PATTERN (matching reference implementation)
        // For even rows: check top-left, top-right, left, right, bottom-left, bottom-right
        // For odd rows: neighbors shift due to honeycomb offset
        const isEvenRow = row % 2 === 0;
        const neighbors = isEvenRow ? [
            [row - 1, col - 1], [row - 1, col],      // Top-left, Top-right
            [row, col - 1], [row, col + 1],          // Left, Right
            [row + 1, col - 1], [row + 1, col]       // Bottom-left, Bottom-right
        ] : [
            [row - 1, col], [row - 1, col + 1],      // Top-left, Top-right (shifted)
            [row, col - 1], [row, col + 1],          // Left, Right
            [row + 1, col], [row + 1, col + 1]       // Bottom-left, Bottom-right (shifted)
        ];
        
        neighbors.forEach(([r, c]) => {
            if (r >= 0 && r < this.gridRows && c >= 0 && c < this.gridCols) {
                connected.push(...this.getConnectedBubbles(color, r, c, visited));
            }
        });
        
        return connected;
    }
    
    dropFloatingBubbles() {
        for (let row = this.gridRows - 1; row >= 0; row--) {
            for (let col = 0; col < this.gridCols; col++) {
                if (this.bubbles[row][col] && !this.isConnected(row, col)) {
                    this.bubbles[row][col] = null;
                }
            }
        }
    }
    
    isConnected(row, col) {
        // BFS from top row to check if bubble is connected (matches reference deleteFloating logic)
        const visited = new Set();
        const queue = [];
        
        // Start BFS from all bubbles in the first row
        for (let c = 0; c < this.gridCols; c++) {
            if (this.bubbles[0]?.[c]) {
                queue.push([0, c]);
                visited.add(`0,${c}`);
            }
        }
        
        // BFS to find all connected bubbles
        while (queue.length > 0) {
            const [r, c] = queue.shift();
            
            // Check if this is the bubble we're looking for
            if (r === row && c === col) {
                return true;
            }
            
            // Add honeycomb neighbors
            const isEvenRow = r % 2 === 0;
            const neighbors = isEvenRow ? [
                [r - 1, c - 1], [r - 1, c],
                [r, c - 1], [r, c + 1],
                [r + 1, c - 1], [r + 1, c]
            ] : [
                [r - 1, c], [r - 1, c + 1],
                [r, c - 1], [r, c + 1],
                [r + 1, c], [r + 1, c + 1]
            ];
            
            for (const [nr, nc] of neighbors) {
                const key = `${nr},${nc}`;
                if (nr >= 0 && nr < this.gridRows && nc >= 0 && nc < this.gridCols &&
                    !visited.has(key) && this.bubbles[nr]?.[nc]) {
                    visited.add(key);
                    queue.push([nr, nc]);
                }
            }
        }
        
        return false;
    }
    
    startGame() {
        this.gameState = 'playing';
        this.createBubbleGrid();
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'inline-block';
        this.lastTime = performance.now();
        this.startTime = performance.now();  // FIX: Track game start time for elapsed calculation
        this.elapsedTime = 0;                // FIX: Reset elapsed time
        this.gameLoop(this.lastTime);
    }
    
    gameLoop(currentTime) {
        if (this.gameState !== 'playing') {
            return;
        }
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // FIX: Increment elapsed time for time limit tracking
        this.elapsedTime = (currentTime - this.startTime);
        
        // IMPROVED: Update shooter angle every frame for smooth aiming
        this.updateShooterAngle();
        
        // Update timers
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
        
        if (this.levelIntroTime > 0) {
            this.levelIntroTime--;
        }
        
        // Time limit is very generous (60 seconds per level) and purely for bonus scoring
        // Game does NOT end when time runs out
        this.timeRemaining = Math.max(0, this.currentConfig.timeLimit - (this.elapsedTime * 0.001));
        // If you want to re-enable time-based loss, uncomment this:
        // if (this.timeRemaining <= 0) {
        //     this.gameState = 'gameOver';
        //     this.audio.playSFX('die');
        // }
        
        this.updateActiveBubble();
        this.updateParticles(deltaTime);
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    draw() {
        // PHASE 1: Increment frame counter for animations
        this.frameCounter++;
        
        // Clear canvas
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw trajectory prediction (dotted arc)
        this.drawTrajectory();
        
        // PHASE 1: Draw bubbles with idle animation support
        this.bubbles.forEach((row, rowIdx) => {
            row.forEach((bubble, colIdx) => {
                if (!bubble) return;
                
                // Check if bubble is animating (placement)
                const animKey = `${rowIdx},${colIdx}`;
                const anim = this.animatingBubbles.get(animKey);
                
                if (anim && anim.progress < 1.0) {
                    // Placement animation (ease-out cubic)
                    const easeProgress = 1 - Math.pow(1 - anim.progress, 3);
                    
                    const interpX = anim.startPos.x + (anim.endPos.x - anim.startPos.x) * easeProgress;
                    const interpY = anim.startPos.y + (anim.endPos.y - anim.startPos.y) * easeProgress;
                    
                    // Scale up effect during placement
                    const scale = 0.8 + 0.2 * easeProgress;
                    
                    this.ctx.save();
                    this.ctx.translate(interpX, interpY);
                    this.ctx.scale(scale, scale);
                    this.ctx.translate(-interpX, -interpY);
                    
                    this.drawBubble(interpX, interpY, bubble.color, this.bubbleSize);
                    this.ctx.restore();
                } else {
                    // PHASE 1: Idle animation (subtle bobbing and rotation)
                    const idleOffset = Math.sin((this.frameCounter + rowIdx * 10 + colIdx * 5) * 0.02) * 2;
                    const idleRotation = Math.sin((this.frameCounter + rowIdx * 15 + colIdx * 8) * 0.015) * 0.05;
                    
                    this.ctx.save();
                    this.ctx.translate(bubble.x, bubble.y + idleOffset);
                    this.ctx.rotate(idleRotation);
                    this.ctx.translate(-bubble.x, -(bubble.y + idleOffset));
                    
                    this.drawBubble(bubble.x, bubble.y + idleOffset, bubble.color, this.bubbleSize);
                    this.ctx.restore();
                }
            });
        });
        
        // Draw particles
        this.drawParticles();
        
        // Draw active bubble
        if (this.activeBubble) {
            this.drawBubble(this.activeBubble.x, this.activeBubble.y, this.activeBubble.color, this.activeBubble.radius);
        }
        
        // Draw shooter with next bubble preview
        this.drawShooter();
        
        // Update UI
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        const remainingBubbles = this.bubbles.reduce((count, row) => {
            if (!row) return count;
            return count + row.filter(Boolean).length;
        }, 0);
        document.getElementById('bubbles').textContent = remainingBubbles;
        
        // Draw mission HUD
        this.drawMissionHUD();
    }
    
    drawTrajectory() {
        if (this.activeBubble) return; // Don't show when shooting
        
        // IMPROVED: Show angle in degrees on the shooter
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.angleDegreesDisplay}°`, this.shooter.x, this.shooter.y - 35);
        
        const maxDistance = 600;
        const stepSize = 3;
        let x = this.shooter.x;
        let y = this.shooter.y;
        let vx = Math.cos(this.shooter.angle) * this.shotSpeed;
        let vy = Math.sin(this.shooter.angle) * this.shotSpeed;
        let distance = 0;
        let segments = []; // Store trajectory segments for gradient coloring
        
        // PHASE 2: Calculate trajectory path first
        let tempX = x, tempY = y, tempVx = vx, tempVy = vy, tempDist = 0;
        let hitPoint = null;
        
        while (tempDist < maxDistance && tempY > 0) {
            tempVy += this.bulletGravity;
            tempVx *= this.damping;
            tempVy *= this.damping;
            
            tempX += tempVx;
            tempY += tempVy;
            tempDist += stepSize;
            
            // Wall bounce
            if (tempX - this.bubbleSize < 0) {
                tempX = this.bubbleSize;
                tempVx *= -this.bounceElasticity;
                tempVy *= 0.95;
            } else if (tempX + this.bubbleSize > this.canvas.width) {
                tempX = this.canvas.width - this.bubbleSize;
                tempVx *= -this.bounceElasticity;
                tempVy *= 0.95;
            }
            
            // Check ceiling collision
            if (tempY < 30 + this.bubbleSize) {
                hitPoint = { x: tempX, y: tempY, distance: tempDist, safe: true };
                break;
            }
            
            // Check bubble collision
            for (let row = 0; row < this.gridRows; row++) {
                for (let col = 0; col < this.gridCols; col++) {
                    const bubble = this.bubbles[row][col];
                    if (!bubble) continue;
                    
                    const dist = Math.hypot(tempX - bubble.x, tempY - bubble.y);
                    if (dist <= this.bubbleSize * 1.95) {
                        hitPoint = { x: tempX, y: tempY, distance: tempDist, safe: true };
                        break;
                    }
                }
                if (hitPoint) break;
            }
            if (hitPoint) break;
        }
        
        // PHASE 2: Draw trajectory with gradient color (green = safe, yellow = medium, red = risky)
        const totalDistance = hitPoint ? hitPoint.distance : maxDistance;
        
        this.ctx.lineWidth = 2.5;
        this.ctx.setLineDash([8, 8]);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        
        // Reset for actual drawing
        tempX = x; tempY = y; tempVx = vx; tempVy = vy; tempDist = 0;
        
        while (tempDist < maxDistance && tempY > 0) {
            tempVy += this.bulletGravity;
            tempVx *= this.damping;
            tempVy *= this.damping;
            
            tempX += tempVx;
            tempY += tempVy;
            tempDist += stepSize;
            
            // Color gradient based on distance traveled (green → yellow → red)
            const progress = tempDist / totalDistance;
            let r, g, b;
            if (progress < 0.5) {
                // Green to Yellow
                r = Math.floor(76 + (255 - 76) * (progress * 2));
                g = 205;
                b = 76;
            } else {
                // Yellow to Red
                r = 255;
                g = Math.floor(205 - (205 - 107) * ((progress - 0.5) * 2));
                b = Math.floor(76 - 76 * ((progress - 0.5) * 2));
            }
            
            this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
            this.ctx.lineTo(tempX, tempY);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(tempX, tempY);
            
            // Wall bounce
            if (tempX - this.bubbleSize < 0) {
                tempX = this.bubbleSize;
                tempVx *= -this.bounceElasticity;
                tempVy *= 0.95;
            } else if (tempX + this.bubbleSize > this.canvas.width) {
                tempX = this.canvas.width - this.bubbleSize;
                tempVx *= -this.bounceElasticity;
                tempVy *= 0.95;
            }
            
            // Check ceiling
            if (tempY < 30 + this.bubbleSize) {
                break;
            }
            
            // Check bubble collision
            let hitBubble = false;
            for (let row = 0; row < this.gridRows; row++) {
                for (let col = 0; col < this.gridCols; col++) {
                    const bubble = this.bubbles[row][col];
                    if (!bubble) continue;
                    
                    const dist = Math.hypot(tempX - bubble.x, tempY - bubble.y);
                    if (dist <= this.bubbleSize * 1.95) {
                        hitBubble = true;
                        break;
                    }
                }
                if (hitBubble) break;
            }
            if (hitBubble) break;
        }
        
        this.ctx.setLineDash([]);
        
        // PHASE 2: Draw impact marker with pulsing animation
        if (hitPoint) {
            const pulse = Math.sin(this.frameCounter * 0.1) * 0.3 + 0.7; // Pulsing effect
            
            // Glow behind marker
            this.ctx.save();
            this.ctx.shadowColor = 'rgba(76, 205, 76, 0.8)';
            this.ctx.shadowBlur = 15 * pulse;
            
            this.ctx.fillStyle = `rgba(76, 205, 76, ${0.3 * pulse})`;
            this.ctx.beginPath();
            this.ctx.arc(hitPoint.x, hitPoint.y, this.bubbleSize * 1.2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
            
            // Marker outline
            this.ctx.strokeStyle = `rgba(76, 205, 76, ${0.9 * pulse})`;
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.arc(hitPoint.x, hitPoint.y, this.bubbleSize, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Inner marker dot
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.beginPath();
            this.ctx.arc(hitPoint.x, hitPoint.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawShooter() {
        this.ctx.save();
        
        // PHASE 2: Shooter barrel (rotates with angle)
        this.ctx.translate(this.shooter.x, this.shooter.y);
        this.ctx.rotate(this.shooter.angle + Math.PI / 2); // Rotate to angle direction
        
        // Barrel design (tube extending upward)
        const barrelLength = 40;
        const barrelWidth = 16;
        
        // Barrel shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(-barrelWidth / 2 + 2, -barrelLength, barrelWidth, barrelLength + 2);
        
        // Barrel gradient (3D effect)
        const barrelGradient = this.ctx.createLinearGradient(-barrelWidth / 2, 0, barrelWidth / 2, 0);
        barrelGradient.addColorStop(0, '#8B6914');
        barrelGradient.addColorStop(0.3, '#DAA520');
        barrelGradient.addColorStop(0.5, '#FFD700');
        barrelGradient.addColorStop(0.7, '#DAA520');
        barrelGradient.addColorStop(1, '#8B6914');
        
        this.ctx.fillStyle = barrelGradient;
        this.ctx.fillRect(-barrelWidth / 2, -barrelLength, barrelWidth, barrelLength);
        
        // Barrel outline
        this.ctx.strokeStyle = 'rgba(139, 105, 20, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-barrelWidth / 2, -barrelLength, barrelWidth, barrelLength);
        
        // Barrel tip glow when ready (no recoil)
        if (this.shooterRecoil === 0) {
            this.ctx.shadowColor = '#FFD700';
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(0, -barrelLength, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
        
        // Apply recoil offset
        const recoilOffset = this.shooterRecoil * 8;
        this.ctx.translate(0, recoilOffset);
        
        this.ctx.restore();
        
        // Shooter base (main body)
        const gradient = this.ctx.createRadialGradient(
            this.shooter.x, this.shooter.y, 0,
            this.shooter.x, this.shooter.y, this.shooter.width / 2
        );
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.6, '#FFB84D');
        gradient.addColorStop(1, '#FF8C00');
        
        // PHASE 2: Shooter shadow
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 5;
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.shooter.x, this.shooter.y, this.shooter.width / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // Shooter outline
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(this.shooter.x, this.shooter.y, this.shooter.width / 2, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Next bubble preview (smaller)
        if (this.nextBubbleColor) {
            this.drawBubble(this.shooter.x, this.shooter.y, this.nextBubbleColor, this.bubbleSize * 0.6);
        }
        
        // Update recoil animation (decay)
        if (this.shooterRecoil > 0) {
            this.shooterRecoil = Math.max(0, this.shooterRecoil - 0.15);
        }
    }
    
    drawMissionHUD() {
        // Title bar
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(0, 0, this.canvas.width, 50);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Level ${this.level}: ${this.currentConfig.name}`, 15, 28);
        
        // Mission objective intro
        if (this.levelIntroTime > 0) {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.currentConfig.name, this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(this.currentConfig.mission, this.canvas.width / 2, this.canvas.height / 2 + 30);
        } else {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '13px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.currentConfig.mission, this.canvas.width / 2, 28);
        }
        
        // Pop count progress (IMPROVED: Visual bar)
        this.ctx.textAlign = 'right';
        const popRatio = this.popCount / this.currentConfig.targetPops;
        const barWidth = 150;
        const barHeight = 8;
        const barX = this.canvas.width - 15 - barWidth;
        const barY = 18;
        
        // Background bar
        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Progress bar
        const barColor = popRatio >= 1.0 ? '#4ECDC4' : '#FFD700';
        this.ctx.fillStyle = barColor;
        this.ctx.fillRect(barX, barY, barWidth * Math.min(popRatio, 1.0), barHeight);
        
        // Border
        this.ctx.strokeStyle = barColor;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Text
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.font = 'bold 13px Arial';
        this.ctx.fillText(`${this.popCount}/${this.currentConfig.targetPops}`, this.canvas.width - 15, 28);
        
        // Timer (IMPROVED: Pulsing when low)
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 14px Arial';
        
        const timeStr = Math.max(0, Math.floor(this.timeRemaining));
        if (this.timeRemaining < 15) {
            // Pulsing effect when low
            const pulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            this.ctx.fillStyle = `rgba(255, 107, 107, ${0.5 + pulse * 0.5})`;
        } else if (this.timeRemaining < 30) {
            this.ctx.fillStyle = '#FFD700';
        } else {
            this.ctx.fillStyle = '#8BC34A';
        }
        
        this.ctx.fillText(`⏱ ${timeStr}s`, 15, this.canvas.height - 15);
        
        // Combo indicator (IMPROVED: Larger and more visible)
        if (this.combo > 1 && this.comboTimer > 0) {
            this.ctx.textAlign = 'center';
            
            // Combo glow effect
            this.ctx.shadowColor = '#FF6B6B';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.fillText(`🔥 Combo x${this.combo}!`, this.canvas.width / 2, this.canvas.height - 15);
            
            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }
    }
    
    togglePause() {
        this.gameState = this.gameState === 'playing' ? 'paused' : 'playing';
        if (this.gameState === 'playing') {
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
        
        this.ctx.fillStyle = '#FFB84D';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🫧 Bubble Pop', this.canvas.width / 2, 100);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press Start to Play!', this.canvas.width / 2, 300);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new BubblePopGame();
});
