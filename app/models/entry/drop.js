var helper = require("helper");
var ensure = helper.ensure;

var set = require("./set");
var get = require("./get");

module.exports = function drop(blogID, path, callback) {
  ensure(blogID, "string")
    .and(path, "string")
    .and(callback, "function");

  get(blogID, path, function(entry) {
    if (!entry) {
      return callback();
    }

    set(blogID, path, { deleted: true }, callback);
  });
};
