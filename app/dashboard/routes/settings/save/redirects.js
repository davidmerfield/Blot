var helper = require("helper");
var Redirects = require("../../../../models/redirects");
var formJSON = helper.formJSON;
var arrayify = helper.arrayify;
var Url = require("url");

module.exports = function(req, res, next) {
  if (!req.body.has_redirects) return next();

  var mappings = {};

  mappings = formJSON(req.body, { redirects: "object" });

  mappings = arrayify(mappings.redirects);

  mappings = mappings.filter(function(mapping) {
    return !!mapping.from && !!mapping.to;
  });

  // Ensure mappings have a leading slash or are regexes
  mappings = mappings.map(function(mapping) {
    mapping.from = normalize(mapping.from);
    mapping.to = normalize(mapping.to);

    return mapping;
  });

  Redirects.set(req.blog.id, mappings, next);
};

function urlNormalizer(url) {
  if (!url) return "";

  try {
    url = Url.parse(url).pathname;
  } catch (e) {
    return "";
  }

  if (url.slice(0, 1) !== "/") url = "/" + url;

  if (url.slice(-1) === "/" && url.length > 1) url = url.slice(0, -1);

  url = url.split("//").join("/");

  return url.toLowerCase();
}

function normalize(str) {
  if (str[0] !== "\\" && str[0] !== "/") {
    try {
      str = urlNormalizer(str);
    } catch (e) {}
  }

  return str;
}
