var exec = require('child_process').exec;
var fs = require('fs-extra');
var localPath = require('helper').localPath;
var basename = require('path').basename;

module.exports = {

  write: function (blogID, path, contents, callback) {

    var git = 'git -C ' + localPath(blogID, '') + ' ';

    fs.outputFile(localPath(blogID, path), contents, function(err){

      if (err) return callback(err);

      // This is dangerous
      exec(git + 'add ' + path, function(err){
        
        if (err) return callback(err);
        
        // This is dangerous
        exec(git + 'commit -m "Added ' + basename(path) + '"', function(err){

          if (err) return callback(err);
      
          // This is dangerous
          exec(git + 'push', callback);
        });
      });
    });
  },

  disconnect: function (blogID, callback) {
   
    callback();
  },

  remove: function (blogID, path, callback) {

    var git = 'git -C ' + localPath(blogID, '') + ' ';

    fs.remove(localPath(blogID, path), function(err){

      if (err) return callback(err);

      // This is dangerous
      exec(git + 'add ' + path, function(err){
        
        if (err) return callback(err);
        
        // This is dangerous
        exec(git + 'commit -m "Removed ' + basename(path) + '"', function(err){

          if (err) return callback(err);
      
          // This is dangerous
          exec(git + 'push', callback);
        });
      });
    });  }

};