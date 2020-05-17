var Debug = require("debug");
var config = require("config");

// Export a version of this function which does nothing in production
if (config.environment !== "development") {
  module.exports = function() {
    return function(req, res, next) {
      req.debug = function() {};
      next();
    };
  };

  module.exports.init = function(req, res, next) {
    next();
  };

  return;
}

function prefix(req) {
  return "dashboard:" + req.originalUrl;
}

module.exports = function(message) {
  return function(req, res, next) {
    req.debug(message);
    next();
  };
};

module.exports.init = function(req, res, next) {
  var start = Date.now();

  req.debug = Debug(prefix(req));
  req.debug("request recieved");

  res.on("finish", function() {
    var duration = Date.now() - start;
    req.debug("\x1b[32m%s\x1b[0m", duration + "ms", "taken to render page");
  });

  next();
};
