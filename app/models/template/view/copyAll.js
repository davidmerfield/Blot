var async = require("async");
var getAll = require("./getAll");
var set = require("./set");

module.exports = function(fromID, toID, callback) {
  getAll(fromID, function(err, allViews) {
    if (err) return callback(err);

    async.each(allViews, set.bind(null, toID), callback);
  });
};
