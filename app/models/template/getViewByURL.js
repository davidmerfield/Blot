var helper = require("helper");
var ensure = helper.ensure;
var redis = require("client");
var key = require("./key");

module.exports = function getViewByURL(templateID, url, callback) {
  ensure(templateID, "string")
    .and(url, "string")
    .and(callback, "function");

  url = helper.urlNormalizer(url);

  redis.get(key.url(templateID, url), callback);
};
