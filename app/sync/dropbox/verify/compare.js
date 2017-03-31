var helper = require('../../../helper');
var forEach = helper.forEach;
var FetchLocal = require('./fetchLocal');
var FetchRemote = require('./fetchRemote');
var ensure = helper.ensure;

var Emit = require('./emit');

module.exports = function (blog, client, callback) {

  ensure(blog, 'object')
    .and(client, 'object')
    .and(callback, 'function');

  var emit = Emit(blog.id);

  var fetchLocal = FetchLocal(blog);
  var fetchRemote = FetchRemote(blog, client);

  var remove = [];
  var update = [];

  function compare (path, callback) {

    ensure(path, 'string')
      .and(callback, 'function');

    fetchRemote(path, function(err, remoteContents){

      // todo this script hangs for users who have deleted
      // the blog folder inside their app folder
      // without blot resetting their blog folder
      // to an empty string...

      // we need to make a folder here...
      // IF it is the top level folder...
      // does this also handle local folders which
      // no longer exist on remote?

      // This folder does not exist
      // in the user's db folder.
      if (err && err.status === 404)
        return remove.push(path);

      // What if the local path is a folder
      // and the remote is a file, or vice versa?
      if (err)
        return callback(err);

      fetchLocal(path, function(err, localContents){

        if (err) throw err;

        var dirs = [];

        var dictionary = build(localContents, remoteContents);

        forEach(dictionary, function(name, file, next){

          // PATH IS LOWERCASED

          // The order of these is important

          if (!file.remote && file.local) {
            remove.push(file.local.path);
            return next();
          }

          if (file.remote && file.remote.stat.is_dir) {
            dirs.push(file.remote.path);
            return next();
          }

          if (file.remote && !file.local) {
            update.push(file.remote.path);
            return next();
          }

          if (file.local.stat.client_mtime !== file.remote.stat.client_mtime) {
            update.push(file.remote.path);
            return next();
          }

          emit('✓ ' + path);
          return next();

        }, function(){

          forEach.parallel(dirs, function(dir, nextDir){

            compare(dir, nextDir);

          }, function(){

            callback(null, update, remove);
          });
        });
      });
    });
  }

  return compare;
};

// THIS IS LOWERCASED
function build (localContents, remoteContents) {

  var dictionary = {};

  localContents.forEach(function(c){

    var name = c.stat.name.toLowerCase();

    dictionary[name] = dictionary[name] || {local: '', remote: ''};
    dictionary[name].local = c;
  });

  remoteContents.forEach(function(c){

    var name = c.stat.name.toLowerCase();

    dictionary[name] = dictionary[name] || {local: '', remote: ''};
    dictionary[name].remote = c;
  });

  return dictionary;
}