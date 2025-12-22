class SokobanMaster {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.audio = new AudioManager();
    this.input = new InputHandler();
    this.save = new SaveManager('sokoban-master');

    this.levels = Array.isArray(window.SOKOBAN_MASTER_LEVELS)
      ? window.SOKOBAN_MASTER_LEVELS
      : [];

    this.totalLevels = this.levels.length;
    this.levelIndex = 0;
    this.unlockedLevel = 0;
    this.bestMoves = {};

    this.staticGrid = [];
    this.boxes = [];
    this.goalSet = new Set();
    this.tileSize = 36;
    this.offsetX = 0;
    this.offsetY = 0;

    this.state = 'idle';
    this.moveCount = 0;
    this.boxGoalCount = 0;
    this.boxesOnGoal = 0;

    this.moveHistory = [];
    this.lastMoveTime = 0;
    this.moveDelay = 140;
    this.speedMultiplier = 1;

    this.overlayTimer = null;

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
      moves: document.getElementById('moves'),
      best: document.getElementById('best'),
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

    elements.speedSlider?.addEventListener('input', (event) => {
      const value = parseFloat(event.target.value);
      this.speedMultiplier = isNaN(value) ? 1 : value;
      this.moveDelay = 140 / this.speedMultiplier;
      if (elements.speedValue) {
        elements.speedValue.textContent = `${this.speedMultiplier.toFixed(1)}x`;
      }
    });

    return elements;
  }

  bindInput() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.input.on('keydown', this.handleKeyDown);
  }

  handleKeyDown(event) {
    if (this.state !== 'playing') {
      if (event.code === 'Space' && this.state === 'idle') {
        this.startGame();
      } else if (event.code === 'Space' && this.state === 'paused') {
        this.togglePause();
      }
      return;
    }

    const now = performance.now();
    if (now - this.lastMoveTime < this.moveDelay) {
      return;
    }

    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.movePlayer(0, -1);
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.movePlayer(0, 1);
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.movePlayer(-1, 0);
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.movePlayer(1, 0);
        break;
      case 'KeyZ':
        this.undoMove();
        break;
      case 'KeyR':
        this.resetLevel();
        break;
      case 'Escape':
        this.togglePause();
        break;
      default:
        return;
    }

    this.lastMoveTime = now;
  }

  loadProgress() {
    const data = this.save.load();
    if (!data) {
      return;
    }

    this.bestMoves = data.bestMoves || {};
    this.levelIndex = Math.min(data.currentLevel || 0, Math.max(this.totalLevels - 1, 0));
    this.unlockedLevel = Math.max(data.unlockedLevel || this.levelIndex, 0);
  }

  saveProgress() {
    this.save.save({
      currentLevel: this.levelIndex,
      unlockedLevel: this.unlockedLevel,
      bestMoves: this.bestMoves
    });
  }

  startGame() {
    if (!this.totalLevels) {
      this.state = 'completed';
      return;
    }

    this.ui.startBtn.style.display = 'none';
    this.ui.pauseBtn.style.display = 'inline-block';
    this.state = 'playing';
    this.loadLevel(this.levelIndex);
  }

  loadLevel(index) {
    const level = this.levels[index];
    if (!Array.isArray(level)) {
      return;
    }

    this.levelIndex = index;
    this.staticGrid = [];
    this.boxes = [];
    this.goalSet = new Set();
    this.moveHistory = [];
    this.moveCount = 0;
    this.boxGoalCount = 0;

    let playerFound = false;

    for (let y = 0; y < level.length; y++) {
      const row = level[y];
      const staticRow = [];
      for (let x = 0; x < row.length; x++) {
        const value = row[x];
        switch (value) {
          case 1:
            staticRow.push('wall');
            break;
          case 2:
            staticRow.push('goal');
            this.goalSet.add(`${x},${y}`);
            this.boxGoalCount++;
            break;
          case 3:
            staticRow.push('floor');
            this.boxes.push({ x, y });
            break;
          case 4:
            staticRow.push('floor');
            this.player = { x, y };
            playerFound = true;
            break;
          case 5:
            staticRow.push('goal');
            this.goalSet.add(`${x},${y}`);
            this.boxGoalCount++;
            this.boxes.push({ x, y });
            break;
          default:
            staticRow.push('floor');
            break;
        }
      }
      this.staticGrid.push(staticRow);
    }

    if (!playerFound) {
      // fallback to top-left open tile
      this.player = { x: 1, y: 1 };
    }

    this.computeLayoutOffsets();
    this.updateBoxesOnGoal();
    this.updateUI();
    this.state = 'playing';
    this.lastMoveTime = 0;

    this.saveProgress();
  }

  computeLayoutOffsets() {
    const rows = this.staticGrid.length;
    const cols = rows ? this.staticGrid[0].length : 0;
    if (!rows || !cols) {
      this.offsetX = 0;
      this.offsetY = 0;
      return;
    }

    const tileByWidth = Math.floor(this.canvas.width / cols);
    const tileByHeight = Math.floor(this.canvas.height / rows);
    this.tileSize = Math.min(48, Math.max(28, Math.min(tileByWidth, tileByHeight)));

    const levelWidth = cols * this.tileSize;
    const levelHeight = rows * this.tileSize;

    this.offsetX = Math.floor((this.canvas.width - levelWidth) / 2);
    this.offsetY = Math.floor((this.canvas.height - levelHeight) / 2);
  }

  movePlayer(dx, dy) {
    if (this.state !== 'playing') {
      return;
    }

    const targetX = this.player.x + dx;
    const targetY = this.player.y + dy;

    if (!this.isWalkable(targetX, targetY)) {
      this.audio.playSFX?.('freeze');
      return;
    }

    const boxIndex = this.findBox(targetX, targetY);
    if (boxIndex !== -1) {
      const nextX = targetX + dx;
      const nextY = targetY + dy;
      if (!this.isWalkable(nextX, nextY) || this.findBox(nextX, nextY) !== -1) {
        this.audio.playSFX?.('freeze');
        return;
      }

      this.storeHistory();
      this.boxes[boxIndex] = { x: nextX, y: nextY };
      this.player = { x: targetX, y: targetY };
      this.moveCount++;
      this.audio.playSFX?.('collect');
    } else {
      this.storeHistory();
      this.player = { x: targetX, y: targetY };
      this.moveCount++;
      this.audio.playSFX?.('collect');
    }

    this.updateBoxesOnGoal();
    this.updateUI();

    if (this.boxesOnGoal === this.boxGoalCount && this.boxGoalCount > 0) {
      this.handleLevelComplete();
    }
  }

  storeHistory() {
    this.moveHistory.push({
      player: { ...this.player },
      boxes: this.boxes.map((box) => ({ ...box }))
    });

    if (this.moveHistory.length > 200) {
      this.moveHistory.shift();
    }
  }

  undoMove() {
    if (this.moveHistory.length === 0 || this.state !== 'playing') {
      return;
    }

    const previous = this.moveHistory.pop();
    this.player = { ...previous.player };
    this.boxes = previous.boxes.map((box) => ({ ...box }));
    this.moveCount = Math.max(0, this.moveCount - 1);
    this.updateBoxesOnGoal();
    this.updateUI();
    this.audio.playSFX?.('jump');
  }

  resetLevel() {
    this.loadLevel(this.levelIndex);
    this.audio.playSFX?.('shoot');
  }

  isWalkable(x, y) {
    return this.staticGrid?.[y]?.[x] && this.staticGrid[y][x] !== 'wall';
  }

  findBox(x, y) {
    return this.boxes.findIndex((box) => box.x === x && box.y === y);
  }

  isGoal(x, y) {
    return this.goalSet.has(`${x},${y}`);
  }

  updateBoxesOnGoal() {
    this.boxesOnGoal = this.boxes.filter((box) => this.isGoal(box.x, box.y)).length;
  }

  handleLevelComplete() {
    this.state = 'won';
    this.audio.playSFX?.('win');

    const best = this.bestMoves[this.levelIndex];
    if (!best || this.moveCount < best) {
      this.bestMoves[this.levelIndex] = this.moveCount;
    }

    this.unlockedLevel = Math.max(this.unlockedLevel, this.levelIndex + 1);
    this.saveProgress();
    this.updateUI();

    if (this.overlayTimer) {
      clearTimeout(this.overlayTimer);
    }

    if (this.levelIndex < this.totalLevels - 1) {
      this.overlayTimer = setTimeout(() => {
        this.levelIndex += 1;
        this.state = 'playing';
        this.loadLevel(this.levelIndex);
      }, 1000);
    } else {
      this.overlayTimer = setTimeout(() => {
        this.state = 'completed';
        this.updateUI();
      }, 1500);
    }
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.ui.pauseBtn.textContent = '▶️ Resume';
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.ui.pauseBtn.textContent = '⏸️ Pause';
    }
  }

  backToMenu() {
    this.saveProgress();
    window.location.href = '../../launcher.html';
  }

  toggleFullscreen() {
    const container = document.querySelector('.game-container');
    if (!document.fullscreenElement) {
      container?.requestFullscreen();
      this.ui.fullscreenBtn.textContent = '🖥️ Exit Fullscreen';
    } else {
      document.exitFullscreen();
      this.ui.fullscreenBtn.textContent = '🖥️ Fullscreen';
    }
  }

  updateUI() {
    if (!this.ui.level) {
      return;
    }

    this.ui.level.textContent = `${this.levelIndex + 1}`;
    if (this.ui.moves) {
      this.ui.moves.textContent = `${this.moveCount}`;
    }
    if (this.ui.best) {
      const best = this.bestMoves[this.levelIndex];
      this.ui.best.textContent = typeof best === 'number' ? `${best}` : '-';
    }
    if (this.ui.boxes) {
      this.ui.boxes.textContent = `${this.boxesOnGoal}/${this.boxGoalCount}`;
    }
  }

  gameLoop() {
    this.draw();
    requestAnimationFrame(this.gameLoop);
  }

  draw() {
    this.ctx.fillStyle = '#0c1023';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.staticGrid.length || !this.player) {
      this.drawSplash();
      return;
    }

    this.drawBoard();

    if (this.state === 'paused') {
      this.drawOverlay('Paused', 'Press Resume or ESC to continue');
    } else if (this.state === 'won') {
      this.drawOverlay('Level Complete!', 'Loading next level...');
    } else if (this.state === 'completed') {
      this.drawOverlay('All Levels Complete!', 'You are the Sokoban Master!');
    }
  }

  drawSplash() {
    this.ctx.fillStyle = '#162447';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 42px Segoe UI';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Sokoban Master', this.canvas.width / 2, this.canvas.height / 2 - 40);

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '20px Segoe UI';
    this.ctx.fillText('100 classic warehouse puzzles await!', this.canvas.width / 2, this.canvas.height / 2 + 10);
    this.ctx.font = '18px Segoe UI';
    this.ctx.fillText('Press Start Game to begin your journey', this.canvas.width / 2, this.canvas.height / 2 + 50);
  }

  drawBoard() {
    const rows = this.staticGrid.length;
    const cols = this.staticGrid[0].length;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tile = this.staticGrid[y][x];
        const px = this.offsetX + x * this.tileSize;
        const py = this.offsetY + y * this.tileSize;

        this.ctx.fillStyle = tile === 'wall' ? '#2f3640' : '#1b2440';
        this.ctx.fillRect(px, py, this.tileSize, this.tileSize);

        this.ctx.strokeStyle = 'rgba(12,16,35,0.6)';
        this.ctx.strokeRect(px, py, this.tileSize, this.tileSize);

        if (this.isGoal(x, y)) {
          this.ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
          this.ctx.beginPath();
          this.ctx.arc(
            px + this.tileSize / 2,
            py + this.tileSize / 2,
            this.tileSize * 0.25,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        }
      }
    }

    this.boxes.forEach((box) => {
      const px = this.offsetX + box.x * this.tileSize;
      const py = this.offsetY + box.y * this.tileSize;
      const onGoal = this.isGoal(box.x, box.y);

      this.ctx.fillStyle = onGoal ? '#4ECDC4' : '#c97b2e';
      this.ctx.fillRect(
        px + this.tileSize * 0.12,
        py + this.tileSize * 0.12,
        this.tileSize * 0.76,
        this.tileSize * 0.76
      );

      this.ctx.strokeStyle = onGoal ? '#1a535c' : '#8B4513';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(
        px + this.tileSize * 0.12,
        py + this.tileSize * 0.12,
        this.tileSize * 0.76,
        this.tileSize * 0.76
      );
    });

    const playerPx = this.offsetX + this.player.x * this.tileSize;
    const playerPy = this.offsetY + this.player.y * this.tileSize;
    this.ctx.fillStyle = '#FFD700';
    this.ctx.beginPath();
    this.ctx.arc(
      playerPx + this.tileSize / 2,
      playerPy + this.tileSize / 2,
      this.tileSize * 0.3,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }

  drawOverlay(title, subtitle) {
    this.ctx.fillStyle = 'rgba(12, 16, 35, 0.75)';
    this.ctx.fillRect(0, this.canvas.height / 2 - 80, this.canvas.width, 160);

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 32px Segoe UI';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(title, this.canvas.width / 2, this.canvas.height / 2 - 10);

    if (subtitle) {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '20px Segoe UI';
      this.ctx.fillText(subtitle, this.canvas.width / 2, this.canvas.height / 2 + 28);
    }
  }
}

window.addEventListener('load', () => {
  new SokobanMaster();
});
