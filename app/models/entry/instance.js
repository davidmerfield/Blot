module.exports = function Entry(init) {
  for (var i in init) this[i] = init[i];
};
