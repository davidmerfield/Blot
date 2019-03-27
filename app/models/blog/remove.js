var get = require("./get");
var helper = require("helper");
var ensure = helper.ensure;
var async = require("async");
var client = require("client");
var START_CURSOR = "0";
var SCAN_SIZE = 1000;

module.exports = function(blogID, callback) {
  ensure(blogID, "string").and(callback, "function");

  get({ id: blogID }, function(err, blog) {
    if (err) return callback(err);

    var patterns = ["template:" + blogID + ":*", "blog:" + blogID + ":*"];

    var remove = ["template:owned_by:" + blogID, "handle:" + blog.handle];

    if (blog.domain) remove.push("domain:" + blog.domain);

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
        client.del(remove, callback);
      }
    );
  });
};
