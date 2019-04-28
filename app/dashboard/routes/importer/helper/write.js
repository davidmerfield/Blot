var fs = require("fs-extra");

module.exports = function(post, callback) {
  var atime, mtime;

  // Remove leading and trailing whitespace
  post.content = post.content.trim();

  fs.outputFile(post.path, post.content, function(err) {
    if (err) return callback(err);

    atime = Date.now();
    mtime = post.updated || post.created || post.dateStamp || Date.now();

    fs.utimes(post.path, atime, mtime, function(err) {
      if (err) return callback(err);
      callback(null);
    });
  });
};
