var debug = require("debug")("blot:clients:dropbox:download");
var dropboxStream = require("dropbox-stream");
var fs = require("fs-extra");
var tmpDir = require("helper").tempDir();
var join = require("path").join;
var uuid = require("uuid/v4");
var retry = require("./retry");
var waitForErrorTimeout = require("./waitForErrorTimeout");

// This is used by sync.js to retrieve files efficiently
// from Dropbox after notification of a change through a webhook
function download(token, source, destination, callback) {
  var tmpLocation = join(tmpDir, uuid());

  debug(source, destination);

  var ws, down, metadata;

  try {
    ws = fs.createWriteStream(tmpLocation);
  } catch (err) {
    debug("Failed to create writeStream", err);
    return callback(err);
  }

  ws.on("finish", function() {
    fs.move(tmpLocation, destination, { overwrite: true }, function(err) {
      if (err) return callback(err);
      debug("Moved", tmpLocation, "to", destination);
      setMtime(destination, metadata.client_modified, callback);
    });
  }).on("error", callback);

  down = dropboxStream
    .createDropboxDownloadStream({
      token: token,

      filepath: source,

      chunkSize: 1000 * 1024,

      autorename: false,
    })
    .on("progress", function(res) {
      debug("progress", res);
    })
    .on("metadata", function(res) {
      debug("metadata", res);
      metadata = res;
    })
    .on("error", function(err) {
      // Since this entire function is wrapped in retry behaviour
      // we just need to wait for the retry delay before surfacing
      // the error. Note that waitForErrorTimeout only ever throws
      // so we shouldn't need ... .then(callback)
      waitForErrorTimeout(err)
        .catch(callback);
    })
    .pipe(ws);
}

function setMtime(path, modified, callback) {
  var mtime;

  try {
    mtime = new Date(modified);
  } catch (e) {
    return callback(e);
  }

  if (
    mtime === false ||
    mtime === null ||
    mtime === undefined ||
    !(mtime instanceof Date)
  ) {
    return callback(new Error("Download: setMtime: Could not create date"));
  }

  fs.utimes(path, mtime, mtime, function(err) {
    if (err) return callback(err);

    return callback(null);
  });
}

module.exports = retry(download);
