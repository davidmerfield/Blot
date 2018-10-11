var helper = require("helper");
var normalize = helper.urlNormalizer;

module.exports = function(req, callback) {
  return callback(null, function() {
    try {
      var url = normalize(req.url) || "/";
      var link = this.url;

      if (!link && this.slug) link = "/tagged/" + this.slug;

      url = url.trim();
      link = link.trim();
    } catch (e) {
      return false;
    }

    var active = "";

    if (link === url) active = "active";

    return active;
  });
};
