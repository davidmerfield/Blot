var get = require("../get/blog");
var localPath = require("helper/localPath");
var getConfirmation = require("../util/getConfirmation");
var async = require("async");
var fs = require("fs-extra");
var join = require("path").join;
var pathsToRemove = [];
get(process.argv[2], function (err, user, blog) {
  if (err) throw err;
  if (blog.client !== "dropbox") throw new Error("Not connected to Dropbox");
  var localFolder = localPath(blog.id, "/");
  walk("/", function (err) {
    if (err) throw err;
    if (!pathsToRemove.length) {
      console.log("Done!");
      return process.exit();
    }
    console.log(pathsToRemove);
    getConfirmation("Remove paths? (y/n)", function (err, ok) {
      if (!ok) return process.exit();
      async.eachSeries(pathsToRemove, fs.remove, function (err) {
        if (err) throw err;
        console.log("Done!");
        process.exit();
      });
    });
  });

  function walk(path, callback) {
    console.log("iterating", path);
    async.eachSeries(
      fs.readdirSync(localFolder + path),
      function handleItem(name, next) {
        console.log(". ", join(localFolder, path, name));
        var stat = fs.statSync(join(localFolder, path, name));
        if (
          name !== name.toLowerCase() &&
          fs.existsSync(join(localFolder, path, name).toLowerCase())
        ) {
          pathsToRemove.push(join(localFolder, path, name));
        }
        if (stat.isDirectory()) {
          return walk(join(path, name), next);
        }
        next();
      },
      callback
    );
  }
});
