const listOfRoles = ['harvester', 'upgrader', 'builder', 'longDistanceHarvester', 'lorry', 'repairer', 'claimer'];

const randomName = () => Math.random().toString(36).substring(2, 7);

StructureSpawn.prototype.getAvailableEnergy = function () {
  return this.energy + _.sum(Game.spawns.Spawn1.room.find(FIND_MY_STRUCTURES, {
    filter: { structureType: STRUCTURE_EXTENSION },
  }).map(extension => extension.energy));
};

StructureSpawn.prototype.spawnCreepWithMemory = function (body, memory) {
  return this.spawnCreep(body, randomName(), {
    memory: {
      ...memory,
      home: this.room.name,
    },
  });
};

// create a new function for StructureSpawn
StructureSpawn.prototype.spawnCreepsIfNecessary =
  function () {
    console.log(`Energy (Room ${this.room.name}):  ${this.getAvailableEnergy()}`);
    this.memory.minCreeps = {
      harvester: 4,
      upgrader: 3,
      builder: 3,
      lorry: 2,
      longDistanceHarvester: 0,
      repairer: 2,
      claimer: 0,
    };
    this.memory.minLongDistanceHarvesters = {
      W8N2: 4, W7N3: 4, W6N3: 2, W7N4: 2, W7N2: 2,
    };
    const { room } = this;
    const creepsInRoom = room.find(FIND_MY_CREEPS);

    const numberOfCreeps = {};
    for (const role of listOfRoles) {
      numberOfCreeps[role] = _.sum(creepsInRoom, c => c.memory.role === role);
    }
    for (const pair in numberOfCreeps) console.log(`${pair}: ${numberOfCreeps[pair]} / ${this.memory.minCreeps[pair]}`);
    const maxEnergy = room.energyCapacityAvailable;
    let name;

    const renewTargets = this.pos.findInRange(FIND_MY_CREEPS, 1)
      .filter(target => target.ticksToLive < 1450).map(target => this.renewCreep(target));
    if (renewTargets.length > 0) {
      return;
    }

    if (numberOfCreeps.harvester === 0 && numberOfCreeps.lorry === 0) {
      if (numberOfCreeps.miner > 0 ||
        (room.storage && room.storage.store[RESOURCE_ENERGY] >= 150 + 550)) {
        name = this.createLorry(150);
      } else {
        // create a harvester because it can work on its own
        name = this.createCustomCreep(room.energyAvailable, 'harvester');
      }
    } else {
      // check if all sources have miners
      const sources = room.find(FIND_SOURCES);
      // iterate over all sources
      for (const source of sources) {
        // if the source has no miner
        if (!_.some(creepsInRoom, c => c.memory.role === 'miner' && c.memory.sourceId === source.id)) {
          // check whether or not the source has a container
          /** @type {Array.StructureContainer} */
          const containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: s => s.structureType === STRUCTURE_CONTAINER,
          });
          // if there is a container next to the source
          if (containers.length > 0) {
            // spawn a miner
            name = this.createMiner(source.id);
            break;
          }
        }
      }
    }

    // if none of the above caused a spawn command check for other roles
    if (name === undefined) {
      for (const role of listOfRoles) {
        // check for claim order
        if (role === 'claimer' && this.memory.claimRoom) {
          // try to spawn a claimer
          name = this.createClaimer(this.memory.claimRoom);
          // if that worked
          if (name && _.isString(name)) {
            // delete the claim order
            delete this.memory.claimRoom;
          }
        } else if (numberOfCreeps[role] < this.memory.minCreeps[role]) {
          if (role === 'lorry') {
            name = this.createLorry(150);
          } else {
            name = this.createCustomCreep(maxEnergy, role);
          }
          break;
        }
      }
    }

    // this.checkLongDistanceHarvesters(name);

    // print name to console if spawning was a success
    // if (name && _.isString(name)) {
    //   console.log(`${this.name} spawned new creep: ${name} (${Game.creeps[name].memory.role})`);
    //   for (const role of listOfRoles) {
    //     console.log(`${role}: ${numberOfCreeps[role]}`);
    //   }
    //   for (const roomName in numberOfLongDistanceHarvesters) {
    //     console.log(`LongDistanceHarvester${roomName}: /
    //     ${numberOfLongDistanceHarvesters[roomName]}`);
    //   }
    // }
  };

