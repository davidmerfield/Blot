var FALSY = ["no", "non", "not", "false", "off"];
var type = require("./type");

module.exports = function(str) {
  if (str === undefined) return true;
  if (str === null) return true;
  if (str === false) return true;

  if (type(str, "string") && FALSY.indexOf(str.trim().toLowerCase()) > -1)
    return true;

  return false;
};
