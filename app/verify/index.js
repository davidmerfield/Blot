var cache = require('../cache');

var hidden = require('./hidden');
var ghosts = require('./ghosts');
var paths = require('./paths');
var menu = require('./menu');

var Emit = require('./emit');

if (require.main === module) {

  var blogID = process.argv[2];

  if (!blogID) throw 'Please pass the user\'s handle as an argument.';

  verify(blogID, function(err){

    if (err) throw err;

    process.exit();
  });
}

function verify (blogID, callback) {

  var emit = Emit(blogID);

  emit('Checking the menu');

  menu(blogID, function(err){

    if (err) return callback(err);

    emit('Checking each entry has a path');

    paths(blogID, function(err){

      if (err) return callback(err);

      emit('Checking for files which should not exist');

      // Then we check that each post, public file
      // etc. has a corresponding local file.
      ghosts(blogID, function(err){

        if (err) return callback(err);

        emit('Checking for files which should exist');

        hidden(blogID, function(err){

          if (err) return callback(err);

          emit('Complete!');

          // Then we're done!
          cache.clear(blogID, callback);
        });
      });
    });
  });
}

module.exports = verify;