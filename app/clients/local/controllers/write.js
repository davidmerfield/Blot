var fs = require("fs-extra");
var Folder = require("../models/folder");
var join = require("path").join;
var debug = require("debug")("blot:clients:local:write");

// Removes a file or folder from at a given path inside
// the blog's source folder. Needed to remove preview files
// and source files for templates.

module.exports = function write(blogID, path, contents, callback) {
  debug(
    "Blog",
    blogID,
    "Writing",
    Buffer.byteLength(contents, "utf8") + " bytes to",
    path
  );
  Folder.get(blogID, function(err, folder) {
    if (err) return callback(err);
    debug("Blog", blogID, "Directory to write path inside:", folder);
    fs.outputFile(join(folder, path), contents, callback);
  });
};
