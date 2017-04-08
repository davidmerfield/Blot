var helper = require('helper');
var forEach = helper.forEach;

var TRY_AGAIN = [
  0, 500, 504, // network error
  429, 503 // rate limit error
];

var IGNORE = [
  403 // file already exists
];

function shouldRetry (error) {
  return error && error.status && TRY_AGAIN.indexOf(error.status) !== -1;
}

function shouldIgnore (error) {
  return error && error.status && IGNORE.indexOf(error.status) !== -1;
}

module.exports = function (oldClient, newClient, callback) {

  oldClient.readdir('/', function(err, paths){

    if (err) return callback(err);

    forEach.multi(25)(paths, function(path, nextPath){

      oldClient.copyRef(path, function onRef(err, ref){

        // There was a network or rate limit error
        if (shouldRetry(err)) return oldClient.copyRef(path, onRef);

        // Work out what to do with this afterwards
        if (err) {
          console.log(err);
          return nextPath();
        }

        newClient.copy(ref, path, function onCopy (err){

          // There was a network or rate limit error
          if (shouldRetry(err)) return newClient.copy(ref, path, onCopy);

          // The file already exists
          if (shouldIgnore(err)) return nextPath();

          // Eh not sure...
          if (err) console.log(err);

          nextPath();
        });
      });
    }, callback);
  });
};