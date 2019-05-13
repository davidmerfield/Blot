var fs = require("fs-extra");
var dirname = require("path").dirname;
var exec = require("child_process").exec;

var REMOTE_ROOT = require("./root");
var LOCAL_ROOT = require("helper").rootDir;

if (require.main === module) {
  download(process.argv[2], process.argv[3], function(err) {
    if (err) throw err;
    process.exit();
  });
}

function download(remotePath, localPath, callback) {
  var COMMAND =
    "rsync -v --progress -e ssh blot:" + remotePath + " " + localPath;

  if (remotePath.indexOf(REMOTE_ROOT) !== 0)
    return callback(new Error(remotePath + " must be inside " + REMOTE_ROOT));

  if (localPath.indexOf(LOCAL_ROOT) !== 0)
    return callback(new Error(localPath + " must be inside " + LOCAL_ROOT));

  fs.ensureDirSync(dirname(localPath));

  var rsync = exec(COMMAND);

  rsync.stdout.pipe(process.stdout);

  rsync.on("close", function(err) {
    if (err) return callback(err);

    callback();
  });
}

module.exports = download;
