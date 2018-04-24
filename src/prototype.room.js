Room.prototype.refreshMemory = function () {
  this.setup();
  this.refreshEnergyWaste();
  this.printInfo();
};

Room.prototype.refreshEnergyWaste = function () {
  const sourceAboutToRegen = this.find(FIND_SOURCES)
    .find(source => source.ticksToRegeneration <= 1);
  if (sourceAboutToRegen) {
    // This is kinda dumb, but we're just checking if its low or not for right now
    this.memory.energyWaste = sourceAboutToRegen.energy;
  }
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
  }
};
