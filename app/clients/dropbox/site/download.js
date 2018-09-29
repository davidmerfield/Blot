var helper = require('helper');
var ensure = helper.ensure;
var time = helper.time;

var mtime = require('./mtime');
var callOnce = helper.callOnce;

var fs = require('fs-extra');

// Error codes from Dropbox's API
var TRY_AGAIN = [
  0, 500, 504, // network error
  429, 503     // rate limit error
];

var INIT_DELAY = 2000;
var MAX_ATTEMPTS = 10;

                // var dropbox_content_hash = require("./dropbox_content_hash");
                // dropbox_content_hash(local_path, function(err, existing_hash) {
                //   if (existing_hash && existing_hash === change.content_hash) {
                //     console.log(
                //       "Blog:",
                //       blog.id,
                //       change.path_lower,
                //       "already has the same version stored locally. Do nothing."
                //     );
                //     return next();
                //   }

function download (client, from, to, _callback) {

  ensure(client, 'object')
    .and(from, 'string')
    .and(to, 'string')
    .and(_callback, 'function');

  time('download');

  var callback = callOnce(function(){
    time.end('download');
    _callback();
  });

  var delay = INIT_DELAY;
  var attempts = 1;


  // This is called when the download has finished.
  client.filesDownload({path: from})
    .then(success)
    .catch(fail);

  function success (res){

    // the format of this stat differs
    // from the info returns from dropbox
    // for requests to /delta this is =
    // to stat.client_mtime
    var modified = res.client_modified;

    // Ensure the directory into which
    // we're downloading the file exists
    fs.outputFile(to, res.fileBinary, {encoding: 'binary'}, function (err) {

      if (err) return callback(err);

      mtime(to, modified, function(err){

        if (err) return callback(err);

        callback(null);
      });
    });
  }

  function fail (error){

    // If error, determine whether or not to try again.
    if (shouldRetry(error) && attempts < MAX_ATTEMPTS) {

      attempts++;
      delay *= 2;

      return setTimeout(function(){

        client.filesDownload({path: from})
          .then(success)
          .catch(fail);

      }, delay);
    }

    callback(error);
  }

}

function shouldRetry (error) {
  return error && error.status && TRY_AGAIN.indexOf(error.status) !== -1;
}

module.exports = download;