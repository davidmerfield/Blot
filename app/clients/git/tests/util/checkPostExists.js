var Entry = require("entry");
var Entries = require("entries");
var localPath = require("helper").localPath;
var fs = require("fs-extra");

module.exports = function(path, callback) {
  Entry.get(global.blog.id, path, function(entry) {
    if (entry && entry.path === path) return callback(null);

    if (entry && entry.path !== path)
      return callback(
        new Error(
          "Entry exists with path " + entry.path + " instead of " + path
        )
      );

    global.usersGitClient.log(function(err, log) {
      console.log("User client last commit:", log.latest.hash);

      global.bareGitClient.log(function(err, log) {
        console.log("Bare client last commit:", log.latest.hash);

        global.liveGitClient.log(function(err, log) {
          console.log("Live client last commit:", log.latest.hash);

          console.log("Files:", fs.readdirSync(localPath(global.blog.id, "/")));

          Entries.getAllIDs(global.blog.id, function(err, entries) {
            console.log("Entries:", entries);

            return callback(new Error("No entry exists " + path));
          });
        });
      });
    });
  });
};
