/**
 * Bubble Class - Base class for all bubble types
 * Inspired by puzzle-bubble-main Ball.js pattern
 * Provides common bubble rendering and properties
 */

import BoundingBox from '../../engine/BoundingBox.js';

class Bubble {
    constructor(x, y, radius, color, canvas, ctx) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Collision detection
        this.bounds = BoundingBox.fromCircle(x, y, radius);
        
        // Visual properties
        this.isGlowing = false;
        this.glowIntensity = 0;
    }

    /**
     * Draw bubble with glossy effect
     * Based on reference implementation visual style
     */
    draw() {
        // Main gradient fill
        const gradient = this.ctx.createRadialGradient(
            this.x - this.radius * 0.3, 
            this.y - this.radius * 0.3, 
            this.radius * 0.1,
            this.x, 
            this.y, 
            this.radius
        );
        
        // Color stops: highlight -> mid-tone -> shadow
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.3, this.color);
        gradient.addColorStop(0.8, this.color);
        
        // Shadow color (darker version)
        const shadowColor = this.darkenColor(this.color, 0.4);
        gradient.addColorStop(1, shadowColor);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Glossy shine effect
        const shineGradient = this.ctx.createRadialGradient(
            this.x - this.radius * 0.35, 
            this.y - this.radius * 0.35, 
            0,
            this.x - this.radius * 0.35, 
            this.y - this.radius * 0.35, 
            this.radius * 0.5
        );
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = shineGradient;
        this.ctx.beginPath();
        this.ctx.arc(
            this.x - this.radius * 0.25, 
            this.y - this.radius * 0.25, 
            this.radius * 0.4, 
            0, 
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Subtle outline
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Glow effect if activated
        if (this.isGlowing && this.glowIntensity > 0) {
            this.ctx.strokeStyle = `rgba(255, 215, 0, ${this.glowIntensity * 0.6})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    /**
     * Update bounding box position
     * Called after any position change
     */
    updateBounds() {
        this.bounds = BoundingBox.fromCircle(this.x, this.y, this.radius);
    }

    /**
     * Check if this bubble collides with another
     * @param {Bubble} other
     * @returns {boolean}
     */
    collidesWith(other) {
        const dist = Math.hypot(this.x - other.x, this.y - other.y);
        return dist <= this.radius + other.radius;
    }

    /**
     * Get distance to another bubble
     * @param {Bubble} other
     * @returns {number}
     */
    distanceTo(other) {
        return Math.hypot(this.x - other.x, this.y - other.y);
    }

    /**
     * Darken a hex color by a percentage
     * @param {string} color - Hex color (#RRGGBB)
     * @param {number} amount - Darken amount (0-1)
     * @returns {string} Darkened hex color
     */
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }

    /**
     * Clone this bubble
     * @returns {Bubble}
     */
    clone() {
        return new Bubble(this.x, this.y, this.radius, this.color, this.canvas, this.ctx);
    }
}

export default Bubble;
