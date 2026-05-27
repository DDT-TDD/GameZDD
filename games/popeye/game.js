// ============================================================
// Sailor Quest — a multi-level platformer (Popeye theme)
// Collect all olives on each level — 6 levels of increasing difficulty
// ============================================================

class SailorQuestGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx    = this.canvas.getContext('2d');

        this.audio = new AudioManager();
        this.input = new InputHandler();
        this.save  = new SaveManager('sailor-quest');

        this.score         = 0;
        this.lives         = 3;
        this.currentLevel  = 0;
        this.gameState     = 'menu';
        this.speedMult     = 1.0;

        // Input state
        this.keys = {};

        // Particle system
        this.particles = [];

        // Win/level-transition overlay
        this.overlay      = null;
        this.overlayTimer = 0;

        // Level configs — 6 increasingly difficult layouts
        this.levelConfigs = [
            {
                name: 'Harbour Dash',
                bg1: '#0a1a3a', bg2: '#1a2a5a',
                water: '#1E90FF',
                platforms: [
                    { x:0,   y:450, w:640, h:20, color:'#4a8fcc' }, // ground
                    { x:80,  y:370, w:130, h:16, color:'#5a9fd0' },
                    { x:280, y:300, w:130, h:16, color:'#5a9fd0' },
                    { x:460, y:340, w:140, h:16, color:'#5a9fd0' },
                    { x:140, y:220, w:130, h:16, color:'#5a9fd0' },
                    { x:360, y:180, w:130, h:16, color:'#5a9fd0' },
                ],
                olives: [
                    {x:120,y:350},{x:330,y:280},{x:510,y:320},
                    {x:180,y:200},{x:410,y:160}
                ],
                enemies: [
                    {x:350,y:430,vx:1.2},{x:160,y:350,vx:1.4}
                ],
                playerStart: {x:50, y:410}
            },
            {
                name: 'Dock Trouble',
                bg1: '#0a2a1a', bg2: '#0a3a2a',
                water: '#00a86b',
                platforms: [
                    { x:0,   y:450, w:200, h:20, color:'#5ab08a' },
                    { x:280, y:450, w:200, h:20, color:'#5ab08a' },
                    { x:50,  y:360, w:120, h:16, color:'#6abf96' },
                    { x:220, y:290, w:120, h:16, color:'#6abf96' },
                    { x:400, y:340, w:100, h:16, color:'#6abf96' },
                    { x:100, y:210, w:100, h:16, color:'#6abf96' },
                    { x:350, y:200, w:100, h:16, color:'#6abf96' },
                    { x:240, y:130, w:120, h:16, color:'#6abf96' },
                ],
                olives: [
                    {x:100,y:430},{x:350,y:430},{x:90,y:340},
                    {x:260,y:270},{x:430,y:320},{x:140,y:190},
                    {x:400,y:180},{x:280,y:110}
                ],
                enemies: [
                    {x:100,y:430,vx:1.2},{x:400,y:430,vx:-1.4},
                    {x:300,y:270,vx:1.6}
                ],
                playerStart: {x:30, y:400}
            },
            {
                name: 'Pirate Cove',
                bg1: '#1a0a1a', bg2: '#2a0a3a',
                water: '#8e44ad',
                platforms: [
                    { x:0,   y:450, w:150, h:20, color:'#7d3c98' },
                    { x:200, y:450, w:100, h:20, color:'#7d3c98' },
                    { x:380, y:450, w:140, h:20, color:'#7d3c98' },
                    { x:60,  y:380, w:100, h:16, color:'#9b59b6' },
                    { x:220, y:350, w:80,  h:16, color:'#9b59b6' },
                    { x:380, y:320, w:100, h:16, color:'#9b59b6' },
                    { x:80,  y:270, w:120, h:16, color:'#9b59b6' },
                    { x:310, y:240, w:100, h:16, color:'#9b59b6' },
                    { x:480, y:200, w:100, h:16, color:'#9b59b6' },
                    { x:150, y:160, w:100, h:16, color:'#9b59b6' },
                    { x:330, y:120, w:100, h:16, color:'#9b59b6' },
                ],
                olives: [
                    {x:60,y:430},{x:230,y:430},{x:430,y:430},
                    {x:100,y:360},{x:250,y:330},{x:420,y:300},
                    {x:120,y:250},{x:345,y:220},{x:515,y:180},
                    {x:190,y:140},{x:370,y:100}
                ],
                enemies: [
                    {x:80,y:430,vx:1.3},{x:420,y:430,vx:-1.5},
                    {x:220,y:330,vx:1.6},{x:420,y:300,vx:-1.4},
                ],
                playerStart: {x:20, y:410}
            },
            {
                name: 'Sea Stack',
                bg1: '#0a1a0a', bg2: '#0a2a1a',
                water: '#27ae60',
                platforms: [
                    { x:0,   y:450, w:100, h:20, color:'#27ae60' },
                    { x:540, y:450, w:100, h:20, color:'#27ae60' },
                    { x:100, y:390, w:80,  h:16, color:'#2ecc71' },
                    { x:260, y:390, w:80,  h:16, color:'#2ecc71' },
                    { x:440, y:390, w:80,  h:16, color:'#2ecc71' },
                    { x:160, y:320, w:80,  h:16, color:'#2ecc71' },
                    { x:340, y:320, w:80,  h:16, color:'#2ecc71' },
                    { x:60,  y:250, w:80,  h:16, color:'#2ecc71' },
                    { x:250, y:250, w:80,  h:16, color:'#2ecc71' },
                    { x:450, y:250, w:80,  h:16, color:'#2ecc71' },
                    { x:160, y:180, w:80,  h:16, color:'#2ecc71' },
                    { x:340, y:180, w:80,  h:16, color:'#2ecc71' },
                    { x:260, y:110, w:80,  h:16, color:'#2ecc71' },
                ],
                olives: [
                    {x:130,y:370},{x:290,y:370},{x:470,y:370},
                    {x:190,y:300},{x:370,y:300},
                    {x:90,y:230},{x:280,y:230},{x:480,y:230},
                    {x:190,y:160},{x:370,y:160},
                    {x:290,y:90}
                ],
                enemies: [
                    {x:140,y:370,vx:1.5},{x:470,y:370,vx:-1.6},
                    {x:200,y:300,vx:1.7},{x:90,y:230,vx:1.8},
                    {x:450,y:230,vx:-1.5},
                ],
                playerStart: {x:30, y:410}
            },
            {
                name: 'Whirlpool Peak',
                bg1: '#1a0a0a', bg2: '#2a1a0a',
                water: '#e74c3c',
                platforms: [
                    { x:0,   y:450, w:80,  h:20, color:'#c0392b' },
                    { x:560, y:450, w:80,  h:20, color:'#c0392b' },
                    { x:180, y:430, w:60,  h:20, color:'#c0392b' },
                    { x:380, y:430, w:60,  h:20, color:'#c0392b' },
                    { x:80,  y:370, w:70,  h:16, color:'#e74c3c' },
                    { x:280, y:360, w:70,  h:16, color:'#e74c3c' },
                    { x:480, y:370, w:70,  h:16, color:'#e74c3c' },
                    { x:160, y:295, w:70,  h:16, color:'#e74c3c' },
                    { x:360, y:295, w:70,  h:16, color:'#e74c3c' },
                    { x:50,  y:225, w:70,  h:16, color:'#e74c3c' },
                    { x:260, y:225, w:70,  h:16, color:'#e74c3c' },
                    { x:470, y:225, w:70,  h:16, color:'#e74c3c' },
                    { x:150, y:155, w:70,  h:16, color:'#e74c3c' },
                    { x:360, y:155, w:70,  h:16, color:'#e74c3c' },
                    { x:260, y:85,  w:80,  h:16, color:'#e74c3c' },
                ],
                olives: [
                    {x:200,y:410},{x:400,y:410},
                    {x:105,y:350},{x:305,y:340},{x:505,y:350},
                    {x:185,y:275},{x:385,y:275},
                    {x:75,y:205},{x:285,y:205},{x:495,y:205},
                    {x:175,y:135},{x:385,y:135},
                    {x:290,y:65}
                ],
                enemies: [
                    {x:200,y:410,vx:1.4},{x:400,y:410,vx:-1.4},
                    {x:105,y:350,vx:1.7},{x:505,y:350,vx:-1.7},
                    {x:285,y:205,vx:2.0},{x:175,y:135,vx:2.2},
                ],
                playerStart: {x:25, y:410}
            },
            {
                name: 'Final Showdown',
                bg1: '#0a0a0a', bg2: '#1a1a2a',
                water: '#f39c12',
                platforms: [
                    { x:0,   y:450, w:60,  h:20, color:'#d4ac0d' },
                    { x:580, y:450, w:60,  h:20, color:'#d4ac0d' },
                    { x:100, y:420, w:50,  h:16, color:'#f1c40f' },
                    { x:300, y:420, w:50,  h:16, color:'#f1c40f' },
                    { x:500, y:420, w:50,  h:16, color:'#f1c40f' },
                    { x:60,  y:360, w:60,  h:16, color:'#f1c40f' },
                    { x:200, y:350, w:60,  h:16, color:'#f1c40f' },
                    { x:350, y:350, w:60,  h:16, color:'#f1c40f' },
                    { x:500, y:360, w:60,  h:16, color:'#f1c40f' },
                    { x:120, y:290, w:60,  h:16, color:'#f1c40f' },
                    { x:290, y:280, w:60,  h:16, color:'#f1c40f' },
                    { x:450, y:290, w:60,  h:16, color:'#f1c40f' },
                    { x:30,  y:220, w:60,  h:16, color:'#f1c40f' },
                    { x:200, y:210, w:60,  h:16, color:'#f1c40f' },
                    { x:370, y:210, w:60,  h:16, color:'#f1c40f' },
                    { x:540, y:220, w:60,  h:16, color:'#f1c40f' },
                    { x:100, y:150, w:60,  h:16, color:'#f1c40f' },
                    { x:290, y:140, w:60,  h:16, color:'#f1c40f' },
                    { x:480, y:150, w:60,  h:16, color:'#f1c40f' },
                    { x:200, y:80,  w:60,  h:16, color:'#f1c40f' },
                    { x:370, y:80,  w:60,  h:16, color:'#f1c40f' },
                    { x:290, y:20,  w:60,  h:16, color:'#f1c40f' },
                ],
                olives: [
                    {x:115,y:400},{x:315,y:400},{x:515,y:400},
                    {x:80,y:340},{x:220,y:330},{x:370,y:330},{x:520,y:340},
                    {x:140,y:270},{x:310,y:260},{x:470,y:270},
                    {x:50,y:200},{x:220,y:190},{x:390,y:190},{x:560,y:200},
                    {x:120,y:130},{x:310,y:120},{x:500,y:130},
                    {x:220,y:60},{x:390,y:60},
                    {x:310,y:0}
                ],
                enemies: [
                    {x:115,y:400,vx:1.6},{x:515,y:400,vx:-1.6},
                    {x:80,y:340,vx:2.0},{x:220,y:330,vx:1.8},{x:520,y:340,vx:-2.0},
                    {x:140,y:270,vx:2.2},{x:470,y:270,vx:-2.2},
                    {x:220,y:190,vx:2.4},{x:560,y:200,vx:-2.4},
                ],
                playerStart: {x:20, y:410}
            }
        ];

        this.init();
    }

    // ──────────────────────────────────────────────────────────────
    init() {
        this.setupEventListeners();
        this.loadSave();
        this.drawMenu();
    }

    // ──────────────────────────────────────────────────────────────
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('backBtn').addEventListener('click',  () => this.goBack());
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());

        const speedSlider = document.getElementById('speedSlider');
        const speedValue  = document.getElementById('speedValue');
        speedSlider.addEventListener('input', e => {
            const s = parseFloat(e.target.value);
            speedValue.textContent = s.toFixed(1) + 'x';
            this.speedMult = s;
        });

        // Keyboard state
        this.input.on('keydown', e => { this.keys[e.code] = true; this.handleJump(e); });
        this.input.on('keyup',   e => { this.keys[e.code] = false; });
    }

    handleJump(e) {
        if (this.gameState !== 'playing') return;
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
            if (!this.player.jumping) {
                this.player.vy = -13;
                this.player.jumping = true;
                this.audio.playSFX('jump');
            }
        }
    }

    // ──────────────────────────────────────────────────────────────
    loadLevel(idx) {
        const cfg = this.levelConfigs[idx];

        this.platforms  = cfg.platforms.map(p => ({ ...p }));
        this.olives     = cfg.olives.map(o => ({ ...o, collected: false, bobPhase: Math.random() * Math.PI * 2 }));
        this.enemies    = cfg.enemies.map(e => ({ ...e, width:26, height:26, startX: e.x }));

        // Constrain enemies to their platform
        this.enemies.forEach(en => {
            en.platform = this.platforms.find(p =>
                en.x >= p.x && en.x <= p.x + p.w - en.width &&
                en.y >= p.y - en.height - 2 && en.y <= p.y + 2
            ) || null;
        });

        const ps = cfg.playerStart;
        this.player = {
            x: ps.x, y: ps.y,
            width: 28, height: 38,
            vx: 0, vy: 0,
            jumping: true,
            facingRight: true,
            frame: 0, frameTimer: 0,
            invincible: 0
        };

        this.particles = [];
        this.overlay = null;
    }

    startGame() {
        this.score        = 0;
        this.lives        = 3;
        this.gameState    = 'playing';
        this.loadLevel(this.currentLevel);
        this.updateUI();
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    // ──────────────────────────────────────────────────────────────
    update(dt) {
        const cfg = this.levelConfigs[this.currentLevel];
        const p   = this.player;

        // Movement
        const speed = 3.5 * this.speedMult;
        if (this.keys['ArrowLeft']  || this.keys['KeyA']) { p.vx = -speed; p.facingRight = false; }
        else if (this.keys['ArrowRight'] || this.keys['KeyD']) { p.vx = speed; p.facingRight = true; }
        else p.vx *= 0.7; // friction

        // Gravity
        p.vy = Math.min(p.vy + 0.55, 16);

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Platform collisions
        p.jumping = true;
        for (const plat of this.platforms) {
            if (p.x + p.width  > plat.x &&
                p.x             < plat.x + plat.w &&
                p.y + p.height  > plat.y &&
                p.y + p.height  < plat.y + plat.h + 14 &&
                p.vy > 0) {
                p.y = plat.y - p.height;
                p.vy = 0;
                p.jumping = false;
            }
        }

        // Boundaries
        if (p.x < 0) p.x = 0;
        if (p.x + p.width > this.canvas.width) p.x = this.canvas.width - p.width;

        // Fall into void / water
        if (p.y > this.canvas.height + 20) {
            this.loseLife();
            return;
        }

        // Invincibility frames
        if (p.invincible > 0) p.invincible -= dt;

        // Walk animation
        p.frameTimer += Math.abs(p.vx) * dt;
        if (p.frameTimer > 0.12) { p.frame = (p.frame + 1) % 4; p.frameTimer = 0; }

        // Olive bobbing
        this.olives.forEach(o => { o.bobPhase += 2 * dt; });

        // Collect olives
        for (const olive of this.olives) {
            if (olive.collected) continue;
            const bobY = olive.y + Math.sin(olive.bobPhase) * 4;
            if (Math.abs(p.x + p.width/2 - olive.x) < 22 &&
                Math.abs(p.y + p.height/2 - bobY)    < 22) {
                olive.collected = true;
                this.score += 100 + this.currentLevel * 20;
                this.audio.playSFX('collect');
                this.spawnParticles(olive.x, bobY, '#90EE90', 10);
            }
        }

        // Enemy patrol
        for (const en of this.enemies) {
            en.x += en.vx * this.speedMult;
            // Bounce at canvas edges OR at platform edges
            const wall = en.platform;
            if (wall) {
                if (en.x < wall.x) { en.x = wall.x; en.vx = Math.abs(en.vx); }
                if (en.x + en.width > wall.x + wall.w) { en.x = wall.x + wall.w - en.width; en.vx = -Math.abs(en.vx); }
            } else {
                if (en.x < 0 || en.x + en.width > this.canvas.width) en.vx *= -1;
            }

            // Collision with player
            if (p.invincible <= 0 &&
                p.x + p.width  > en.x &&
                p.x             < en.x + en.width &&
                p.y + p.height  > en.y &&
                p.y             < en.y + en.height) {
                this.loseLife();
                return;
            }
        }

        // Win check
        if (this.olives.every(o => o.collected)) {
            this.levelComplete();
        }

        // Particles
        this.particles = this.particles.filter(pt => pt.life > 0);
        this.particles.forEach(pt => {
            pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.1;
            pt.life -= dt;
        });

        this.updateUI();
    }

    loseLife() {
        this.lives--;
        this.audio.playSFX('die');
        this.spawnParticles(this.player.x + 14, this.player.y + 19, '#ff4444', 16);
        if (this.lives <= 0) {
            this.gameState = 'gameover';
        } else {
            this.loadLevel(this.currentLevel);
        }
    }

    levelComplete() {
        this.audio.playSFX('win');
        this.overlay = 'levelWin';
        this.overlayTimer = 2.2;
        this.gameState = 'levelWin';
    }

    spawnParticles(x, y, color, n) {
        for (let i = 0; i < n; i++) {
            const angle = (Math.random() * Math.PI * 2);
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x, y, color,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 0.6 + Math.random() * 0.5,
                size: 3 + Math.random() * 4
            });
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = '❤️'.repeat(this.lives);
        document.getElementById('level').textContent = (this.currentLevel + 1) + ' / ' + this.levelConfigs.length;
        const cfg = this.levelConfigs[this.currentLevel];
        const el = document.getElementById('missionName');
        if (el) el.textContent = cfg ? cfg.name : '';
        const ollEl = document.getElementById('olivesLeft');
        if (ollEl && this.olives) {
            const left = this.olives.filter(o => !o.collected).length;
            ollEl.textContent = left;
        }
    }

    // ──────────────────────────────────────────────────────────────
    draw() {
        const ctx = this.ctx;
        const cfg = this.levelConfigs[this.currentLevel];
        const W   = this.canvas.width;
        const H   = this.canvas.height;

        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, cfg.bg1);
        grad.addColorStop(1, cfg.bg2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Stars
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (let i = 0; i < 40; i++) {
            const sx = (i * 97 + this.currentLevel * 13) % W;
            const sy = (i * 53 + this.currentLevel * 7) % (H * 0.5);
            const ss = (i % 3 === 0) ? 2 : 1;
            ctx.fillRect(sx, sy, ss, ss);
        }

        // Platforms
        for (const plat of this.platforms) {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(plat.x + 3, plat.y + 3, plat.w, plat.h);
            // Platform body
            ctx.fillStyle = plat.color;
            ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(plat.x, plat.y, plat.w, 3);
            // Edge glow
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1;
            ctx.strokeRect(plat.x + 0.5, plat.y + 0.5, plat.w - 1, plat.h - 1);
        }

        // Olives
        for (const olive of this.olives) {
            if (olive.collected) continue;
            const bobY = olive.y + Math.sin(olive.bobPhase) * 4;
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#90EE90';
            ctx.fillStyle = '#2d8a2d';
            ctx.beginPath();
            ctx.ellipse(olive.x, bobY, 10, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#90EE90';
            ctx.beginPath();
            ctx.ellipse(olive.x, bobY, 8, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Pimiento
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.arc(olive.x, bobY, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Enemies — red crabs
        for (const en of this.enemies) {
            this.drawCrab(en);
        }

        // Player — sailor
        this.drawSailor(this.player);

        // Particles
        for (const pt of this.particles) {
            ctx.globalAlpha = pt.life;
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // HUD — level name + olives
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.roundRect(10, 10, 300, 44, 8);
        ctx.fill();
        ctx.fillStyle = '#00f7ff';
        ctx.font = 'bold 13px "Rajdhani","Segoe UI",sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('LEVEL ' + (this.currentLevel + 1) + ': ' + cfg.name, 18, 28);
        ctx.fillStyle = '#90EE90';
        ctx.font = '12px "Rajdhani","Segoe UI",sans-serif';
        const left = this.olives.filter(o => !o.collected).length;
        ctx.fillText('Olives left: ' + left + ' / ' + this.olives.length, 18, 46);

        // Lives indicator (drawn on canvas too for quick feedback)
        ctx.textAlign = 'right';
        ctx.font = '16px sans-serif';
        ctx.fillText('❤️'.repeat(this.lives), W - 12, 30);

        // Overlays
        if (this.gameState === 'levelWin') this.drawLevelWinOverlay();
        if (this.gameState === 'gameover') this.drawGameOverOverlay();
        if (this.gameState === 'victory')  this.drawVictoryOverlay();
    }

    drawSailor(p) {
        const ctx  = this.ctx;
        const x    = p.x, y = p.y;
        const flip = p.facingRight ? 1 : -1;

        ctx.save();
        ctx.translate(x + p.width / 2, y);
        ctx.scale(flip, 1);

        // Invincibility blink
        if (p.invincible > 0 && Math.floor(p.invincible * 10) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        // Legs (walk animation)
        const legSwing = Math.sin(p.frame * Math.PI / 2) * 5;
        ctx.fillStyle = '#003366';
        ctx.fillRect(-7, 20, 8, 16 + legSwing);
        ctx.fillRect(1,  20, 8, 16 - legSwing);

        // Body — white shirt
        ctx.fillStyle = '#e8e8f0';
        ctx.fillRect(-9, 8, 18, 16);
        // Collar stripes (navy)
        ctx.fillStyle = '#003366';
        ctx.fillRect(-9, 8, 18, 5);
        ctx.fillRect(-9, 8, 3, 14);

        // Head
        ctx.fillStyle = '#FFD8A8';
        ctx.beginPath();
        ctx.arc(0, 2, 9, 0, Math.PI * 2);
        ctx.fill();

        // Sailor hat
        ctx.fillStyle = '#fff';
        ctx.fillRect(-10, -8, 20, 6);
        ctx.fillStyle = '#1a1a66';
        ctx.fillRect(-10, -11, 20, 4);
        ctx.fillRect(-3, -15, 6, 5);

        // Eye
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(4, 1, 2, 0, Math.PI * 2);
        ctx.fill();
        // Smile
        ctx.strokeStyle = '#6b3a1f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(3, 5, 4, 0.1, Math.PI - 0.1);
        ctx.stroke();

        // Arm
        ctx.fillStyle = '#e8e8f0';
        ctx.fillRect(9, 10, 6, 10);

        ctx.restore();
    }

    drawCrab(en) {
        const ctx = this.ctx;
        const cx  = en.x + en.width / 2;
        const cy  = en.y + en.height / 2;
        ctx.save();

        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255,60,0,0.6)';

        // Body
        ctx.fillStyle = '#cc2200';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 12, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Claws
        ctx.fillStyle = '#ee3300';
        ctx.beginPath(); ctx.ellipse(cx - 16, cy - 2, 7, 5, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 16, cy - 2, 7, 5, 0.3,  0, Math.PI * 2); ctx.fill();

        // Legs
        ctx.strokeStyle = '#ee3300'; ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath(); ctx.moveTo(cx - 10 + i * 3, cy + 6); ctx.lineTo(cx - 14 + i * 4, cy + 14); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 10 - i * 3, cy + 6); ctx.lineTo(cx + 14 - i * 4, cy + 14); ctx.stroke();
        }

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(cx - 5, cy - 4, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 5, cy - 4, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(cx - 5, cy - 4, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 5, cy - 4, 1.5, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }

    drawLevelWinOverlay() {
        const ctx = this.ctx;
        const W = this.canvas.width, H = this.canvas.height;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#ffe600';
        ctx.font = 'bold 48px "Orbitron","Segoe UI",sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 20; ctx.shadowColor = '#ffe600';
        ctx.fillText('LEVEL CLEAR!', W / 2, H / 2 - 20);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#90EE90';
        ctx.font = '22px "Rajdhani","Segoe UI",sans-serif';
        ctx.fillText('Score: ' + this.score, W / 2, H / 2 + 30);
    }

    drawGameOverOverlay() {
        const ctx = this.ctx;
        const W = this.canvas.width, H = this.canvas.height;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#ff2d78';
        ctx.font = 'bold 48px "Orbitron","Segoe UI",sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 18; ctx.shadowColor = '#ff2d78';
        ctx.fillText('GAME OVER', W / 2, H / 2 - 30);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = '22px "Rajdhani","Segoe UI",sans-serif';
        ctx.fillText('Final Score: ' + this.score, W / 2, H / 2 + 20);
        ctx.fillStyle = '#a0a8c0';
        ctx.font = '17px "Rajdhani","Segoe UI",sans-serif';
        ctx.fillText('Press Start to play again', W / 2, H / 2 + 56);
    }

    drawVictoryOverlay() {
        const ctx = this.ctx;
        const W = this.canvas.width, H = this.canvas.height;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#ffe600';
        ctx.font = 'bold 42px "Orbitron","Segoe UI",sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 22; ctx.shadowColor = '#ffe600';
        ctx.fillText('YOU WIN!', W / 2, H / 2 - 40);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#00f7ff';
        ctx.font = '24px "Rajdhani","Segoe UI",sans-serif';
        ctx.fillText('All 6 levels completed!', W / 2, H / 2 + 10);
        ctx.fillStyle = '#90EE90';
        ctx.font = '22px "Rajdhani","Segoe UI",sans-serif';
        ctx.fillText('Final Score: ' + this.score, W / 2, H / 2 + 46);
    }

    // ──────────────────────────────────────────────────────────────
    gameLoop(currentTime) {
        if (this.gameState === 'menu') return;

        const dt = Math.min((currentTime - (this.lastTime || currentTime)) / 1000, 0.05);
        this.lastTime = currentTime;

        if (this.gameState === 'playing') {
            this.update(dt);
        } else if (this.gameState === 'levelWin') {
            this.overlayTimer -= dt;
            if (this.overlayTimer <= 0) {
                this.currentLevel++;
                if (this.currentLevel >= this.levelConfigs.length) {
                    this.gameState = 'victory';
                    this.saveSave();
                } else {
                    this.loadLevel(this.currentLevel);
                    this.gameState = 'playing';
                }
            }
        }

        this.draw();

        if (this.gameState !== 'gameover' && this.gameState !== 'victory') {
            requestAnimationFrame(t => this.gameLoop(t));
        } else {
            this.draw(); // final frame
        }
    }

    // ──────────────────────────────────────────────────────────────
    drawMenu() {
        const ctx = this.ctx;
        const W = this.canvas.width, H = this.canvas.height;

        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0a1a3a');
        grad.addColorStop(1, '#1a2a5a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Stars
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 0; i < 50; i++) {
            ctx.fillRect((i * 83) % W, (i * 71) % (H * 0.7), (i % 3 === 0) ? 2 : 1, (i % 3 === 0) ? 2 : 1);
        }

        // Title
        ctx.shadowBlur = 24; ctx.shadowColor = '#1E90FF';
        ctx.fillStyle = '#00f7ff';
        ctx.font = 'bold 52px "Orbitron","Segoe UI",sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚓ SAILOR QUEST', W / 2, 110);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#a0c8ff';
        ctx.font = '20px "Rajdhani","Segoe UI",sans-serif';
        ctx.fillText('Jump across platforms and collect all the olives!', W / 2, 155);

        // Level info
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.roundRect(W/2 - 200, 190, 400, 150, 14); ctx.fill();

        ctx.fillStyle = '#ffe600';
        ctx.font = 'bold 16px "Orbitron","Segoe UI",sans-serif';
        ctx.fillText('MISSION GUIDE', W / 2, 218);

        const missions = ['1. Harbour Dash', '2. Dock Trouble', '3. Pirate Cove',
                          '4. Sea Stack',    '5. Whirlpool Peak','6. Final Showdown'];
        ctx.fillStyle = '#a0c8ff'; ctx.font = '14px "Rajdhani","Segoe UI",sans-serif';
        missions.forEach((m, i) => {
            const col = i < 3 ? W / 2 - 95 : W / 2 + 15;
            const row = 238 + (i % 3) * 28;
            ctx.textAlign = 'left';
            ctx.fillText(m, col, row);
        });
        ctx.textAlign = 'center';

        ctx.fillStyle = '#90EE90';
        ctx.font = '18px "Rajdhani","Segoe UI",sans-serif';
        ctx.fillText('Starting on Level ' + (this.currentLevel + 1), W / 2, 358);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 17px "Rajdhani","Segoe UI",sans-serif';
        ctx.fillText('Press START to play!', W / 2, 400);

        // Controls reminder
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.roundRect(W/2 - 160, 415, 320, 52, 10); ctx.fill();
        ctx.fillStyle = '#a0a8c0'; ctx.font = '13px "Rajdhani","Segoe UI",sans-serif';
        ctx.fillText('← → / A D — Move    ↑ / W / Space — Jump', W / 2, 445);
    }

    // ──────────────────────────────────────────────────────────────
    toggleFullscreen() {
        const c = document.querySelector('.game-container');
        if (!document.fullscreenElement) {
            c.requestFullscreen().catch(() => {});
            document.getElementById('fullscreenBtn').textContent = '🖥️ Exit';
        } else {
            document.exitFullscreen();
            document.getElementById('fullscreenBtn').textContent = '🖥️ Fullscreen';
        }
    }

    goBack() {
        this.saveSave();
        window.location.href = '../../launcher.html';
    }

    saveSave() {
        this.save.save({ score: this.score, level: this.currentLevel, totalLevels: this.levelConfigs.length });
    }

    loadSave() {
        const d = this.save.load();
        if (d) {
            this.score        = d.score || 0;
            this.currentLevel = Math.min(d.level || 0, this.levelConfigs.length - 1);
        }
    }
}

window.addEventListener('load', () => new SailorQuestGame());
