var exec = require("child_process").exec;
var remotePath = "/var/www/llllll/sites/status/app.log";
var LOGDIR = __dirname + "/logs";
var localPath = LOGDIR + "/" + Date.now() + "-app.log";

// create dir for log files if it doesn't exist
try {
  require("fs").mkdirSync(LOGDIR);
} catch (e) {}

var download =
  "rsync -v --progress -e ssh llllll:" + remotePath + " " + localPath;

// you need to have set up an ssh alias for this to work
exec(download, function(err) {
  if (err) throw err;

  exec("open " + localPath, process.exit);
});
