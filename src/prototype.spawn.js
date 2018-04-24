/* eslint-disable no-unused-vars */
const listOfRoles = ['harvester', 'upgrader', 'builder', 'longDistanceHarvester', 'lorry', 'repairer', 'claimer', 'reserver'];

const randomName = () => Math.random().toString(36).substring(2, 7);

StructureSpawn.prototype.spawnCreepWithMemory = function (body, memory) {
  return this.spawnCreep(body, randomName(), {
    memory: {
      ...memory,
      home: this.room.name,
    },
  });
};

StructureSpawn.prototype.hasRenewRoom = function () {
  return this.pos.findInRange(FIND_MY_CREEPS, 1).length < 5;
};

StructureSpawn.prototype.shouldRenewCreep = function () {
  return this.pos.findInRange(FIND_MY_CREEPS, 1).length < 5;
};

// create a new function for StructureSpawn
StructureSpawn.prototype.spawnCreepsIfNecessary =
  function () {
    this.memory.minCreeps = {
      harvester: 4,
      upgrader: 3,
      builder: 2,
      lorry: 0,
      longDistanceHarvester: 0,
      repairer: 2,
      claimer: 0,
      reserver: 0,
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

    const healTarget = this.pos.findInRange(FIND_MY_CREEPS, 1)
      .filter(target => target.ticksToLive < 1450)
      .map(target => this.renewCreep(target))
      .find(response => response === OK);

    if (healTarget) {
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

    if (name === undefined) {
      this.checkReservers(name);
    }

    if (name === undefined) {
      this.checkLongDistanceHarvesters(name);
    }


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

StructureSpawn.prototype.checkLongDistanceHarvesters = function (name) {
  Object.entries(this.memory.minLongDistanceHarvesters)
    .forEach(([roomName, minHarvestersPerSpawn]) => {
      if (Game.rooms[roomName]) {
        Game.rooms[roomName].find(FIND_SOURCES).forEach((source, sourceIndex) => {
          if (minHarvestersPerSpawn > Object.values(Game.creeps).filter(creep => (
            creep.memory.role === 'longDistanceHarvester' &&
            creep.memory.target === roomName &&
            creep.memory.sourceIndex === sourceIndex
          )).length) {
            this.createLongDistanceHarvester(
              Math.min(this.room.energyAvailable, 500),
              2, this.room.name, roomName, sourceIndex,
            );
          }
        });
      } else if (minHarvestersPerSpawn >
        Object.values(Game.creeps).filter(creep => (
          creep.memory.role === 'longDistanceHarvester' &&
          creep.memory.target === roomName &&
          creep.memory.sourceIndex === 0
        )).length) {
        this.createLongDistanceHarvester(
          Math.min(Math.max(250, this.room.energyAvailable), 500),
          2, this.room.name, roomName, 0,
        );
      }
    });
};

StructureSpawn.prototype.checkReservers = function (name) {
  Object.entries(this.memory.minLongDistanceHarvesters)
    .forEach(([roomName, harvesters]) => {
      if (Object.values(Game.creeps).filter(creep => (
        creep.memory.role === 'reserver' &&
        creep.memory.target === roomName
      )).length === 0) {
        this.createReserver(roomName);
      }
    });
};
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

StructureSpawn.prototype.createReserver =
  function (target) {
    return this.spawnCreepWithMemory([CLAIM, MOVE], { role: 'reserver', target });
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
