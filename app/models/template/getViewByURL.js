var key = require("./key");
var client = require("client");
var urlNormalizer = require("helper").urlNormalizer;

module.exports = function getViewByURL(templateID, url, callback) {
  url = urlNormalizer(url);

  client.get(key.url(templateID, url), callback);
};
