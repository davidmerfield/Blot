var key = require("./key");
var client = require("client");
var get = require("./get");
var async = require("async");
var debug = require("debug")("template:list");

// The list of possible template choices
// for a given blog. Accepts a UID and
// returns an array of template metadata
// objects. Does not contain any view info
module.exports = function list(blogID, callback) {
  var batch = client.batch();

  batch.smembers(key.publicTemplates);
  batch.smembers(key.blogTemplates(blogID));

  batch.exec(function(err, templateIDs) {
    if (err) return callback(err);

    templateIDs = templateIDs[0].concat(templateIDs[1]);

    debug(blogID, templateIDs);

    async.map(templateIDs, get, callback);
  });
};
