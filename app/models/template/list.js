var key = require("./key");
var redis = require("client");
var get = require("./get");
var async = require("async");

// The list of possible template choices
// for a given blog. Accepts a UID and
// returns an array of template metadata
// objects. Does not contain any view info
module.exports = function list(blogID, callback) {
  redis.smembers(key.publicTemplates, function(err, publicTemplates) {
    redis.smembers(key.blogTemplates(blogID), function(err, blogTemplates) {
      var templateIDs = publicTemplates.concat(blogTemplates);
      var response = [];

      async.eachSeries(
        templateIDs,
        function(id, next) {
          get(id, function(err, info) {
            if (err) return next();

            if (info) response.push(info);

            next();
          });
        },
        function() {
          callback(err, response);
        }
      );
    });
  });
};
