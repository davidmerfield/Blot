var fs = require("fs-extra");
var Metadata = require("metadata");
var helper = require("helper");
var localPath = helper.localPath;
var async = require("async");

module.exports = function(blog) {

  return function (path, options, callback) {

    if (callback === undefined && typeof options === "function") {
      callback = options;
      options = {};
    }

    var queue = [fs.ensureDir.bind(this, localPath(blog.id, path))];

    if (options.name) {
      queue.push(Metadata.add.bind(this, blog.id, path, options.name));
    }

    async.parallel(queue, callback);
  };
};