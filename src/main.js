require('./prototype.creep');
require('./prototype.spawn');
require('./prototype.tower');
require('./prototype.room');

module.exports.loop = function() {
    console.log('\n'.repeat(30) + '------------------------------------');
    for (let name in Memory.creeps) {
        if (Game.creeps[name] === undefined) {
            delete Memory.creeps[name];
        }
    }

    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        if(creep.checkLife()){
            creep.run();
        }
    }
    
    var towers = _.filter(Game.structures, s => s.structureType == STRUCTURE_TOWER);
    for (let tower of towers) {
        tower.defend();
    }
    
    for (let spawnName in Game.spawns) {
        Game.spawns[spawnName].spawnCreepsIfNecessary();
    }
};