/**
 * AudioManager - Handles all audio playback with volume controls and muting
 */
class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = {};
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.musicMuted = false;
        this.sfxMuted = false;
        this.currentMusic = null;

        // Web Audio context for synthesized fallbacks (lazy initialised)
        this.audioContext = null;
        this.masterGain = null;
        this.defaultSFX = {};

        this.loadSettings();
        this.initDefaultSFX();
    }
    
    /**
     * Load audio settings from localStorage
     */
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('audioSettings') || '{}');
        this.musicVolume = settings.musicVolume ?? 0.5;
        this.sfxVolume = settings.sfxVolume ?? 0.7;
        this.musicMuted = settings.musicMuted ?? false;
        this.sfxMuted = settings.sfxMuted ?? false;
    }
    
    /**
     * Save audio settings to localStorage
     */
    saveSettings() {
        localStorage.setItem('audioSettings', JSON.stringify({
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            musicMuted: this.musicMuted,
            sfxMuted: this.sfxMuted
        }));
    }
    
    /**
     * Load a sound effect
     */
    loadSound(name, path) {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = this.sfxVolume;
        this.sounds[name] = audio;
    }
    
    /**
     * Load background music
     */
    loadMusic(name, path) {
        const audio = new Audio(path);
        audio.loop = true;
        audio.volume = this.musicVolume;
        this.music[name] = audio;
    }
    
    /**
     * Play a sound effect
     */
    playSound(name) {
        if (this.sfxMuted) return;

        const source = this.sounds[name];
        if (!source) {
            this.playDefaultSFX(name);
            return;
        }

        const sound = source.cloneNode();
        sound.volume = this.sfxVolume;
        sound.play().catch(e => console.log('Audio play failed:', e));
    }
    
    /**
     * Play background music
     */
    playMusic(name) {
        if (this.musicMuted || !this.music[name]) return;
        
        // Stop current music
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }
        
        this.currentMusic = this.music[name];
        this.currentMusic.volume = this.musicVolume;
        this.currentMusic.play().catch(e => console.log('Music play failed:', e));
    }
    
    /**
     * Stop current music
     */
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }
    }
    
    /**
     * Set music volume (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume;
        }
        this.saveSettings();
    }
    
    /**
     * Set sound effects volume (0-1)
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.sfxMuted ? 0 : this.sfxVolume;
        }
        this.saveSettings();
    }
    
    /**
     * Toggle music mute
     */
    toggleMusicMute() {
        this.musicMuted = !this.musicMuted;
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicMuted ? 0 : this.musicVolume;
        }
        this.saveSettings();
    }
    
    /**
     * Toggle sound effects mute
     */
    toggleSFXMute() {
        this.sfxMuted = !this.sfxMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.sfxMuted ? 0 : this.sfxVolume;
        }
        this.saveSettings();
    }

    /**
     * Convenience alias used throughout games
     */
    playSFX(name) {
        this.playSound(name);
    }

    /**
     * Register simple synthesized fallbacks for commonly used SFX ids
     */
    initDefaultSFX() {
        this.defaultSFX = {
            collect: [
                { freq: 523.25, duration: 0.08, type: 'sine', gain: 0.25 },  // C5
                { freq: 659.25, duration: 0.08, type: 'sine', gain: 0.22 },  // E5
                { freq: 783.99, duration: 0.12, type: 'sine', gain: 0.20 }   // G5
            ],
            win: [
                { freq: 523.25, duration: 0.15, type: 'triangle', gain: 0.28 },  // C5
                { freq: 659.25, duration: 0.15, type: 'triangle', gain: 0.26 },  // E5
                { freq: 783.99, duration: 0.18, type: 'triangle', gain: 0.24 },  // G5
                { freq: 1046.5, duration: 0.25, type: 'triangle', gain: 0.22 }   // C6
            ],
            die: [
                { freq: 392.00, duration: 0.15, type: 'sine', gain: 0.3 },   // G4
                { freq: 349.23, duration: 0.15, type: 'sine', gain: 0.28 },  // F4
                { freq: 293.66, duration: 0.2, type: 'sine', gain: 0.25 },   // D4
                { freq: 246.94, duration: 0.3, type: 'sine', gain: 0.22 }    // B3
            ],
            jump: [
                { freq: 329.63, duration: 0.1, type: 'triangle', gain: 0.28 },  // E4
                { freq: 523.25, duration: 0.12, type: 'triangle', gain: 0.24 }  // C5
            ],
            shoot: [
                { freq: 440.00, duration: 0.04, type: 'sine', gain: 0.22 },    // A4
                { freq: 554.37, duration: 0.06, type: 'sine', gain: 0.18 }     // C#5
            ],
            freeze: [
                { freq: 880.00, duration: 0.08, type: 'sine', gain: 0.25 },    // A5
                { freq: 698.46, duration: 0.12, type: 'sine', gain: 0.22 },    // F5
                { freq: 523.25, duration: 0.16, type: 'sine', gain: 0.18 }     // C5
            ]
        };
    }

    ensureAudioContext() {
        if (this.audioContext) return;

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            this.audioContext = new AudioCtx();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.sfxMuted ? 0 : this.sfxVolume;
            this.masterGain.connect(this.audioContext.destination);
        } catch (err) {
            console.warn('Web Audio not available:', err);
            this.audioContext = null;
        }
    }

    playDefaultSFX(name) {
        if (this.sfxMuted) return;
        const pattern = this.defaultSFX[name] || this.defaultSFX.generic;
        if (!pattern) {
            // Create a basic fallback on first use
            this.defaultSFX.generic = [
                { freq: 440, duration: 0.12, type: 'sine', gain: 0.25 }
            ];
            return this.playDefaultSFX('generic');
        }

        this.ensureAudioContext();
        if (!this.audioContext || !this.masterGain) return;

        // Some browsers require user interaction before resuming the context
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
        }

        let startTime = this.audioContext.currentTime;
        for (const step of pattern) {
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            osc.type = step.type || 'sine';
            osc.frequency.value = step.freq;
            
            const gain = step.gain ?? 0.25;
            const attackTime = step.duration * 0.1;
            const releaseTime = step.duration * 0.3;
            
            // ADSR envelope for smoother sound
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(gain, startTime + attackTime);
            gainNode.gain.setValueAtTime(gain, startTime + step.duration - releaseTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + step.duration);
            
            osc.connect(gainNode);
            gainNode.connect(this.masterGain);
            osc.start(startTime);
            osc.stop(startTime + step.duration + 0.02);
            startTime += step.duration * 0.85; // Slight overlap
        }
    }
}

// Export for use in games
window.AudioManager = AudioManager;
