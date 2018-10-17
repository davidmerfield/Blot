var client = require("client");
var key = require("./key");

module.exports = function isOwner(blogID, templateID, callback) {
  client.SISMEMBER(key.blogTemplates(blogID), templateID, callback);
};
