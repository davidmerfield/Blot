var Blog = require("blog");
var fs = require("fs-extra");
var helper = require("helper");
var BLOGS_DIRECTORY = helper.rootDir + "/blogs";
var tmp = helper.tempDir();
var async = require("async");
var yesno = require("yesno");
var colors = require("colors/safe");

if (require.main === module)
  main(function(err) {
    if (err) throw err;
    process.exit();
  });

function main(callback) {
  Blog.getAllIDs(function(err, ids) {
    if (err) return callback(err);
    fs.readdir(BLOGS_DIRECTORY, function(err, items) {
      if (err) return callback(err);

      var missingFolders = ids.filter(function(id) {
        return items.indexOf(id) === -1;
      });

      var strayFolders = items.filter(function(item) {
        return ids.indexOf(item) === -1;
      });

      console.log("Missing folders:", missingFolders.length);
      console.log("Stray items:", strayFolders.length);
      async.eachSeries(
        strayFolders,
        function(strayFolderName, next) {
          var from = BLOGS_DIRECTORY + "/" + strayFolderName;
          var to = tmp + strayFolderName;
          yesno.ask(
            "Move " +
              strayFolderName +
              "?" +
              colors.dim("\nFrom: " + from + "\n. To: " + to),
            true,
            function(ok) {
              if (!ok) return next();
              fs.move(from, to, next);
            }
          );
        },
        callback
      );
    });
  });
}
