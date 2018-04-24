module.exports = {
  // a function to run the logic for this role
  /** @param {Creep} creep */
  run(creep) {
    // if creep is bringing energy to a structure but has no energy left
    if (creep.memory.working === true && creep.carry.energy === 0) {
      // switch state
      creep.memory.working = false;
    } else if (!creep.memory.working && creep.carry.energy === creep.carryCapacity) {
      // switch state
      creep.memory.working = true;
    }

    // if creep is supposed to transfer energy to a structure
    if (creep.memory.working === true) {
      // find closest spawn, extension or tower which is not full
      let structure = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
        // the second argument for findClosestByPath is an object which takes
        // a property called filter which can be a function
        // we use the arrow operator to define it
        filter: s => (s.structureType === STRUCTURE_SPAWN
          || s.structureType === STRUCTURE_EXTENSION
          || s.structureType === STRUCTURE_TOWER)
          && s.energy < s.energyCapacity,
      });

      if (structure === undefined) {
        structure = creep.room.storage;
      }

      // if we found one
      if (structure) {
        // try to transfer energy, if it is not in range
        if (creep.transfer(structure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          // move towards it
          creep.moveTo(structure);
        }
      }
    } else {
      creep.getEnergy(false, true);
    }
  },
};
