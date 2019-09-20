var client = require("client");
var helper = require("helper");
var ensure = helper.ensure;
var key = require("./key");

// this is a private method which assumes the
// tag has been normalized. we
module.exports = function get(blogID, tag, callback) {
  ensure(blogID, "string")
    .and(tag, "string")
    .and(callback, "function");

  var multi = client.multi();

  multi.get(key.name(blogID, tag));
  multi.smembers(key.tag(blogID, tag));

  multi.exec(function(err, res) {
    if (err) throw err;

    var prettyTag = res[0];

    var entryIDs = res[1];

    return callback(null, entryIDs, prettyTag);
  });
};
