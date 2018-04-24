// create a new function for StructureTower
StructureTower.prototype.defend = function () {
  if (this.pos) {
    // find closes hostile creep
    const target = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    // if one is found...
    if (target) {
      // ...FIRE!
      this.attack(target);
    }
  }
};
