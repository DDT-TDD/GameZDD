/**
 * ProjectileBubble - Active bubble fired by shooter
 * Extends Bubble with physics and motion
 * Inspired by puzzle-bubble-main ProyectileBall.js
 */

import Bubble from './Bubble.js';

class ProjectileBubble extends Bubble {
    constructor(x, y, radius, color, canvas, ctx, shooter) {
        super(x, y, radius, color, canvas, ctx);
        
        this.shooter = shooter; // Reference to shooter for angle/speed
        this.vx = 0; // Velocity X
        this.vy = 0; // Velocity Y
        this.isMoving = false;
        this.shotSpeed = 5; // Default speed, can be overridden
        
        // Physics
        this.maxDistance = 600; // Max travel distance before disappear
        this.distanceTraveled = 0;
    }

    /**
     * Initialize projectile with shooter angle and speed
     * @param {number} angle - Launch angle in radians
     * @param {number} speed - Launch speed
     */
    launch(angle, speed) {
        this.shotSpeed = speed;
        this.vx = Math.cos(angle) * speed;
        this.vy = -Math.sin(angle) * speed; // Negative for upward
        this.isMoving = true;
        this.distanceTraveled = 0;
    }

    /**
     * Update projectile position and check collisions
     * Returns true if should be removed from game
     * @returns {boolean} Should remove this projectile
     */
    update() {
        if (!this.isMoving) {
            return false;
        }

        // Update position
        const oldX = this.x;
        const oldY = this.y;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Track distance traveled
        const distMoved = Math.hypot(this.x - oldX, this.y - oldY);
        this.distanceTraveled += distMoved;

        // Check if reached max distance
        if (this.distanceTraveled >= this.maxDistance) {
            return true; // Remove this projectile
        }

        // Bounce off walls
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -1;
        } else if (this.x + this.radius > this.canvas.width) {
            this.x = this.canvas.width - this.radius;
            this.vx *= -1;
        }

        // Check if hit ceiling (stop at top)
        if (this.y - this.radius < 30) {
            this.y = this.radius + 30;
            this.isMoving = false;
            return false; // Projectile stops moving but stays in play
        }

        // Update bounds for collision detection
        this.updateBounds();

        return false; // Keep this projectile
    }

    /**
     * Stop the projectile
     */
    stop() {
        this.isMoving = false;
        this.vx = 0;
        this.vy = 0;
    }

    /**
     * Get trajectory visualization points
     * For drawing aim assist line
     * @param {number} stepSize - Distance between points (default 5)
     * @returns {Array<{x: number, y: number}>} Points along trajectory
     */
    getTrajectoryPoints(stepSize = 5) {
        const points = [];
        let x = this.x;
        let y = this.y;
        let vx = this.vx || (Math.cos(this.shooter.angle) * this.shotSpeed);
        let vy = this.vy || (-Math.sin(this.shooter.angle) * this.shotSpeed);
        let distance = 0;

        points.push({ x: Math.round(x), y: Math.round(y) });

        while (distance < this.maxDistance && y > 0) {
            x += vx;
            y += vy;
            distance += stepSize;

            // Wall bounce simulation
            if (x - this.radius < 0) {
                x = this.radius;
                vx *= -1;
            } else if (x + this.radius > this.canvas.width) {
                x = this.canvas.width - this.radius;
                vx *= -1;
            }

            // Stop at ceiling
            if (y < 30 + this.radius) {
                points.push({ x: Math.round(x), y: Math.round(y + this.radius + 30) });
                break;
            }

            points.push({ x: Math.round(x), y: Math.round(y) });
        }

        return points;
    }

    /**
     * Clone this projectile
     * @returns {ProjectileBubble}
     */
    clone() {
        return new ProjectileBubble(this.x, this.y, this.radius, this.color, this.canvas, this.ctx, this.shooter);
    }
}

export default ProjectileBubble;
