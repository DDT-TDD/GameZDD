/**
 * GridBubble - Bubble in the game grid
 * Extends Bubble with grid position tracking and matching logic
 */

import Bubble from './Bubble.js';

class GridBubble extends Bubble {
    constructor(x, y, radius, color, canvas, ctx, gridRow = -1, gridCol = -1) {
        super(x, y, radius, color, canvas, ctx);
        
        this.gridRow = gridRow;
        this.gridCol = gridCol;
        
        // Match detection state
        this.isMatched = false;
        this.matchCount = 0; // Number of connected matches (for scoring)
        
        // Animation
        this.popAnimation = null; // Animation controller
        this.isPopping = false;
        this.popProgress = 0; // 0-1
    }

    /**
     * Get grid position
     * @returns {{row: number, col: number}}
     */
    getGridPosition() {
        return { row: this.gridRow, col: this.gridCol };
    }

    /**
     * Set grid position and update visual position
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @param {number} gridSpacing - Pixel spacing between grid positions
     * @param {number} gridStartY - Starting Y position for grid
     */
    setGridPosition(row, col, gridSpacing, gridStartY = 30) {
        this.gridRow = row;
        this.gridCol = col;
        
        // Calculate visual position (with honeycomb offset)
        const offsetX = (row % 2) * (gridSpacing / 2);
        this.x = col * gridSpacing + gridSpacing / 2 + offsetX;
        this.y = row * gridSpacing + gridSpacing / 2 + gridStartY;
        
        this.updateBounds();
    }

    /**
     * Mark this bubble as part of a match group
     * @param {number} count - Number of connected matches
     */
    markAsMatched(count = 3) {
        this.isMatched = true;
        this.matchCount = count;
        this.isGlowing = true;
        this.glowIntensity = 1;
    }

    /**
     * Unmark bubble as matched
     */
    unmarkAsMatched() {
        this.isMatched = false;
        this.matchCount = 0;
        this.isGlowing = false;
        this.glowIntensity = 0;
    }

    /**
     * Start pop animation
     */
    startPopAnimation(duration = 0.3) {
        this.isPopping = true;
        this.popProgress = 0;
        this.popAnimation = {
            duration: duration,
            elapsed: 0,
            easing: 'easeOut' // Can be 'linear', 'easeIn', 'easeOut', 'easeInOut'
        };
    }

    /**
     * Update pop animation
     * @param {number} deltaTime - Milliseconds elapsed
     * @returns {boolean} True if animation complete
     */
    updatePopAnimation(deltaTime) {
        if (!this.isPopping || !this.popAnimation) {
            return true;
        }

        this.popAnimation.elapsed += deltaTime / 1000;
        this.popProgress = this.popAnimation.elapsed / this.popAnimation.duration;

        if (this.popProgress >= 1) {
            this.popProgress = 1;
            return true; // Animation complete
        }

        return false; // Still animating
    }

    /**
     * Draw bubble with pop animation state
     * Overrides parent draw method
     */
    draw() {
        if (this.isPopping && this.popProgress > 0) {
            // Apply pop animation scale
            const scale = 1 - this.popProgress; // Shrink from 1 to 0
            const animRadius = this.radius * scale;
            
            if (animRadius <= 0) return; // Don't draw if fully popped

            // Fade out transparency
            const oldAlpha = this.ctx.globalAlpha;
            this.ctx.globalAlpha = 1 - this.popProgress;

            // Save and scale
            this.ctx.save();
            this.ctx.translate(this.x, this.y);
            this.ctx.scale(scale, scale);
            this.ctx.translate(-this.x, -this.y);

            // Draw bubble at scaled size
            super.draw();

            this.ctx.restore();
            this.ctx.globalAlpha = oldAlpha;
        } else {
            // Normal draw
            super.draw();
        }
    }

    /**
     * Check if adjacent to another grid bubble
     * @param {GridBubble} other
     * @param {number} gridSpacing
     * @returns {boolean}
     */
    isAdjacentTo(other, gridSpacing) {
        // Honeycomb grid adjacency check
        const rowDiff = Math.abs(this.gridRow - other.gridRow);
        const colDiff = Math.abs(this.gridCol - other.gridCol);

        if (rowDiff > 1) return false;
        if (colDiff > 1) return false;
        if (rowDiff === 0 && colDiff === 0) return false; // Same position

        // Honeycomb specific logic
        if (rowDiff === 1) {
            // Check diagonal adjacency based on row parity
            const rowParity = this.gridRow % 2;
            const otherRowParity = other.gridRow % 2;
            
            if (rowParity === otherRowParity) {
                return colDiff <= 1;
            } else {
                // Diagonal offset based on row parity
                return colDiff <= 1;
            }
        }

        return colDiff <= 1;
    }

    /**
     * Clone this grid bubble
     * @returns {GridBubble}
     */
    clone() {
        const bubble = new GridBubble(
            this.x, 
            this.y, 
            this.radius, 
            this.color, 
            this.canvas, 
            this.ctx, 
            this.gridRow, 
            this.gridCol
        );
        if (this.isMatched) {
            bubble.markAsMatched(this.matchCount);
        }
        return bubble;
    }
}

export default GridBubble;
