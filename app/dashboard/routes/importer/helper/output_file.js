var fs = require("fs-extra");

module.exports = function(post, callback) {
  fs.outputFile(post.path, post.content, function(err) {
    if (err) return callback(err);

    // Set the files atime (access time) and mtime (last-modified)
    // I really just want to set the mtime but it doesn't seem
    // possible to modify it using the fs module without doing atime
    var atime = Date.now();
    var mtime = post.updated || Date.now();

    fs.utimes(post.path, atime, mtime, function(err) {
      if (err) return callback(err);

      callback();
    });
  });
};
