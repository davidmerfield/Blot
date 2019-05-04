var key = require("./key");
var client = require("client");

module.exports = function isOwner(owner, id, callback) {
  client.SISMEMBER(key.blogTemplates(owner), id, callback);
};
