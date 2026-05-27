// ============================================================
// GameZDD Launcher — game registry + UI controller
// ============================================================

const GAMES = [
    {
        id: 'pacman',
        title: 'Pac-Man',
        description: 'Classic arcade maze — eat all dots and dodge the ghosts!',
        icon: '👾',
        category: 'maze',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg,#FFE600 0%,#FF8C00 100%)'
    },
    {
        id: 'pacman-maze',
        title: 'Maze Munch',
        description: 'Procedural mazes, 4 ghost colours and power pellets!',
        icon: '🟡',
        category: 'maze',
        difficulty: 'Medium',
        gradient: 'linear-gradient(135deg,#f7971e 0%,#ffd200 100%)'
    },
    {
        id: 'lolo',
        title: 'Hero Quest',
        description: 'Explore dungeons, push blocks and collect every chest!',
        icon: '🗡️',
        category: 'maze',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)'
    },
    {
        id: 'mole-mania',
        title: 'Tunnel Quest',
        description: 'Dig through caves, collect gems and dodge falling rocks!',
        icon: '⛏️',
        category: 'maze',
        difficulty: 'Medium',
        gradient: 'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)'
    },
    {
        id: 'sokoban',
        title: 'Box Pusher',
        description: 'Push boxes onto every target — the ultimate brain workout!',
        icon: '📦',
        category: 'maze',
        difficulty: 'Medium',
        gradient: 'linear-gradient(135deg,#fa709a 0%,#fee140 100%)'
    },
    {
        id: 'sokoban-master',
        title: 'Sokoban Master',
        description: '100 classic Sokoban puzzles with best-move tracking!',
        icon: '🧩',
        category: 'maze',
        difficulty: 'Hard',
        gradient: 'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)'
    },
    {
        id: 'super-mario',
        title: 'Super Jumper',
        description: 'Full-physics platformer — stomp goombas, grab coins!',
        icon: '🍄',
        category: 'action',
        difficulty: 'Medium',
        gradient: 'linear-gradient(135deg,#e52d27 0%,#b31217 100%)'
    },
    {
        id: 'donkey-kong',
        title: 'Barrel Climber',
        description: 'Climb ladders and leap over rolling barrels to the top!',
        icon: '🪜',
        category: 'action',
        difficulty: 'Medium',
        gradient: 'linear-gradient(135deg,#fccb90 0%,#d57eeb 100%)'
    },
    {
        id: 'burgertime',
        title: 'Chef Rush',
        description: 'Walk over ingredients to build burgers while dodging foes!',
        icon: '🍔',
        category: 'action',
        difficulty: 'Medium',
        gradient: 'linear-gradient(135deg,#fa709a 0%,#fee140 100%)'
    },
    {
        id: 'popeye',
        title: 'Sailor Quest',
        description: 'Jump across platforms to collect all olives before time\'s up!',
        icon: '⚓',
        category: 'action',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg,#1E90FF 0%,#00CED1 100%)'
    },
    {
        id: 'tetris',
        title: 'Block Fall',
        description: 'Classic Tetris with hold piece, bag randomiser and missions!',
        icon: '🎮',
        category: 'puzzle',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg,#e0c3fc 0%,#8ec5fc 100%)'
    },
    {
        id: 'memory',
        title: 'Memory Cards',
        description: 'Flip cards and match pairs — three difficulty levels!',
        icon: '🃏',
        category: 'puzzle',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)'
    },
    {
        id: 'block-blast',
        title: 'Block Blast',
        description: 'Drop blocks and clear connected groups — cascade for points!',
        icon: '🟦',
        category: 'bubble',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)'
    },
    {
        id: 'arkanoid',
        title: 'Brick Breaker',
        description: 'Bounce the ball, smash all bricks — power-ups await!',
        icon: '🏓',
        category: 'bubble',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg,#ff6e7f 0%,#bfe9ff 100%)'
    },
    {
        id: 'puzzle-bubble',
        title: 'Bubble Pop',
        description: 'Aim and shoot coloured bubbles — match 3 to pop them!',
        icon: '🫧',
        category: 'bubble',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)'
    },
    {
        id: 'zuma',
        title: 'Marble Chain',
        description: 'Shoot marbles into the moving chain before it reaches the end!',
        icon: '⚽',
        category: 'bubble',
        difficulty: 'Medium',
        gradient: 'linear-gradient(135deg,#ff9a9e 0%,#fecfef 100%)'
    }
];

