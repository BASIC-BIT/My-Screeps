/* eslint-disable no-unused-vars */
const listOfRoles = ['repairer', 'harvester', 'upgrader', 'builder', 'longDistanceHarvester', 'lorry', 'claimer', 'reserver'];

const randomName = () => Math.random().toString(36).substring(2, 7);
const MAX_CREEPS_RENEWING_COUNT = 6;

StructureSpawn.prototype.spawnWorker = function (role, memory) {
  const energy = 500;

  return this.createCustomCreep(energy, {
    ...memory,
    role,
    home: this.room.name,
  });
};
StructureSpawn.prototype.spawnCreepWithMemory = function (body, memory) {
  return this.spawnCreep(body, randomName(), {
    memory: {
      ...memory,
      home: this.room.name,
      working: false,
      mom: this,
    },
  });
};

StructureSpawn.prototype.setStagingForRenewingCreeps = function () {
  this.room.find(FIND_MY_CREEPS)
    .filter(creep => creep.memory.renewing)
    .forEach((creep) => { creep.memory.staging = true; });


  this.room.find(FIND_MY_CREEPS)
    .filter(creep => creep.memory.renewing)
    .sort((a, b) => a.ticksToDecay < b.ticksToDecay)
    .forEach((creep, index) => {
      if (index < MAX_CREEPS_RENEWING_COUNT) {
        creep.memory.staging = false;
      }
    });
};

StructureSpawn.prototype.getEnergyForCreep = function () {
  return Math.min(
    Math.max(this.room.energyCapacityAvailable / 2, 250),
    Math.max((this.room.energyAvailable * 2) / 3, 500),
  );
};

// create a new function for StructureSpawn
StructureSpawn.prototype.spawnCreepsIfNecessary =
  function () {
    this.memory.minCreeps = {
      harvester: 6,
      upgrader: 2,
      builder: 2,
      lorry: 4,
      longDistanceHarvester: 0,
      repairer: 2,
      claimer: 0,
      reserver: 0,
    };
    this.memory.minLongDistanceHarvesters = {
      W8N2: 6, W7N3: 6, W6N3: 4, W7N4: 4, W7N2: 4,
    };
    const { room } = this;
    const creepsInRoom = room.find(FIND_MY_CREEPS);

    const numberOfCreeps = {};
    for (const role of listOfRoles) {
      numberOfCreeps[role] = _.sum(creepsInRoom, c => c.memory.role === role);
    }
    for (const pair in numberOfCreeps) console.log(`${pair}: ${numberOfCreeps[pair]} / ${this.memory.minCreeps[pair]}`);
    let creepCreateResponse;

    const healTargets = this.pos.findInRange(FIND_MY_CREEPS, 1)
      .filter(target => target.ticksToLive < 1450)
      .map(target => ({
        target,
        response: this.renewCreep(target),
      })).filter(target => target.response === OK)
      .map(target => target.target);

    const targetWithLowestHealth = healTargets.reduce((prev, cur) =>
      (((cur && !prev) || (cur && prev && cur.ticksToDecay < prev.ticksToDecay))
        ? cur : prev), undefined);

    if (targetWithLowestHealth) {
      console.log(`Healing (${this.name}): ${targetWithLowestHealth.name}`);
      this.renewCreep(targetWithLowestHealth);
      return;
    }

    if (numberOfCreeps.harvester === 0 && numberOfCreeps.lorry === 0) {
      if (numberOfCreeps.miner > 0 ||
        (room.storage && room.storage.store[RESOURCE_ENERGY] >= 150 + 550)) {
        creepCreateResponse = this.createLorry(150);
      } else {
        // create a harvester because it can work on its own
        creepCreateResponse = this.createCustomCreep(room.energyAvailable, 'harvester');
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
            creepCreateResponse = this.createMiner(source.id);
            break;
          }
        }
      }
    }

    // if none of the above caused a spawn command check for other roles
    if (creepCreateResponse !== OK) {
      for (const role of listOfRoles) {
        // check for claim order
        if (role === 'claimer' && this.memory.claimRoom) {
          // try to spawn a claimer
          creepCreateResponse = this.createClaimer(this.memory.claimRoom);
          // if that worked
          if (creepCreateResponse && _.isString(creepCreateResponse)) {
            // delete the claim order
            delete this.memory.claimRoom;
          }
        } else if (numberOfCreeps[role] < this.memory.minCreeps[role]) {
          if (role === 'lorry') {
            creepCreateResponse = this.createLorry(350);
          } else {
            creepCreateResponse = this.createCustomCreep(this.getEnergyForCreep(), role);
          }
          break;
        }
      }
    }

    if (creepCreateResponse !== OK) {
      creepCreateResponse = this.checkReservers();
    }

    if (creepCreateResponse !== OK) {
      creepCreateResponse = this.checkLongDistanceHarvesters(creepCreateResponse);
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
StructureSpawn.prototype.createCustomCreep = function (energy, role, memory) {
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
  return this.spawnCreepWithMemory(body, { ...memory, role });
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
              this.getEnergyForCreep(),
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
          this.getEnergyForCreep(),
          2, this.room.name, roomName, 0,
        );
      }
    });
};

StructureSpawn.prototype.checkReservers = function () {
  let spawnTargetRoom;
  Object.entries(this.memory.minLongDistanceHarvesters)
    .filter(([roomName, harvesters]) =>
      Game.map.getRoomLinearDistance(roomName, this.room.name) === 1)
    .forEach(([roomName, harvesters]) => {
      if (Object.values(Game.creeps).filter(creep => (
        creep.memory.role === 'reserver' &&
          creep.memory.target === roomName
      )).length < 2) {
        spawnTargetRoom = roomName;
      }
    });
  if (spawnTargetRoom) {
    return this.createReserver(spawnTargetRoom);
  }
  return undefined;
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
