var debug = require('debug')('client:git');
var fs = require('fs-extra');
var localPath = require('helper').localPath;
var Git = require('simple-git');

module.exports = {

  write: function (blogID, path, contents, callback) {

    if (path[0] === '/') path = path.slice(1);

    var git = Git(localPath(blogID, '/'));
    var message = 'Updated ' + path;

    debug('Blog:', blogID, 'Attempting to write', path);

    fs.outputFile(localPath(blogID, path), contents, function(err){

      if (err) return callback(err);

      debug('Blog:', blogID, 'Attempting to add, commit and push', path);

      git.add(path).commit(message).push(function(err){

        if (err) return callback(err);

        debug('Blog:', blogID, 'Successfully wrote', path);

        callback();
      });
    });
  },

  disconnect: function (blogID, callback) {
    
    // remove tokens

    callback();
  },

  remove: function (blogID, path, callback) {

    if (path[0] === '/') path = path.slice(1);

    var git = Git(localPath(blogID, '/'));
    var message = 'Removed ' + path;


    debug('Blog:', blogID, 'Attempting to remove', path);

    fs.remove(localPath(blogID, path), function(err){

      if (err) return callback(err);

      debug('Blog:', blogID, 'Attempting to add, commit and push', path);

      git.add(path).commit(message).push(function(err){

        if (err) return callback(err);

        debug('Blog:', blogID, 'Successfully removed', path);

        callback();
      });
    });    
  }

};