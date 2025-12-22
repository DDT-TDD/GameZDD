// Block Fall (Tetris) Game
class BlockFallGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('holdCanvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        // Grid settings
    this.cols = 10;
    this.rows = 20;
    this.blockSize = 40;
        this.canvas.width = this.cols * this.blockSize;
        this.canvas.height = this.rows * this.blockSize;
        
        // Game managers
        this.audio = new AudioManager();
        this.input = new InputHandler();
        this.save = new SaveManager('tetris');
        
        // Game state
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameState = 'menu';
        this.mode = 'kids'; // kids or normal
        
        // Grid
        this.grid = [];
        this.initGrid();
        
        // Current piece
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        this.currentRotation = 0;
        
        // Next and hold pieces
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        
        // Timing
        this.lastTime = 0;
        this.dropTimer = 0;
        this.dropInterval = 1000; // Kids mode: slower
        this.baseDropInterval = 1000; // Base speed for calculations
        this.speedMultiplier = 1.0; // Speed multiplier from slider
        this.lockDelay = 500;
        this.lockTimer = 0;
        this.isLocking = false;
        
        // Input handling
        this.moveRepeatDelay = 150;
        this.moveRepeatRate = 50;
        this.lastMoveTime = 0;
        this.moveTimer = 0;
        
        // Tetromino definitions
        this.pieces = {
            I: {
                shape: [
                    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
                    [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
                    [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
                    [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]
                ],
                color: '#00F0F0'
            },
            O: {
                shape: [
                    [[1,1], [1,1]]
                ],
                color: '#F0F000'
            },
            T: {
                shape: [
                    [[0,1,0], [1,1,1], [0,0,0]],
                    [[0,1,0], [0,1,1], [0,1,0]],
                    [[0,0,0], [1,1,1], [0,1,0]],
                    [[0,1,0], [1,1,0], [0,1,0]]
                ],
                color: '#A000F0'
            },
            S: {
                shape: [
                    [[0,1,1], [1,1,0], [0,0,0]],
                    [[0,1,0], [0,1,1], [0,0,1]],
                    [[0,0,0], [0,1,1], [1,1,0]],
                    [[1,0,0], [1,1,0], [0,1,0]]
                ],
                color: '#00F000'
            },
            Z: {
                shape: [
                    [[1,1,0], [0,1,1], [0,0,0]],
                    [[0,0,1], [0,1,1], [0,1,0]],
                    [[0,0,0], [1,1,0], [0,1,1]],
                    [[0,1,0], [1,1,0], [1,0,0]]
                ],
                color: '#F00000'
            },
            J: {
                shape: [
                    [[1,0,0], [1,1,1], [0,0,0]],
                    [[0,1,1], [0,1,0], [0,1,0]],
                    [[0,0,0], [1,1,1], [0,0,1]],
                    [[0,1,0], [0,1,0], [1,1,0]]
                ],
                color: '#0000F0'
            },
            L: {
                shape: [
                    [[0,0,1], [1,1,1], [0,0,0]],
                    [[0,1,0], [0,1,0], [0,1,1]],
                    [[0,0,0], [1,1,1], [1,0,0]],
                    [[1,1,0], [0,1,0], [0,1,0]]
                ],
                color: '#F0A000'
            }
        };
        
        this.pieceTypes = Object.keys(this.pieces);
        
        // 7-Bag system for authentic Tetris randomization
        this.pieceBag = [];
        this.refillBag();
        
        // Level missions
        this.levelMissions = [
            { name: 'Getting Started', mission: 'Clear 10 lines', target: 10 },
            { name: 'Building Up', mission: 'Clear 25 lines', target: 25 },
            { name: 'Combo Master', mission: 'Clear 40 lines', target: 40 },
            { name: 'Speed Demon', mission: 'Clear 60 lines', target: 60 },
            { name: 'Tetris Legend', mission: 'Clear 100 lines!', target: 100 }
        ];
        this.combo = 0;
        this.highestCombo = 0;
        
        this.init();
    }
    
    refillBag() {
        // Authentic 7-bag randomization - ensures fair piece distribution
        this.pieceBag = [...this.pieceTypes];
        // Shuffle the bag
        for (let i = this.pieceBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.pieceBag[i], this.pieceBag[j]] = [this.pieceBag[j], this.pieceBag[i]];
        }
    }
    
    init() {
        this.setupEventListeners();
        this.loadGame();
        this.drawMenu();
    }
    
    initGrid() {
        this.grid = [];
        for (let y = 0; y < this.rows; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.cols; x++) {
                this.grid[y][x] = 0;
            }
        }
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('backBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('modeBtn').addEventListener('click', () => this.showModeSelection());
        document.getElementById('confirmModeBtn').addEventListener('click', () => this.confirmMode());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('quitBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('menuBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        
        // Speed control slider
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            speedValue.textContent = speed.toFixed(1) + 'x';
            this.updateGameSpeed(speed);
        });
        
        // Mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
        
        // Keyboard controls
        this.input.on('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.softDrop();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    this.rotatePiece();
                    break;
                case 'Space':
                    this.hardDrop();
                    break;
                case 'KeyC':
                    this.holdCurrentPiece();
                    break;
                case 'Escape':
                    this.togglePause();
                    break;
            }
        });
    }
    
    showModeSelection() {
        document.getElementById('modeModal').classList.add('active');
    }
    
    confirmMode() {
        const selectedBtn = document.querySelector('.mode-btn.active');
        this.mode = selectedBtn.dataset.mode;
        
        // Set drop speed based on mode
        if (this.mode === 'kids') {
            this.baseDropInterval = 1000;
        } else {
            this.baseDropInterval = 800;
        }
        this.dropInterval = this.baseDropInterval / this.speedMultiplier;
        
        document.getElementById('modeModal').classList.remove('active');
    }
    
    updateGameSpeed(speed) {
        this.speedMultiplier = speed;
        this.dropInterval = this.baseDropInterval / this.speedMultiplier;
    }
    
    startGame() {
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.initGrid();
        this.holdPiece = null;
        this.canHold = true;
        
        this.nextPiece = this.getRandomPiece();
        this.spawnPiece();
        
        this.gameState = 'playing';
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'block';
        
        this.updateUI();
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    gameLoop(currentTime) {
        if (this.gameState !== 'playing') {
            return;
        }
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Auto drop
        this.dropTimer += deltaTime;
        if (this.dropTimer >= this.dropInterval) {
            this.dropTimer = 0;
            this.dropPiece();
        }
        
        // Lock delay
        if (this.isLocking) {
            this.lockTimer += deltaTime;
            if (this.lockTimer >= this.lockDelay) {
                this.lockPiece();
                this.isLocking = false;
                this.lockTimer = 0;
            }
        }
    }
    
    getRandomPiece() {
        // Use 7-bag system for authentic piece distribution
        if (this.pieceBag.length === 0) {
            this.refillBag();
        }
        
        const type = this.pieceBag.pop();
        return {
            type: type,
            shape: this.pieces[type].shape,
            color: this.pieces[type].color
        };
    }
    
    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.getRandomPiece();
        this.currentRotation = 0;
        this.currentX = Math.floor(this.cols / 2) - Math.floor(this.getCurrentShape()[0].length / 2);
        this.currentY = 0;
        this.canHold = true;
        this.isLocking = false;
        this.lockTimer = 0;
        
        // Check if game over
        if (!this.isValidPosition(this.currentX, this.currentY, this.currentRotation)) {
            this.gameOver();
        }
        
        this.drawNextPiece();
    }
    
    getCurrentShape() {
        return this.currentPiece.shape[this.currentRotation % this.currentPiece.shape.length];
    }
    
    isValidPosition(x, y, rotation) {
        const shape = this.currentPiece.shape[rotation % this.currentPiece.shape.length];
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.cols || newY >= this.rows) {
                        return false;
                    }
                    
                    if (newY >= 0 && this.grid[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    movePiece(dx, dy) {
        if (this.isValidPosition(this.currentX + dx, this.currentY + dy, this.currentRotation)) {
            this.currentX += dx;
            this.currentY += dy;
            
            // Reset lock timer if moved
            if (dy === 0) {
                this.isLocking = false;
                this.lockTimer = 0;
            }
        }
    }
    
    rotatePiece() {
        const newRotation = (this.currentRotation + 1) % this.currentPiece.shape.length;
        
        // Try basic rotation
        if (this.isValidPosition(this.currentX, this.currentY, newRotation)) {
            this.currentRotation = newRotation;
            this.isLocking = false;
            this.lockTimer = 0;
            return;
        }
        
        // Try wall kicks
        const kicks = [
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: -2, y: 0 },
            { x: 2, y: 0 }
        ];
        
        for (const kick of kicks) {
            if (this.isValidPosition(this.currentX + kick.x, this.currentY + kick.y, newRotation)) {
                this.currentX += kick.x;
                this.currentY += kick.y;
                this.currentRotation = newRotation;
                this.isLocking = false;
                this.lockTimer = 0;
                return;
            }
        }
    }
    
    dropPiece() {
        if (this.isValidPosition(this.currentX, this.currentY + 1, this.currentRotation)) {
            this.currentY++;
            this.isLocking = false;
            this.lockTimer = 0;
        } else {
            if (!this.isLocking) {
                this.isLocking = true;
                this.lockTimer = 0;
            }
        }
    }
    
    softDrop() {
        if (this.isValidPosition(this.currentX, this.currentY + 1, this.currentRotation)) {
            this.currentY++;
            this.score += 1;
        }
    }
    
    hardDrop() {
        let dropDistance = 0;
        while (this.isValidPosition(this.currentX, this.currentY + 1, this.currentRotation)) {
            this.currentY++;
            dropDistance++;
        }
        this.score += dropDistance * 2;
        this.lockPiece();
    }
    
    lockPiece() {
        const shape = this.getCurrentShape();
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const y = this.currentY + row;
                    const x = this.currentX + col;
                    if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
                        this.grid[y][x] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
        this.updateUI();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(new Array(this.cols).fill(0));
                linesCleared++;
                y++; // Check same row again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            
            // Combo system
            this.combo++;
            if (this.combo > this.highestCombo) {
                this.highestCombo = this.combo;
            }
            
            // Scoring with combo bonus
            const lineScores = [0, 100, 300, 500, 800]; // Single, Double, Triple, Tetris
            let baseScore = lineScores[linesCleared] * this.level;
            
            // Tetris bonus (4 lines at once)
            if (linesCleared === 4) {
                baseScore *= 1.5;
                this.audio.playSFX('win'); // Special sound for Tetris
            }
            
            // Combo bonus
            const comboBonus = (this.combo - 1) * 50;
            this.score += baseScore + comboBonus;
            
            // Level up every 10 lines
            this.level = Math.floor(this.lines / 10) + 1;
            
            // Increase speed with level (but keep kids mode slower)
            if (this.mode === 'kids') {
                this.baseDropInterval = Math.max(400, 1000 - (this.level - 1) * 50);
            } else {
                this.baseDropInterval = Math.max(100, 800 - (this.level - 1) * 50);
            }
            this.dropInterval = this.baseDropInterval / this.speedMultiplier;
            
            this.audio.playSFX('collect');
        } else {
            // Reset combo if no lines cleared
            this.combo = 0;
        }
    }
    
    holdCurrentPiece() {
        if (!this.canHold) return;
        
        if (this.holdPiece === null) {
            this.holdPiece = this.currentPiece;
            this.spawnPiece();
        } else {
            const temp = this.currentPiece;
            this.currentPiece = this.holdPiece;
            this.holdPiece = temp;
            this.currentRotation = 0;
            this.currentX = Math.floor(this.cols / 2) - Math.floor(this.getCurrentShape()[0].length / 2);
            this.currentY = 0;
        }
        
        this.canHold = false;
        this.drawHoldPiece();
    }
    
    getGhostY() {
        let ghostY = this.currentY;
        while (this.isValidPosition(this.currentX, ghostY + 1, this.currentRotation)) {
            ghostY++;
        }
        return ghostY;
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
    
    gameOver() {
        this.gameState = 'gameover';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLines').textContent = this.lines;
        document.getElementById('gameOverModal').classList.add('active');
        document.getElementById('pauseBtn').style.display = 'none';
        document.getElementById('startBtn').style.display = 'block';
        this.saveGame();
    }
    
    restartGame() {
        document.getElementById('gameOverModal').classList.remove('active');
        this.startGame();
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
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
    }
    
    saveGame() {
        this.save.save({
            highScore: Math.max(this.score, this.save.load()?.highScore || 0),
            totalLines: (this.save.load()?.totalLines || 0) + this.lines,
            currentLevel: this.level,
            totalLevels: 20
        });
    }
    
    loadGame() {
        const data = this.save.load();
        if (data) {
            // Load settings but start fresh each game
        }
    }
    
    drawBlock(ctx, x, y, size, color) {
        // Create gradient for 3D effect
        const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
        gradient.addColorStop(0, this.lightenColor(color, 20));
        gradient.addColorStop(1, this.darkenColor(color, 20));
        
        // Draw main block with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, size - 2, size - 2);
        
        // Add highlight on top-left
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(x + 2, y + 2, size * 0.4, size * 0.4);
        
        // Add shadow on bottom-right
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + size - size * 0.3 - 2, y + size - size * 0.3 - 2, size * 0.3, size * 0.3);
        
        // Add border
        ctx.strokeStyle = this.darkenColor(color, 40);
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, size - 3, size - 3);
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    draw() {
        // Clear canvas with gradient background
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGradient.addColorStop(0, '#0a0a0a');
        bgGradient.addColorStop(1, '#1a1a2e');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid with subtle glow
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                this.ctx.strokeRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
                
                if (this.grid[y][x]) {
                    this.drawBlock(
                        this.ctx,
                        x * this.blockSize + 1,
                        y * this.blockSize + 1,
                        this.blockSize,
                        this.grid[y][x]
                    );
                }
            }
        }
        
        // Draw ghost piece (kids mode feature) with enhanced effect
        if (this.mode === 'kids' && this.currentPiece) {
            const ghostY = this.getGhostY();
            const shape = this.getCurrentShape();
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const x = (this.currentX + col) * this.blockSize + 1;
                        const y = (ghostY + row) * this.blockSize + 1;
                        
                        // Draw ghost with glow effect
                        this.ctx.shadowBlur = 15;
                        this.ctx.shadowColor = this.currentPiece.color;
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                        this.ctx.fillRect(x, y, this.blockSize - 2, this.blockSize - 2);
                        this.ctx.shadowBlur = 0;
                        
                        // Draw border
                        this.ctx.strokeStyle = this.currentPiece.color;
                        this.ctx.lineWidth = 2;
                        this.ctx.setLineDash([5, 5]);
                        this.ctx.strokeRect(x, y, this.blockSize - 2, this.blockSize - 2);
                        this.ctx.setLineDash([]);
                    }
                }
            }
        }
        
        // Draw current piece with enhanced graphics
        if (this.currentPiece) {
            const shape = this.getCurrentShape();
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        // Add subtle glow around active piece
                        this.ctx.shadowBlur = 10;
                        this.ctx.shadowColor = this.currentPiece.color;
                        
                        this.drawBlock(
                            this.ctx,
                            (this.currentX + col) * this.blockSize + 1,
                            (this.currentY + row) * this.blockSize + 1,
                            this.blockSize,
                            this.currentPiece.color
                        );
                        
                        this.ctx.shadowBlur = 0;
                    }
                }
            }
        }
        
        // Draw mission and stats overlay
        const missionIndex = Math.min(this.level - 1, this.levelMissions.length - 1);
        const mission = this.levelMissions[missionIndex];
        
        // Mission text at top
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = 'black';
        this.ctx.fillText('Mission: ' + mission.name, 5, 20);
        
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText(mission.mission, 5, 40);
        
        // Progress bar
        const progress = Math.min(this.lines / mission.target, 1);
        const barWidth = this.canvas.width - 10;
        const barHeight = 8;
        const barY = 50;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(5, barY, barWidth, barHeight);
        
        // Progress fill with gradient
        const progressGradient = this.ctx.createLinearGradient(5, barY, 5 + barWidth * progress, barY);
        progressGradient.addColorStop(0, '#00FF00');
        progressGradient.addColorStop(1, '#FFD700');
        this.ctx.fillStyle = progressGradient;
        this.ctx.fillRect(5, barY, barWidth * progress, barHeight);
        
        // Border
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(5, barY, barWidth, barHeight);
        
        // Combo display
        if (this.combo > 1) {
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FF1654';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#FF1654';
            this.ctx.fillText('COMBO x' + this.combo + '!', this.canvas.width / 2, this.canvas.height - 30);
        }
        
        // Highest combo
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 3;
        this.ctx.fillText('Best: x' + this.highestCombo, this.canvas.width - 5, this.canvas.height - 10);
        
        this.ctx.shadowBlur = 0;
    }
    
    drawNextPiece() {
        // Dark background with gradient
        const bgGradient = this.nextCtx.createLinearGradient(0, 0, 0, this.nextCanvas.height);
        bgGradient.addColorStop(0, 'rgba(10, 10, 10, 0.9)');
        bgGradient.addColorStop(1, 'rgba(26, 26, 46, 0.9)');
        this.nextCtx.fillStyle = bgGradient;
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const shape = this.nextPiece.shape[0];
            const blockSize = 25;
            const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
            const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        this.drawBlock(
                            this.nextCtx,
                            offsetX + col * blockSize,
                            offsetY + row * blockSize,
                            blockSize,
                            this.nextPiece.color
                        );
                    }
                }
            }
        }
    }
    
    drawHoldPiece() {
        // Dark background with gradient
        const bgGradient = this.holdCtx.createLinearGradient(0, 0, 0, this.holdCanvas.height);
        bgGradient.addColorStop(0, 'rgba(10, 10, 10, 0.9)');
        bgGradient.addColorStop(1, 'rgba(26, 26, 46, 0.9)');
        this.holdCtx.fillStyle = bgGradient;
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (this.holdPiece) {
            const shape = this.holdPiece.shape[0];
            const blockSize = 25;
            const offsetX = (this.holdCanvas.width - shape[0].length * blockSize) / 2;
            const offsetY = (this.holdCanvas.height - shape.length * blockSize) / 2;
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        this.drawBlock(
                            this.holdCtx,
                            offsetX + col * blockSize,
                            offsetY + row * blockSize,
                            blockSize,
                            this.holdPiece.color
                        );
                    }
                }
            }
        }
    }
    
    drawMenu() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#667eea';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Block Fall', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Press Start to Play!', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new BlockFallGame();
});
