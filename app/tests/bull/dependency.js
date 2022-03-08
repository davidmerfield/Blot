module.exports = function (data) {
  if (data.throwInDependency)
    throw new Error("Simulated exception in dependency");
};
