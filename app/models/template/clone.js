var ensure = require("helper/ensure");
var extend = require("helper/extend");
var getAllViews = require("./getAllViews");
var setMultipleViews = require("./setMultipleViews");
var getMetadata = require("./getMetadata");
var setMetadata = require("./setMetadata");

module.exports = function clone(fromID, toID, metadata, callback) {
  ensure(fromID, "string")
    .and(toID, "string")
    .and(metadata, "object")
    .and(callback, "function");

  getAllViews(fromID, function (err, allViews) {
    if (err || !allViews) {
      var message = "No theme with that name exists to clone from " + fromID;
      return callback(new Error(message));
    }

    setMultipleViews(toID, allViews, function (err) {
      if (err) return callback(err);

      getMetadata(fromID, function (err, existingMetadata) {
        if (err) {
          var message = "Could not clone from " + fromID;
          return callback(new Error(message));
        }

        // Copy across any metadata from the
        // source of the clone, if its not set
        extend(metadata).and(existingMetadata);

        setMetadata(toID, metadata, callback);
      });
    });
  });
};
