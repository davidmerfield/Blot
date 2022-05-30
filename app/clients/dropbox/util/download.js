var debug = require("debug")("blot:clients:dropbox:download");
var dropboxStream = require("dropbox-stream");
var fs = require("fs-extra");
var tmpDir = require("helper/tempDir")();
var join = require("path").join;
var uuid = require("uuid/v4");
var retry = require("./retry");
var waitForErrorTimeout = require("./waitForErrorTimeout");
var clfdate = require("helper/clfdate");

// This is used by sync.js to retrieve files efficiently
// from Dropbox after notification of a change through a webhook
function download(token, source, destination, _callback) {
  const prefix = () => clfdate() + " clients:dropbox:download";

  console.log(prefix(), source);

  var ws, down, metadata;
  var tmpLocation = join(tmpDir, uuid());
  console.log(prefix(), "tmpLocation =", tmpLocation);

  var callback = function (err) {
    console.log(prefix(), "removing", tmpLocation);
    fs.remove(tmpLocation, function () {
      console.log(prefix(), "calling back with err = ", err);
      _callback(err);
    });
  };

  try {
    ws = fs.createWriteStream(tmpLocation);
  } catch (err) {
    console.log(prefix(), "failed to createWriteStream", err);
    return callback(err);
  }

  ws.on("finish", function () {
    console.log(prefix(), "stream complete");
    console.log(prefix(), "moving tmpLocation to", destination);
    fs.move(tmpLocation, destination, { overwrite: true }, function (err) {
      if (err) return callback(err);
      console.log(prefix(), "setting mtime to", metadata.client_modified);
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
    .on("progress", function (res) {
      console.log(prefix(), "stream progress", res);
    })
    .on("metadata", function (res) {
      console.log(prefix(), "stream metadata", res);
      metadata = res;
    })
    .on("error", function (err) {
      // Since this entire function is wrapped in retry behaviour
      // we should wait for any retry delay before surfacing
      // the error. Note that waitForErrorTimeout only ever throws
      // so we shouldn't need ... .then(callback)
      console.log(prefix(), "stream error", err);
      waitForErrorTimeout(err).catch(callback);
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

  fs.utimes(path, mtime, mtime, function (err) {
    if (err) return callback(err);

    return callback(null);
  });
}

module.exports = retry(download);
