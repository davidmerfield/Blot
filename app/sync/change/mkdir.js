var fs = require("fs-extra");
var Metadata = require("metadata");
var helper = require("helper");
var localPath = helper.localPath;
var async = require("async");

module.exports = function(blogID, path, options, callback) {
  if (callback === undefined && typeof options === "function") {
    callback = options;
    options = {};
  }

  var queue = [fs.ensureDir.bind(this, localPath(blogID, path))];

  if (options.name) {
    queue.push(Metadata.add.bind(this, blogID, path, options.name));
  }

  async.parallel(queue, callback);
};
