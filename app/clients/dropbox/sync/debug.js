var helper = require('../../helper');
var forEach = helper.forEach;

module.exports = function (changes, callback) {

  console.log();
  console.log('``````````````````````````````');

  forEach(changes, function(change, next){

    if (change.wasRemoved) {
      console.log('x', change.path);
    }

    if (change.wasRenamed) {
      console.log('→', change.path, 'from', change.oldPath);
    }

    if (!change.wasRenamed && !change.wasRemoved) {
      console.log('+', change.path);
    }

    next();

  }, function(){
  console.log('``````````````````````````````');
  if (callback) return callback();
  throw 'DEBUG';
  });
};