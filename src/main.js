require('./prototype.creep');
require('./prototype.spawn');
require('./prototype.tower');
require('./prototype.room');

module.exports.loop = function () {
  console.log(`${'\n'.repeat(30)}------------------------------------`);
  for (const name in Memory.creeps) {
    if (Game.creeps[name] === undefined) {
      delete Memory.creeps[name];
    }
  }

  Object.values(Game.rooms).map(room => room.refreshMemory());

  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.checkLife()) {
      creep.run();
    }
  }

  const towers = _.filter(Game.structures, s => s.structureType === STRUCTURE_TOWER);
  for (const tower of towers) {
    if (tower) {
      tower.defend();
    }
  }

  for (const spawnName in Game.spawns) {
    Game.spawns[spawnName].spawnCreepsIfNecessary();
  }
};
