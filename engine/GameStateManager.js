/**
 * Game State Machine
 * Inspired by puzzle-bubble-main pattern
 * Provides clear state transitions and prevents logic errors
 */

const GameState = {
    MENU: 'menu',
    INSTRUCTIONS: 'instructions',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_INTRO: 'levelIntro',
    GAMEOVER: 'gameover',
    WIN: 'win'
};

class GameStateManager {
    constructor(initialState = GameState.MENU) {
        this.currentState = initialState;
        this.previousState = null;
        this.stateListeners = new Map();
    }

    /**
     * Transition to a new state
     * @param {string} newState - New state from GameState
     * @returns {boolean} True if transition successful, false if invalid
     */
    setState(newState) {
        if (!Object.values(GameState).includes(newState)) {
            console.warn(`Invalid state: ${newState}`);
            return false;
        }

        if (this.currentState === newState) {
            return false; // No change
        }

        this.previousState = this.currentState;
        this.currentState = newState;
        this.notifyListeners(newState);
        return true;
    }

    /**
     * Get current state
     * @returns {string}
     */
    getState() {
        return this.currentState;
    }

    /**
     * Check if in specific state
     * @param {string} state
     * @returns {boolean}
     */
    isState(state) {
        return this.currentState === state;
    }

    /**
     * Check if in any of multiple states
     * @param {...string} states
     * @returns {boolean}
     */
    isStateIn(...states) {
        return states.includes(this.currentState);
    }

    /**
     * Listen for state changes
     * @param {string} state - State to listen for
     * @param {Function} callback - Called when state changes to this state
     */
    onStateChange(state, callback) {
        if (!this.stateListeners.has(state)) {
            this.stateListeners.set(state, []);
        }
        this.stateListeners.get(state).push(callback);
    }

    /**
     * Remove state listener
     * @param {string} state
     * @param {Function} callback
     */
    offStateChange(state, callback) {
        if (this.stateListeners.has(state)) {
            const listeners = this.stateListeners.get(state);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Notify all listeners of state change
     * @private
     */
    notifyListeners(state) {
        if (this.stateListeners.has(state)) {
            this.stateListeners.get(state).forEach(callback => {
                callback(state, this.previousState);
            });
        }
    }
}

export { GameState, GameStateManager };
