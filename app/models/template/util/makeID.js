var makeSlug = require("helper/makeSlug");

module.exports = function makeID(owner, name) {
  return owner + ":" + makeSlug(name);
};
