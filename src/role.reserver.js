module.exports = {
  // a function to run the logic for this role
  run(creep) {
    // if in target room
    if (creep.room.name !== creep.memory.target) {
      // find exit to target room
      const exit = creep.room.findExitTo(creep.memory.target);
      // move to exit
      creep.moveTo(creep.pos.findClosestByRange(exit));
    } else {
      // try to claim controller
      const response = creep.reserveController(creep.room.controller);
      if (response !== OK) {
        // move towards the controller
        creep.moveTo(creep.room.controller);
      }
    }
  },
};
