/**
 * Trait System - Base class for composable game behaviors
 * Inspired by super-mario-master architecture
 * Allows games to compose complex behavior without deep inheritance
 */

class Trait {
    constructor(name) {
        this.name = name;
    }

    // Called when another entity collides with this one
    collides(entity, candidate) {
        // Override in subclasses
    }

    // Called when entity is obstructed during movement
    obstruct(entity, side, match) {
        // Override in subclasses
        // side: 'top', 'bottom', 'left', 'right'
        // match: the entity/tile causing obstruction
    }

    // Called after all entities updated (for cleanup/finalization)
    finalize(entity) {
        // Override in subclasses
    }

    // Main update loop for this behavior
    update(entity, gameContext, level) {
        // Override in subclasses
    }
}

// Trait names for easy lookup
Trait.MOVEMENT = 'movement';
Trait.COLLISION = 'collision';
Trait.PHYSICS = 'physics';
Trait.RENDER = 'render';
Trait.ANIMATION = 'animation';
Trait.AI = 'ai';

export default Trait;
