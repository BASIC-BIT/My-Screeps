Room.prototype.refreshMemory = function () {
  this.memory.counter = this.memory.counter ? this.memory.counter + 1 : 1;
  this.setup();
  this.refreshEnergyWaste();
  if (this.memory.counter % 300 > 50) {
    this.refreshPositions();
  }
  if (this.find(FIND_MY_STRUCTURES)
    .filter(structure => structure.structureType === STRUCTURE_SPAWN).length > 0) {
    if (this.memory.counter % 10 === 1) {
      // this.getNextRoadPosition();
    }
    if (this.memory.counter % 300 === 25) {
      this.createBestNewRoad();
      this.getNextRoadPosition();
    }
  }
  this.printInfo();
};
Room.prototype.createBestNewRoad = function () {
  if (this.memory.nextRoadPosition) {
    this.createConstructionSite(
      this.memory.nextRoadPosition.x,
      this.memory.nextRoadPosition.y,
      STRUCTURE_ROAD,
    );
  }
};

Room.prototype.refreshPositions = function () {
  this.memory.positionHistory = this.getUpdatedPositionMemory(this.memory.positionHistory);
};

Room.prototype.getAllPositionsWithoutRoads = function () {
  const positions = [];

  const roads = this.find(FIND_STRUCTURES)
    .filter(structure => structure.structureType === STRUCTURE_ROAD)
    .concat(this.find(FIND_CONSTRUCTION_SITES)
      .filter(site => site.structureType === STRUCTURE_ROAD))
    .map(structure => structure.pos);

  for (let x = 1; x <= 48; x++) {
    for (let y = 0; y <= 48; y++) {
      const pos = this.getPositionAt(x, y);
      if (roads.find(item => item.isEqualTo(pos)) === undefined) {
        positions.push(pos);
      }
    }
  }

  return positions;
};

Room.prototype.getNextRoadPosition = function () {
  const positionsWithoutRoads = this.getAllPositionsWithoutRoads();
  let output;

  if (positionsWithoutRoads && this.memory.positionHistory) {
    output = positionsWithoutRoads.reduce((best, newPosition) => {
      const newCount = this.memory.positionHistory[newPosition];
      if (newCount) {
        return {
          position: best.count > newCount ? best.position : newPosition,
          count: best.count > newCount ? best.count : newCount,
        };
      }
      return best;
    }, { position: undefined, count: undefined }).position;
  }

  this.memory.nextRoadPosition = output;
  return output;
};

Room.prototype.refreshEnergyWaste = function () {
  const sourceAboutToRegen = this.find(FIND_SOURCES)
    .find(source => source.ticksToRegeneration <= 1);
  if (sourceAboutToRegen) {
    // This is kinda dumb, but we're just checking if its low or not for right now
    this.memory.energyWaste = sourceAboutToRegen.energy;
  }
};

Room.prototype.getUsedPositionsThisTick = function () {
  return this.find(FIND_MY_CREEPS).map(creep => creep.pos);
};

Room.prototype.getUpdatedPositionMemory = function (oldMemory) {
  if (!oldMemory) {
    oldMemory = {};
  }
  const currentPositions = this.getUsedPositionsThisTick();

  if (currentPositions) {
    currentPositions.forEach((position) => {
      oldMemory[position] = oldMemory[position] ? oldMemory[position] + 1 : 1;
    });
  }

  return oldMemory;
};

Room.prototype.hasEnergyWaste = function () {
  return this.memory.energyWaste === undefined || this.memory.energyWaste > 50;
};

Room.prototype.setup = function () {
};

Room.prototype.printInfo = function () {
  if (this.find(FIND_MY_STRUCTURES).length > 0) {
    console.log(`Waste (${this.name}): ${this.hasEnergyWaste() ? this.memory.energyWaste : 'NONE'}`);
    console.log(`Energy (${this.name}): ${this.energyAvailable}`);
    if (this.memory.nextRoadPosition) {
      const road = this.memory.nextRoadPosition;
      console.log(`NextRoad: ${road.x},${road.y}`);
      new RoomVisual(this.name).text(
        '💥',
        this.memory.nextRoadPosition.x,
        this.memory.nextRoadPosition.y,
        { color: 'green', font: 0.8 },
      );
    }
  }
};