// create a new function for StructureSpawn
StructureSpawn.prototype.createCustomCreep = function (energy, roleName) {
  // create a balanced body as big as possible with the given energy
  let numberOfParts = Math.floor(energy / 200);
  // make sure the creep is not too big (more than 50 parts)
  numberOfParts = Math.min(numberOfParts, Math.floor(50 / 3));
  const body = [];
  for (let i = 0; i < numberOfParts; i++) {
    body.push(WORK);
  }
  for (let i = 0; i < numberOfParts; i++) {
    body.push(CARRY);
  }
  for (let i = 0; i < numberOfParts; i++) {
    body.push(MOVE);
  }
  // create creep with the created body and the given role
  return this.spawnCreepWithMemory(body, { role: roleName, working: false });
};

// StructureSpawn.prototype.checkLongDistanceHarvesters = function (name) {
// let rooms = {};
// if (name === undefined) {
//   for (let roomName in this.memory.minLongDistanceHarvesters) {
//     if (Game.rooms[roomName] && Game.rooms[roomName].spawns) { //can see room
//       rooms[roomName] = Game.rooms[roomName].spawns
//         .map((spawn, spawnIndex) => _.sum(Game.creeps, (c) =>
//           c.memory.role === 'longDistanceHarvester' &&
//           c.memory.target === roomName &&
//           c.memory.spawnIndex === spawnIndex));
//     } else {
//       rooms[roomName] = ["WhateverIOnlyNeedOneSpawn"]
//         .map((spawn, spawnIndex) => _.sum(Game.creeps, (c) =>
//           c.memory.role === 'longDistanceHarvester' &&
//           c.memory.target === roomName &&
//           c.memory.spawnIndex === spawnIndex));
//     }
//   }
//   Object.entries(rooms).map(([key, obj]) => console.log(key + ': ' + obj));
//   Object.entries(rooms)
//     .map(([roomName, spawns]) => Object.entries(spawns).forEach(([spawnIndex, harvesters]) => {
//       if (this.memory.minLongDistanceHarvesters[roomName] > harvesters) {
//         name = this.createLongDistanceHarvester(
//           Math.min(this.getAvailableEnergy(), 500),
//           2, this.room.name, roomName, spawnIndex)
//       }
//     }));
// }
// };

// create a new function for StructureSpawn
StructureSpawn.prototype.createLongDistanceHarvester =
  function (energy, numberOfWorkParts, home, target, sourceIndex) {
    // create a body with the specified number of WORK parts and one MOVE part per non-MOVE part
    const body = [];
    for (let i = 0; i < numberOfWorkParts; i++) {
      body.push(WORK);
    }

    // 150 = 100 (cost of WORK) + 50 (cost of MOVE)
    energy -= 150 * numberOfWorkParts;

    let numberOfParts = Math.floor(energy / 100);
    // make sure the creep is not too big (more than 50 parts)
    numberOfParts = Math.min(numberOfParts, Math.floor((50 - (numberOfWorkParts * 2)) / 2));
    for (let i = 0; i < numberOfParts; i++) {
      body.push(CARRY);
    }
    for (let i = 0; i < numberOfParts + numberOfWorkParts; i++) {
      body.push(MOVE);
    }

    // create creep with the created body
    return this.spawnCreepWithMemory(body, {
      role: 'longDistanceHarvester',
      home,
      target,
      sourceIndex,
      working: false,
    });
  };

// create a new function for StructureSpawn
StructureSpawn.prototype.createClaimer =
  function (target) {
    return this.spawnCreepWithMemory([CLAIM, MOVE], { role: 'claimer', target });
  };

// create a new function for StructureSpawn
StructureSpawn.prototype.createMiner =
  function (sourceId) {
    return this.spawnCreepWithMemory([WORK, WORK, WORK, WORK, WORK, MOVE], { role: 'miner', sourceId });
  };

// create a new function for StructureSpawn
StructureSpawn.prototype.createLorry =
  function (energy) {
    // create a body with twice as many CARRY as MOVE parts
    let numberOfParts = Math.floor(energy / 150);
    // make sure the creep is not too big (more than 50 parts)
    numberOfParts = Math.min(numberOfParts, Math.floor(50 / 3));
    const body = [];
    for (let i = 0; i < numberOfParts * 2; i++) {
      body.push(CARRY);
    }
    for (let i = 0; i < numberOfParts; i++) {
      body.push(MOVE);
    }

    // create creep with the created body and the role 'lorry'
    return this.spawnCreepWithMemory(body, { role: 'lorry', working: false });
  };
