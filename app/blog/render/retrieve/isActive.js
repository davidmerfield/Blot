var normalize = require("helper/urlNormalizer");

module.exports = function (req, callback) {
  return callback(null, function () {
    var url = normalize(req.url) || "/";

    return function (text) {
      var active = "";

      if (text === url) active = "active";

      return active;
    };
  });
};
