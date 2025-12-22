/**
 * Bounding Box System - AABB collision detection
 * Inspired by super-mario-master architecture
 * Provides precise rectangular collision detection with side awareness
 */

class BoundingBox {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * Check if this box overlaps with another box
     * @param {BoundingBox} other - The other bounding box
     * @returns {boolean} True if overlapping
     */
    overlaps(other) {
        return this.left < other.right &&
               this.right > other.left &&
               this.top < other.bottom &&
               this.bottom > other.top;
    }

    /**
     * Get which side of this box is closest to another box
     * @param {BoundingBox} other - The other bounding box
     * @returns {string} 'top', 'bottom', 'left', or 'right'
     */
    getSide(other) {
        const overlapTop = this.bottom - other.top;
        const overlapBottom = other.bottom - this.top;
        const overlapLeft = this.right - other.left;
        const overlapRight = other.right - this.left;

        const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);

        if (minOverlap === overlapTop) return 'top';
        if (minOverlap === overlapBottom) return 'bottom';
        if (minOverlap === overlapLeft) return 'left';
        if (minOverlap === overlapRight) return 'right';
    }

    /**
     * Get center point of bounding box
     * @returns {{x: number, y: number}} Center coordinates
     */
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    /**
     * Set center point of bounding box
     * @param {number} cx - Center x
     * @param {number} cy - Center y
     */
    setCenter(cx, cy) {
        this.x = cx - this.width / 2;
        this.y = cy - this.height / 2;
    }

    // Getters for sides
    get top() { return this.y; }
    get bottom() { return this.y + this.height; }
    get left() { return this.x; }
    get right() { return this.x + this.width; }

    // Setters for sides (useful for collision response)
    set top(value) { this.y = value; }
    set bottom(value) { this.y = value - this.height; }
    set left(value) { this.x = value; }
    set right(value) { this.x = value - this.width; }

    /**
     * Get distance to another box center
     * @param {BoundingBox} other
     * @returns {number} Euclidean distance
     */
    distanceTo(other) {
        const dx = this.getCenter().x - other.getCenter().x;
        const dy = this.getCenter().y - other.getCenter().y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Clone this bounding box
     * @returns {BoundingBox} New bounding box with same dimensions
     */
    clone() {
        return new BoundingBox(this.x, this.y, this.width, this.height);
    }

    /**
     * Create a bounding box from circle (for compatibility with ball-based games)
     * @param {number} x - Center x
     * @param {number} y - Center y
     * @param {number} radius - Circle radius
     * @returns {BoundingBox} Square bounding box around circle
     */
    static fromCircle(x, y, radius) {
        return new BoundingBox(x - radius, y - radius, radius * 2, radius * 2);
    }
}

export default BoundingBox;
