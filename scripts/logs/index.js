var exec = require("child_process").exec;
var log = require("./list");

var now = Date.now();
var download = require("../remote/download");

var localLogDir = log.dir + "/production/" + now;
var remoteLogDir = "/var/www/blot/logs";

var options = require("minimist")(process.argv.slice(2));

var forEach = require("../../app/helper").forEach;

if (!options.a) log.names = ["app.log"];

forEach(
  log.names,
  function(name, next) {
    var remotePath = remoteLogDir + "/" + name;
    var localPath = localLogDir + "/" + name;

    download(
      remotePath,
      localPath,
      function(err) {
        if (err) throw err;

        exec("open " + localPath);

        next();
      },
      { silent: true }
    );
  },
  process.exit
);
