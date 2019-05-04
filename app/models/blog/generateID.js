var uuid = require("uuid/v4");
var PREFIX = "blog_";

module.exports = function() {
  var id = uuid()
    .split("-")
    .join("")
    .toLowerCase();

  return PREFIX + id;
};
