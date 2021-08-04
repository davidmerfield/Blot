var capitalize = require("./capitalize");

module.exports = function (str) {
  return capitalize(str.split("-").join(" "));
};
