/**
 * GameEngine - Base engine for all puzzle games
 */
class GameEngine {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = options.width || 800;
        this.height = options.height || 600;
        this.targetFPS = options.targetFPS || 60;
        this.running = false;
        this.paused = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Initialize canvas
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Initialize managers
        this.audio = new AudioManager();
        this.input = new InputHandler();
        this.save = options.gameName ? new SaveManager(options.gameName) : null;
        
        // Game state
        this.state = 'menu';
        this.states = {};
        
        // Performance tracking
        this.frameCount = 0;
        this.fps = 0;
        this.fpsTime = 0;
    }
    
    /**
     * Register a game state
     */
    addState(name, state) {
        this.states[name] = state;
    }
    
    /**
     * Switch to a different state
     */
    setState(name) {
        if (this.states[name]) {
            if (this.states[this.state] && this.states[this.state].exit) {
                this.states[this.state].exit();
            }
            this.state = name;
            if (this.states[this.state].enter) {
                this.states[this.state].enter();
            }
        }
    }
    
    /**
     * Start game loop
     */
    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    /**
     * Stop game loop
     */
    stop() {
        this.running = false;
    }
    
    /**
     * Toggle pause
     */
    togglePause() {
        this.paused = !this.paused;
    }
    
    /**
     * Main game loop
     */
    gameLoop(currentTime = 0) {
        if (!this.running) return;
        
        // Calculate delta time
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Calculate FPS
        this.frameCount++;
        this.fpsTime += this.deltaTime;
        if (this.fpsTime >= 1) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = 0;
        }
        
        // Update and render current state
        if (!this.paused && this.states[this.state]) {
            if (this.states[this.state].update) {
                this.states[this.state].update(this.deltaTime);
            }
            if (this.states[this.state].render) {
                this.states[this.state].render(this.ctx);
            }
        }
        
        // Check for ESC key to pause
        if (this.input.isKeyPressed('Escape')) {
            this.togglePause();
        }
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    /**
     * Clear canvas
     */
    clear(color = '#000000') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    /**
     * Draw text with options
     */
    drawText(text, x, y, options = {}) {
        const {
            font = '24px Arial',
            color = '#FFFFFF',
            align = 'left',
            baseline = 'top',
            stroke = false,
            strokeColor = '#000000',
            strokeWidth = 2
        } = options;
        
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        
        if (stroke) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = strokeWidth;
            this.ctx.strokeText(text, x, y);
        }
        
        this.ctx.fillText(text, x, y);
    }
    
    /**
     * Draw rectangle
     */
    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    }
    
    /**
     * Draw circle
     */
    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * Draw image
     */
    drawImage(img, x, y, width, height) {
        if (width && height) {
            this.ctx.drawImage(img, x, y, width, height);
        } else {
            this.ctx.drawImage(img, x, y);
        }
    }
}

// Export for use in games
window.GameEngine = GameEngine;
