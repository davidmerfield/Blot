var normalize = require("./normalize");
var get = require("./_get");

// This is the method exposed publicly
// it normalized the tag first...
module.exports = function(blogID, tag, callback) {
  return get(blogID, normalize(tag), callback);
};
