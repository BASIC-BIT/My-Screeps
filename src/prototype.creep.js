const roles = {
  harvester: require('./role.harvester'),
  upgrader: require('./role.upgrader'),
  builder: require('./role.builder'),
  longDistanceHarvester: require('./role.longDistanceHarvester'),
  lorry: require('./role.lorry'),
  repairer: require('./role.repairer'),
  claimer: require('./role.claimer'),
};

Creep.prototype.run =
  function () {
    roles[this.memory.role].run(this);
  };

// Manage renewing at a source - return true if should work
Creep.prototype.checkLife = function () {
  if (this.ticksToLive < 500) {
    this.memory.renewing = true;
  }
  if (this.ticksToLive > 1400 || (this.room.name === 'W8N3' && Game.spawns.Spawn1.getAvailableEnergy() < 250)) {
    this.memory.renewing = false;
  }
  if (this.memory.renewing) {
    if (this.room.name === 'W8N3') {
      const spawn = Game.spawns.Spawn1;
      this.moveTo(spawn);
    } else {
      const exit = this.room.findExitTo('W8N3');
      // move to exit
      this.moveTo(this.pos.findClosestByPath(exit));
    }
  }
  return !this.memory.renewing;
};

/** @function
 @param {bool} useContainer
 @param {bool} useSource */
Creep.prototype.getEnergy =
  function (useContainer, useSource) {
    /** @type {StructureContainer} */
    let container;
    let source;
    // if the Creep should look for containers
    if (useContainer) {
      // find closest container
      container = this.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s => (s.structureType === STRUCTURE_CONTAINER ||
          s.structureType === STRUCTURE_STORAGE) &&
          s.store[RESOURCE_ENERGY] > 0,
      });
      // if one was found
      if (container) {
        // try to withdraw energy, if the container is not in range
        if (this.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          // move towards it
          this.moveTo(container);
        }
      }
    }
    // if no container was found and the Creep should look for Sources
    if (container === undefined && useSource) {
      // find closest source
      source = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE, { filter: s => s.energy > 0 });

      // try to harvest energy, if the source is not in range
      if (this.harvest(source) === ERR_NOT_IN_RANGE) {
        // move towards it
        this.moveTo(source);
      }
    }

    if (container === undefined && source === undefined) {
      this.moveTo(Game.flags.holding.pos);
    }
  };
