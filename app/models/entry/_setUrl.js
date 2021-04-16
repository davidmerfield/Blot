var async = require("async");
var ensure = require("helper/ensure");
var redis = require("client");
var Key = require("./key").url;
var model = require("./model");
var get = require("./get");

// this needs to return an error if something went wrong
// and the finalized, stored url to the entry...
module.exports = function (blogID, entry, callback) {
  ensure(blogID, "string").and(entry, model).and(callback, "function");

  if (entry.draft || entry.deleted) return callback(null, "");

  // does This cause a memory leak? we sometimes
  // exist before calling all the next functions
  // if we find a successful candidate.
  async.eachSeries(
    entry.urlCandidates,
    function (candidate, next) {
      check(blogID, candidate, entry.id, function (err, taken) {
        if (err) return callback(err);

        if (taken) return next();

        var key = Key(blogID, candidate);

        redis.set(key, entry.id, function (err) {
          if (err) return callback(err);

          return callback(null, candidate);
        });
      });
    },
    function () {
      // if we exhaust the list of candidates, what should happen?
      // just return an error for now... TODO in future, just keep
      // generating UIDS... but whatever for now.
      callback(new Error("Could not find a permalink for " + entry.path));
    }
  );
};

function check(blogID, candidate, entryID, callback) {
  var key = Key(blogID, candidate);

  redis.get(key, function (err, existingID) {
    if (err) return callback(err);

    // This url is available and unused
    if (!existingID) return callback();

    // This url points to this entry already
    if (existingID === entryID) return callback();

    // This url points to a different entry
    get(blogID, existingID, function (existingEntry) {
      // For some reason (bug) the url key was
      // set but the entry does not exist. Claim the url.
      if (!existingEntry) return callback();

      // The existing entry has since moved to a different url
      // (perhaps the author modified its permalink etc...)
      // so this entry can claim this url.
      if (existingEntry.url !== candidate) return callback();

      // The existing entry was deleted after claiming this
      // url, so this entry can claim it.
      if (existingEntry.deleted) return callback();

      // If we reach this far down, it means the entry
      // which has claimed this url is still visible and
      // still uses this url, so we can't claim it.
      return callback(null, true);
    });
  });
}
