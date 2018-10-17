var helper = require("helper");
var client = require("client");
var key = require("./key");

module.exports = function getNameByUrl(templateID, url, callback) {
  url = helper.urlNormalizer(url);
  client.get(key.url(templateID, url), callback);
};
