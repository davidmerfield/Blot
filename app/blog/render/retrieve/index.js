var _ = require("lodash");
var helper = require("helper");
var ensure = helper.ensure;
var dirToModule = helper.dirToModule;
var dictionary = dirToModule(__dirname, require);
var async = require("async");

module.exports = function(req, retrieve, callback) {
  ensure(req, "object")
    .and(retrieve, "object")
    .and(callback, "function");

  var locals = {};

  async.each(
    _.keys(retrieve),
    function(localName, nextLocal) {
      if (dictionary[localName] === undefined) {
        console.log(req.blog.handle, req.blog.id, ": No retrieve method to look up", localName);
        return nextLocal();
      }

      dictionary[localName](req, function(err, value) {
        if (err) console.log(err);

        if (value !== undefined) locals[localName] = value;

        return nextLocal();
      });
    },
    function() {
      callback(null, locals);
    }
  );
};
