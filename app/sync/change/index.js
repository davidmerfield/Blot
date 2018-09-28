module.exports = function() {
  return {
    set: require("./set"),
    drop: require("./drop"),
    mkdir: require('./mkdir'),
    rebuildDependents: require('./rebuildDependents')
  };
};
