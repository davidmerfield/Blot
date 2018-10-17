var fs = require("fs-extra");
var Sync = require("sync");
var localPath = require("helper").localPath;
var model = require("./model");

model.list(function(err, blogIDs) {
  if (err) throw err;
  blogIDs.forEach(function(blogID) {
    model.get(blogID, function(err, folder) {
      if (err) throw err;
      init(blogID, folder, function(err) {
        console.log("Initialized", blogID);
      });
    });
  });
});

function init(blogID, userFolder, callback) {
  fs.watch(
    require("os").homedir() + "/" + userFolder,
    { recursive: true },
    function(event, path) {
      if (!path) return;

      var syncOptions = { retryCount: -1, retryDelay: 10, retryJitter: 10 };

      // Redlock options to ensure we acquire a lock eventually...
      // pershaps we should keep track and only issue a second pending sync
      // to prevent an infinite stack of webhooks.
      Sync(blogID, syncOptions, function(err, folder, done) {
        if (err) return console.log(err);

        var stat;
        path = "/" + path;
        var pathInUserFolder =
          require("os").homedir() + "/" + userFolder + path;
        var pathOnBlot = localPath(blogID, path);

        try {
          stat = fs.statSync(pathInUserFolder);
        } catch (e) {
          if (e.code === "ENOENT") {
            // we should read the contents of the folder
            // on blot and call update for each one
            // after doing this.
            fs.removeSync(pathOnBlot);
          }
        }

        if (stat && stat.isDirectory()) {
          fs.mkdirSync(pathOnBlot);
        }

        if (stat && stat.isFile()) {
          fs.copySync(pathInUserFolder, pathOnBlot);
        }

        folder.update(path, {}, function(err) {
          if (err) console.log(err);
          done(null, function(err) {
            if (err) console.log(err);
          });
        });
      });
    }
  );

  callback(null);
}

module.exports = init;
