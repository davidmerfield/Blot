var ensure = require("helper/ensure");
var punycode = require("helper/punycode");
var url = require("url");
var HOST = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;

var INVALID = "Please enter a valid hostname";
var IN_USE = "That domain was already in use.";

module.exports = function (blogID, domain, callback) {
  var get = require("../get");

  try {
    ensure(blogID, "string").and(domain, "string").and(callback, "function");

    domain = domain.replace(" ", "");
    domain = domain.trim();
    domain = domain.toLowerCase();

    if (!domain) return callback(null, "");

    // http://google.com -> google.com
    if (domain.indexOf("://") > -1) domain = url.parse(domain).hostname;

    // mañana.com -> xn--maana-pta.com
    domain = punycode.toASCII(domain);
  } catch (e) {
    return callback(INVALID);
  }

  if (!HOST.test(domain)) {
    return callback(INVALID);
  }

  get({ domain: domain }, function (err, blog) {
    if (blog && blog.id && blog.id !== blogID) {
      return callback(IN_USE);
    }

    return callback(null, domain);
  });
};
