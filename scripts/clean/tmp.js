var fs = require("fs-extra");
var tmp = require("helper/tempDir")();
var async = require("async");
var exec = require("child_process").exec;
var MAXAGE = 1000 * 60 * 5;
var colors = require("colors/safe");
var moment = require("moment");

if (require.main === module)
  main(function (err) {
    if (err) throw err;
    process.exit();
  });

// find /tmp -mtime +1 -delete

function main(callback) {
  console.log("Cleaning tmp directory...");
  exec("du -sh " + tmp, function (err, stdout) {
    if (err) return callback(err);
    console.log("before: " + stdout.split("\t")[0].trim());

    fs.readdir(tmp, function (err, items) {
      if (err) return callback(err);

      async.eachSeries(
        items,
        function (item, next) {
          var path = tmp + item;

          if (fs.statSync(path).mtime.valueOf() > Date.now() - MAXAGE) {
            console.log(
              colors.dim(
                "Skipping",
                path,
                moment(fs.statSync(path).mtime).fromNow()
              )
            );
            return next();
          }
          console.log(colors.red("Removing", path));
          fs.remove(path, next);
        },
        function (err) {
          if (err) return callback(err);
          exec("du -sh " + tmp, function (err, stdout) {
            if (err) return callback(err);
            console.log("after: " + stdout.split("\t")[0].trim());
            callback(null);
          });
        }
      );
    });
  });
}
