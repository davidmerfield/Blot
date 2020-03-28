var client = require("client");
var helper = require("helper");
var ensure = helper.ensure;
var key = require("./key");

module.exports = function(blogID, url, callback) {
  ensure(blogID, "string")
    .and(url, "string")
    .and(callback, "function");

  var ignoreKey = key.ignore(blogID);

  ensure(ignoreKey, "string");

  return client.SADD(ignoreKey, url, callback);
};
