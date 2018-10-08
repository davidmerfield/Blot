var redis = require("client");
var key = require('./key');

module.exports = function isOwner(owner, id, callback) {
  redis.SISMEMBER(key.blogTemplates(owner), id, callback);
};
