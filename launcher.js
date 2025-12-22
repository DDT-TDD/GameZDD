// Game Collection Data
const games = [
    {
        id: 'lolo',
        title: 'Lolo\'s Adventure',
        description: 'Push blocks and solve puzzles to collect all hearts!',
        icon: '🎯',
        category: 'maze',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
        id: 'pacman',
        title: 'Pac-Man',
        description: 'Classic arcade maze game - eat dots and avoid ghosts!',
        icon: '�',
        category: 'maze',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg, #FFE600 0%, #FF8C00 100%)'
    },
    {
        id: 'mole-mania',
        title: 'Diggy\'s Quest',
        description: 'Dig tunnels and solve underground puzzles!',
        icon: '⛏️',
        category: 'maze',
        difficulty: 'Medium',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
        id: 'sokoban',
        title: 'Box Pusher Pro',
        description: 'Push boxes to targets in this classic puzzle!',
        icon: '📦',
        category: 'maze',
        difficulty: 'Medium',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
        id: 'sokoban-master',
        title: 'Sokoban Master',
        description: '100 challenging box-pushing puzzles! Classic collection.',
        icon: '📦',
        category: 'maze',
        difficulty: 'Hard',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
        id: 'puzzle-bubble',
        title: 'Bubble Pop',
        description: 'Match colored bubbles and clear the screen!',
        icon: '🫧',
        category: 'bubble',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    },
    {
        id: 'memory',
        title: 'Memory Cards',
        description: 'Find matching card pairs in three difficulty levels!',
        icon: '🃏',
        category: 'puzzle',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
        id: 'zuma',
        title: 'Ball Chain',
        description: 'Shoot balls to match colors in the moving chain!',
        icon: '⚽',
        category: 'bubble',
        difficulty: 'Medium',
        gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    },
    {
        id: 'block-blast',
        title: 'Block Blast',
        description: 'Place blocks strategically to clear lines!',
        icon: '🟦',
        category: 'bubble',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    },
    {
        id: 'arkanoid',
        title: 'Brick Breaker',
        description: 'Bounce the ball to break all the blocks!',
        icon: '🏓',
        category: 'bubble',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)'
    },
    {
        id: 'tetris',
        title: 'Block Fall',
        description: 'Arrange falling pieces to complete lines!',
        icon: '🎮',
        category: 'bubble',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)'
    },
    {
        id: 'popeye',
        title: 'Catch \'Em All',
        description: 'Catch falling items on platforms!',
        icon: '🎪',
        category: 'action',
        difficulty: 'Easy',
        gradient: 'linear-gradient(135deg, #f77062 0%, #fe5196 100%)'
    },
    {
        id: 'donkey-kong',
        title: 'Barrel Climber',
        description: 'Climb ladders and dodge rolling obstacles!',
        icon: '🪜',
        category: 'action',
        difficulty: 'Medium',
        gradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)'
    },
    {
        id: 'burgertime',
        title: 'Burger Builder',
        description: 'Build burgers by walking over ingredients!',
        icon: '🍔',
        category: 'action',
        difficulty: 'Medium',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
        id: 'super-mario',
        title: 'Super Mario V2',
        description: 'Realistic platformer with advanced jump physics!',
        icon: '🍄',
        category: 'action',
        difficulty: 'Medium',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
];

// Launcher Application
class GameLauncher {
    constructor() {
        this.audio = new AudioManager();
        this.recentGames = this.loadRecentGames();
        this.playTimeStart = Date.now();
        this.settings = this.loadSettings();
        
        this.init();
    }
    
    init() {
        this.renderGames();
        this.setupEventListeners();
        this.startPlayTimeTracking();
        this.applySettings();
    }
    
    loadSettings() {
        const defaults = {
            playerName: '',
            theme: 'default',
            musicVolume: 50,
            sfxVolume: 70,
            musicMuted: false,
            sfxMuted: false
        };
        
        const saved = localStorage.getItem('gamezdd_settings');
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    }
    
    saveSettings() {
        localStorage.setItem('gamezdd_settings', JSON.stringify(this.settings));
    }
    
    applySettings() {
        // Apply theme
        document.body.className = this.settings.theme;
        
        // Apply audio settings
        this.audio.setMusicVolume(this.settings.musicVolume / 100);
        this.audio.setSFXVolume(this.settings.sfxVolume / 100);
        
        if (this.settings.musicMuted) this.audio.toggleMusicMute();
        if (this.settings.sfxMuted) this.audio.toggleSFXMute();
        
        // Update UI
        document.getElementById('musicVolume').value = this.settings.musicVolume;
        document.getElementById('sfxVolume').value = this.settings.sfxVolume;
        document.getElementById('playerName').value = this.settings.playerName;
        document.getElementById('theme').value = this.settings.theme;
        
        this.updateMuteButtons();
    }
    
    loadRecentGames() {
        const recent = localStorage.getItem('gamezdd_recent');
        return recent ? JSON.parse(recent) : [];
    }
    
    saveRecentGame(gameId) {
        // Add to beginning, remove if already exists
        this.recentGames = this.recentGames.filter(id => id !== gameId);
        this.recentGames.unshift(gameId);
        
        // Keep only last 3
        this.recentGames = this.recentGames.slice(0, 3);
        
        localStorage.setItem('gamezdd_recent', JSON.stringify(this.recentGames));
    }
    
    renderGames() {
        const gameGrid = document.getElementById('gameGrid');
        gameGrid.innerHTML = '';
        
        games.forEach(game => {
            const card = this.createGameCard(game);
            gameGrid.appendChild(card);
        });
    }
    
    createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        if (this.recentGames.includes(game.id)) {
            card.classList.add('recent');
        }
        
