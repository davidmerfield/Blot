var config = require("../../config");

var time = console.time.bind(this);
time.end = function(label) {
  var upper = label === label.toUpperCase();
  if (upper) console.log("----------------------");
  console.timeEnd(label);
  if (upper) console.log();
};

function nul() {}

nul.end = nul;

if (config.debug) module.exports = time;
else module.exports = nul;
