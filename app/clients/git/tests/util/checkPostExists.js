var Entry = require("entry");
var Entries = require("entries");
var localPath = require("helper").localPath;
var fs = require("fs-extra");

module.exports = function(path, expectedEntry, callback) {

  if (typeof expectedEntry === 'function') {
    callback = expectedEntry;
    expectedEntry = {};
  }

  Entry.get(global.blog.id, path, function(entry) {

    if (!entry) return debug(path, callback);

    for (var i in expectedEntry)
      expect(expectedEntry[i]).toEqual(entry[i]);

    if (entry && entry.path !== path)
      return callback(
        new Error(
          "Entry exists with path " + entry.path + " instead of " + path
        )
      );

    return callback(null);

  });
};


function debug (path, callback) {
      var message = "No entry exists " + path;

    global.usersGitClient.log(function(err, log) {
      message += "\nUser client last commit: " + log.latest.hash;

      global.bareGitClient.log(function(err, log) {
        message += "\nBare client last commit: " + log.latest.hash;

        global.liveGitClient.log(function(err, log) {
          message += "\nLive client last commit: " + log.latest.hash;

          message += "\nFiles: " + fs.readdirSync(localPath(global.blog.id, "/"));

          Entries.getAllIDs(global.blog.id, function(err, entries) {
            message += "\nEntries: " + entries;

            return callback(new Error(message));
          });
        });
      });
    });
}