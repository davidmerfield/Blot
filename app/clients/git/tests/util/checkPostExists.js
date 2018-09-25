var Entry = require("entry");
var Entries = require("entries");
var localPath = require("helper").localPath;
var fs = require("fs-extra");

module.exports = function(expectedEntry, callback) {

  var context = this;

  if (!expectedEntry.path) throw new Error('Pass a path as a property of the entry as first argument');

  Entry.get(context.blog.id, expectedEntry.path, function(entry) {

    if (!entry) return debug(context, expectedEntry.path, callback);

    for (var i in expectedEntry)
      expect(expectedEntry[i]).toEqual(entry[i]);

    return callback(null);
  });
};


function debug (context, path, callback) {
      var message = "No entry exists " + path;

    context.usersGitClient.log(function(err, log) {
      message += "\nUser client last commit: " + log.latest.hash;

      context.bareGitClient.log(function(err, log) {
        message += "\nBare client last commit: " + log.latest.hash;

        context.liveGitClient.log(function(err, log) {
          message += "\nLive client last commit: " + log.latest.hash;

          message += "\nFiles: " + fs.readdirSync(localPath(this.blog.id, "/"));

          Entries.getAllIDs(context.blog.id, function(err, entries) {
            message += "\nEntries: " + entries;

            return callback(new Error(message));
          });
        });
      });
    });
}