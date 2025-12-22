// Hero Quest Game
class HeroQuestGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game managers
        this.audio = new AudioManager();
        this.input = new InputHandler();
        this.save = new SaveManager('hero-quest');
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.gameState = 'menu';
        this.speedMultiplier = 1.0;
        
        // Grid
        this.tileSize = 40;
        this.gridCols = 16;
        this.gridRows = 12;
        this.tiles = [];
        
        // Player
        this.player = { x: 1, y: 10 };
        
        // Game objects
        this.chests = [];
        this.enemies = [];
        this.blocks = [];
        
        // Timing
        this.playerBaseDelay = 150;
        this.moveDelay = this.playerBaseDelay;
        this.lastMoveTime = 0;
        this.enemyBaseDelay = 400;
        this.enemyMinDelay = 120;
        this.lastTime = 0;
        
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
            this.moveDelay = this.playerBaseDelay / this.speedMultiplier;
            this.updateEnemySpeeds();
        });
        
        this.input.on('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            const now = performance.now();
            if (now - this.lastMoveTime < this.moveDelay) return;
            
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.movePlayer(-1, 0);
                    this.lastMoveTime = now;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.movePlayer(1, 0);
                    this.lastMoveTime = now;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    this.movePlayer(0, -1);
                    this.lastMoveTime = now;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.movePlayer(0, 1);
                    this.lastMoveTime = now;
                    break;
            }
        });
    }

    getEnemyMoveDelay() {
        return Math.max(this.enemyBaseDelay / this.speedMultiplier, this.enemyMinDelay);
    }

    updateEnemySpeeds() {
        const delay = this.getEnemyMoveDelay();
        this.enemies.forEach(enemy => {
            enemy.moveDelay = delay;
        });
    }

    createEnemy(x, y, vx, vy) {
        const delay = this.getEnemyMoveDelay();
        return {
            x,
            y,
            vx,
            vy,
            moveDelay: delay,
            moveElapsed: Math.random() * delay
        };
    }
    
    createLevel() {
        // Initialize tiles
        this.tiles = [];
        for (let y = 0; y < this.gridRows; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.gridCols; x++) {
                if (x === 0 || x === this.gridCols - 1 || y === 0 || y === this.gridRows - 1) {
                    this.tiles[y][x] = { type: 'wall', passable: false };
                } else {
                    this.tiles[y][x] = { type: 'floor', passable: true };
                }
            }
        }
        
        // Level configurations
        const levelConfigs = [
            // Level 1
            {
                walls: [[6, 3, 10]],
                chests: [
                    { x: 3, y: 3 },
                    { x: 10, y: 3 },
                    { x: 8, y: 8 }
                ],
                enemies: [
                    { x: 5, y: 2, vx: 1, vy: 0 },
                    { x: 12, y: 8, vx: 0, vy: 1 }
                ],
                blocks: [
                    { x: 5, y: 5 },
                    { x: 11, y: 5 }
                ],
                player: { x: 1, y: 10 }
            },
            // Level 2 - More walls and enemies
            {
                walls: [
                    [3, 3, 12],
                    [5, 5, 10],
                    [8, 7, 14]
                ],
                chests: [
                    { x: 2, y: 2 },
                    { x: 13, y: 3 },
                    { x: 7, y: 6 },
                    { x: 14, y: 9 }
                ],
                enemies: [
                    { x: 5, y: 2, vx: 1, vy: 0 },
                    { x: 12, y: 5, vx: 0, vy: 1 },
                    { x: 8, y: 8, vx: 1, vy: 0 }
                ],
                blocks: [
                    { x: 6, y: 4 },
                    { x: 11, y: 7 },
                    { x: 3, y: 9 }
                ],
                player: { x: 1, y: 10 }
            },
            // Level 3 - Expert
            {
                walls: [
                    [2, 4, 14],
                    [4, 2, 8],
                    [6, 6, 14],
                    [9, 3, 11]
                ],
                chests: [
                    { x: 3, y: 3 },
                    { x: 12, y: 2 },
                    { x: 5, y: 7 },
                    { x: 13, y: 8 },
                    { x: 7, y: 10 }
                ],
                enemies: [
                    { x: 4, y: 2, vx: 1, vy: 0 },
                    { x: 11, y: 4, vx: 0, vy: 1 },
                    { x: 7, y: 6, vx: 1, vy: 0 },
                    { x: 13, y: 9, vx: -1, vy: 0 }
                ],
                blocks: [
                    { x: 5, y: 4 },
                    { x: 10, y: 6 },
                    { x: 3, y: 9 },
                    { x: 12, y: 10 }
                ],
                player: { x: 1, y: 10 }
            },
            // Level 4 - Maze
            {
                walls: [
                    [2, 2, 10],
                    [4, 4, 14],
                    [6, 2, 12],
                    [8, 4, 14],
                    [10, 2, 10]
                ],
                chests: [
                    { x: 2, y: 1 },
                    { x: 13, y: 3 },
                    { x: 3, y: 5 },
                    { x: 13, y: 7 },
                    { x: 2, y: 9 }
                ],
                enemies: [
                    { x: 1, y: 5, vx: 0, vy: 1 },
                    { x: 14, y: 5, vx: 0, vy: -1 },
                    { x: 5, y: 1, vx: 1, vy: 0 },
                    { x: 5, y: 10, vx: 1, vy: 0 }
                ],
                blocks: [
                    { x: 7, y: 3 },
                    { x: 7, y: 7 }
                ],
                player: { x: 1, y: 10 }
            },
            // Level 5 - Enemy swarm
            {
                walls: [
                    [5, 3, 12]
                ],
                chests: [
                    { x: 2, y: 2 },
                    { x: 13, y: 2 },
                    { x: 2, y: 9 },
                    { x: 13, y: 9 }
                ],
                enemies: [
                    { x: 4, y: 1, vx: 1, vy: 0 },
                    { x: 11, y: 1, vx: -1, vy: 0 },
                    { x: 4, y: 10, vx: 1, vy: 0 },
                    { x: 11, y: 10, vx: -1, vy: 0 },
                    { x: 1, y: 4, vx: 0, vy: 1 },
                    { x: 14, y: 4, vx: 0, vy: 1 }
                ],
                blocks: [
                    { x: 7, y: 4 },
                    { x: 8, y: 4 },
                    { x: 7, y: 6 },
                    { x: 8, y: 6 }
                ],
                player: { x: 1, y: 1 }
            },
            // Level 6 - Block puzzle
            {
                walls: [
                    [3, 3, 12],
                    [8, 3, 12]
                ],
                chests: [
                    { x: 4, y: 2 },
                    { x: 11, y: 2 },
                    { x: 4, y: 9 },
                    { x: 11, y: 9 }
                ],
                enemies: [
                    { x: 7, y: 5, vx: 1, vy: 0 }
                ],
                blocks: [
                    { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 4 }, { x: 8, y: 4 }, { x: 9, y: 4 }, { x: 10, y: 4 }, { x: 11, y: 4 },
                    { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 }
                ],
                player: { x: 1, y: 1 }
            },
            // Level 7 - Claustrophobia
            {
                walls: [
                    [2, 2, 13], [4, 2, 13], [6, 2, 13], [8, 2, 13]
                ],
                chests: [
                    { x: 1, y: 1 }, { x: 14, y: 1 },
                    { x: 1, y: 3 }, { x: 14, y: 3 },
                    { x: 1, y: 5 }, { x: 14, y: 5 },
                    { x: 1, y: 7 }, { x: 14, y: 7 },
                    { x: 1, y: 9 }, { x: 14, y: 9 }
                ],
                enemies: [
                    { x: 7, y: 1, vx: 1, vy: 0 },
                    { x: 7, y: 3, vx: -1, vy: 0 },
                    { x: 7, y: 5, vx: 1, vy: 0 },
                    { x: 7, y: 7, vx: -1, vy: 0 },
                    { x: 7, y: 9, vx: 1, vy: 0 }
                ],
                blocks: [],
                player: { x: 7, y: 10 }
            },
            // Level 8 - The Final Challenge
            {
                walls: [
                    [2, 2, 5], [2, 10, 13],
                    [4, 2, 5], [4, 10, 13],
                    [6, 0, 3], [6, 7, 8], [6, 12, 15],
                    [8, 2, 5], [8, 10, 13],
                    [10, 2, 5], [10, 10, 13]
                ],
                chests: [
                    { x: 1, y: 1 }, { x: 14, y: 1 },
                    { x: 1, y: 10 }, { x: 14, y: 10 },
                    { x: 7, y: 5 }
                ],
                enemies: [
                    { x: 1, y: 3, vx: 1, vy: 0 }, { x: 14, y: 3, vx: -1, vy: 0 },
                    { x: 1, y: 8, vx: 1, vy: 0 }, { x: 14, y: 8, vx: -1, vy: 0 },
                    { x: 4, y: 1, vx: 0, vy: 1 }, { x: 11, y: 1, vx: 0, vy: 1 },
                    { x: 4, y: 10, vx: 0, vy: -1 }, { x: 11, y: 10, vx: 0, vy: -1 }
                ],
                blocks: [
                    { x: 7, y: 2 }, { x: 8, y: 2 },
                    { x: 7, y: 9 }, { x: 8, y: 9 }
                ],
                player: { x: 7, y: 1 }
            }
        ];
        
        // Get current level config
        if (this.level > levelConfigs.length) {
            this.gameState = 'win';
            this.drawWinScreen();
            return;
        }
        const levelIndex = this.level - 1;
        const config = levelConfigs[levelIndex];
        
        // Add walls
        for (let wallConfig of config.walls) {
            const [row, startCol, endCol] = wallConfig;
            for (let i = startCol; i <= endCol; i++) {
                this.tiles[row][i] = { type: 'wall', passable: false };
            }
        }
        
        // Create chests
        this.chests = config.chests.map(c => ({ ...c, collected: false }));
        
        // Create enemies
        this.enemies = config.enemies.map(e => this.createEnemy(e.x, e.y, e.vx, e.vy));
        
        // Create movable blocks
        this.blocks = config.blocks.map(b => ({ ...b }));
        
        // Set player position
        this.player = { ...config.player };
        
        this.updateEnemySpeeds();
    }
    
    movePlayer(dx, dy) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        if (!this.isWalkable(newX, newY)) return;
        
        // Check if pushing a block
        const blockIndex = this.blocks.findIndex(b => b.x === newX && b.y === newY);
        if (blockIndex !== -1) {
            const blockNewX = newX + dx;
            const blockNewY = newY + dy;
            
            if (!this.isWalkable(blockNewX, blockNewY) || 
                this.blocks.some(b => b.x === blockNewX && b.y === blockNewY)) {
                return;
            }
            
            this.blocks[blockIndex].x = blockNewX;
            this.blocks[blockIndex].y = blockNewY;
            this.audio.playSFX('move');
        }
        
        this.player.x = newX;
        this.player.y = newY;
        
        // Collect chests
        for (let chest of this.chests) {
            if (!chest.collected && chest.x === this.player.x && chest.y === this.player.y) {
                chest.collected = true;
                this.score += 50;
                this.audio.playSFX('collect');
            }
        }
        
        // Check win
        if (this.chests.every(c => c.collected)) {
            this.level++;
            this.audio.playSFX('win');
            this.createLevel();
        }
    }
    
    isWalkable(x, y, ignoreEnemy = null) {
        if (x < 0 || x >= this.gridCols || y < 0 || y >= this.gridRows) return false;
        const tile = this.tiles[y]?.[x];
        if (!tile || !tile.passable) return false;
        
        // Check enemies
        if (this.enemies.some(e => e !== ignoreEnemy && e.x === x && e.y === y)) return false;
        
        return true;
    }
    
    update(deltaTime) {
        // Update enemies
        for (let enemy of this.enemies) {
            enemy.moveElapsed = (enemy.moveElapsed || 0) + deltaTime;

            while (enemy.moveElapsed >= enemy.moveDelay) {
                enemy.moveElapsed -= enemy.moveDelay;
                const newX = enemy.x + enemy.vx;
                const newY = enemy.y + enemy.vy;

                if (this.isWalkable(newX, newY, enemy)) {
                    enemy.x = newX;
                    enemy.y = newY;
                } else {
                    enemy.vx *= -1;
                    enemy.vy *= -1;
                    enemy.moveElapsed = 0;
                    break;
                }

                if (enemy.x === this.player.x && enemy.y === this.player.y) {
                    this.gameState = 'gameOver';
                    this.audio.playSFX('die');
                    break;
                }
            }

            if (this.gameState === 'gameOver') {
                break;
            }
        }
        
        // Update UI
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('chests').textContent = this.chests.filter(c => c.collected).length;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw tiles
        for (let y = 0; y < this.gridRows; y++) {
            for (let x = 0; x < this.gridCols; x++) {
                const tile = this.tiles[y][x];
                const px = x * this.tileSize;
                const py = y * this.tileSize;
                
                if (tile.type === 'wall') {
                    this.ctx.fillStyle = '#FF69B4';
                    this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
                } else {
                    this.ctx.fillStyle = 'rgba(255, 105, 180, 0.2)';
                    this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
                }
            }
        }
        
        // Draw blocks
        this.ctx.fillStyle = '#8B4513';
        for (let block of this.blocks) {
            const px = block.x * this.tileSize;
            const py = block.y * this.tileSize;
            this.ctx.fillRect(px + 5, py + 5, this.tileSize - 10, this.tileSize - 10);
        }
        
        // Draw chests
        this.ctx.fillStyle = '#FFD700';
        for (let chest of this.chests) {
            if (!chest.collected) {
                const px = chest.x * this.tileSize + this.tileSize / 2;
                const py = chest.y * this.tileSize + this.tileSize / 2;
                this.ctx.fillRect(px - 10, py - 10, 20, 20);
            }
        }
        
        // Draw enemies
        this.ctx.fillStyle = '#FF1493';
        for (let enemy of this.enemies) {
            const px = enemy.x * this.tileSize + this.tileSize / 2;
            const py = enemy.y * this.tileSize + this.tileSize / 2;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 12, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw player
        const playerPx = this.player.x * this.tileSize + this.tileSize / 2;
        const playerPy = this.player.y * this.tileSize + this.tileSize / 2;
        this.ctx.fillStyle = '#00CED1';
        this.ctx.fillRect(playerPx - 15, playerPy - 15, 30, 30);
    }
    
    startGame() {
        this.gameState = 'playing';
        this.createLevel();
        this.lastTime = performance.now();
        this.lastMoveTime = this.lastTime - this.moveDelay;
        this.gameLoop(this.lastTime);
    }
    
    gameLoop(currentTime) {
        if (this.gameState !== 'playing' && this.gameState !== 'gameOver') {
            return;
        }
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.gameState === 'playing') {
            this.update(deltaTime);
        }
        this.draw();
        
        if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FF1493';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
            return;
        }

        if (this.gameState === 'win') {
            return; // Stop the loop on win
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
        
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🌈 Hero Quest', this.canvas.width / 2, 100);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Collect all the chests!', this.canvas.width / 2, 300);
    }
    
    drawWinScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('You Win!', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '24px Arial';
        this.ctx.fillText('You have completed all levels!', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new HeroQuestGame();
});
