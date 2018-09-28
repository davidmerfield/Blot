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

  var queue = [Metadata.add.bind(this, blogID, path, options.name)];

  if (options.name) {
    queue.push();
  }

  async.parallel(queue, callback);
};
