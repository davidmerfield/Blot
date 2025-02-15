var client = require("models/client");
var ensure = require("helper/ensure");
var key = require("./key");

// This is a private method which assumes the
// tag has been normalized.
module.exports = function get(blogID, tag, callback) {
  ensure(blogID, "string").and(tag, "string").and(callback, "function");

  const tagKey = key.name(blogID, tag);
  const tagSetKey = key.tag(blogID, tag);

  // Fetch the name and the set of entry IDs in parallel
  client.get(tagKey, function (err, prettyTag) {
    if (err) return callback(err);

    client.smembers(tagSetKey, function (err, entryIDs) {
      if (err) return callback(err);

      // Combine the results and call the callback
      return callback(null, entryIDs, prettyTag);
    });
  });
};