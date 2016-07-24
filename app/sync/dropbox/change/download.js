var helper = require('../../../helper');
var ensure = helper.ensure;
var time = helper.time;

var mtime = require('./mtime');

var callOnce = helper.callOnce;
var mkdirp = helper.mkdirp;
var dirname = require('path').dirname;

var fs = require('fs');

// Error codes from Dropbox's API
var TRY_AGAIN = [
  0, 500, 504, // network error
  429, 503     // rate limit error
];

var INIT_DELAY = 2000;
var MAX_ATTEMPTS = 10;

var OPTIONS = {buffer: true};

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
  client.readFile(from, OPTIONS, function done (error, buffer, stat) {

    // If error, determine whether or not to try again.
    if (shouldRetry(error) && attempts < MAX_ATTEMPTS) {

      attempts++;
      delay *= 2;

      return setTimeout(function(){

        client.readFile(from, OPTIONS, done);

      }, delay);
    }

    if (error || !buffer || !stat)
      return callback(error || 'No buffer or stat object');

    // the format of this stat differs
    // from the info returns from dropbox
    // for requests to /delta this is =
    // to stat.client_mtime
    var modified = stat._json.client_mtime;

    // Ensure the directory into which
    // we're downloading the file exists
    mkdirp(dirname(to), function (err) {

      if (err) return callback(err);

      var ws = fs.createWriteStream(to);

      ws.on('error', callback);

      ws.on('finish', function(){
        mtime(to, modified, callback);
      });

      ws.write(buffer);

      ws.end();
    });
  });
}

function shouldRetry (error) {
  return error && error.status && TRY_AGAIN.indexOf(error.status) !== -1;
}

module.exports = download;