/**
 * SaveManager - Handles game progress saving and loading
 */
class SaveManager {
    constructor(gameName) {
        this.gameName = gameName;
        this.currentSlot = 1;
        this.maxSlots = 3;
    }
    
    /**
     * Get save key for localStorage
     */
    getSaveKey(slot = this.currentSlot) {
        return `gamezdd_${this.gameName}_slot${slot}`;
    }
    
    /**
     * Save game data to slot
     */
    save(data, slot = this.currentSlot) {
        const saveData = {
            timestamp: Date.now(),
            data: data
        };
        
        try {
            localStorage.setItem(this.getSaveKey(slot), JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    }
    
    /**
     * Load game data from slot
     */
    load(slot = this.currentSlot) {
        try {
            const saveData = localStorage.getItem(this.getSaveKey(slot));
            if (saveData) {
                const parsed = JSON.parse(saveData);
                return parsed.data;
            }
            return null;
        } catch (e) {
            console.error('Load failed:', e);
            return null;
        }
    }
    
    /**
     * Check if save exists in slot
     */
    exists(slot = this.currentSlot) {
        return localStorage.getItem(this.getSaveKey(slot)) !== null;
    }
    
    /**
     * Delete save from slot
     */
    delete(slot = this.currentSlot) {
        localStorage.removeItem(this.getSaveKey(slot));
    }
    
    /**
     * Get all save slots info
     */
    getAllSlots() {
        const slots = [];
        for (let i = 1; i <= this.maxSlots; i++) {
            const saveData = localStorage.getItem(this.getSaveKey(i));
            if (saveData) {
                const parsed = JSON.parse(saveData);
                slots.push({
                    slot: i,
                    timestamp: parsed.timestamp,
                    data: parsed.data
                });
            } else {
                slots.push({
                    slot: i,
                    timestamp: null,
                    data: null
                });
            }
        }
        return slots;
    }
    
    /**
     * Export save data as JSON string
     */
    export(slot = this.currentSlot) {
        const data = this.load(slot);
        if (data) {
            return JSON.stringify({
                game: this.gameName,
                slot: slot,
                data: data
            }, null, 2);
        }
        return null;
    }
    
    /**
     * Import save data from JSON string
     */
    import(jsonString, slot = this.currentSlot) {
        try {
            const imported = JSON.parse(jsonString);
            if (imported.game === this.gameName) {
                return this.save(imported.data, slot);
            }
            return false;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    }
    
    /**
     * Auto-save with debouncing
     */
    autoSave(data, delay = 1000) {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(() => {
            this.save(data);
        }, delay);
    }
}

// Export for use in games
window.SaveManager = SaveManager;
