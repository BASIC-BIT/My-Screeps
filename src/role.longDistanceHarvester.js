module.exports = {
  // a function to run the logic for this role
  /** @param {Creep} creep */
  run(creep) {
    // if creep is bringing energy to a structure but has no energy left
    if (creep.carry.energy === 0) {
      // switch state
      creep.memory.working = false;
    } else if (creep.carry.energy === creep.carryCapacity) {
      // switch state
      creep.memory.working = true;
    }

    // if creep is supposed to transfer energy to a structure
    if (creep.memory.working === true) {
      // if in home room
      if (creep.room.name === creep.memory.home) {
        // find closest spawn, extension or tower which is not full
        let structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          // the second argument for findClosestByPath is an object which takes
          // a property called filter which can be a function
          // we use the arrow operator to define it
          filter: s => ((s.structureType === STRUCTURE_SPAWN
            || s.structureType === STRUCTURE_EXTENSION
            || s.structureType === STRUCTURE_TOWER)
            && s.energy < s.energyCapacity) ||
            (s.structureType === STRUCTURE_CONTAINER
              && s.store[RESOURCE_ENERGY] < s.storeCapacity),
        });

        if (structure === undefined) {
          structure = creep.room.storage;
        }

        if (structure === undefined) {
          structure = Game.flags.holding.pos;
        }

        // if we found one
        if (structure) {
          // try to transfer energy, if it is not in range
          if (creep.transfer(structure, RESOURCE_ENERGY) !== OK) {
            // move towards it
            creep.moveTo(structure);
          }
        }
      } else {
        // find exit to home room
        const exit = creep.room.findExitTo(creep.memory.home);
        // and move to exit
        creep.moveTo(creep.pos.findClosestByPath(exit));
      }
    } else if (creep.room.name === creep.memory.target) {
      // find source
      const source = creep.room.find(FIND_SOURCES)[creep.memory.sourceIndex];
      // try to harvest energy, if the source is not in range
      if (creep.harvest(source) !== OK) {
        // move towards the source
        creep.moveTo(source);
      }
    } else {
      // find exit to target room
      const exit = creep.room.findExitTo(creep.memory.target);
      // move to exit
      creep.moveTo(creep.pos.findClosestByPath(exit));
    }
  },
};
