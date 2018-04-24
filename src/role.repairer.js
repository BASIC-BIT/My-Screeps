const roleBuilder = require('./role.builder');

module.exports = {
  // a function to run the logic for this role
  /** @param {Creep} creep */
  run(creep) {
    // if creep is trying to repair something but has no energy left
    if (creep.memory.working === true && creep.carry.energy === 0) {
      // switch state
      creep.memory.working = false;
    } else if (!creep.memory.working && creep.carry.energy === creep.carryCapacity) {
      // switch state
      creep.memory.working = true;
    }

    // if creep is supposed to repair something
    if (creep.memory.working === true) {
      // find closest structure with less than max hits
      // Exclude walls because they have way too many max hits and would keep
      // our repairers busy forever. We have to find a solution for that later.
      const structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        // the second argument for findClosestByPath is an object which takes
        // a property called filter which can be a function
        // we use the arrow operator to define it
        filter: s => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL,
      });

      // if we find one
      if (structure) {
        // try to repair it, if it is out of range
        if (creep.repair(structure) === ERR_NOT_IN_RANGE) {
          // move towards it
          creep.moveTo(structure);
        }
      } else {
        // look for construction sites
        roleBuilder.run(creep);
      }
    } else {
      creep.getEnergy(true, true);
    }
  },
};
