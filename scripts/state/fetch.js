require("../only_locally");

var Remote = require("../remote");
var download = Remote.download;
var execRemote = Remote.exec;

var REMOTE_DUMP_PATH = Remote.root + "/db/dump.rdb";

function main(callback) {
  var now = Math.round(Date.now() / 1000);
  var directory = __dirname + "/data/production-" + now;
  var local_dump_path = directory + "/dump.rdb";
  
  console.log("Retrieving the last time db was saved to disk...");
  execRemote("redis-cli lastsave", function(err, lastsave) {
    if (err) return callback(err);

    console.log("Saving db to disk");
    execRemote("redis-cli bgsave", function(err) {
      if (err) return callback(err);

      execRemote("redis-cli lastsave", function then(err, latestsave) {
        if (err) return callback(err);

        // Bgsave is not yet finished...
        if (latestsave === lastsave) {
          console.log("... Checking if db was saved to disk...");
          return execRemote("redis-cli lastsave", then);
        }

        console.log("Done! Downloading db");

        download(REMOTE_DUMP_PATH, local_dump_path, function(err) {
          if (err) return callback(err);

          console.log("Download complete!");
          callback();
        });
      });
    });
  });
}

if (require.main === module) {
  main(function(err) {
    if (err) throw err;

    process.exit();
  });
}

module.exports = main;
