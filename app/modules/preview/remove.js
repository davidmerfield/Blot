var drafts = require('../../drafts');
var helper = require('../../helper');
var previewPath = drafts.previewPath;
var ensure = helper.ensure;


var INITIAL_DELAY = 2000;
var MAX_ATTEMPTS = 10;

// Error codes from Dropbox's API
var TRY_AGAIN = [
  0, 500, 504, // network error
  429, 503     // rate limit error
];

// Minor helper to determine
// if an error code is retry-able
function canRetry (err) {

  return err &&
         err.status !== null &&
         err.status !== undefined &&
         TRY_AGAIN.indexOf(err.status) !== -1;

}

module.exports = function (client, _path, callback) {

  ensure(client, 'object')
    .and(_path, 'string')
    .and(callback, 'function');

  var delay = INITIAL_DELAY, attempts = 1;

  // Determine the path of the preview
  // file for this item. It can be a folder!

  // This will sometimes
  // be called for folders removed inside
  // the user's draft folder. In this case,
  // the preview file won't exist. No biggie.
  var path = previewPath(_path);

  if (!path) {
    console.log('Could not determine the path to a preview file for ', _path);
    return callback();
  }

  client.remove(path, function done (err){

    // the preview file didn't exist
    // It's possible the user had already
    if (err && err.status === 404) {
      return callback(null);
    }

    // This almost certainly occurs when
    // we hit API limits. We back off,
    // doubling the delay with each attempt.
    if (canRetry(err) && attempts < MAX_ATTEMPTS) {

      delay *= 2;
      attempts++;

      return setTimeout(function(){

        client.remove(path, done);

      }, delay);
    }

    // We don't pass this error up the chain
    // since it's not really that important.
    // I figure the user can always remove the
    // preview file themselves.
    if (err) {
      console.log('Error removing preview file', path);
      console.log(err);
    } else {
      console.log('Removed preview file', path);
    }

    callback();
  });
};