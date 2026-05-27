// Tunnel Quest Game - Enhanced Adventure
class TunnelQuestGame {
	constructor() {
		this.canvas = document.getElementById('gameCanvas');
		this.ctx = this.canvas.getContext('2d');

		// Core managers
		this.audio = new AudioManager();
		this.input = new InputHandler();
		this.save = new SaveManager('tunnel-quest');

		// Game state
		this.score = 0;
		this.level = 1;
		this.items = 0;
		this.gameState = 'menu';
		this.speedMultiplier = 1.0;

		// Grid definition
		this.tileSize = 40;
		this.gridCols = 16;
		this.gridRows = 12;
		this.tiles = [];

		// Entities
		this.player = { x: 1, y: 1, speed: 4 };
		this.gems = [];
		this.enemies = [];
		this.rocks = [];
		this.exit = null;
		this.particles = [];

		// Progress tracking
		this.levelConfigs = [
			{ name: 'Surface Cavern', mission: 'Collect 4 gems and reach the lift.', gems: 4, enemies: 1, rocks: 4, time: 90, collapseRate: 0.01 },
			{ name: 'Crystal Gallery', mission: 'Collect 6 gems while avoiding collapse traps.', gems: 6, enemies: 2, rocks: 6, time: 85, collapseRate: 0.015 },
			{ name: 'Lava Vein', mission: 'Collect 7 gems, beware roaming magma worms!', gems: 7, enemies: 3, rocks: 6, time: 80, collapseRate: 0.018 },
			{ name: 'Ancient Catacombs', mission: 'Collect 8 relic gems and escape the guardians.', gems: 8, enemies: 3, rocks: 8, time: 75, collapseRate: 0.02 },
			{ name: 'Forgotten Depths', mission: 'Collect 9 gems before the air runs out.', gems: 9, enemies: 4, rocks: 8, time: 70, collapseRate: 0.022 },
			{ name: 'The Core', mission: 'Collect 10 radiant gems and unlock the final lift!', gems: 10, enemies: 5, rocks: 10, time: 65, collapseRate: 0.025 }
		];
		this.currentConfig = this.levelConfigs[0];
		this.levelIntroTime = 0;
		this.timeRemaining = 0;
		this.combo = 0;
		this.comboTimer = 0;
		this.collapseTimer = 0;

		// Animation helpers
		this.lastFrameTime = 0;

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
			this.player.speed = 4 * this.speedMultiplier;
		});

		this.input.on('keydown', (e) => {
			if (this.gameState !== 'playing') return;
			switch(e.code) {
				case 'ArrowLeft':
				case 'KeyA':
					this.tryMovePlayer(-1, 0);
					break;
				case 'ArrowRight':
				case 'KeyD':
					this.tryMovePlayer(1, 0);
					break;
				case 'ArrowUp':
				case 'KeyW':
					this.tryMovePlayer(0, -1);
					break;
				case 'ArrowDown':
				case 'KeyS':
					this.tryMovePlayer(0, 1);
					break;
			}
		});
	}

	startGame() {
		this.gameState = 'playing';
		document.getElementById('startBtn').style.display = 'none';
		this.createLevel();
		this.lastFrameTime = performance.now();
		this.gameLoop(this.lastFrameTime);
	}

	createLevel() {
		const index = Math.min(this.level - 1, this.levelConfigs.length - 1);
		this.currentConfig = this.levelConfigs[index];

		this.tiles = [];
		for (let y = 0; y < this.gridRows; y++) {
			this.tiles[y] = [];
			for (let x = 0; x < this.gridCols; x++) {
				const isBorder = x === 0 || x === this.gridCols - 1 || y === 0 || y === this.gridRows - 1;
				this.tiles[y][x] = {
					type: isBorder ? 'bedrock' : 'dirt',
					passable: !isBorder,
					hardness: isBorder ? Infinity : 1,
					revealed: isBorder
				};
			}
		}

		this.player = { x: 1, y: 1, speed: 4 * this.speedMultiplier };
		this.exit = { x: this.gridCols - 2, y: this.gridRows - 2, open: false };
		this.gems = [];
		this.enemies = [];
		this.rocks = [];
		this.particles = [];
		this.items = 0;
		this.combo = 0;
		this.comboTimer = 0;
		this.collapseTimer = 0;

		this.generateCaveLayout();
		this.scatterRocks(this.currentConfig.rocks);
		this.scatterGems(this.currentConfig.gems);
		this.spawnEnemies(this.currentConfig.enemies);

		this.timeRemaining = this.currentConfig.time;
		this.levelIntroTime = 150; // frames (~2.5s)
		this.updateSidebar();
	}

	generateCaveLayout() {
		const carve = (x, y) => {
			if (x <= 0 || y <= 0 || x >= this.gridCols - 1 || y >= this.gridRows - 1) return;
			this.tiles[y][x].type = 'tunnel';
			this.tiles[y][x].passable = true;
			this.tiles[y][x].revealed = true;
		};

		// Carve a guaranteed path to the exit using a simple biased walk
		let x = this.player.x;
		let y = this.player.y;
		const targetX = this.exit.x;
		const targetY = this.exit.y;
		carve(x, y);

		while (x !== targetX || y !== targetY) {
			if (Math.random() < 0.6) {
				x += Math.sign(targetX - x);
			} else {
				y += Math.sign(targetY - y);
			}
			carve(x, y);
		}

		// Carve additional side tunnels for exploration
		for (let i = 0; i < 60; i++) {
			let cx = Math.floor(Math.random() * (this.gridCols - 2)) + 1;
			let cy = Math.floor(Math.random() * (this.gridRows - 2)) + 1;
			const length = 2 + Math.floor(Math.random() * 5);
			const dir = Math.random() > 0.5 ? [1, 0] : [0, 1];
			for (let j = 0; j < length; j++) {
				carve(cx, cy);
				cx += dir[0];
				cy += dir[1];
				if (cx < 1 || cy < 1 || cx >= this.gridCols - 1 || cy >= this.gridRows - 1) break;
			}
		}
	}

	scatterRocks(count) {
		let placed = 0;
		while (placed < count) {
			const x = Math.floor(Math.random() * (this.gridCols - 2)) + 1;
			const y = Math.floor(Math.random() * (this.gridRows - 2)) + 1;
			if ((x === this.player.x && y === this.player.y) || (x === this.exit.x && y === this.exit.y)) continue;
			const tile = this.tiles[y][x];
			if (tile.type === 'tunnel') continue;
			tile.type = 'rock';
			tile.passable = false;
			tile.hardness = 2;
			this.rocks.push({ x, y, falling: false, fallTimer: 0 });
			placed++;
		}
	}

	scatterGems(count) {
		let placed = 0;
		while (placed < count) {
			const x = Math.floor(Math.random() * (this.gridCols - 2)) + 1;
			const y = Math.floor(Math.random() * (this.gridRows - 2)) + 1;
			if ((x === this.player.x && y === this.player.y) || (x === this.exit.x && y === this.exit.y)) continue;
			if (this.tiles[y][x].type !== 'tunnel') continue;
			if (this.gems.some(g => g.x === x && g.y === y)) continue;
			this.gems.push({ x, y, collected: false, pulse: Math.random() * Math.PI * 2 });
			placed++;
		}
	}

	spawnEnemies(count) {
		const pickSpawn = () => {
			for (let attempts = 0; attempts < 100; attempts++) {
				const x = Math.floor(Math.random() * (this.gridCols - 2)) + 1;
				const y = Math.floor(Math.random() * (this.gridRows - 2)) + 1;
				if (this.tiles[y][x].type === 'tunnel' && !(x === this.player.x && y === this.player.y)) {
					return { x, y };
				}
			}
			return { x: this.exit.x - 1, y: this.exit.y - 1 };
		};

		for (let i = 0; i < count; i++) {
			const spawn = pickSpawn();
			this.enemies.push({
				x: spawn.x,
				y: spawn.y,
				moveTimer: 0,
				moveDelay: 400 - i * 30,
				direction: { x: 0, y: 1 },
				patrolLength: 6 + Math.floor(Math.random() * 6)
			});
		}
	}

	tryMovePlayer(dx, dy) {
		if (dx === 0 && dy === 0) return;
		const newX = this.player.x + dx;
		const newY = this.player.y + dy;
		if (!this.isInside(newX, newY)) return;

		const tile = this.tiles[newY][newX];
		if (!tile.passable) {
			// Allow pushing rocks if space behind is free
			if (tile.type === 'rock') {
				const pushX = newX + dx;
				const pushY = newY + dy;
				if (this.isInside(pushX, pushY) && this.tiles[pushY][pushX].passable && !this.isOccupied(pushX, pushY)) {
					tile.type = 'tunnel';
					tile.passable = true;
					const rock = this.rocks.find(r => r.x === newX && r.y === newY);
					if (rock) {
						rock.x = pushX;
						rock.y = pushY;
						rock.falling = true;
						rock.fallTimer = 0;
					}
				} else {
					return;
				}
			} else {
				return;
			}
		}

		this.player.x = newX;
		this.player.y = newY;

		if (tile.type === 'dirt') {
			tile.type = 'tunnel';
			tile.revealed = true;
			this.score += 5;
			this.combo++;
			this.comboTimer = 2; // seconds
			this.spawnDust(newX, newY, '#C88747');
			this.audio.playSFX('dig');
		} else {
			this.combo = 0;
		}

		this.collectGemAt(newX, newY);

		if (!this.exit.open && this.items >= this.currentConfig.gems) {
			this.exit.open = true;
			this.audio.playSFX('win');
		}

		if (this.exit.open && newX === this.exit.x && newY === this.exit.y) {
			this.advanceLevel();
		}

		this.updateSidebar();
	}

	collectGemAt(x, y) {
		const gem = this.gems.find(g => !g.collected && g.x === x && g.y === y);
		if (gem) {
			gem.collected = true;
			this.items++;
			this.score += 150 + this.combo * 10;
			this.spawnDust(x, y, '#FFD700', 12);
			this.audio.playSFX('collect');
		}
	}

	advanceLevel() {
		this.level++;
		this.score += 500;
		this.audio.playSFX('win');
		this.createLevel();
	}

	failLevel(reason) {
		this.gameState = 'gameOver';
		this.failureReason = reason;
		this.audio.playSFX('die');
	}

	isInside(x, y) {
		return x >= 0 && y >= 0 && x < this.gridCols && y < this.gridRows;
	}

	isOccupied(x, y) {
		return this.enemies.some(e => Math.round(e.x) === x && Math.round(e.y) === y);
	}

	spawnDust(x, y, color, amount = 8) {
		const centerX = x * this.tileSize + this.tileSize / 2;
		const centerY = y * this.tileSize + this.tileSize / 2;
		for (let i = 0; i < amount; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = Math.random() * 1.5 + 0.5;
			this.particles.push({
				x: centerX,
				y: centerY,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: 0.5 + Math.random() * 0.4,
				color
			});
		}
	}

	update(deltaTime) {
		if (this.gameState !== 'playing') return;

		this.timeRemaining -= deltaTime;
		if (this.timeRemaining <= 0) {
			this.failLevel('Air supply depleted');
			return;
		}

		if (this.comboTimer > 0) {
			this.comboTimer -= deltaTime;
			if (this.comboTimer <= 0) {
				this.combo = 0;
			}
		}

		this.collapseTimer += deltaTime;
		const collapseInterval = 8 - (this.level * this.currentConfig.collapseRate * 30);
		if (this.collapseTimer >= collapseInterval) {
			this.triggerCollapse();
			this.collapseTimer = 0;
		}

		this.updateEnemies(deltaTime);
		this.updateRocks(deltaTime);
		this.updateParticles(deltaTime);
		this.updateSidebar();
	}

	triggerCollapse() {
		const candidates = [];
		for (let y = 1; y < this.gridRows - 1; y++) {
			for (let x = 1; x < this.gridCols - 1; x++) {
				const tile = this.tiles[y][x];
				if (tile.type === 'dirt' && Math.random() < this.currentConfig.collapseRate) {
					candidates.push({ x, y });
				}
			}
		}
		if (candidates.length === 0) return;
		const { x, y } = candidates[Math.floor(Math.random() * candidates.length)];
		this.tiles[y][x].type = 'bedrock';
		this.tiles[y][x].passable = false;
		this.tiles[y][x].revealed = true;
		this.spawnDust(x, y, '#6D4C41', 16);
		this.audio.playSFX('collapse');
		if (this.player.x === x && this.player.y === y) {
			this.failLevel('Tunnel collapse caught you');
		}
	}

	updateEnemies(deltaTime) {
		for (let enemy of this.enemies) {
			enemy.moveTimer -= deltaTime * 1000;
			if (enemy.moveTimer <= 0) {
				enemy.moveTimer = enemy.moveDelay / this.speedMultiplier;
				const dirs = [
					{ x: 1, y: 0 },
					{ x: -1, y: 0 },
					{ x: 0, y: 1 },
					{ x: 0, y: -1 }
				].sort(() => Math.random() - 0.5);
				for (const dir of dirs) {
					const nx = enemy.x + dir.x;
					const ny = enemy.y + dir.y;
					if (!this.isInside(nx, ny)) continue;
					const tile = this.tiles[ny][nx];
					if (tile.passable || tile.type === 'dirt') {
						if (tile.type === 'dirt') {
							tile.type = 'tunnel';
							tile.revealed = true;
						}
						enemy.x = nx;
						enemy.y = ny;
						break;
					}
				}
			}

			if (Math.abs(enemy.x - this.player.x) < 0.5 && Math.abs(enemy.y - this.player.y) < 0.5) {
				this.failLevel('A burrow beast caught you');
			}
		}
	}

	updateRocks(deltaTime) {
		for (let rock of this.rocks) {
			if (!rock.falling) continue;
			rock.fallTimer += deltaTime;
			if (rock.fallTimer >= 0.12) {
				const belowY = rock.y + 1;
				if (this.isInside(rock.x, belowY) && this.tiles[belowY][rock.x].passable && !this.isOccupied(rock.x, belowY)) {
					rock.y = belowY;
					rock.fallTimer = 0;
					if (this.player.x === rock.x && this.player.y === rock.y) {
						this.failLevel('Crushed by a boulder');
					}
				} else {
					rock.falling = false;
				}
			}
		}
	}

	updateParticles(deltaTime) {
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.life -= deltaTime;
			if (p.life <= 0) {
				this.particles.splice(i, 1);
				continue;
			}
			p.x += p.vx * this.tileSize * deltaTime;
			p.y += p.vy * this.tileSize * deltaTime;
			p.vy += 0.2 * deltaTime;
		}
	}

	updateSidebar() {
		document.getElementById('score').textContent = this.score;
		document.getElementById('level').textContent = this.level;
		document.getElementById('items').textContent = `${this.items}/${this.currentConfig.gems}`;
	}

	gameLoop(currentTime) {
		if (this.gameState !== 'playing') return;

		const deltaTime = (currentTime - this.lastFrameTime) / 1000;
		this.lastFrameTime = currentTime;

		this.update(deltaTime);
		this.draw();

		if (this.gameState === 'playing') {
			requestAnimationFrame((time) => this.gameLoop(time));
		} else {
			this.drawGameOver();
		}
	}

	draw() {
		// Background gradient
		const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
		gradient.addColorStop(0, '#2B1D0E');
		gradient.addColorStop(1, '#512D1C');
		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		this.drawTiles();
		this.drawGems();
		this.drawExit();
		this.drawRocks();
		this.drawPlayer();
		this.drawEnemies();
		this.drawParticles();
		this.drawHUD();
	}

	drawTiles() {
		for (let y = 0; y < this.gridRows; y++) {
			for (let x = 0; x < this.gridCols; x++) {
				const tile = this.tiles[y][x];
				const px = x * this.tileSize;
				const py = y * this.tileSize;
				switch(tile.type) {
					case 'bedrock':
						this.ctx.fillStyle = '#263238'; // Solid dark grey steel-hard slate
						break;
					case 'rock':
						this.ctx.fillStyle = '#37474F';
						break;
					case 'dirt':
						this.ctx.fillStyle = '#5D4037'; // Warm brownish dirt
						break;
					default:
						this.ctx.fillStyle = '#1A0E07'; // Deep cave background
				}
				if (tile.type !== 'tunnel') {
					this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
					
					// Draw textured details for blocks
					if (tile.type === 'bedrock') {
						this.ctx.strokeStyle = '#1a1a1a';
						this.ctx.lineWidth = 1;
						this.ctx.strokeRect(px, py, this.tileSize, this.tileSize);
						// Diagonal crossed steel bands
						this.ctx.strokeStyle = '#37474F';
						this.ctx.beginPath();
						this.ctx.moveTo(px + 4, py + 4);
						this.ctx.lineTo(px + this.tileSize - 4, py + this.tileSize - 4);
						this.ctx.stroke();
					} else if (tile.type === 'dirt') {
						// Small soil/pebble patterns
						this.ctx.fillStyle = '#4E342E';
						this.ctx.fillRect(px + 6, py + 8, 3, 3);
						this.ctx.fillRect(px + 22, py + 18, 4, 3);
						this.ctx.fillRect(px + 12, py + 28, 3, 4);
						this.ctx.fillRect(px + 30, py + 10, 3, 3);
						// Grass or root tips on top border
						if (y === 1) {
							this.ctx.fillStyle = '#2E7D32'; // Green roots/moss
							this.ctx.fillRect(px, py, this.tileSize, 4);
						}
					}
				}
			}
		}
	}

	drawGems() {
		for (let gem of this.gems) {
			if (gem.collected) continue;
			gem.pulse += 0.08;
			const px = gem.x * this.tileSize + this.tileSize / 2;
			const py = gem.y * this.tileSize + this.tileSize / 2;
			const radius = 8 + Math.sin(gem.pulse) * 2;
			
			// Draw high-fidelity ruby gem!
			this.ctx.shadowBlur = 15;
			this.ctx.shadowColor = '#E91E63';
			this.ctx.fillStyle = '#FF2E93';
			
			// Diamond crystal shape
			this.ctx.beginPath();
			this.ctx.moveTo(px, py - radius);
			this.ctx.lineTo(px + radius, py);
			this.ctx.lineTo(px, py + radius);
			this.ctx.lineTo(px - radius, py);
			this.ctx.closePath();
			this.ctx.fill();
			
			// Gem highlight
			this.ctx.fillStyle = '#FFFFFF';
			this.ctx.beginPath();
			this.ctx.moveTo(px - radius/3, py - radius/3);
			this.ctx.lineTo(px, py - radius);
			this.ctx.lineTo(px + radius/3, py - radius/3);
			this.ctx.closePath();
			this.ctx.fill();

			this.ctx.shadowBlur = 0;
		}
	}

	drawExit() {
		const px = this.exit.x * this.tileSize;
		const py = this.exit.y * this.tileSize;
		
		// Draw concrete frame
		this.ctx.fillStyle = '#455A64';
		this.ctx.fillRect(px + 2, py + 2, this.tileSize - 4, this.tileSize - 4);
		
		// Draw hazard stripes on frame
		this.ctx.strokeStyle = '#FFEB3B';
		this.ctx.lineWidth = 2;
		this.ctx.beginPath();
		this.ctx.moveTo(px + 2, py + 2);
		this.ctx.lineTo(px + 8, py + 8);
		this.ctx.moveTo(px + this.tileSize - 2, py + 2);
		this.ctx.lineTo(px + this.tileSize - 8, py + 8);
		this.ctx.stroke();

		if (this.exit.open) {
			// Green glowing portal / lift door!
			this.ctx.fillStyle = '#1B5E20';
			this.ctx.fillRect(px + 6, py + 6, this.tileSize - 12, this.tileSize - 12);
			
			// Pulse glow
			const pulse = Math.abs(Math.sin(Date.now() / 200)) * 0.4 + 0.6;
			this.ctx.shadowBlur = 10;
			this.ctx.shadowColor = '#4CAF50';
			this.ctx.strokeStyle = `rgba(76, 175, 80, ${pulse})`;
			this.ctx.lineWidth = 3;
			this.ctx.strokeRect(px + 6, py + 6, this.tileSize - 12, this.tileSize - 12);
			this.ctx.shadowBlur = 0;
			
			// Draw classic retro exit ladder symbol inside
			this.ctx.strokeStyle = '#FFFFFF';
			this.ctx.lineWidth = 2;
			this.ctx.beginPath();
			// Sides of ladder
			this.ctx.moveTo(px + 15, py + 8);
			this.ctx.lineTo(px + 15, py + 32);
			this.ctx.moveTo(px + 25, py + 8);
			this.ctx.lineTo(px + 25, py + 32);
			// Rungs
			for (let ry = py + 12; ry <= py + 28; ry += 6) {
				this.ctx.moveTo(px + 15, ry);
				this.ctx.lineTo(px + 25, ry);
			}
			this.ctx.stroke();
		} else {
			// Closed brown padlock metal gate
			this.ctx.fillStyle = '#5D4037';
			this.ctx.fillRect(px + 6, py + 6, this.tileSize - 12, this.tileSize - 12);
			
			this.ctx.strokeStyle = '#3E2723';
			this.ctx.lineWidth = 2;
			this.ctx.strokeRect(px + 6, py + 6, this.tileSize - 12, this.tileSize - 12);
			
			// Lock icon
			this.ctx.beginPath();
			this.ctx.arc(px + 20, py + 18, 4, Math.PI, 0); // shackle
			this.ctx.strokeStyle = '#FFD700';
			this.ctx.lineWidth = 2;
			this.ctx.stroke();
			
			// Lock body
			this.ctx.fillStyle = '#FFD700';
			this.ctx.beginPath();
			this.ctx.rect(px + 15, py + 18, 10, 8);
			this.ctx.fill();
			this.ctx.fillStyle = '#000';
			this.ctx.fillRect(px + 19, py + 20, 2, 4); // Keyhole
		}
	}

	drawRocks() {
		for (let rock of this.rocks) {
			const rx = rock.x * this.tileSize;
			const ry = rock.y * this.tileSize;
			
			// Rounded chunky boulder
			this.ctx.fillStyle = '#78909C'; // Cool gray slate color
			this.ctx.beginPath();
			this.ctx.roundRect(rx + 4, ry + 4, this.tileSize - 8, this.tileSize - 8, 8);
			this.ctx.fill();
			
			// Dark slate shadows
			this.ctx.fillStyle = '#546E7A';
			this.ctx.beginPath();
			this.ctx.roundRect(rx + 8, ry + 18, this.tileSize - 16, this.tileSize - 24, 4);
			this.ctx.fill();
			
			// Highlighting ridges
			this.ctx.fillStyle = '#CFD8DC';
			this.ctx.fillRect(rx + 8, ry + 6, 12, 3);
			this.ctx.fillRect(rx + 6, ry + 9, 3, 10);

			// Crack lines
			this.ctx.strokeStyle = '#37474F';
			this.ctx.lineWidth = 2;
			this.ctx.beginPath();
			this.ctx.moveTo(rx + 10, ry + 10);
			this.ctx.lineTo(rx + 18, ry + 18);
			this.ctx.lineTo(rx + 16, ry + 28);
			this.ctx.moveTo(rx + 24, ry + 12);
			this.ctx.lineTo(rx + 20, ry + 22);
			this.ctx.stroke();
		}
	}

	drawPlayer() {
		const px = this.player.x * this.tileSize + this.tileSize / 2;
		const py = this.player.y * this.tileSize + this.tileSize / 2;
		
		// Draw a highly polished 90s-style retro mole!
		// Mole body
		this.ctx.fillStyle = '#795548'; // Brown mole fur
		this.ctx.beginPath();
		this.ctx.arc(px, py + 2, 15, 0, Math.PI * 2);
		this.ctx.fill();
		
		// Inner belly
		this.ctx.fillStyle = '#D7CCC8'; // Light beige belly
		this.ctx.beginPath();
		this.ctx.arc(px, py + 6, 9, 0, Math.PI * 2);
		this.ctx.fill();

		// Face / Snout
		this.ctx.fillStyle = '#FFCCBC'; // Cute pinkish nose snout
		this.ctx.beginPath();
		this.ctx.arc(px, py - 4, 7, 0, Math.PI * 2);
		this.ctx.fill();
		
		// Mole nose tip
		this.ctx.fillStyle = '#E64A19'; 
		this.ctx.beginPath();
		this.ctx.arc(px, py - 7, 3, 0, Math.PI * 2);
		this.ctx.fill();

		// Shiny black eyes with safety goggles!
		this.ctx.strokeStyle = '#FFEB3B'; // Yellow goggle frame
		this.ctx.lineWidth = 2;
		this.ctx.beginPath();
		this.ctx.arc(px - 5, py - 4, 4, 0, Math.PI * 2);
		this.ctx.arc(px + 5, py - 4, 4, 0, Math.PI * 2);
		this.ctx.stroke();
		
		this.ctx.fillStyle = '#00E676'; // Cool green goggle/lens reflections!
		this.ctx.beginPath();
		this.ctx.arc(px - 5, py - 4, 2.5, 0, Math.PI * 2);
		this.ctx.arc(px + 5, py - 4, 2.5, 0, Math.PI * 2);
		this.ctx.fill();

		this.ctx.fillStyle = 'white';
		this.ctx.beginPath();
		this.ctx.arc(px - 6, py - 5, 1, 0, Math.PI * 2);
		this.ctx.arc(px + 4, py - 5, 1, 0, Math.PI * 2);
		this.ctx.fill();

		// Yellow Miner/Construction Hat!
		this.ctx.fillStyle = '#FBC02D'; // Deep yellow
		this.ctx.beginPath();
		this.ctx.arc(px, py - 9, 9, Math.PI, 0, false);
		this.ctx.fill();
		// Hat brim
		this.ctx.fillRect(px - 11, py - 9, 22, 3);
		// Hat lamp center
		this.ctx.fillStyle = '#FFF';
		this.ctx.beginPath();
		this.ctx.arc(px, py - 11, 2, 0, Math.PI * 2);
		this.ctx.fill();
		
		// Hands holding a small pickaxe
		this.ctx.fillStyle = '#795548'; // Hands
		this.ctx.beginPath();
		this.ctx.arc(px - 11, py + 4, 4, 0, Math.PI * 2);
		this.ctx.arc(px + 11, py + 4, 4, 0, Math.PI * 2);
		this.ctx.fill();

		// Pickaxe handle
		this.ctx.strokeStyle = '#8D6E63'; // Wooden stick
		this.ctx.lineWidth = 2;
		this.ctx.beginPath();
		this.ctx.moveTo(px + 8, py + 10);
		this.ctx.lineTo(px + 14, py - 2);
		this.ctx.stroke();
		// Pickaxe steel blade
		this.ctx.strokeStyle = '#B0BEC5';
		this.ctx.lineWidth = 3;
		this.ctx.beginPath();
		this.ctx.arc(px + 14, py - 2, 6, Math.PI * 1.2, Math.PI * 1.8);
		this.ctx.stroke();
	}

	drawEnemies() {
		for (let enemy of this.enemies) {
			const px = enemy.x * this.tileSize + this.tileSize / 2;
			const py = enemy.y * this.tileSize + this.tileSize / 2;
			
			// Animated hovering hover-monster!
			const bounce = Math.sin((Date.now() / 150) + enemy.x * 2) * 2;
			
			// Devil/Spiky body
			this.ctx.fillStyle = '#E53935'; // Red base
			this.ctx.beginPath();
			this.ctx.arc(px, py + bounce, 14, 0, Math.PI * 2);
			this.ctx.fill();
			
			// Back/side spikes!
			this.ctx.fillStyle = '#B71C1C'; // Dark red spikes
			this.ctx.beginPath();
			this.ctx.moveTo(px - 10, py - 10 + bounce);
			this.ctx.lineTo(px - 16, py - 16 + bounce);
			this.ctx.lineTo(px - 4, py - 13 + bounce);
			this.ctx.fill();
			
			this.ctx.beginPath();
			this.ctx.moveTo(px + 10, py - 10 + bounce);
			this.ctx.lineTo(px + 16, py - 16 + bounce);
			this.ctx.lineTo(px + 4, py - 13 + bounce);
			this.ctx.fill();
			
			// Angry eyes
			this.ctx.fillStyle = '#FFEB3B';
			this.ctx.beginPath();
			this.ctx.arc(px - 5, py - 3 + bounce, 4, 0, Math.PI * 2);
			this.ctx.arc(px + 5, py - 3 + bounce, 4, 0, Math.PI * 2);
			this.ctx.fill();
			
			this.ctx.fillStyle = '#000';
			this.ctx.beginPath();
			this.ctx.arc(px - 4, py - 3 + bounce, 1.8, 0, Math.PI * 2);
			this.ctx.arc(px + 4, py - 3 + bounce, 1.8, 0, Math.PI * 2);
			this.ctx.fill();
			
			// Angled eyebrows
			this.ctx.strokeStyle = '#000';
			this.ctx.lineWidth = 2;
			this.ctx.beginPath();
			this.ctx.moveTo(px - 9, py - 7 + bounce);
			this.ctx.lineTo(px - 2, py - 4 + bounce);
			this.ctx.moveTo(px + 9, py - 7 + bounce);
			this.ctx.lineTo(px + 2, py - 4 + bounce);
			this.ctx.stroke();

			// Monster fangs/mouth
			this.ctx.fillStyle = '#FFFFFF';
			this.ctx.beginPath();
			this.ctx.moveTo(px - 6, py + 4 + bounce);
			this.ctx.lineTo(px - 4, py + 8 + bounce);
			this.ctx.lineTo(px - 2, py + 4 + bounce);
			this.ctx.lineTo(px, py + 8 + bounce);
			this.ctx.lineTo(px + 2, py + 4 + bounce);
			this.ctx.lineTo(px + 4, py + 8 + bounce);
			this.ctx.lineTo(px + 6, py + 4 + bounce);
			this.ctx.closePath();
			this.ctx.fill();
		}
	}

	drawParticles() {
		for (let particle of this.particles) {
			this.ctx.fillStyle = particle.color;
			this.ctx.globalAlpha = Math.max(0, particle.life);
			this.ctx.beginPath();
			this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
			this.ctx.fill();
		}
		this.ctx.globalAlpha = 1;
	}

	drawHUD() {
		const mission = this.currentConfig;
		this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
		this.ctx.fillRect(0, 0, this.canvas.width, 52);

		this.ctx.fillStyle = '#FFD700';
		this.ctx.font = 'bold 16px Segoe UI';
		this.ctx.textAlign = 'left';
		this.ctx.fillText(`Level ${this.level}: ${mission.name}`, 14, 22);

		if (this.levelIntroTime > 0) {
			this.levelIntroTime--;
			this.ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
			this.ctx.font = 'bold 40px Segoe UI';
			this.ctx.textAlign = 'center';
			this.ctx.fillText(mission.name, this.canvas.width / 2, this.canvas.height / 2 - 40);
			this.ctx.font = '24px Segoe UI';
			this.ctx.fillStyle = 'white';
			this.ctx.fillText(mission.mission, this.canvas.width / 2, this.canvas.height / 2 + 10);
		} else {
			this.ctx.fillStyle = '#AABBC4';
			this.ctx.font = '13px Segoe UI';
			this.ctx.textAlign = 'left';
			this.ctx.fillText(`🎯 Obj: ${mission.mission}`, 14, 42);
		}

		// Time remaining
		const time = Math.max(0, Math.floor(this.timeRemaining));
		this.ctx.textAlign = 'right';
		this.ctx.font = 'bold 16px Segoe UI';
		this.ctx.fillStyle = time < 15 ? '#FF6B6B' : '#8BC34A';
		this.ctx.fillText(`Air: ${time}s`, this.canvas.width - 16, 22);

		// Combo indicator
		if (this.combo > 1 && this.comboTimer > 0) {
			this.ctx.textAlign = 'center';
			this.ctx.fillStyle = '#FF7043';
			this.ctx.font = 'bold 22px Segoe UI';
			this.ctx.fillText(`Combo x${this.combo}`, this.canvas.width / 2, this.canvas.height - 20);
		}
	}

	drawGameOver() {
		this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.fillStyle = '#FF6B6B';
		this.ctx.font = 'bold 48px Segoe UI';
		this.ctx.textAlign = 'center';
		this.ctx.fillText('Tunnel Collapsed!', this.canvas.width / 2, this.canvas.height / 2 - 40);
		this.ctx.fillStyle = '#FFFFFF';
		this.ctx.font = '24px Segoe UI';
		this.ctx.fillText(this.failureReason || 'Try Again', this.canvas.width / 2, this.canvas.height / 2);
		this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
	}

	toggleFullscreen() {
		const container = document.querySelector('.game-container');
		if (!document.fullscreenElement) {
			container.requestFullscreen().catch(err => console.log('Fullscreen error:', err));
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
		const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
		gradient.addColorStop(0, '#2B1D0E');
		gradient.addColorStop(1, '#512D1C');
		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		this.ctx.fillStyle = '#FFD700';
		this.ctx.font = 'bold 48px Segoe UI';
		this.ctx.textAlign = 'center';
		this.ctx.fillText('⛏️ Tunnel Quest', this.canvas.width / 2, 120);

		this.ctx.fillStyle = 'white';
		this.ctx.font = '24px Segoe UI';
		this.ctx.fillText('Dig through ancient caverns, collect gems, and escape before the air runs out!', this.canvas.width / 2, 240);
		this.ctx.font = '20px Segoe UI';
		this.ctx.fillText('Arrows / WASD to move • Push rocks • Beware collapsing tunnels', this.canvas.width / 2, 320);
	}
}

window.addEventListener('load', () => new TunnelQuestGame());
