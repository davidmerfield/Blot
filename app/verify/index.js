var disk_cache = require('disk_cache');
var Emit = require('./emit');

var menu = require('./menu');
var ghosts = require('./ghosts');
var hidden = require('./hidden');

function verify (blogID, callback) {

  var emit = Emit(blogID);

  emit('Checking the menu');

  menu(blogID, function(err){

    if (err) return callback(err);

    emit('Checking each entry has a path');

    // Then we check that each post, public file
    // etc. has a corresponding local file.
    ghosts(blogID, function(err){

      if (err) return callback(err);

      emit('Checking for files which should exist');

      hidden(blogID, function(err){

        if (err) return callback(err);

        emit('Complete!');

        // Then we're done!
        disk_cache.flushByBlogID(blogID, callback);
      });
    });
  });
}

module.exports = verify;