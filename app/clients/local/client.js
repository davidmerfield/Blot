var database = require('./database');
var fs = require('fs-extra');
var join = require('path').join;

// these are shared with Blot and are currently used
// to write / remove preview files when a draft is created
// or removed.
module.exports = {

  write: function (blogID, path, contents, callback) {

    database.get(blogID, function(err, folder){

      if (err) return callback(err);

      fs.outputFile(join(folder, path), contents, callback);
    });
  },

  disconnect: function (blogID, callback) {
    database.drop(blogID, function(err){

      if (err) return callback(err);

      // at this point we should really replace the symlink with the files themselves

      callback();
    });
  },

  remove: function (blogID, path, callback) {

    database.get(blogID, function(err, folder){

      if (err) return callback(err);

      fs.remove(join(folder, path), callback);
    });
  }

};