var fs = require('fs-extra');

module.exports = function (post, callback) {

  var atime, mtime;

  console.log('...', post.path, post.title);
  
  fs.outputFile(post.path, post.content, function(err){

    if (err) return callback(err);

    atime = Date.now();
    mtime = post.updated || post.created || post.dateStamp || Date.now();

    fs.utimes(post.path, atime, mtime, callback);
  });
};