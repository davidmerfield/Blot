var debug = require("debug")("clients:dropbox:download");
var dropboxStream = require("./dropbox-stream");
var fs = require("fs-extra");
var retry = require("./retry");
var addTimeout = require("./addTimeout");
var setMtime = require("./setMtime");
var tmpDir = require("helper").tempDir();
var join = require("path").join;
var uuid = require("uuid/v4");

module.exports = function(token, source, destination, callback) {
  var stat = false;
  var tmpLocation = join(tmpDir, uuid());

  callback = addTimeout(callback);

  retry(
    callback,
    function(errHandler) {
      var ws, down, metadata;

      try {
        ws = fs.createWriteStream(tmpLocation);
      } catch (err) {
        debug("Failed to create writeStream", err);
        return callback(err);
      }

      ws.on("finish", function() {
        fs.move(tmpLocation, destination, function(err) {
          if (err) return callback(err);
          debug("Moved", tmpLocation, 'to', destination);
          setMtime(destination, metadata.client_modified, callback);
        });
      }).on("error", errHandler);

      down = dropboxStream
        .createDropboxDownloadStream({
          token: token,

          filepath: source,

          chunkSize: 1000 * 1024,

          autorename: false
        })
        .on("progress", function(res) {
          debug("progress", res);
        })
        .on("metadata", function(res) {
          debug("metadata", res);
          metadata = res;
        })
        .on("error", errHandler)
        .pipe(ws);
    },
    function(err) {
      debug(err);

      callback(err, stat);
    }
  );
};