// ──────────────────────────────────────────────────────────
// Launcher class
// ──────────────────────────────────────────────────────────
class GameLauncher {
    constructor() {
        this.recentGames   = this.loadRecentGames();
        this.settings      = this.loadSettings();
        this.playTimeStart = Date.now();
        this.activeFilter  = 'all';

        this.init();
    }

    // ── Init ──────────────────────────────────────────────
    init() {
        this.renderGames();
        this.setupEventListeners();
        this.startPlayTimeTracking();
        this.applySettings();
    }

    // ── Settings persistence ──────────────────────────────
    loadSettings() {
        const defaults = {
            playerName: '', theme: '', musicVolume: 50, sfxVolume: 70,
            musicMuted: false, sfxMuted: false
        };
        try {
            const saved = localStorage.getItem('gamezdd_settings');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch { return defaults; }
    }

    saveSettings() {
        localStorage.setItem('gamezdd_settings', JSON.stringify(this.settings));
    }

    applySettings() {
        document.body.className = this.settings.theme || '';

        document.getElementById('musicVolume').value = this.settings.musicVolume;
        document.getElementById('sfxVolume').value   = this.settings.sfxVolume;
        document.getElementById('playerName').value  = this.settings.playerName;
        document.getElementById('theme').value       = this.settings.theme || '';

        this.updateMuteButtons();
    }

    // ── Recent games ──────────────────────────────────────
    loadRecentGames() {
        try {
            return JSON.parse(localStorage.getItem('gamezdd_recent') || '[]');
        } catch { return []; }
    }

    saveRecentGame(id) {
        this.recentGames = [id, ...this.recentGames.filter(x => x !== id)].slice(0, 3);
        localStorage.setItem('gamezdd_recent', JSON.stringify(this.recentGames));
    }

    // ── Render ────────────────────────────────────────────
    renderGames() {
        const grid = document.getElementById('gameGrid');
        grid.innerHTML = '';
        GAMES.forEach(g => grid.appendChild(this.createGameCard(g)));
    }

    createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card' + (this.recentGames.includes(game.id) ? ' recent' : '');
        card.dataset.id = game.id;
        card.dataset.category = game.category;
        card.dataset.title = game.title.toLowerCase();

        const progress = this.getGameProgress(game.id);

        card.style.setProperty('--card-accent', game.gradient);

        card.innerHTML = `
            <div class="recent-badge">⭐ Recent</div>
            <div class="game-icon" style="background:${game.gradient}">${game.icon}</div>
            <div class="game-title">${game.title}</div>
            <div class="game-description">${game.description}</div>
            <div class="game-progress">
                <div class="game-progress-bar" style="width:${progress}%"></div>
            </div>
            <div class="game-stats">
                <span class="difficulty-badge diff-${game.difficulty}">${game.difficulty}</span>
                <span>🎯 ${game.category}</span>
            </div>
            <button class="play-btn" data-id="${game.id}">
                ${progress > 0 ? '▶ CONTINUE' : '▶ PLAY'}
            </button>
        `;

        card.querySelector('.play-btn').addEventListener('click', e => {
            e.stopPropagation();
            this.launchGame(game.id);
        });

        return card;
    }

    getGameProgress(gameId) {
        try {
            const save = new SaveManager(gameId);
            const data = save.load();
            if (!data) return 0;
            const lvl   = data.currentLevel || data.level || 1;
            const total = data.totalLevels  || 6;
            return Math.min(100, Math.round(((lvl - 1) / total) * 100));
        } catch { return 0; }
    }

    launchGame(gameId) {
        this.saveRecentGame(gameId);
        this.showToast('Launching ' + (GAMES.find(g => g.id === gameId)?.title || gameId) + '…');
        setTimeout(() => { window.location.href = `games/${gameId}/index.html`; }, 300);
    }

