module.exports = (function() {
  var redis = require("client"),
    helper = require("helper"),
    crypto = require("crypto"),
    type = helper.type,
    ensure = helper.ensure;

  function setDimensions(url, dimensions, callback) {
    ensure(url, "string")
      .and(dimensions, "object")
      .and(callback, "function");

    var width = dimensions.width,
      height = dimensions.height;

    ensure(width, "number").and(height, "number");

    redis.hmset(dimensionsKey(url), "width", width, "height", height, function(
      err
    ) {
      if (err) throw err;

      callback();
    });
  }

  function getDimensions(url, callback) {
    ensure(url, "string").and(callback, "function");

    redis.hgetall(dimensionsKey(url), function(error, dimensions) {
      if (error) throw error;

      if (!dimensions || type(dimensions) !== "object") {
        return callback(null);
      }

      dimensions.width = +dimensions.width;
      dimensions.height = +dimensions.height;

      callback(null, dimensions);
    });
  }

  function dimensionsKey(url) {
    return (
      "image:dimensions:" +
      crypto
        .createHash("md5")
        .update(url)
        .digest("hex")
    );
  }

  return {
    setDimensions: setDimensions,
    getDimensions: getDimensions
  };
})();
