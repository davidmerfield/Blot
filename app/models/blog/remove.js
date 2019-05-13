var get = require("./get");
var key = require("./key");
var helper = require("helper");
var ensure = helper.ensure;
var async = require("async");
var client = require("client");
var START_CURSOR = "0";
var SCAN_SIZE = 1000;
var symlinks = require("./symlinks");
var config = require("config");
var BackupDomain = require("./util/backupDomain");

module.exports = function(blogID, callback) {
  var multi = client.multi();
  var symlinksToRemove = [];

  ensure(blogID, "string").and(callback, "function");

  get({ id: blogID }, function(err, blog) {
    if (err) return callback(err);

    var patterns = ["template:" + blogID + ":*", "blog:" + blogID + ":*"];

    var remove = ["template:owned_by:" + blogID, "handle:" + blog.handle];

    // TODO ALSO remove alternate key with/out 'www', e.g. www.example.com
    if (blog.domain) {
      symlinksToRemove.push(blog.domain);
      symlinksToRemove.push(BackupDomain(blog.domain));
      remove.push("domain:" + blog.domain);
      remove.push("domain:" + BackupDomain(blog.domain));
    }

    if (blog.handle) {
      symlinksToRemove.push(blog.handle + "." + config.host);
    }

    async.each(
      patterns,
      function(pattern, next) {
        var args = [START_CURSOR, "MATCH", pattern, "COUNT", SCAN_SIZE];

        client.scan(args, function then(err, res) {
          if (err) throw err;

          // the cursor for the next pass
          args[0] = res[0];

          // Append the keys we matched in the last pass
          remove = remove.concat(res[1]);

          // There are more keys to check, so keep going
          if (res[0] !== START_CURSOR) return client.scan(args, then);

          next();
        });
      },
      function() {
        multi.del(remove);
        multi.srem(key.ids, blogID);
        multi.exec(function(err) {
          if (err) return callback(err);
          symlinks(blogID, [], symlinksToRemove, callback);
        });
      }
    );
  });
};
