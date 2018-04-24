const roleUpgrader = require('./role.upgrader');

module.exports = {
  // a function to run the logic for this role
  /** @param {Creep} creep */
  run(creep) {
    // if target is defined and creep is not in target room
    if (creep.memory.target && creep.room.name !== creep.memory.target) {
      // find exit to target room
      const exit = creep.room.findExitTo(creep.memory.target);
      // move to exit
      creep.moveTo(creep.pos.findClosestByRange(exit));
      // return the function to not do anything else
      return;
    }

    // if creep is trying to complete a constructionSite but has no energy left
    if (creep.memory.working === true && creep.carry.energy === 0) {
      // switch state
      creep.memory.working = false;
    } else if (!creep.memory.working && creep.carry.energy === creep.carryCapacity) {
      // switch state
      creep.memory.working = true;
    }

    // if creep is supposed to complete a constructionSite
    if (creep.memory.working === true) {
      // find closest constructionSite
      const constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
      // if one is found
      if (constructionSite) {
        // try to build, if the constructionSite is not in range
        if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
          // move towards the constructionSite
          creep.moveTo(constructionSite);
        }
      } else {
        // go upgrading the controller
        roleUpgrader.run(creep);
      }
    } else {
      creep.getEnergy(true, true);
    }
  },
};
