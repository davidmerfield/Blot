var client = require("client");
var helper = require("helper");
var ensure = helper.ensure;
var key = require("./key");

module.exports = function getAllIDs(callback) {
  ensure(callback, "function");

  client.smembers(key.ids, callback);
};
