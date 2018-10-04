var debug = require("debug")("clients:dropbox:upload");
var dropboxStream = require("dropbox-stream");
var fs = require("fs-extra");
var async = require("async");

function upload(token, source, destination, callback) {
  var read, up;

  debug(source, destination);

  up = dropboxStream
    .createDropboxUploadStream({
      token: token,
      filepath: destination,
      chunkSize: 1000 * 1024,
      autorename: false
    })
    .on("error", callback)
    .on("metadata", function() {
      callback(null);
    });

  read = fs.createReadStream(source).on("error", callback);

  read.pipe(up);
}

// try calling download 5 times with exponential backoff
// (i.e. intervals of 100, 200, 400, 800, 1600 milliseconds)
module.exports = function(token, source, destination, callback) {
  async.retry(
    {
      times: 5,
      interval: function(retryCount) {
        return 50 * Math.pow(2, retryCount);
      }
    },
    async.apply(upload, token, source, destination),
    callback
  );
};
