var helper = require('../../../helper');
var ensure = helper.ensure;
var forEach = helper.forEach;
var fs = require('fs');
var mime = require('mime');
var LocalPath = helper.localPath;
var basename = require('path').basename;

module.exports = function stat (blogID, client, changes, callback) {

  ensure(blogID, 'string')
    .and(client, 'object')
    .and(changes, 'array')
    .and(callback, 'function');

  forEach(changes, function(change, next){

    // We already have stat (likely a created or
    // updated file) so skip it!
    if (change.stat) return next();

    change.name = basename(change.path);

    fetchLocal(blogID, change, function(err, stat){

      if (stat) change.stat = stat;

      // We could look up the stat on the client
      // at this point... could be expensive though
      // var STAT_OPTIONS = {deleted: true, readDir: false};
      // client.stat(remotePath(blog.folder,change.path), STAT_OPTIONS, function(err, stat){

      return next();

    });
  }, function(){
    callback(null, changes);
  });
};

function fetchLocal (blogID, change, callback) {

  ensure(blogID, 'string')
    .and(change.path, 'string')
    .and(change.name, 'string')
    .and(callback, 'function');

  var localPath = LocalPath(blogID, change.path);

  fs.stat(localPath, function(err, stat){

    if (err || !stat) return callback(err);

    callback(null, {
      size: stat.size,
      client_mtime: new Date(stat.mtime).getTime(),
      name: change.name,
      path: change.path,
      mime_type: mime.lookup(change.path),
      is_dir: stat.isDirectory()
    });
  });
}
