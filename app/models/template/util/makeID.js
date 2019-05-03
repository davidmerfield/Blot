var helper = require('helper');

module.exports = function makeID(owner, name) {
  return owner + ":" + helper.makeSlug(name);
};