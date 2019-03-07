var fs = require("fs-extra");
var Folder = require("../models/folder");
var join = require("path").join;
var debug = require("debug")("blot:clients:local:remove");

// Removes a file or folder from at a given path inside
// the blog's source folder. Needed to remove preview files
// and source files for templates.
module.exports = function remove(blogID, path, callback) {
  debug("Blog", blogID, "Removing", path);
  Folder.get(blogID, function(err, folder) {
    if (err) return callback(err);

    debug("Blog", blogID, "Directory remove path inside:", folder);
    fs.remove(join(folder, path), callback);
  });
};
