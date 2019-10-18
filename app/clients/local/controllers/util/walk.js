var fs = require("fs-extra");

module.exports = function walk(dir) {
  var results = [];
  fs.readdirSync(dir).forEach(function(file) {
    file = dir + "/" + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
};
