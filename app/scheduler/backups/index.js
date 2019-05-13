var config = require("../config");
var redis = require("redis").createClient();
var helper = require("./helper");
var upload = helper.upload;
var encrypt = helper.encrypter.encrypt;
var fs = require("fs-extra");
var DB_PATH = require("path").resolve(__dirname + "/../db/dump.rdb");

var tmp = helper.tempDir();
var Moment = require("moment");
var joinpath = require("path").join;

// called from command line
if (require.main === module) {
  var extraTag = process.argv[2];

  backUP(extraTag);
}

function backUP(extraString) {
  saveDBToDisk(function() {
    var ds = Moment.utc().format("YYYY-MM-DD-HH-mm-ss");

    var clone_name = ds;

    if (extraString) clone_name += "-" + extraString;

    clone_name += "-encrypted-dump.rdb";

    var encrypted_clone_path = joinpath(tmp, clone_name);

    encrypt(DB_PATH, encrypted_clone_path, function(err) {
      if (err) throw err;

      var options = {
        bucket: config.backup.bucket,
        remote: clone_name
      };

      upload(encrypted_clone_path, options, function(err) {
        if (err) {
          console.log("Backup error :(");
          console.log(err);
        }

        if (!err) {
          console.log("Backup complete!");
        }

        fs.remove(encrypted_clone_path);
      });
    });
  });
}

function saveDBToDisk(callback) {
  redis.lastsave(function(err, last_save_time) {
    console.log("Backup: Saving database to disk at " + last_save_time);

    redis.bgsave(function(err, stat) {
      console.log("Backup: " + stat);

      (function checkLast() {
        redis.lastsave(function(err, latest_save_time) {
          if (latest_save_time !== last_save_time) {
            console.log("Backup: DB saved to disk in background");
            return callback();
          }

          checkLast();
        });
      })();
    });
  });
}

module.exports = {
  now: backUP
};