    // ── Filter + Search ───────────────────────────────────
    applyFilterSearch() {
        const query = document.getElementById('searchInput').value.toLowerCase().trim();
        document.querySelectorAll('.game-card').forEach(card => {
            const matchCat   = this.activeFilter === 'all' || card.dataset.category === this.activeFilter;
            const matchQuery = !query || card.dataset.title.includes(query);
            card.classList.toggle('hidden', !(matchCat && matchQuery));
        });
    }

    // ── Event Listeners ───────────────────────────────────
    setupEventListeners() {
        // Settings / Help
        document.getElementById('settingsBtn').addEventListener('click', () => this.openModal('settingsModal'));
        document.getElementById('helpBtn').addEventListener('click',     () => this.openModal('helpModal'));
        document.getElementById('closeSettings').addEventListener('click', () => this.closeModal('settingsModal'));
        document.getElementById('closeHelp').addEventListener('click',     () => this.closeModal('helpModal'));

        // Click outside to close
        document.querySelectorAll('.modal').forEach(m => {
            m.addEventListener('click', e => { if (e.target === m) this.closeModal(m.id); });
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilterSearch());

        // Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeFilter = btn.dataset.filter;
                this.applyFilterSearch();
            });
        });

        // Settings controls
        document.getElementById('musicVolume').addEventListener('input', e => {
            this.settings.musicVolume = parseInt(e.target.value);
            this.saveSettings();
        });
        document.getElementById('sfxVolume').addEventListener('input', e => {
            this.settings.sfxVolume = parseInt(e.target.value);
            this.saveSettings();
        });
        document.getElementById('toggleMusic').addEventListener('click', () => {
            this.settings.musicMuted = !this.settings.musicMuted;
            this.updateMuteButtons();
            this.saveSettings();
        });
        document.getElementById('toggleSFX').addEventListener('click', () => {
            this.settings.sfxMuted = !this.settings.sfxMuted;
            this.updateMuteButtons();
            this.saveSettings();
        });
        document.getElementById('playerName').addEventListener('change', e => {
            this.settings.playerName = e.target.value;
            this.saveSettings();
        });
        document.getElementById('theme').addEventListener('change', e => {
            this.settings.theme = e.target.value;
            document.body.className = this.settings.theme || '';
            this.saveSettings();
        });
        document.getElementById('resetProgress').addEventListener('click', () => {
            if (confirm('Reset ALL game progress? This cannot be undone!')) {
                GAMES.forEach(g => {
                    try { new SaveManager(g.id).delete(1); } catch {}
                    localStorage.removeItem(`save_${g.id}`);
                });
                this.recentGames = [];
                localStorage.removeItem('gamezdd_recent');
                this.renderGames();
                this.closeModal('settingsModal');
                this.showToast('Progress reset!');
            }
        });
    }

    updateMuteButtons() {
        const mBtn = document.getElementById('toggleMusic');
        const sBtn = document.getElementById('toggleSFX');
        mBtn.textContent = this.settings.musicMuted ? '🔇 Music Off' : '🔊 Music On';
        mBtn.classList.toggle('muted', !!this.settings.musicMuted);
        sBtn.textContent = this.settings.sfxMuted ? '🔇 SFX Off' : '🔊 SFX On';
        sBtn.classList.toggle('muted', !!this.settings.sfxMuted);
    }

    openModal(id)  { document.getElementById(id).classList.add('active');    }
    closeModal(id) { document.getElementById(id).classList.remove('active'); }

    // ── Toast ─────────────────────────────────────────────
    showToast(msg) {
        const t = document.getElementById('toast');
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
    }

    // ── Play-time tracker ─────────────────────────────────
    startPlayTimeTracking() {
        const el = document.getElementById('playTime');
        setInterval(() => {
            const mins = Math.floor((Date.now() - this.playTimeStart) / 60000);
            el.textContent = mins >= 60
                ? `${Math.floor(mins/60)}h ${mins%60}m`
                : `${mins}m`;
        }, 10000);
    }
}

// Boot
window.addEventListener('DOMContentLoaded', () => new GameLauncher());
