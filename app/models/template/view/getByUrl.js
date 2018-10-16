var helper = require("helper");
var redis = require("client");
var key = require("./key");

module.exports = function getByUrl(templateID, url, callback) {

  url = helper.urlNormalizer(url);

  redis.get(key.url(templateID, url), callback);
};
