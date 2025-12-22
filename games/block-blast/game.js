// Block Blast Game (Match-3)
class BlockBlastGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new AudioManager();
        this.input = new InputHandler();
        this.save = new SaveManager('block-blast');
        
        this.score = 0;
        this.level = 1;
        this.gameState = 'menu';
        this.speedMultiplier = 1.0;
        
        this.gridSize = 8;
        this.blockSize = this.canvas.width / this.gridSize;
        this.grid = [];
        this.colors = ['#FF6B9D', '#FFB84D', '#00D4FF', '#A8E6CF', '#FFD3B6', '#FF8B94'];
        
        // Mission Level System
        this.levelConfigs = [
            { name: 'Blast Off', mission: 'Score 500 points by matching blocks.', targetScore: 500, moveLimit: 100, cascade: 1.0 },
            { name: 'Block Master', mission: 'Reach 1000 points with clever combos.', targetScore: 1000, moveLimit: 80, cascade: 1.2 },
            { name: 'Cascade Challenge', mission: 'Score 2000 points using cascades!', targetScore: 2000, moveLimit: 100, cascade: 1.5 },
            { name: 'Advanced Blast', mission: 'Master the 3000 point challenge.', targetScore: 3000, moveLimit: 90, cascade: 1.8 },
            { name: 'Expert Puzzle', mission: 'Reach 5000 points - ultimate test!', targetScore: 5000, moveLimit: 120, cascade: 2.0 }
        ];
        this.currentConfig = this.levelConfigs[0];
        this.moveCount = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.levelIntroTime = 0;
        this.cascadeParticles = [];
        this.cascadeCount = 0;
        
        this.init();
    }
    
    init() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('backBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.speedMultiplier = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = this.speedMultiplier.toFixed(1) + 'x';
        });
        
        // Click handler for block matching
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState !== 'playing') return;
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.blockSize);
            const y = Math.floor((e.clientY - rect.top) / this.blockSize);
            this.handleBlockClick(x, y);
        });
        
        this.drawMenu();
    }
    
    handleBlockClick(x, y) {
        if (x < 0 || y < 0 || x >= this.gridSize || y >= this.gridSize) return;
        
        const color = this.grid[y][x];
        const matched = this.getConnectedBlocks(color, x, y);
        
        if (matched.length >= 3) {
            this.moveCount++;
            let cascadeScore = 0;
            
            // Remove matched blocks
            matched.forEach(({rx, ry}) => {
                this.grid[ry][rx] = null;
                cascadeScore += Math.floor(10 * this.currentConfig.cascade * (1 + this.combo * 0.2));
            });
            
            this.score += cascadeScore;
            this.combo++;
            this.comboTimer = 3; // Increased combo window
            this.audio.playSFX('collect');
            
            // Check for cascade
            this.dropBlocks();
            this.processCascades();
            
            // Check win condition
            if (this.score >= this.currentConfig.targetScore) {
                this.levelUp();
            }
        }
    }
    
    getConnectedBlocks(color, x, y, visited = new Set()) {
        const key = `${x},${y}`;
        if (visited.has(key)) return [];
        if (x < 0 || y < 0 || x >= this.gridSize || y >= this.gridSize) return [];
        if (this.grid[y][x] !== color) return [];
        
        visited.add(key);
        const connected = [{rx: x, ry: y}];
        
        const neighbors = [
            [x - 1, y], [x + 1, y],
            [x, y - 1], [x, y + 1]
        ];
        
        neighbors.forEach(([nx, ny]) => {
            connected.push(...this.getConnectedBlocks(color, nx, ny, visited));
        });
        
        return connected;
    }
    
    dropBlocks() {
        for (let x = 0; x < this.gridSize; x++) {
            let writePos = this.gridSize - 1;
            for (let y = this.gridSize - 1; y >= 0; y--) {
                if (this.grid[y][x] !== null) {
                    this.grid[writePos][x] = this.grid[y][x];
                    if (writePos !== y) {
                        this.grid[y][x] = null;
                    }
                    writePos--;
                }
            }
        }
    }
    
    processCascades() {
        let cascadeMatches = [];
        
        // Find new matches after drop
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] !== null) {
                    const matches = this.getConnectedBlocks(this.grid[y][x], x, y);
                    if (matches.length >= 3) {
                        cascadeMatches.push(...matches);
                    }
                }
            }
        }
        
        // Remove duplicates
        const uniqueMatches = Array.from(new Set(cascadeMatches.map(m => `${m.rx},${m.ry}`)))
            .map(key => {
                const [rx, ry] = key.split(',').map(Number);
                return {rx, ry};
            });
        
        if (uniqueMatches.length > 0) {
            this.cascadeCount++;
            const cascadeBonus = Math.floor(uniqueMatches.length * 5 * this.cascadeCount);
            uniqueMatches.forEach(({rx, ry}) => {
                this.grid[ry][rx] = null;
                this.score += cascadeBonus;
                // Add particle effect
                this.cascadeParticles.push({
                    x: rx * this.blockSize + this.blockSize / 2,
                    y: ry * this.blockSize + this.blockSize / 2,
                    life: 0.5,
                    text: `+${cascadeBonus}`
                });
            });
            this.audio.playSFX('collect');
            
            // Continue cascading
            this.dropBlocks();
            setTimeout(() => this.processCascades(), 150);
        } else {
            this.cascadeCount = 0;
        }
    }
    
    levelUp() {
        this.level++;
        this.combo = 0;
        this.comboTimer = 0;
        this.cascadeCount = 0;
        this.gameState = 'levelup';
        this.audio.playSFX('win');
        
        setTimeout(() => {
            this.createGrid();
            this.gameState = 'playing';
        }, 2000);
    }
    
    createGrid() {
        const index = Math.min(this.level - 1, this.levelConfigs.length - 1);
        this.currentConfig = this.levelConfigs[index];
        this.moveCount = 0;
        this.combo = 0;
        this.cascadeCount = 0;
        this.comboTimer = 0;
        this.cascadeParticles = [];
        this.levelIntroTime = 120;
        
        this.grid = [];
        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = this.colors[Math.floor(Math.random() * this.colors.length)];
            }
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.createGrid();
        document.getElementById('startBtn').style.display = 'none';
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    gameLoop(currentTime) {
        if (this.gameState !== 'playing' && this.gameState !== 'levelup') return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
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
        
        // Update particles
        this.cascadeParticles = this.cascadeParticles.filter(p => {
            p.life -= deltaTime;
            return p.life > 0;
        });
        
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    draw() {
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw blocks with enhanced visuals
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] !== null) {
                    const px = x * this.blockSize;
                    const py = y * this.blockSize;
                    
                    // Draw block with gradient and shadow
                    const blockGradient = this.ctx.createLinearGradient(px, py, px, py + this.blockSize);
                    blockGradient.addColorStop(0, this.grid[y][x]);
                    blockGradient.addColorStop(1, this.adjustColor(this.grid[y][x], -30));
                    
                    this.ctx.fillStyle = blockGradient;
                    this.ctx.fillRect(px + 2, py + 2, this.blockSize - 4, this.blockSize - 4);
                    
                    // Highlight edge
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(px + 2, py + 2, this.blockSize - 4, this.blockSize - 4);
                    
                    // Border
                    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(px + 1, py + 1, this.blockSize - 2, this.blockSize - 2);
                }
            }
        }
        
        // Draw cascade particles (floating numbers)
        this.cascadeParticles.forEach(particle => {
            const alpha = particle.life;
            const scale = 1 + (0.5 - particle.life);
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = `bold ${14 * scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(particle.text, particle.x, particle.y - (0.5 - particle.life) * 30);
            this.ctx.restore();
        });
        
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        
        // Draw mission HUD
        this.drawMissionHUD();
        
        // Draw level up screen
        if (this.gameState === 'levelup') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🎉 LEVEL UP! 🎉', this.canvas.width / 2, this.canvas.height / 2);
            
            this.ctx.fillStyle = '#4ECDC4';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Level ${this.level}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
    }
    
    adjustColor(color, amount) {
        const usePound = color[0] === '#';
        const col = usePound ? color.slice(1) : color;
        const num = parseInt(col, 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return (usePound ? '#' : '') + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
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
        
        // Score target progress
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.font = 'bold 14px Arial';
        const progress = Math.floor((this.score / this.currentConfig.targetScore) * 100);
        this.ctx.fillText(`${progress}% / ${this.currentConfig.targetScore}`, this.canvas.width - 15, 28);
        
        // Combo indicator
        if (this.combo > 1 && this.comboTimer > 0) {
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.font = 'bold 22px Arial';
            this.ctx.fillText(`Combo x${this.combo}!`, this.canvas.width / 2, this.canvas.height - 15);
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
    
    drawMenu() {
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.95)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#00D4FF';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🧩 Block Blast', this.canvas.width / 2, 100);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Match 3+ blocks!', this.canvas.width / 2, 300);
    }
}

window.addEventListener('load', () => new BlockBlastGame());
