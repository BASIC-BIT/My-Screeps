// create a new function for StructureTower
StructureTower.prototype.defend = function () {
  if (this.pos) {
    // find closes hostile creep
    let target = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    // if one is found...
    if (target) {
      // ...FIRE!
      this.attack(target);
      return;
    }

    target = this.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: creep => creep.hits < creep.hitsMax,
    });

    if (target) {
      this.heal(target);
      return;
    }

    target = this.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: structure => structure.hits < structure.hitsMax,
    });

    if (target) {
      this.repair(target);
    }
  }
};
