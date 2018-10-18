var helper = require("helper");
var dirToModule = helper.dirToModule;
var dictionary = dirToModule(__dirname, require);
var async = require("async");

module.exports = function(req, retrieve, callback) {
  async.mapValues(
    retrieve,
    function(value, variable, next) {
      if (dictionary[variable] === undefined) {
        return next();
      }

      dictionary[variable](req, next);
    },
    callback
  );
};
