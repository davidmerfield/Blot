var config = require("config");
var redis = require("redis").createClient();
var helper = require("helper");
var upload = helper.upload;
var encrypt = helper.encrypter.encrypt;
var fs = require("fs-extra");
var DB_PATH = require("path").resolve(__dirname + "/../../db/dump.rdb");

var tmp = helper.tempDir();
var Moment = require("moment");
var joinpath = require("path").join;

// called from command line
if (require.main === module) {
  backup(function (err) {
    if (err) throw err;
    process.exit();
  });
}

function backup(callback) {
  saveDBToDisk(function (err) {
    if (err) return callback(err);

    var datestring = Moment.utc().format("YYYY-MM-DD-HH-mm-ss");
    var suffix = "-encrypted-dump.rdb";
    var filename = datestring + suffix;
    var encrypted_clone_path = joinpath(tmp, filename);
    var options = {
      bucket: config.backup.bucket,
      remote: filename,
    };

    console.log("Backup: Encrypting database dump");
    encrypt(DB_PATH, encrypted_clone_path, function (err) {
      if (err) return callback(err);

      console.log("Backup: Uploading encrypted copy of dump");
      upload(encrypted_clone_path, options, function (err) {
        if (err) return callback(err);

        console.log("Backup: Removing local encrypted copy of dump");
        fs.remove(encrypted_clone_path, function (err) {
          if (err) return callback(err);

          console.log("Backup: Complete");
          callback();
        });
      });
    });
  });
}

function saveDBToDisk(callback) {
  redis.lastsave(function (err, last_save_time) {
    if (err) return callback(err);
    console.log("Backup: Saving database to disk at " + last_save_time);
    redis.bgsave(function (err) {
      if (err) return callback(err);
      console.log("Backup: Asked redis to save database to disk in background");

      redis.lastsave(function onCheck(err, latest_save_time) {
        if (err) return callback(err);

        if (latest_save_time === last_save_time) {
          return redis.lastsave(onCheck);
        }

        console.log("Backup: DB saved to disk");
        callback();
      });
    });
  });
}

module.exports = backup;
