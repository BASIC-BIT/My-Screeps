module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        // if in target room
        creep.memory.target = 'W8N2';
        if (creep.room.name !== creep.memory.target) {
            // find exit to target room
            var exit = creep.room.findExitTo(creep.memory.target);
            // move to exit
            creep.moveTo(creep.pos.findClosestByRange(exit));
        }
        else {
            // try to claim controller
            const response = creep.claimController(creep.room.controller)
            if (response !== OK) {
                // move towards the controller
                creep.moveTo(creep.room.controller);
            }
        }
    }
};