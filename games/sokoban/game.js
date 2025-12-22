// Box Pusher Pro - Clean Sokoban Implementation
class BoxPushGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.audio = new AudioManager();
    this.input = new InputHandler();
    this.save = new SaveManager('box-push-pro');
    this.levels = window.CLASSIC_SOKOBAN_LEVELS || [];
    this.totalLevels = this.levels.length;
    this.levelIndex = 0;
    this.unlockedLevel = 0;
    this.totalScore = 0;
    this.staticGrid = [];
    this.boxes = [];
    this.goalSet = new Set();
    this.player = null;
    this.tileSize = 40;
    this.offsetX = 0;
    this.offsetY = 0;
    this.state = 'idle';
    this.moveCount = 0;
    this.boxGoalCount = 0;
    this.boxesOnGoal = 0;
    this.moveHistory = [];
    this.boxHistory = [];
    this.lastMoveTime = 0;
    this.moveDelay = 100;
    this.speedMultiplier = 1.0;
    this.levelConfigs = [
      { name: 'Box Basics', mission: 'Push 2 boxes to their goals.', boxCount: 2, moveLimit: 50, timeLimit: 180 },
      { name: 'Puzzle Training', mission: 'Solve with strategy.', boxCount: 2, moveLimit: 40, timeLimit: 180 },
      { name: 'Warehouse Challenge', mission: 'Push 3 boxes!', boxCount: 3, moveLimit: 60, timeLimit: 240 },
      { name: 'Advanced Logistics', mission: 'Master the 3-box puzzle.', boxCount: 3, moveLimit: 50, timeLimit: 240 },
      { name: 'Expert Puzzle', mission: 'Ultimate challenge!', boxCount: 4, moveLimit: 80, timeLimit: 300 },
      { name: 'Master Challenge', mission: 'Most complex arrangement.', boxCount: 4, moveLimit: 70, timeLimit: 300 }
    ];
    this.currentConfig = this.levelConfigs[0];
    this.ui = this.setupUI();
    this.bindInput();
    this.loadProgress();
    this.updateUI();
    this.drawSplash();
    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
  }
  setupUI() {
    const elements = {
      level: document.getElementById('level'),
      score: document.getElementById('score'),
      moves: document.getElementById('moves'),
      boxes: document.getElementById('boxes'),
      startBtn: document.getElementById('startBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      backBtn: document.getElementById('backBtn'),
      undoBtn: document.getElementById('undoBtn'),
      resetBtn: document.getElementById('resetBtn'),
      fullscreenBtn: document.getElementById('fullscreenBtn'),
      speedSlider: document.getElementById('speedSlider'),
      speedValue: document.getElementById('speedValue')
    };
    elements.startBtn?.addEventListener('click', () => this.startGame());
    elements.pauseBtn?.addEventListener('click', () => this.togglePause());
    elements.undoBtn?.addEventListener('click', () => this.undoMove());
    elements.resetBtn?.addEventListener('click', () => this.resetLevel());
    elements.backBtn?.addEventListener('click', () => this.backToMenu());
    elements.fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());
    elements.speedSlider?.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      this.speedMultiplier = isNaN(v) ? 1 : v;
      this.moveDelay = 100 / this.speedMultiplier;
      elements.speedValue && (elements.speedValue.textContent = `${this.speedMultiplier.toFixed(1)}x`);
    });
    return elements;
  }
  bindInput() { this.handleKeyDown = this.handleKeyDown.bind(this); this.input.on('keydown', this.handleKeyDown); }
  handleKeyDown(event) {
    if (this.state === 'idle' && event.code === 'Space') { this.startGame(); return; }
    if (this.state === 'paused' && event.code === 'Space') { this.togglePause(); return; }
    if (this.state !== 'playing') return;
    const now = performance.now();
    if (now - this.lastMoveTime < this.moveDelay) return;
    switch (event.code) {
      case 'ArrowUp': case 'KeyW': this.movePlayer(0, -1); break;
      case 'ArrowDown': case 'KeyS': this.movePlayer(0, 1); break;
      case 'ArrowLeft': case 'KeyA': this.movePlayer(-1, 0); break;
      case 'ArrowRight': case 'KeyD': this.movePlayer(1, 0); break;
      case 'KeyZ': this.undoMove(); break;
      case 'KeyR': this.resetLevel(); break;
      case 'Escape': this.togglePause(); break;
      default: return;
    }
    this.lastMoveTime = now;
  }
  loadProgress() {
    const data = this.save.load();
    if (!data) return;
    this.levelIndex = Math.min(data.currentLevel || 0, Math.max(this.totalLevels - 1, 0));
    this.unlockedLevel = Math.max(data.unlockedLevel || this.levelIndex, 0);
    this.totalScore = data.totalScore || 0;
  }
  saveProgress() { this.save.save({ currentLevel: this.levelIndex, unlockedLevel: this.unlockedLevel, totalScore: this.totalScore }); }
  loadLevel() {
    if (this.levels.length === 0) { console.warn('No levels'); return; }
    const level = this.levels[this.levelIndex];
    this.staticGrid = level.map(row => [...row]);
    this.boxes = []; this.goalSet.clear(); this.moveCount = 0; this.boxesOnGoal = 0;
    for (let y = 0; y < this.staticGrid.length; y++) {
      for (let x = 0; x < this.staticGrid[y].length; x++) {
        const cell = this.staticGrid[y][x];
        if (cell === 2 || cell === 5) this.goalSet.add(`${x},${y}`);
        if (cell === 3) { this.boxes.push({ x, y, onGoal: false }); this.staticGrid[y][x] = 1; }
        else if (cell === 5) { this.boxes.push({ x, y, onGoal: true }); this.boxesOnGoal++; this.staticGrid[y][x] = 1; }
        else if (cell === 4) { this.player = { x, y }; this.staticGrid[y][x] = 1; }
      }
    }
    this.boxGoalCount = this.goalSet.size;
    this.currentConfig = this.levelConfigs[Math.min(this.levelIndex, this.levelConfigs.length - 1)];
    this.state = 'playing';
  }
  movePlayer(dx, dy) {
    if (!this.player) return;
    const newX = this.player.x + dx, newY = this.player.y + dy;
    if (newY < 0 || newY >= this.staticGrid.length || newX < 0 || newX >= this.staticGrid[0].length || this.staticGrid[newY][newX] === 0) return;
    const boxAtNewPos = this.boxes.find(b => b.x === newX && b.y === newY);
    if (boxAtNewPos) {
      const boxNewX = newX + dx, boxNewY = newY + dy;
      if (boxNewY < 0 || boxNewY >= this.staticGrid.length || boxNewX < 0 || boxNewX >= this.staticGrid[0].length || 
          this.staticGrid[boxNewY][boxNewX] === 0 || this.boxes.find(b => b.x === boxNewX && b.y === boxNewY)) return;
      const wasOnGoal = boxAtNewPos.onGoal;
      boxAtNewPos.x = boxNewX; boxAtNewPos.y = boxNewY;
      boxAtNewPos.onGoal = this.goalSet.has(`${boxNewX},${boxNewY}`);
      if (wasOnGoal && !boxAtNewPos.onGoal) this.boxesOnGoal--;
      else if (!wasOnGoal && boxAtNewPos.onGoal) this.boxesOnGoal++;
      this.moveHistory.push({ type: 'move', x: this.player.x, y: this.player.y });
      this.boxHistory.push({ x: boxAtNewPos.x - dx, y: boxAtNewPos.y - dy, onGoal: wasOnGoal });
    } else {
      this.moveHistory.push({ type: 'move', x: this.player.x, y: this.player.y });
      this.boxHistory.push(null);
    }
    this.player.x = newX; this.player.y = newY; this.moveCount++;
    if (this.boxesOnGoal === this.boxGoalCount) this.winLevel();
    this.audio.playSFX('move');
  }
  undoMove() {
    if (this.moveHistory.length === 0) return;
    const lastMove = this.moveHistory.pop(), lastBoxState = this.boxHistory.pop();
    this.player.x = lastMove.x; this.player.y = lastMove.y; this.moveCount--;
    if (lastBoxState) {
      const box = this.boxes.find(b => b.x === this.player.x && b.y === this.player.y);
      if (box) {
        box.x = lastBoxState.x; box.y = lastBoxState.y; box.onGoal = lastBoxState.onGoal;
        this.boxesOnGoal = this.boxes.filter(b => b.onGoal).length;
      }
    }
    this.audio.playSFX('undo');
  }
  resetLevel() { this.moveHistory = []; this.boxHistory = []; this.loadLevel(); this.audio.playSFX('reset'); }
  winLevel() {
    this.state = 'won';
    this.totalScore += Math.max(0, 100 - this.moveCount * 2);
    this.unlockedLevel = Math.max(this.unlockedLevel, Math.min(this.levelIndex + 1, this.totalLevels - 1));
    this.saveProgress();
    this.audio.playSFX('win');
    setTimeout(() => {
      if (this.levelIndex < this.totalLevels - 1) { this.levelIndex++; this.loadLevel(); }
      else this.state = 'gameover';
    }, 2000);
  }
  startGame() { if (this.totalLevels === 0) { console.warn('No levels'); return; } this.loadLevel(); }
  togglePause() { if (this.state === 'playing') this.state = 'paused'; else if (this.state === 'paused') this.state = 'playing'; }
  toggleFullscreen() {
    const container = document.querySelector('.game-container');
    if (!document.fullscreenElement) {
      container?.requestFullscreen().catch(err => console.log('Fullscreen error:', err));
      this.ui.fullscreenBtn && (this.ui.fullscreenBtn.textContent = ' Exit Fullscreen');
    } else {
      document.exitFullscreen();
      this.ui.fullscreenBtn && (this.ui.fullscreenBtn.textContent = ' Fullscreen');
    }
  }
  backToMenu() { this.state = 'idle'; this.saveProgress(); window.location.href = '../../launcher.html'; }
  updateUI() {
    if (this.ui.level) this.ui.level.textContent = this.levelIndex + 1;
    if (this.ui.moves) this.ui.moves.textContent = this.moveCount;
    if (this.ui.boxes) this.ui.boxes.textContent = `${this.boxesOnGoal}/${this.boxGoalCount}`;
    if (this.ui.score) this.ui.score.textContent = this.totalScore;
  }
  draw() {
    // Draw gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw floor and walls with texture patterns
    for (let y = 0; y < this.staticGrid.length; y++) {
      for (let x = 0; x < this.staticGrid[y].length; x++) {
        const cell = this.staticGrid[y][x], px = x * this.tileSize + this.offsetX, py = y * this.tileSize + this.offsetY;
        if (cell === 0) {
          // Walls - solid dark
          this.ctx.fillStyle = '#0a0a0f';
          this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
          this.ctx.strokeStyle = '#222';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(px, py, this.tileSize, this.tileSize);
        } else if (cell === 1) {
          // Floor - checkerboard pattern
          const isChecked = (x + y) % 2 === 0;
          this.ctx.fillStyle = isChecked ? '#4a4a5e' : '#3a3a4e';
          this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
          
          // Add checkerboard shadow for depth
          this.ctx.strokeStyle = isChecked ? '#2a2a3e' : '#1a1a2e';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(px + 2, py + 2, this.tileSize - 4, this.tileSize - 4);
        }
      }
    }
    
    // Draw goals with pulsing animation
    const pulseAlpha = 0.3 + 0.4 * Math.abs(Math.sin(Date.now() / 500));
    for (const goal of this.goalSet) {
      const [x, y] = goal.split(',').map(Number), px = x * this.tileSize + this.offsetX, py = y * this.tileSize + this.offsetY;
      
      // Pulsing glow background
      this.ctx.fillStyle = `rgba(76, 200, 100, ${pulseAlpha})`;
      this.ctx.fillRect(px + 2, py + 2, this.tileSize - 4, this.tileSize - 4);
      
      // Goal outline
      this.ctx.strokeStyle = '#4c8';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(px + 2, py + 2, this.tileSize - 4, this.tileSize - 4);
      
      // Goal center marker (target symbol)
      const cx = px + this.tileSize / 2;
      const cy = py + this.tileSize / 2;
      const r = 5;
      this.ctx.strokeStyle = '#4c8';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(cx - 8, cy);
      this.ctx.lineTo(cx + 8, cy);
      this.ctx.moveTo(cx, cy - 8);
      this.ctx.lineTo(cx, cy + 8);
      this.ctx.stroke();
    }
    
    // Draw boxes with wood texture
    for (const box of this.boxes) {
      const px = box.x * this.tileSize + this.offsetX, py = box.y * this.tileSize + this.offsetY;
      const boxSize = this.tileSize - 8;
      
      if (box.onGoal) {
        // Box on goal - green with happiness
        this.ctx.fillStyle = '#7dd77d';
        this.ctx.fillRect(px + 4, py + 4, boxSize, boxSize);
        this.ctx.strokeStyle = '#2d8c2d';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(px + 4, py + 4, boxSize, boxSize);
        
        // Happy face on completed box
        const cx = px + this.tileSize / 2;
        const cy = py + this.tileSize / 2;
        this.ctx.fillStyle = '#2d8c2d';
        this.ctx.beginPath();
        this.ctx.arc(cx - 4, cy - 3, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(cx + 4, cy - 3, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(cx, cy + 4, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Box not on goal - wood texture with shading
        // Main wood color
        this.ctx.fillStyle = '#d4a574';
        this.ctx.fillRect(px + 4, py + 4, boxSize, boxSize);
        
        // Wood grain texture
        for (let i = 0; i < 3; i++) {
          this.ctx.strokeStyle = `rgba(139, 90, 43, ${0.3 - i * 0.1})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(px + 4 + i * 6, py + 4);
          this.ctx.lineTo(px + 4 + i * 6, py + 4 + boxSize);
          this.ctx.stroke();
        }
        
        // 3D shadow effect
        this.ctx.strokeStyle = '#8b5a2b';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(px + 4, py + 4, boxSize, boxSize);
        
        // Highlight corner
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(px + 6, py + 6);
        this.ctx.lineTo(px + 6 + boxSize - 4, py + 6);
        this.ctx.lineTo(px + 6, py + 6 + boxSize - 4);
        this.ctx.stroke();
      }
    }
    
    // Draw player character
    if (this.player) {
      const px = this.player.x * this.tileSize + this.offsetX, py = this.player.y * this.tileSize + this.offsetY;
      const cx = px + this.tileSize / 2, cy = py + this.tileSize / 2, r = this.tileSize / 3;
      
      // Head (circle)
      this.ctx.fillStyle = '#4af';
      this.ctx.beginPath();
      this.ctx.arc(cx, cy - 2, r, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Body (rectangle)
      this.ctx.fillStyle = '#4af';
      this.ctx.fillRect(cx - r + 2, cy + 2, r * 2 - 4, r + 2);
      
      // Eyes
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(cx - 3, cy - 3, 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(cx + 3, cy - 3, 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Smile
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy - 1, 3, 0, Math.PI, false);
      this.ctx.stroke();
      
      // Arms
      this.ctx.strokeStyle = '#4af';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(cx - r, cy + 2);
      this.ctx.lineTo(cx - r - 4, cy);
      this.ctx.moveTo(cx + r, cy + 2);
      this.ctx.lineTo(cx + r + 4, cy);
      this.ctx.stroke();
    }
    
    this.updateUI();
    if (this.state === 'won') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#4f4'; this.ctx.font = 'bold 40px Arial'; this.ctx.textAlign = 'center';
      this.ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.fillStyle = '#fff'; this.ctx.font = '20px Arial';
      this.ctx.fillText(`Moves: ${this.moveCount}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
  }
  drawSplash() {
    this.ctx.fillStyle = '#222'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#fff'; this.ctx.font = 'bold 32px Arial'; this.ctx.textAlign = 'center';
    this.ctx.fillText(' BOX PUSHER PRO', this.canvas.width / 2, 100);
    this.ctx.font = '20px Arial'; this.ctx.fillText('Push boxes to goals!', this.canvas.width / 2, 180);
  }
  gameLoop(timestamp) {
    if (this.state === 'idle' || this.state === 'gameover') this.drawSplash();
    else if (this.state === 'playing' || this.state === 'won' || this.state === 'paused') {
      this.draw();
      if (this.state === 'paused') {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#fff'; this.ctx.font = 'bold 40px Arial'; this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
      }
    }
    requestAnimationFrame(this.gameLoop);
  }
}
const game = new BoxPushGame();
