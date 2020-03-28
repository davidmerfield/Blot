var client = require("client");
var helper = require("helper");
var ensure = helper.ensure;
var key = require("./key");

module.exports = function(blogID, from, callback) {
  ensure(blogID, "string")
    .and(from, "string")
    .and(callback, "function");

  var redirects = key.redirects(blogID);

  client.zrem(redirects, from, function(err) {
    if (err) throw err;

    var fromKey = key.redirect(blogID, from);

    client.del(fromKey, function(err) {
      if (err) throw err;

      callback();
    });
  });
};
