var debug = require("debug")("clients:dropbox:upload");
var dropboxStream = require("dropbox-stream");
var fs = require("fs-extra");
var retry = require("./retry");

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

module.exports = retry(upload);
