// Maze Munch Game - Pac-Man Style
class MazeMunchGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 800;
        this.height = 600;
        
        // Grid settings
        this.gridSize = 25;
        this.cols = Math.floor(this.width / this.gridSize);
        this.rows = Math.floor(this.height / this.gridSize);
        
        // Game managers
        this.audio = new AudioManager();
        this.input = new InputHandler();
        this.save = new SaveManager('pacman-maze');
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'menu'; // menu, playing, paused, win, gameover
        this.difficulty = 'easy';
        
        // Level missions
        this.levelMissions = [
            { name: 'The Beginning', mission: 'Eat all dots! Avoid the ghosts!', targetScore: 500 },
            { name: 'Ghost Hunt', mission: 'Eat all ghosts with power pellets!', targetScore: 1000 },
            { name: 'Speed Run', mission: 'Clear the maze quickly!', targetScore: 1500 },
            { name: 'Fruit Frenzy', mission: 'Collect all fruits!', targetScore: 2000 },
            { name: 'Master Level', mission: 'Perfect clear - no lives lost!', targetScore: 3000 }
        ];
        
        // Player
        this.player = {
            x: 1,
            y: 1,
            direction: { x: 0, y: 0 },
            nextDirection: { x: 0, y: 0 },
            speed: 3,
            animFrame: 0,
            powerUpTime: 0,
            invincible: false
        };
        
        // Ghosts
        this.ghosts = [];
        this.ghostColors = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];
        
        // Maze and dots
        this.maze = [];
        this.dots = [];
        this.powerPellets = [];
        this.fruits = [];
        
        // Animation
        this.lastTime = 0;
        this.animationId = null;
        this.moveTimer = 0;
        this.moveInterval = 0.15;
        this.baseMoveInterval = 0.15;
        this.speedMultiplier = 1.0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadGame();
        this.generateMaze();
        this.setupGhosts();
        this.draw();
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('backBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        document.getElementById('retryBtn').addEventListener('click', () => this.restartGame());
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
        document.getElementById('quitBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        
        // Keyboard controls
        this.input.on('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            switch(e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.player.nextDirection = { x: 0, y: -1 };
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.player.nextDirection = { x: 0, y: 1 };
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.player.nextDirection = { x: -1, y: 0 };
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.player.nextDirection = { x: 1, y: 0 };
                    break;
                case 'Escape':
                    this.togglePause();
                    break;
            }
        });
    }
    
    updateGameSpeed(speed) {
        this.speedMultiplier = speed;
        this.moveInterval = this.baseMoveInterval / this.speedMultiplier;
    }
    
    generateMaze() {
        // Create authentic Pac-Man style maze - classic 28x31 pattern adapted to our grid
        this.maze = this.createClassicPacManMaze();
        this.placeDots();
        this.placePowerPellets();
        this.spawnFruit();
    }
    
    createClassicPacManMaze() {
        // Classic Pac-Man inspired maze pattern - symmetric and authentic
        // 1 = wall, 0 = path, 2 = ghost house
        const pattern = [
            "1111111111111111111111111111111111",
            "1......1......1..1......1......1",
            "1.1111.1.1111.1..1.1111.1.1111.1",
            "1P1111.1.1111.1..1.1111.1.1111P1",
            "1.1111.1.1111.1..1.1111.1.1111.1",
            "1..............................1",
            "1.1111.11.11111111111.11.1111.1",
            "1.1111.11.11111111111.11.1111.1",
            "1......11.......11.......11....1",
            "111111.11111.11.11.11.11111.111",
            "111111.11111.11.11.11.11111.111",
            "111111.11....11..11....11.11111",
            "111111.11.11112222111.11.11111",
            "111111.11.11222222211.11.11111",
            "..........11222222211.11.......",
            "111111.11.11222222211.11.11111",
            "111111.11.11111111111.11.11111",
            "111111.11....11..11....11.11111",
            "111111.11.11111111111.11.11111",
            "1......11.......11.......11....1",
            "1.1111.11111.11.11.11.11111.1",
            "1.1111.11111.11.11.11.11111.1",
            "1P...1................1...P1",
            "1111.1.11.11111111111.11.1.1111",
            "1111.1.11.11111111111.11.1.1111",
            "1......11.......11.......11....1",
            "1.11111111111.11.11.11111111111.1",
            "1.11111111111.11.11.11111111111.1",
            "1..............................1",
            "1111111111111111111111111111111111"
        ];
        
        const maze = [];
        for (let y = 0; y < this.rows; y++) {
            maze[y] = [];
            for (let x = 0; x < this.cols; x++) {
                // Scale pattern to fit our grid
                const patternY = Math.floor((y / this.rows) * pattern.length);
                const patternX = Math.floor((x / this.cols) * pattern[0].length);
                const char = pattern[patternY][patternX];
                
                if (char === '1') {
                    maze[y][x] = 1; // Wall
                } else if (char === '2') {
                    maze[y][x] = 2; // Ghost house
                } else {
                    maze[y][x] = 0; // Path
                }
            }
        }
        return maze;
    }
    
    placeDots() {
        this.dots = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.maze[y][x] === 0 && !(x === this.player.x && y === this.player.y)) {
                    this.dots.push({ x, y });
                }
            }
        }
    }
    
    placePowerPellets() {
        this.powerPellets = [];
        const corners = [
            { x: 2, y: 2 },
            { x: this.cols - 3, y: 2 },
            { x: 2, y: this.rows - 3 },
            { x: this.cols - 3, y: this.rows - 3 }
        ];
        
        corners.forEach(pos => {
            if (this.maze[pos.y] && this.maze[pos.y][pos.x] === 0) {
                this.powerPellets.push({ x: pos.x, y: pos.y, pulse: 0 });
            }
        });
    }
    
    spawnFruit() {
        if (Math.random() > 0.3) {
            const empty = this.dots.filter(d => 
                !this.powerPellets.some(p => p.x === d.x && p.y === d.y)
            );
            if (empty.length > 0) {
                const pos = empty[Math.floor(Math.random() * empty.length)];
                this.fruits.push({
                    x: pos.x,
                    y: pos.y,
                    type: ['🍒', '🍓', '🍊', '🍎', '🍇'][Math.floor(Math.random() * 5)],
                    points: 100 * this.level,
                    lifetime: 10
                });
            }
        }
    }
    
    setupGhosts() {
        this.ghosts = [];
        const ghostCount = Math.min(2 + this.level, 4);
        
        // Find ghost house center (areas marked with 2)
        let houseX = Math.floor(this.cols / 2);
        let houseY = Math.floor(this.rows / 2);
        
        // Ghost personalities: Blinky (chase), Pinky (ambush), Inky (patrol), Clyde (shy)
        const ghostTypes = [
            { name: 'Blinky', color: '#FF0000', personality: 'blinky', speed: 1.0 },    // Red - Direct chaser
            { name: 'Pinky', color: '#FFB8FF', personality: 'pinky', speed: 1.05 },     // Pink - Ambusher
            { name: 'Inky', color: '#00FFFF', personality: 'inky', speed: 0.95 },       // Cyan - Patroller
            { name: 'Clyde', color: '#FFB852', personality: 'clyde', speed: 0.9 }        // Orange - Shy
        ];
        
        for (let i = 0; i < ghostCount; i++) {
            const type = ghostTypes[i % ghostTypes.length];
            
            this.ghosts.push({
                x: houseX + (i - 1.5),
                y: houseY,
                color: type.color,
                name: type.name,
                direction: { x: 0, y: 0 },
                personality: type.personality,
                speed: type.speed,
                scared: false,
                scaredTime: 0,
                mode: 'scatter', // scatter or chase
                modeTimer: 0,
                scatterTarget: this.getScatterTarget(i),
                homeX: houseX + (i - 1.5),
                homeY: houseY
            });
        }
        
        // Mode switching timer
        this.ghostModeTimer = 0;
        this.ghostModeDuration = 7; // seconds
        this.currentGhostMode = 'scatter';
    }
    
    getScatterTarget(ghostIndex) {
        // Each ghost has a corner they prefer during scatter mode
        const corners = [
            { x: this.cols - 3, y: 2 },           // Blinky - top right
            { x: 2, y: 2 },                        // Pinky - top left  
            { x: this.cols - 3, y: this.rows - 3 }, // Inky - bottom right
            { x: 2, y: this.rows - 3 }             // Clyde - bottom left
        ];
        return corners[ghostIndex % 4];
    }
    
    startGame() {
        this.gameState = 'playing';
        this.player.x = 1;
        this.player.y = 1;
        this.player.direction = { x: 0, y: 0 };
        this.player.nextDirection = { x: 0, y: 0 };
        this.player.invincible = false;
        
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
        this.moveTimer += deltaTime;
        
        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;
            
            // Try to change direction
            if (this.canMove(this.player.x + this.player.nextDirection.x, this.player.y + this.player.nextDirection.y)) {
                this.player.direction = { ...this.player.nextDirection };
            }
            
            // Move player
            if (this.canMove(this.player.x + this.player.direction.x, this.player.y + this.player.direction.y)) {
                this.player.x += this.player.direction.x;
                this.player.y += this.player.direction.y;
                
                // Collect dots
                this.checkDotCollection();
                this.checkPowerPelletCollection();
                this.checkFruitCollection();
            }
            
            // Move ghosts
            this.moveGhosts();
            
            // Check collisions
            this.checkGhostCollision();
        }
        
        // Update power-up timer
        if (this.player.powerUpTime > 0) {
            this.player.powerUpTime -= deltaTime;
            if (this.player.powerUpTime <= 0) {
                this.player.invincible = false;
                this.ghosts.forEach(g => g.scared = false);
            }
        }
        
        // Update fruits
        this.fruits = this.fruits.filter(f => {
            f.lifetime -= deltaTime;
            return f.lifetime > 0;
        });
        
        // Update power pellet animation
        this.powerPellets.forEach(p => p.pulse += deltaTime * 5);
        
        // Check win condition
        if (this.dots.length === 0) {
            this.levelComplete();
        }
        
        // Update animation
        this.player.animFrame += deltaTime * 10;
    }
    
    canMove(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;
        return this.maze[y][x] === 0;
    }
    
    checkDotCollection() {
        const dotIndex = this.dots.findIndex(d => d.x === this.player.x && d.y === this.player.y);
        if (dotIndex !== -1) {
            this.dots.splice(dotIndex, 1);
            this.score += 10;
            this.updateUI();
        }
    }
    
    checkPowerPelletCollection() {
        const pelletIndex = this.powerPellets.findIndex(p => p.x === this.player.x && p.y === this.player.y);
        if (pelletIndex !== -1) {
            this.powerPellets.splice(pelletIndex, 1);
            this.score += 50;
            this.player.powerUpTime = 8;
            this.player.invincible = true;
            this.ghosts.forEach(g => {
                g.scared = true;
                g.scaredTime = 8;
            });
            this.updateUI();
        }
    }
    
    checkFruitCollection() {
        const fruitIndex = this.fruits.findIndex(f => f.x === this.player.x && f.y === this.player.y);
        if (fruitIndex !== -1) {
            const fruit = this.fruits[fruitIndex];
            this.fruits.splice(fruitIndex, 1);
            this.score += fruit.points;
            this.updateUI();
        }
    }
    
    moveGhosts() {
        // Update global ghost mode (scatter/chase switching)
        this.ghostModeTimer += this.moveInterval;
        if (this.ghostModeTimer >= this.ghostModeDuration) {
            this.ghostModeTimer = 0;
            this.currentGhostMode = this.currentGhostMode === 'scatter' ? 'chase' : 'scatter';
        }
        
        this.ghosts.forEach(ghost => {
            // Update scared timer
            if (ghost.scared && ghost.scaredTime > 0) {
                ghost.scaredTime--;
                if (ghost.scaredTime <= 0) {
                    ghost.scared = false;
                }
            }
            
            let newDir = { ...ghost.direction };
            let targetX, targetY;
            
            if (ghost.scared) {
                // Run away from player - move erratically
                newDir = this.getRunAwayDirection(ghost);
            } else {
                // Determine target based on personality and mode
                ghost.mode = this.currentGhostMode;
                
                if (ghost.mode === 'scatter') {
                    // Go to scatter corner
                    targetX = ghost.scatterTarget.x;
                    targetY = ghost.scatterTarget.y;
                } else {
                    // Chase mode - different behavior per ghost
                    switch(ghost.personality) {
                        case 'blinky': // Red - Direct chase
                            targetX = this.player.x;
                            targetY = this.player.y;
                            break;
                        case 'pinky': // Pink - Ambush (4 tiles ahead)
                            targetX = this.player.x + this.player.direction.x * 4;
                            targetY = this.player.y + this.player.direction.y * 4;
                            break;
                        case 'inky': // Cyan - Complex (uses Blinky position)
                            const blinky = this.ghosts[0];
                            const pivotX = this.player.x + this.player.direction.x * 2;
                            const pivotY = this.player.y + this.player.direction.y * 2;
                            targetX = pivotX + (pivotX - blinky.x);
                            targetY = pivotY + (pivotY - blinky.y);
                            break;
                        case 'clyde': // Orange - Chase if far, scatter if close
                            const dist = Math.hypot(ghost.x - this.player.x, ghost.y - this.player.y);
                            if (dist > 8) {
                                targetX = this.player.x;
                                targetY = this.player.y;
                            } else {
                                targetX = ghost.scatterTarget.x;
                                targetY = ghost.scatterTarget.y;
                            }
                            break;
                    }
                }
                
                // Calculate best direction toward target
                newDir = this.getBestDirection(ghost, targetX, targetY);
            }
            
            // Try new direction
            if (this.canMove(ghost.x + newDir.x, ghost.y + newDir.y)) {
                ghost.direction = newDir;
                ghost.x += newDir.x;
                ghost.y += newDir.y;
            }
            // If can't move in new direction, try continuing current direction
            else if (this.canMove(ghost.x + ghost.direction.x, ghost.y + ghost.direction.y)) {
                ghost.x += ghost.direction.x;
                ghost.y += ghost.direction.y;
            }
            // Otherwise pick best valid direction
            else {
                const validDirs = [
                    { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
                ].filter(d => this.canMove(ghost.x + d.x, ghost.y + d.y));
                
                if (validDirs.length > 0) {
                    ghost.direction = validDirs[Math.floor(Math.random() * validDirs.length)];
                    ghost.x += ghost.direction.x;
                    ghost.y += ghost.direction.y;
                }
            }
        });
    }
    
    getBestDirection(ghost, targetX, targetY) {
        // Calculate distances for all four directions
        const directions = [
            { x: 0, y: -1 }, // up
            { x: 0, y: 1 },  // down
            { x: -1, y: 0 }, // left
            { x: 1, y: 0 }   // right
        ];
        
        let bestDir = ghost.direction;
        let bestDist = Infinity;
        
        for (let dir of directions) {
            const newX = ghost.x + dir.x;
            const newY = ghost.y + dir.y;
            
            // Don't reverse direction unless necessary
            if (dir.x === -ghost.direction.x && dir.y === -ghost.direction.y) {
                continue;
            }
            
            if (this.canMove(newX, newY)) {
                const dist = Math.hypot(newX - targetX, newY - targetY);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = dir;
                }
            }
        }
        
        return bestDir;
    }
    
    getChaseDirection(ghost) {
        const dx = this.player.x - ghost.x;
        const dy = this.player.y - ghost.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return { x: Math.sign(dx), y: 0 };
        } else {
            return { x: 0, y: Math.sign(dy) };
        }
    }
    
    getRandomDirection(ghost) {
        const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        return dirs[Math.floor(Math.random() * dirs.length)];
    }
    
    getAmbushDirection(ghost) {
        // Try to get ahead of player
        const targetX = this.player.x + this.player.direction.x * 4;
        const targetY = this.player.y + this.player.direction.y * 4;
        
        const dx = targetX - ghost.x;
        const dy = targetY - ghost.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return { x: Math.sign(dx), y: 0 };
        } else {
            return { x: 0, y: Math.sign(dy) };
        }
    }
    
    getPatrolDirection(ghost) {
        // Continue in same direction mostly
        if (Math.random() > 0.1) {
            return ghost.direction;
        }
        return this.getRandomDirection(ghost);
    }
    
    getRunAwayDirection(ghost) {
        const dx = ghost.x - this.player.x;
        const dy = ghost.y - this.player.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return { x: Math.sign(dx), y: 0 };
        } else {
            return { x: 0, y: Math.sign(dy) };
        }
    }
    
    checkGhostCollision() {
        this.ghosts.forEach((ghost, index) => {
            if (ghost.x === this.player.x && ghost.y === this.player.y) {
                if (this.player.invincible && ghost.scared) {
                    // Eat ghost
                    this.score += 200;
                    this.updateUI();
                    // Respawn ghost
                    this.respawnGhost(index);
                } else if (!this.player.invincible) {
                    // Lose life
                    this.loseLife();
                }
            }
        });
    }
    
    respawnGhost(index) {
        let x, y;
        do {
            x = Math.floor(Math.random() * (this.cols - 4)) + 2;
            y = Math.floor(Math.random() * (this.rows - 4)) + 2;
        } while (this.maze[y][x] === 1 || (Math.abs(x - this.player.x) < 8 && Math.abs(y - this.player.y) < 8));
        
        this.ghosts[index].x = x;
        this.ghosts[index].y = y;
        this.ghosts[index].scared = false;
    }
    
    loseLife() {
        this.lives--;
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset positions
            this.player.x = 1;
            this.player.y = 1;
            this.player.direction = { x: 0, y: 0 };
            this.setupGhosts();
        }
    }
    
    levelComplete() {
        this.gameState = 'win';
        document.getElementById('winScore').textContent = this.score;
        document.getElementById('winModal').classList.add('active');
        this.saveGame();
    }
    
    nextLevel() {
        this.level++;
        this.updateUI();
        document.getElementById('winModal').classList.remove('active');
        
        // Bonus lives every 3 levels
        if (this.level % 3 === 0) {
            this.lives++;
        }
        
        this.generateMaze();
        this.setupGhosts();
        this.startGame();
    }
    
    gameOver() {
        this.gameState = 'gameover';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverModal').classList.add('active');
        this.saveGame();
    }
    
    restartGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.updateUI();
        
        document.getElementById('gameOverModal').classList.remove('active');
        
        this.generateMaze();
        this.setupGhosts();
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
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }
    
    saveGame() {
        this.save.save({
            score: this.score,
            lives: this.lives,
            currentLevel: this.level,
            totalLevels: 5
        });
    }
    
    loadGame() {
        const data = this.save.load();
        if (data) {
            this.level = data.currentLevel || 1;
            // Don't restore score/lives on load, start fresh each session
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw maze
        this.ctx.fillStyle = '#1E40AF';
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.maze[y][x] === 1) {
                    this.ctx.fillRect(
                        x * this.gridSize,
                        y * this.gridSize,
                        this.gridSize,
                        this.gridSize
                    );
                }
            }
        }
        
        // Draw dots
        this.ctx.fillStyle = '#FFD700';
        this.dots.forEach(dot => {
            this.ctx.beginPath();
            this.ctx.arc(
                dot.x * this.gridSize + this.gridSize / 2,
                dot.y * this.gridSize + this.gridSize / 2,
                3,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
        
        // Draw power pellets
        this.powerPellets.forEach(pellet => {
            const size = 6 + Math.sin(pellet.pulse) * 2;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(
                pellet.x * this.gridSize + this.gridSize / 2,
                pellet.y * this.gridSize + this.gridSize / 2,
                size,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
        
        // Draw fruits
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.fruits.forEach(fruit => {
            this.ctx.fillText(
                fruit.type,
                fruit.x * this.gridSize + this.gridSize / 2,
                fruit.y * this.gridSize + this.gridSize / 2
            );
        });
        
        // Draw player
        this.ctx.fillStyle = this.player.invincible ? '#FFD700' : '#FFFF00';
        const mouthOpen = Math.sin(this.player.animFrame) > 0;
        
        this.ctx.save();
        this.ctx.translate(
            this.player.x * this.gridSize + this.gridSize / 2,
            this.player.y * this.gridSize + this.gridSize / 2
        );
        
        // Rotate based on direction
        let angle = 0;
        if (this.player.direction.x > 0) angle = 0;
        else if (this.player.direction.x < 0) angle = Math.PI;
        else if (this.player.direction.y > 0) angle = Math.PI / 2;
        else if (this.player.direction.y < 0) angle = -Math.PI / 2;
        this.ctx.rotate(angle);
        
        this.ctx.beginPath();
        if (mouthOpen) {
            this.ctx.arc(0, 0, this.gridSize / 2 - 2, 0.2 * Math.PI, 1.8 * Math.PI);
            this.ctx.lineTo(0, 0);
        } else {
            this.ctx.arc(0, 0, this.gridSize / 2 - 2, 0, 2 * Math.PI);
        }
        this.ctx.fill();
        this.ctx.restore();
        
        // Draw ghosts
        this.ghosts.forEach(ghost => {
            if (ghost.scared) {
                this.ctx.fillStyle = '#0000FF';
            } else {
                this.ctx.fillStyle = ghost.color;
            }
            
            const x = ghost.x * this.gridSize;
            const y = ghost.y * this.gridSize;
            const size = this.gridSize - 4;
            
            // Ghost body
            this.ctx.beginPath();
            this.ctx.arc(x + size / 2, y + size / 2, size / 2, Math.PI, 0);
            this.ctx.lineTo(x + size, y + size);
            this.ctx.lineTo(x + size * 0.75, y + size * 0.8);
            this.ctx.lineTo(x + size * 0.5, y + size);
            this.ctx.lineTo(x + size * 0.25, y + size * 0.8);
            this.ctx.lineTo(x, y + size);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Eyes
            if (!ghost.scared) {
                this.ctx.fillStyle = '#FFF';
                this.ctx.beginPath();
                this.ctx.arc(x + size * 0.35, y + size * 0.4, 3, 0, Math.PI * 2);
                this.ctx.arc(x + size * 0.65, y + size * 0.4, 3, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#000';
                this.ctx.beginPath();
                this.ctx.arc(x + size * 0.35, y + size * 0.4, 1.5, 0, Math.PI * 2);
                this.ctx.arc(x + size * 0.65, y + size * 0.4, 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // Draw power-up indicator
        if (this.player.invincible) {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `Power-Up: ${Math.ceil(this.player.powerUpTime)}s`,
                this.width / 2,
                30
            );
        }
        
        // Draw mission information
        const missionIndex = Math.min(this.level - 1, this.levelMissions.length - 1);
        const mission = this.levelMissions[missionIndex];
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Level ' + this.level + ': ' + mission.name, 10, 25);
        
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText(mission.mission, 10, 45);
        
        // Draw ghost mode indicator
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = this.currentGhostMode === 'scatter' ? '#00FFFF' : '#FF0000';
        this.ctx.fillText('Ghost Mode: ' + this.currentGhostMode.toUpperCase(), this.width - 10, 25);
        
        // Draw dots remaining
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Dots: ' + this.dots.length, this.width - 10, 45);
    }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new MazeMunchGame();
});
