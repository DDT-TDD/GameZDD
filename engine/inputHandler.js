/**
 * InputHandler - Unified keyboard, mouse, and gamepad input handling
 */
class InputHandler {
    constructor() {
        this.keys = {};
        this.keysPressed = {};
        this.mouse = { x: 0, y: 0, buttons: {} };
        this.gamepad = null;
        this.callbacks = {
            keydown: [],
            keyup: [],
            mousedown: [],
            mouseup: [],
            mousemove: []
        };
        
        this.init();
    }
    
    /**
     * Initialize event listeners
     */
    init() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            // Prevent default for game keys to stop page scrolling
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || 
                e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
                e.preventDefault();
            }
            
            if (!this.keys[e.code]) {
                this.keysPressed[e.code] = true;
            }
            this.keys[e.code] = true;
            this.callbacks.keydown.forEach(cb => cb(e));
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keysPressed[e.code] = false;
            this.callbacks.keyup.forEach(cb => cb(e));
        });
        
        // Mouse events
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.callbacks.mousemove.forEach(cb => cb(e));
        });
        
        window.addEventListener('mousedown', (e) => {
            this.mouse.buttons[e.button] = true;
            this.callbacks.mousedown.forEach(cb => cb(e));
        });
        
        window.addEventListener('mouseup', (e) => {
            this.mouse.buttons[e.button] = false;
            this.callbacks.mouseup.forEach(cb => cb(e));
        });
        
        // Gamepad polling
        this.pollGamepad();
    }
    
    /**
     * Check if key is currently held down
     */
    isKeyDown(code) {
        return this.keys[code] || false;
    }
    
    /**
     * Check if key was just pressed (one-time trigger)
     */
    isKeyPressed(code) {
        const pressed = this.keysPressed[code];
        if (pressed) {
            this.keysPressed[code] = false;
            return true;
        }
        return false;
    }
    
    /**
     * Check arrow key or WASD directions
     */
    getDirection() {
        const dir = { x: 0, y: 0 };
        
        if (this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA')) dir.x = -1;
        if (this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD')) dir.x = 1;
        if (this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW')) dir.y = -1;
        if (this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS')) dir.y = 1;
        
        // Gamepad support
        if (this.gamepad) {
            const axes = this.gamepad.axes;
            if (Math.abs(axes[0]) > 0.5) dir.x = Math.sign(axes[0]);
            if (Math.abs(axes[1]) > 0.5) dir.y = Math.sign(axes[1]);
        }
        
        return dir;
    }
    
    /**
     * Check if action button pressed (Space, Enter, or gamepad A)
     */
    isActionPressed() {
        const pressed = this.isKeyPressed('Space') || this.isKeyPressed('Enter');
        
        if (this.gamepad && this.gamepad.buttons[0].pressed) {
            return true;
        }
        
        return pressed;
    }
    
    /**
     * Poll gamepad state
     */
    pollGamepad() {
        const gamepads = navigator.getGamepads();
        this.gamepad = gamepads[0] || null;
        requestAnimationFrame(() => this.pollGamepad());
    }
    
    /**
     * Register callback for input events
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }
    
    /**
     * Remove callback
     */
    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }
    
    /**
     * Reset all input states
     */
    reset() {
        this.keys = {};
        this.keysPressed = {};
        this.mouse.buttons = {};
    }
}

// Export for use in games
window.InputHandler = InputHandler;