        // Get progress
        const progress = this.getGameProgress(game.id);
        
        card.innerHTML = `
            <div class="game-icon" style="background: ${game.gradient}">
                ${game.icon}
            </div>
            <div class="game-title">${game.title}</div>
            <div class="game-description">${game.description}</div>
            <div class="game-progress">
                <div class="game-progress-bar" style="width: ${progress}%">
                    ${progress > 0 ? progress + '%' : ''}
                </div>
            </div>
            <div class="game-stats">
                <span>📊 ${game.difficulty}</span>
                <span>🎯 ${game.category}</span>
            </div>
            <button class="play-btn" data-game="${game.id}">
                ${progress > 0 ? '▶️ Continue' : '🎮 Play'}
            </button>
        `;
        
        // Add click handler
        card.querySelector('.play-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.launchGame(game.id);
        });
        
        card.addEventListener('click', () => {
            this.showGameInfo(game);
        });
        
        return card;
    }
    
    getGameProgress(gameId) {
        const save = new SaveManager(gameId);
        const data = save.load();
        
        if (!data) return 0;
        
        // Calculate progress percentage based on level completion
        // This is a simple estimate - each game will have its own calculation
        const currentLevel = data.currentLevel || 1;
        const totalLevels = data.totalLevels || 20;
        
        return Math.min(100, Math.round((currentLevel / totalLevels) * 100));
    }
    
    showGameInfo(game) {
        // Play sound effect
        // this.audio.playSound('click');
        
        // Show detailed info (could open a modal)
        console.log('Game info:', game);
    }
    
    launchGame(gameId) {
        // Save as recent
        this.saveRecentGame(gameId);
        
        // Play sound
        // this.audio.playSound('start');
        
        // Launch game in new window or navigate
        const gameUrl = `games/${gameId}/index.html`;
        window.location.href = gameUrl;
    }
    
    setupEventListeners() {
        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openModal('settingsModal');
        });
        
        // Help button
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.openModal('helpModal');
        });
        
        // Close buttons
        document.getElementById('closeSettings').addEventListener('click', () => {
            this.closeModal('settingsModal');
        });
        
        document.getElementById('closeHelp').addEventListener('click', () => {
            this.closeModal('helpModal');
        });
        
        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
        
        // Settings controls
        document.getElementById('musicVolume').addEventListener('input', (e) => {
            this.settings.musicVolume = parseInt(e.target.value);
            this.audio.setMusicVolume(this.settings.musicVolume / 100);
            this.saveSettings();
        });
        
        document.getElementById('sfxVolume').addEventListener('input', (e) => {
            this.settings.sfxVolume = parseInt(e.target.value);
            this.audio.setSFXVolume(this.settings.sfxVolume / 100);
            this.saveSettings();
        });
        
        document.getElementById('toggleMusic').addEventListener('click', () => {
            this.audio.toggleMusicMute();
            this.settings.musicMuted = this.audio.musicMuted;
            this.updateMuteButtons();
            this.saveSettings();
        });
        
        document.getElementById('toggleSFX').addEventListener('click', () => {
            this.audio.toggleSFXMute();
            this.settings.sfxMuted = this.audio.sfxMuted;
            this.updateMuteButtons();
            this.saveSettings();
        });
        
        document.getElementById('playerName').addEventListener('change', (e) => {
            this.settings.playerName = e.target.value;
            this.saveSettings();
        });
        
        document.getElementById('theme').addEventListener('change', (e) => {
            this.settings.theme = e.target.value;
            this.applySettings();
            this.saveSettings();
        });
        
        document.getElementById('resetProgress').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset ALL game progress? This cannot be undone!')) {
                this.resetAllProgress();
            }
        });
    }
    
    updateMuteButtons() {
        const musicBtn = document.getElementById('toggleMusic');
        const sfxBtn = document.getElementById('toggleSFX');
        
        musicBtn.textContent = this.audio.musicMuted ? '🔇 Music Off' : '🔊 Music On';
        musicBtn.classList.toggle('muted', this.audio.musicMuted);
        
        sfxBtn.textContent = this.audio.sfxMuted ? '🔇 SFX Off' : '🔊 SFX On';
        sfxBtn.classList.toggle('muted', this.audio.sfxMuted);
    }
    
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
    
    resetAllProgress() {
        games.forEach(game => {
            const save = new SaveManager(game.id);
            for (let i = 1; i <= 3; i++) {
                save.delete(i);
            }
        });
        
        this.recentGames = [];
        localStorage.removeItem('gamezdd_recent');
        localStorage.removeItem('gamezdd_playtime');
        
        this.renderGames();
        alert('All progress has been reset! 🔄');
    }
    
    startPlayTimeTracking() {
        // Load total play time
        const totalTime = parseInt(localStorage.getItem('gamezdd_playtime') || '0');
        
        // Update display every minute
        setInterval(() => {
            const sessionTime = Math.floor((Date.now() - this.playTimeStart) / 60000);
            const total = totalTime + sessionTime;
            
            const hours = Math.floor(total / 60);
            const minutes = total % 60;
            
            let timeStr = '';
            if (hours > 0) {
                timeStr = `${hours}h ${minutes}m`;
            } else {
                timeStr = `${minutes}m`;
            }
            
            document.getElementById('playTime').textContent = timeStr;
        }, 1000);
        
        // Save play time on page unload
        window.addEventListener('beforeunload', () => {
            const sessionTime = Math.floor((Date.now() - this.playTimeStart) / 60000);
            localStorage.setItem('gamezdd_playtime', (totalTime + sessionTime).toString());
        });
    }
}

// Initialize launcher when page loads
window.addEventListener('DOMContentLoaded', () => {
    new GameLauncher();
});
