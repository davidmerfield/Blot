var fs = require("fs-extra");
var config = require("config");
var Moment = require("moment");
var redis = require("redis").createClient();
var helper = require("helper");
var tmp = require("helper/tempDir")();
var ensure = require("helper/ensure");
var encrypt = require("helper/encrypter").encrypt;
var joinpath = require("path").join;
var DB_PATH = require("path").resolve(__dirname + "/../../db/dump.rdb");
var BUCKET = config.backup.bucket;
var AWS = require("aws-sdk");
var DAYS_OF_BACKUPS_TO_KEEP = 7;

AWS.config.update({
  accessKeyId: config.aws.key,
  secretAccessKey: config.aws.secret,
});

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

    console.log("Backup: Encrypting database dump");
    encrypt(DB_PATH, encrypted_clone_path, function (err) {
      if (err) return callback(err);

      console.log("Backup: Uploading encrypted copy of dump");
      upload(encrypted_clone_path, filename, function (err) {
        if (err) return callback(err);

        console.log("Backup: Removing local encrypted copy of dump");
        fs.remove(encrypted_clone_path, function (err) {
          if (err) return callback(err);

          console.log("Backup: Looking up old backup to remove");
          wipeOldBackups(function (err) {
            if (err) return callback(err);

            console.log("Backup: Complete");
            callback();
          });
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

function upload(path, filename, callback) {
  ensure(path, "string").and(filename, "string").and(callback, "function");

  var root = config.environment === "development" ? "_dev/" : "";
  var remote = joinpath(root, filename);
  var body = fs.createReadStream(path);

  var params = {
    Bucket: BUCKET,
    Key: remote,
  };

  var s3Client = new AWS.S3({ params: params });

  s3Client.upload({ Body: body }).send(function (err) {
    if (err) return callback(err);
    callback(null);
  });
}

function wipeOldBackups(callback) {
  var datestring = Moment.utc()
    .subtract(DAYS_OF_BACKUPS_TO_KEEP, "days")
    .format("YYYY-MM-DD-");

  var root = config.environment === "development" ? "_dev/" : "";
  var remote = joinpath(root, datestring);

  console.log(
    "Backup: Looking up backups made " +
      DAYS_OF_BACKUPS_TO_KEEP +
      " days ago on " +
      datestring
  );

  var s3Client = new AWS.S3();
  s3Client.listObjects(
    {
      Bucket: BUCKET,
      Prefix: remote,
    },
    function (err, data) {
      if (err) return callback(err);

      if (!data || !data.Contents.length) {
        console.log("Backup: No old backups to remove");
        return callback();
      }

      var Objects = data.Contents.map((i) => {
        return { Key: i.Key };
      });

      s3Client.deleteObjects(
        {
          Bucket: BUCKET,
          Delete: {
            Objects: Objects,
            Quiet: false,
          },
        },
        function (err, data) {
          if (err) return callback(err);

          if (data && data.Deleted && data.Deleted.length) {
            console.log(
              "Backup: Deleted " +
                data.Deleted.length +
                " dump made " +
                DAYS_OF_BACKUPS_TO_KEEP +
                " days ago: " +
                data.Deleted.map((i) => i.Key).join(", ")
            );
          }

          callback();
        }
      );
    }
  );
}

module.exports = backup;
